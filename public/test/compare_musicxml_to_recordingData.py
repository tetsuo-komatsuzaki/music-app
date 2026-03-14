import json
import numpy as np
from pathlib import Path

# =========================
# パス設定
# =========================
BASE_DIR = Path(__file__).resolve().parent
MUSIC_JSON = BASE_DIR / "output" / "note_results.json"
AUDIO_JSON = BASE_DIR / "output" / "audio_features.json"
OUTPUT_JSON = BASE_DIR / "output" / "comparison_result.json"

# =========================
# パラメータ
# =========================
ONSET_WINDOW = 0.15               # 期待開始の周辺探索幅（秒）
NEAR_ONSET_CHECK = 0.05           # onset候補の近傍でピッチ一致チェックする幅（秒）

PITCH_TOLERANCE_CENTS = 50        # pitch一致判定（cent）
TIMING_TOLERANCE = 0.10           # timing OK判定（秒）

RMS_THRESHOLD = 0.01              # audio_features.jsonを作る時に使った値と揃える
FIRST_ONSET_MIN_RMS = 0.02        # 「最初の本物onset」を判定するために少し厳しめ
FIRST_ONSET_MIN_VALID_FRAMES = 3  # onset近傍に有効f0が最低何点あれば“本物”扱いするか

END_SEARCH_EXTRA = 0.30           # expected_endよりどれだけ先までendを探すか（秒）
MIN_END_GAP = 0.02                # detected_onset直後すぐをendにしないための最小ギャップ（秒）

# =========================
# cents差分
# =========================
def cents_diff(f_detected: np.ndarray, f_expected: float) -> np.ndarray:
    # f_detectedは配列でもスカラでもOKにする
    return 1200.0 * np.log2(np.asarray(f_detected) / float(f_expected))

def safe_float(x):
    return float(x) if x is not None else None

# =========================
# データ読み込み
# =========================
with open(MUSIC_JSON, "r", encoding="utf-8") as f:
    music_data = json.load(f)
    note_list = music_data["notes"]

with open(AUDIO_JSON, "r", encoding="utf-8") as f:
    audio_data = json.load(f)

# audio_features.json 側
time_all = np.array(audio_data["time"], dtype=float)
f0_all = np.array(audio_data["f0_hz"], dtype=float)
rms_all = np.array(audio_data["rms"], dtype=float)
onset_times = np.array(audio_data["onset_times"], dtype=float)

# 有効フレーム（前処理の条件と同じ）
not_nan_mask = ~np.isnan(f0_all)
loud_mask = rms_all > RMS_THRESHOLD
valid_mask = not_nan_mask & loud_mask

valid_time = time_all[valid_mask]
valid_f0 = f0_all[valid_mask]

# =========================
# 楽譜側：比較対象ノートだけ抽出
# =========================
notes_only = [n for n in note_list if n.get("type") == "note" and n.get("pitches")]
if len(notes_only) == 0:
    raise RuntimeError("No note entries found in note_results.json (type=='note' with pitches).")

first_expected_start = float(notes_only[0]["start_time_sec"])

# =========================
# 録音側：最初の“本物”onsetを推定して、全体の時間シフトを作る
# =========================
def pick_first_real_onset(onset_times: np.ndarray) -> float | None:
    if onset_times is None or len(onset_times) == 0:
        return None

    for cand in onset_times:
        # 近傍のフレーム
        near = (time_all >= cand - NEAR_ONSET_CHECK) & (time_all <= cand + NEAR_ONSET_CHECK)
        if np.sum(near) == 0:
            continue

        # 近傍のRMSがある程度大きいか
        if np.nanmax(rms_all[near]) < FIRST_ONSET_MIN_RMS:
            continue

        # 近傍に “有効f0” が最低限あるか（ノイズonset排除）
        near_valid = near & valid_mask
        if np.sum(near_valid) < FIRST_ONSET_MIN_VALID_FRAMES:
            continue

        return float(cand)

    # 条件に合うものが無ければ、フォールバックとして最初のonset
    return float(onset_times[0])

first_real_onset = pick_first_real_onset(onset_times)
if first_real_onset is None:
    # onsetが取れないなら、valid_timeの先頭を録音開始基準にする
    if len(valid_time) == 0:
        raise RuntimeError("No valid audio frames (valid_time is empty). Check RMS_THRESHOLD or audio file.")
    first_real_onset = float(valid_time[0])

global_shift_sec = first_real_onset - first_expected_start

# =========================
# onset探索（shift後の期待時刻で行う）
# =========================
def detect_onset_for_note(expected_start_shift: float, expected_pitch: float) -> float | None:
    # ① onset候補（shift後の期待開始近傍）
    onset_candidates = onset_times[
        (onset_times >= expected_start_shift - ONSET_WINDOW) &
        (onset_times <= expected_start_shift + ONSET_WINDOW)
    ]

    # onset候補があるなら、候補ごとに「近傍で期待ピッチ一致」を確認
    for cand in onset_candidates:
        near_mask = (
            (valid_time >= cand - NEAR_ONSET_CHECK) &
            (valid_time <= cand + NEAR_ONSET_CHECK)
        )
        if np.sum(near_mask) == 0:
            continue

        mean_pitch = np.mean(valid_f0[near_mask])
        diff_cents = float(np.abs(cents_diff(mean_pitch, expected_pitch)))
        if diff_cents <= PITCH_TOLERANCE_CENTS:
            return float(cand)

    # ② フォールバック：期待開始近傍の valid_f0 から最も近いピッチの時刻
    window_mask = (
        (valid_time >= expected_start_shift - ONSET_WINDOW) &
        (valid_time <= expected_start_shift + ONSET_WINDOW)
    )
    if np.sum(window_mask) == 0:
        return None

    window_times = valid_time[window_mask]
    window_pitch = valid_f0[window_mask]
    cents_array = np.abs(cents_diff(window_pitch, expected_pitch))
    best_idx = int(np.argmin(cents_array))

    if float(cents_array[best_idx]) <= PITCH_TOLERANCE_CENTS:
        return float(window_times[best_idx])

    return None

# =========================
# end検出：鳴っている“最後の時刻”を探す
# =========================
def detect_end_for_note(detected_onset: float | None, expected_end_shift: float, expected_pitch: float) -> float | None:
    if detected_onset is None:
        return None

    # end探索レンジ
    search_start = detected_onset + MIN_END_GAP
    search_end = expected_end_shift + END_SEARCH_EXTRA

    if search_end <= search_start:
        search_end = search_start + 0.05

    # その範囲のフレームを取り出す（valid_maskベース）
    region_mask = (time_all >= search_start) & (time_all <= search_end) & valid_mask
    if np.sum(region_mask) == 0:
        return None

    region_times = time_all[region_mask]
    region_f0 = f0_all[region_mask]
    region_rms = rms_all[region_mask]

    # 期待ピッチ一致（±tol）かつ十分な音量
    cents_err = np.abs(cents_diff(region_f0, expected_pitch))
    ok_mask = (cents_err <= PITCH_TOLERANCE_CENTS) & (region_rms > RMS_THRESHOLD)

    if np.sum(ok_mask) == 0:
        # 一致区間が取れない場合：せめて「有効フレームが途切れる直前」をend候補にする
        return float(region_times[-1])

    # 最後に一致している時刻
    return float(region_times[ok_mask][-1])

# =========================
# 区間平均ピッチ：detected区間で測る（開始ズレ吸収後に自然）
# =========================
def avg_pitch_in_interval(t0: float, t1: float) -> float | None:
    if t1 <= t0:
        return None
    m = (valid_time >= t0) & (valid_time <= t1)
    if np.sum(m) == 0:
        return None
    return float(np.mean(valid_f0[m]))

# =========================
# 比較処理
# =========================
results = []

for note in notes_only:
    expected_pitch = float(note["pitches"][0])

    expected_start = float(note["start_time_sec"])
    expected_end = float(note["end_time_sec"])

    # ★ 全体シフトを適用した期待時刻
    expected_start_shift = expected_start + global_shift_sec
    expected_end_shift = expected_end + global_shift_sec

    # ① onset検出
    detected_onset = detect_onset_for_note(expected_start_shift, expected_pitch)

    # ③ 開始差分
    start_diff = (detected_onset - expected_start_shift) if detected_onset is not None else None
    start_ok = (start_diff is not None) and (abs(start_diff) <= TIMING_TOLERANCE)

    # ④ end検出（修正版）
    detected_end = detect_end_for_note(detected_onset, expected_end_shift, expected_pitch)
    end_diff = (detected_end - expected_end_shift) if detected_end is not None else None
    end_ok = (end_diff is not None) and (abs(end_diff) <= TIMING_TOLERANCE)

    # ⑤ ピッチ（平均）：detected区間が取れていればそれを優先、ダメなら期待区間
    t0 = detected_onset if detected_onset is not None else expected_start_shift
    t1 = detected_end if detected_end is not None else expected_end_shift

    avg_pitch = avg_pitch_in_interval(t0, t1)
    if avg_pitch is not None:
        pitch_diff_cents = float(cents_diff(avg_pitch, expected_pitch))
        pitch_ok = abs(pitch_diff_cents) <= PITCH_TOLERANCE_CENTS
    else:
        pitch_diff_cents = None
        pitch_ok = False

    results.append({
        "note_index": int(note["note_index"]),

        # 参考：全体シフト
        "global_shift_sec": float(global_shift_sec),

        # 期待（shift後）
        "expected_start_sec": float(expected_start_shift),
        "expected_end_sec": float(expected_end_shift),
        "expected_pitch_hz": float(expected_pitch),

        # 検出
        "detected_start_sec": safe_float(detected_onset),
        "detected_end_sec": safe_float(detected_end),

        # 誤差
        "pitch_cents_error": safe_float(pitch_diff_cents),
        "pitch_ok": bool(pitch_ok),

        "start_diff_sec": safe_float(start_diff),
        "start_ok": bool(start_ok),

        "end_diff_sec": safe_float(end_diff),
        "end_ok": bool(end_ok),
    })

# =========================
# 保存
# =========================
OUTPUT_JSON.parent.mkdir(exist_ok=True)

with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print("Comparison complete.")
print(f"global_shift_sec = {global_shift_sec:.3f} sec")
print(f"Saved to {OUTPUT_JSON}")
