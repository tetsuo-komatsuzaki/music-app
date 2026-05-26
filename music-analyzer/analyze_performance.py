from __future__ import annotations

import sys
import json
import os
import subprocess
import tempfile
from typing import Any, Dict, List, Optional

import numpy as np
import requests
import psycopg2
import librosa
from dotenv import load_dotenv

# =========================
# 引数
# =========================
if len(sys.argv) < 4:
    raise Exception("Usage: python analyze_performance.py USER_ID SCORE_ID PERFORMANCE_ID [practice]")

USER_ID = sys.argv[1]
SCORE_ID = sys.argv[2]          # Score用: scoreId / Practice用: practiceItemId
PERFORMANCE_ID = sys.argv[3]
IS_PRACTICE = any(a == "practice" for a in sys.argv[4:])
# --recording-bpm=90 のような引数をパース
RECORDING_BPM: Optional[float] = None
for a in sys.argv[4:]:
    if a.startswith("--recording-bpm="):
        RECORDING_BPM = float(a.split("=", 1)[1])

# =========================
# ENV
# =========================
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
MUSICXML_BUCKET = os.getenv("BUCKET_NAME")
PERFORMANCE_BUCKET = os.getenv("PERFORMANCE_BUCKET", "performances")
DATABASE_URL = os.getenv("DATABASE_URL")

if not all([SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MUSICXML_BUCKET, DATABASE_URL]):
    raise Exception("ENV不足")

# =========================
# パラメータ
# =========================
HOP_LENGTH = 256
FRAME_LENGTH = 2048
RMS_THRESHOLD = 0.01

# ノイズゲート
GATE_THRESHOLD_MULTIPLIER = 6      # ノイズフロア × 倍率
GATE_THRESHOLD_MIN        = 0.003  # 閾値下限（超静音環境対策）
GATE_THRESHOLD_MAX        = 0.05   # 閾値上限
GATE_ATTACK_FRAMES        = 3      # 約17ms @hop=256,sr=44100
GATE_HOLD_FRAMES          = 4      # 約23ms（保守的：スタッカート実測後に調整予定）
GATE_MIN_RUN_FRAMES       = 4      # 約23ms

# ピッチ判定
PITCH_TOLERANCE_CENTS = 50    # ±50cents: ピッチ正確 → confidence "high"
PITCH_SEARCH_CENTS = 200      # ±200cents（±2半音）: ピッチずれ → confidence "medium"
MIN_VALID_FRAMES = 5
CENTER_RATIO = 0.80

# ③ 3軸カスケード評価 (2026-05-26)
# 持続が期待値の何%以内なら "持続◯" 判定とするか
DURATION_TOLERANCE_RATIO = 0.3  # ±30%
# 段階拡大の探索半径 (秒)
CASCADE_SEARCH_RADII = [0.15, 0.5, 1.0, 1.5]
# 短音奏法の note 属性 (これらが True なら持続短くて OK)
SHORT_TECHNIQUE_ATTRS = ("is_staccato", "is_pizzicato", "is_spiccato",
                          "is_ricochet", "is_bow_staccato")

# v1.7 Phase D (2026-05-23): 重音 / ハーモニクススペクトル検証パラメータ
# - 単音 (len(pitches)==1) は既存 yin パスで処理。本パラメータは len>=2 専用。
# - 暫定値、Step G で実機録音から最終調整 (Tetsuo 実機検証時)。
SPECTRAL_N_FFT             = 4096   # 高音域 fine resolution (FRAME_LENGTH=2048 より大)
SPECTRAL_PRESENCE_SNR      = 3.0    # bin/noise 比、これ以上で presence_ok=True
SPECTRAL_INCONCLUSIVE_SNR  = 1.5    # 全 pitch がこれ未満 → spectral_inconclusive (赤判定にしない)
DOUBLE_STOP_CENTS_OK       = 50     # 重音セント許容 (単音 PITCH_TOLERANCE_CENTS と揃える)
SPECTRAL_BIN_HALFWIDTH     = 1      # ピーク補間に使う周辺ビン数 (±1 = 3点パラボリック)

# v1.7 Phase E (2026-05-23): ハーモニクス純度判定パラメータ
# - is_harmonic=true ノート専用。フラジオレット (基音卓越・倍音少) を判定。
# - 暫定値、Step G で実機録音から最終調整 (Tetsuo 実機検証時)。
HARMONIC_FUND_RATIO_OK = 0.45   # 基音卓越度 ≥ これで純度十分 → ◎
HARMONIC_OVERTONE_MAX  = 3      # 顕著な倍音本数 ≤ これで純度十分 (合わせ技で ◎)
HARMONIC_OVERTONE_SNR  = 2.0    # 倍音検出 SNR (これ以上で「顕著な倍音」とカウント)
HARMONIC_CENTS_OK      = 50     # ハーモニクスのセント許容 (sounding pitch 基準)

# タイミング判定: BPM 連動 (= TIMING_TOLERANCE_BASE × (60 / target_bpm))
# - 速い tempo ほど許容を厳しく (固定値では速い曲ほど甘くなる逆転を解消)
# - target_bpm は recording_bpm 優先 (interval_diff は time_scale で recording_bpm 基準に
#   補正済のため、許容値も同基準で揃える)
#
# 2026-05-16 調整 (Tetsuo 指示): 0.10 → 0.30 (3倍緩和、判定が厳しすぎたため)。
#   BPM60で±0.30s, BPM90で±0.20s(約0.3拍), BPM120で±0.15s, BPM180で±0.10s。
#   timing 判定を寛容化 → rhythmAccuracy / overallScore 上昇。
#   ダウンストリーム: SongMastery 演奏マスター到達が容易化 / RHYTHM 課題化が減少。
#   過寛容なら 0.15〜0.20 へ再調整予定。
TIMING_TOLERANCE_BASE = 0.30


def get_timing_tolerance(target_bpm: float) -> float:
    """BPM 連動のタイミング許容値 (秒) を返す。"""
    if target_bpm is None or target_bpm <= 0:
        return TIMING_TOLERANCE_BASE
    return TIMING_TOLERANCE_BASE * (60.0 / target_bpm)

# 区間探索
SEARCH_DURATION_MULTIPLIER = 3.0  # expected_duration × この倍率

# (2026-05-26 ⑤⑧ cleanup: RESYNC_* / LOOKAHEAD_* は cascade 移行後に dead code 化したため削除)

# Onset 検出（環境変数フラグで有効化）
# 個別課題 v1+ (2026-05-25 PDCA): 同音連続箇所の正しい検出に Phase 1 onset 検出が
# 必須なため、デフォルトを true に変更。明示的に false 設定すれば旧挙動に戻せる。
USE_ONSET_DETECTION = os.environ.get("USE_ONSET_DETECTION", "true") == "true"

# PDCA-2 (2026-05-26): 残 4 件の同音連続 -300ms 偏差の真因切り分け用診断ログ。
# ANALYZE_DIAG=true を Cloud Run env で設定した時だけ動く (本番影響なし)。
# H1: librosa が onset 候補を出していない / H2: ガード却下 / H3: 統合バグ
# の切り分け用。
DIAG_LOG = os.environ.get("ANALYZE_DIAG", "false") == "true"


def _diag(msg: str) -> None:
    if DIAG_LOG:
        print(f"[DIAG] {msg}", flush=True)
ONSET_PITCH_CHANGE_CENTS = 30     # onset 前後のピッチ変化閾値（cents）
ONSET_PITCH_CHANGE_WINDOW = 0.03  # onset 前後の比較窓（秒）

# 個別課題 v1+ (2026-05-25 PDCA): 同音連続箇所の onset 判定。
# 同音連続では pitch 変化が原理的にないため、RMS rise (音量立ち上がり) で
# 判定する。異音切替時の既存判定 (ピッチ変化≥30 cents) は無改変。
SAME_PITCH_ONSET_RMS_RATIO = 1.5    # 後30ms平均 / 前30ms平均 がこれ以上で「立ち上がり」
SAME_PITCH_ONSET_RMS_WINDOW = 0.03  # ±30ms (ONSET_PITCH_CHANGE_WINDOW と揃える)

# ノート飛ばし: section_missing は廃止
# 見つからないノートは not_detected として記録し、探索を継続する

# 制約
MAX_DURATION_SEC = 660   # 10分 (600s) + 余裕 1分 (Recorder 側 MAX_DURATION = 600s 整合 + 録音前後の無音バッファ吸収)
MIN_DURATION_SEC = 3

# 開始位置検出
SEARCH_RANGE_SEC = 1.0
SEARCH_STEP_SEC = 0.01

# 楽器別ピッチ範囲
INSTRUMENT_PITCH_RANGE = {
    "violin":   ("G3", "E7"),
    "recorder": ("C5", "D7"),
    "flute":    ("C4", "C7"),
    "cello":    ("C2", "A5"),
}
DEFAULT_PITCH_RANGE = ("G3", "E6")

# =========================
# ヘルパー
# =========================
def cents_diff(f_detected, f_expected: float):
    return 1200.0 * np.log2(np.asarray(f_detected) / float(f_expected))

def safe_float(x):
    return float(x) if x is not None else None


# =========================================================
# ノイズゲート（3ステージ）
# =========================================================

def _fill_gaps(mask: np.ndarray, max_gap: int) -> np.ndarray:
    """mask 中の False ギャップを max_gap フレーム以内なら True で埋める（Hold）"""
    result = mask.copy()
    n = len(mask)
    i = 0
    while i < n:
        if not mask[i]:
            gap_start = i
            while i < n and not mask[i]:
                i += 1
            if i - gap_start <= max_gap:
                result[gap_start:i] = True
        else:
            i += 1
    return result


def _remove_short_runs(mask: np.ndarray, min_run: int) -> np.ndarray:
    """mask 中の True の連続が min_run フレーム未満なら False に戻す"""
    result = mask.copy()
    n = len(mask)
    i = 0
    while i < n:
        if mask[i]:
            run_start = i
            while i < n and mask[i]:
                i += 1
            if i - run_start < min_run:
                result[run_start:i] = False
        else:
            i += 1
    return result


def apply_noise_gate(rms: np.ndarray, time_all: np.ndarray,
                     f0: np.ndarray, first_sound_time: float) -> np.ndarray:
    """
    適応型ノイズゲートを適用し有効フレームの bool マスクを返す。

    Stage 1: 演奏前無音区間からノイズフロアを推定して閾値を決定
    Stage 2: 閾値マスク → ギャップ充填（Hold） → 孤立除去（Attack 相当）
    Stage 3: 最小連続フレーム数フィルタ
    """
    # --- Stage 1: 適応型閾値 ---
    pre_mask = time_all < (first_sound_time - 0.1)
    pre_rms  = rms[pre_mask]

    if len(pre_rms) >= 20:
        noise_floor = float(np.percentile(pre_rms, 75))
    else:
        # フォールバック: f0=NaN フレーム（ピッチ未検出 ≈ 無音）の RMS を使う
        nan_mask = np.isnan(f0[:len(rms)])
        noise_floor = float(np.median(rms[nan_mask])) if nan_mask.sum() > 10 \
                      else RMS_THRESHOLD / GATE_THRESHOLD_MULTIPLIER

    threshold = float(np.clip(
        noise_floor * GATE_THRESHOLD_MULTIPLIER,
        GATE_THRESHOLD_MIN,
        GATE_THRESHOLD_MAX,
    ))
    print(f"  [NoiseGate] noise_floor={noise_floor:.4f} "
          f"threshold={threshold:.4f} (pre_silence={len(pre_rms)} frames)")

    # --- Stage 2: Hold + Attack ---
    raw     = rms > threshold
    held    = _fill_gaps(raw, GATE_HOLD_FRAMES)
    attacked = _remove_short_runs(held, GATE_ATTACK_FRAMES)

    # --- Stage 3: 最小連続フレーム数フィルタ ---
    return _remove_short_runs(attacked, GATE_MIN_RUN_FRAMES)


# =========================================================
# Onset 検出（Spectral Flux ベース）
# =========================================================

def detect_onsets(y, sr, hop_length=HOP_LENGTH):
    """
    Spectral Flux ベースの onset 検出。
    バイオリン向けに delta を低めに設定。
    Returns: onset_times (numpy array, 秒単位)
    """
    onset_frames = librosa.onset.onset_detect(
        y=y, sr=sr, hop_length=hop_length,
        pre_max=3,
        post_max=3,
        pre_avg=3,
        post_avg=5,
        delta=0.05,
        wait=5,
    )
    return librosa.frames_to_time(onset_frames, sr=sr, hop_length=hop_length)


def _is_legitimate_onset(onset_t, valid_time, valid_f0, rms, time_all,
                          expected_pitch, prev_expected_pitch):
    """onset 候補が legitimate な「新しい音の開始」か判定 (ガード)。

    個別課題 v1+ (2026-05-25 PDCA):
      - 異音切替 (prev_expected_pitch != expected_pitch):
        既存ピッチ変化判定。≥30 cents で採用、未満は偽 onset として却下。
      - 同音連続 (prev_expected_pitch == expected_pitch):
        ピッチ変化が原理的にないため代わりに RMS rise を判定。
        後30ms平均 / 前30ms平均 ≥ SAME_PITCH_ONSET_RMS_RATIO で「弓の弾き直し」と
        みなし採用、未満は同一弓継続中の弓圧変化等として却下。
    """
    # ─── 同音連続: RMS rise 判定 ─────────────────────────────
    if (
        prev_expected_pitch is not None
        and expected_pitch is not None
        and abs(prev_expected_pitch - expected_pitch) < 1e-6
        and rms is not None
        and time_all is not None
    ):
        before_mask = (time_all >= onset_t - SAME_PITCH_ONSET_RMS_WINDOW) & (time_all < onset_t)
        after_mask = (time_all >= onset_t) & (time_all < onset_t + SAME_PITCH_ONSET_RMS_WINDOW)
        before_rms = rms[before_mask]
        after_rms = rms[after_mask]
        if len(before_rms) < 2 or len(after_rms) < 2:
            _diag(f"same_pitch_onset t={onset_t:.3f} DATA_INSUFFICIENT "
                  f"before_n={len(before_rms)} after_n={len(after_rms)} → accept")
            return True  # データ不足 → 採用 (Phase 2 cursor scan で救える)
        before_mean = float(np.mean(before_rms))
        after_mean = float(np.mean(after_rms))
        if before_mean <= 1e-9:
            decision = after_mean > 1e-9
            _diag(f"same_pitch_onset t={onset_t:.3f} BEFORE_SILENCE "
                  f"after={after_mean:.5f} → {'accept' if decision else 'reject'}")
            return decision
        ratio = after_mean / before_mean
        decision = ratio >= SAME_PITCH_ONSET_RMS_RATIO
        _diag(f"same_pitch_onset t={onset_t:.3f} before={before_mean:.5f} "
              f"after={after_mean:.5f} ratio={ratio:.2f} thr={SAME_PITCH_ONSET_RMS_RATIO} "
              f"→ {'accept' if decision else 'reject'}")
        return decision

    # ─── 異音切替: 既存ピッチ変化判定 (無改変) ──────────────────
    before_mask = (valid_time >= onset_t - ONSET_PITCH_CHANGE_WINDOW) & (valid_time < onset_t)
    after_mask = (valid_time >= onset_t) & (valid_time < onset_t + ONSET_PITCH_CHANGE_WINDOW)

    before_f0 = valid_f0[before_mask]
    after_f0 = valid_f0[after_mask]

    if len(before_f0) < 2 or len(after_f0) < 2:
        return True  # データ不足 → onset を採用（Phase 2 で救える）

    before_median = float(np.median(before_f0))
    after_median = float(np.median(after_f0))

    if before_median <= 0 or after_median <= 0:
        return True

    cd = abs(1200.0 * np.log2(after_median / before_median))
    return cd >= ONSET_PITCH_CHANGE_CENTS


def download_from_storage(bucket: str, path: str) -> bytes:
    url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{path}"
    res = requests.get(url, headers={"Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}"})
    if res.status_code != 200:
        raise Exception(f"Download failed ({bucket}/{path}): {res.status_code} {res.text[:200]}")
    return res.content

def upload_to_storage(bucket: str, path: str, data: bytes, content_type: str = "application/json"):
    url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{path}"
    res = requests.post(url, headers={
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": content_type,
    }, data=data)
    if res.status_code not in [200, 201]:
        if res.status_code == 400 or "already exists" in res.text.lower():
            res = requests.put(url, headers={
                "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                "Content-Type": content_type,
            }, data=data)
            if res.status_code not in [200, 201]:
                raise Exception(f"Upload failed ({bucket}/{path}): {res.status_code} {res.text[:200]}")
        else:
            raise Exception(f"Upload failed ({bucket}/{path}): {res.status_code} {res.text[:200]}")


# =========================================================
# Step 1: 開始位置検出（ピッチスキャン）
# =========================================================

def find_start_position(notes_only, valid_time, valid_f0, first_sound_time):
    first_note_start = float(notes_only[0]["start_time_sec"])
    check_notes = notes_only[:min(15, len(notes_only))]
    anchor = first_sound_time - first_note_start

    best_shift = anchor
    best_matches = 0

    if len(valid_time) > 0 and len(check_notes) >= 2:
        steps = int(SEARCH_RANGE_SEC / SEARCH_STEP_SEC)
        for abs_off in range(0, steps + 1):
            for sign in ([0] if abs_off == 0 else [-1, 1]):
                candidate = anchor + abs_off * sign * SEARCH_STEP_SEC
                matches = 0
                for nt in check_notes:
                    t0 = float(nt["start_time_sec"]) + candidate
                    t1 = float(nt["end_time_sec"]) + candidate
                    dur = t1 - t0
                    margin = dur * 0.1
                    mask = (valid_time >= t0 + margin) & (valid_time <= t1 - margin)
                    if np.sum(mask) >= MIN_VALID_FRAMES:
                        med = float(np.median(valid_f0[mask]))
                        ep = float(nt["pitches"][0])
                        if med > 0 and abs(1200.0 * np.log2(med / ep)) <= PITCH_TOLERANCE_CENTS:
                            matches += 1
                if matches > best_matches:
                    best_matches = matches
                    best_shift = candidate

    print(f"  Start position: shift={best_shift:.4f}s ({best_matches}/{len(check_notes)} matches)")
    return best_shift


# =========================================================
# Step 2: 区間探索
# =========================================================

def _refine_onset(seg_start, expected_pitch, expected_duration, valid_time, valid_f0):
    """
    マッチした窓の中で、期待ピッチが実際に現れ始めるフレームを探す。
    窓の先頭から1フレームずつ見て、期待ピッチに近いフレームが
    連続して現れ始める位置を返す。
    """
    window_end = seg_start + expected_duration
    mask = (valid_time >= seg_start) & (valid_time <= window_end)
    wt = valid_time[mask]
    wf = valid_f0[mask]

    if len(wf) == 0:
        return seg_start

    # 先頭フレームが既に期待ピッチに近ければ補正不要
    first_cents = abs(1200.0 * np.log2(wf[0] / expected_pitch)) if wf[0] > 0 else 9999
    if first_cents <= PITCH_SEARCH_CENTS:
        return seg_start

    # 窓内を走査して、期待ピッチが連続3フレーム以上現れる最初の位置を探す
    run = 0
    for i in range(len(wf)):
        if wf[i] > 0 and abs(1200.0 * np.log2(wf[i] / expected_pitch)) <= PITCH_SEARCH_CENTS:
            run += 1
            if run >= 3:
                return float(wt[i - 2])
        else:
            run = 0

    return seg_start


def _try_match_at(t, expected_pitch, expected_duration, valid_time, valid_f0,
                  prev_expected_pitch=None, next_expected_pitch=None):
    """
    時刻 t を起点に、expected_pitch のマッチを試行。
    成功すれば結果 dict、失敗すれば None。
    """
    seg_start = t
    measure_end = t + expected_duration
    margin = expected_duration * (1.0 - CENTER_RATIO) / 2.0

    mask = (valid_time >= seg_start + margin) & (valid_time <= measure_end - margin)
    cnt = int(np.sum(mask))

    if cnt < MIN_VALID_FRAMES:
        return None

    med = float(np.median(valid_f0[mask]))
    if med <= 0:
        return None

    # ⑨ 重複除去 (2026-05-26): cents 計算を 1 回だけ実施。符号付きで保持し
    # 絶対値は別途取って confidence / 採否判定に使う。pitch_cents_error として
    # dict に含めて返し、evaluate_notes 側での再計算を不要にする。
    cents_signed = float(cents_diff(med, expected_pitch))
    c_abs = abs(cents_signed)
    if c_abs > PITCH_SEARCH_CENTS:
        return None

    confidence = "high" if c_abs <= PITCH_TOLERANCE_CENTS else "medium"

    # Improvement J: medium match 時、前の音か次の音に近ければ skip
    if confidence == "medium":
        if prev_expected_pitch is not None:
            c_prev = abs(1200.0 * np.log2(med / prev_expected_pitch))
            if c_prev < c_abs:
                return None
        if next_expected_pitch is not None:
            c_next = abs(1200.0 * np.log2(med / next_expected_pitch))
            if c_next < c_abs:
                return None

    refined_start = _refine_onset(
        seg_start, expected_pitch, expected_duration,
        valid_time, valid_f0)
    actual_end = _detect_sound_end(refined_start, med, valid_time, valid_f0)

    return {
        "seg_start": refined_start,
        "seg_end": actual_end,
        "avg_pitch": med,
        "valid_frames": cnt,
        "confidence": confidence,
        "pitch_cents_error": cents_signed,  # ⑨ 重複除去で追加
    }


def find_note_segment(cursor, expected_pitch, expected_duration, valid_time, valid_f0,
                      onset_times=None, prev_expected_pitch=None, next_expected_pitch=None,
                      prev_seg_end=None, rms=None, time_all=None, note_idx=None,
                      search_range_override=None):
    """
    カーソルから前方に expected_duration 幅の窓を走査し、
    noteの特徴に合う区間を探す。

    Phase 1: onset_times を優先候補として探索（ガード条件付き）
    Phase 2: 既存のスキャン探索（フォールバック）

    search_range_override: ③ medium false-accept 対策の段階拡大用 (2026-05-26)。
    指定があればそれを使用、なければ従来通り expected_duration から算出。
    """
    if search_range_override is not None:
        search_range = search_range_override
    else:
        search_range = max(expected_duration * SEARCH_DURATION_MULTIPLIER, 1.5)
        search_range = min(search_range, 3.0)
    search_end = cursor + search_range

    same_pitch = (
        prev_expected_pitch is not None
        and expected_pitch is not None
        and abs(prev_expected_pitch - expected_pitch) < 1e-6
    )

    # === Phase 1: onset ベース探索 ===
    if onset_times is not None and len(onset_times) > 0:
        candidate_onsets = onset_times[(onset_times >= cursor) & (onset_times < search_end)]
        _diag(f"note={note_idx} same_pitch={same_pitch} cursor={cursor:.3f} "
              f"search_end={search_end:.3f} candidates={len(candidate_onsets)} "
              f"prev_seg_end={prev_seg_end if prev_seg_end is not None else 'N/A'}")
        for onset_t in candidate_onsets:
            # ガード1: 前ノートの持続中の偽 onset を無視
            if prev_seg_end is not None and onset_t < prev_seg_end - 0.05:
                _diag(f"note={note_idx} cand t={onset_t:.3f} REJ guard1 prev_seg_end")
                continue
            # ガード2: 期待タイミングから大幅に外れた onset は無視
            timing_gap = abs(onset_t - cursor)
            if timing_gap > expected_duration * 2.0:
                _diag(f"note={note_idx} cand t={onset_t:.3f} REJ guard2 "
                      f"gap={timing_gap:.3f}>{expected_duration*2:.3f}")
                continue
            # ガード3: legitimate な onset か判定。
            # 同音連続時は RMS rise、異音切替時はピッチ変化で判定 (v1+ PDCA)。
            if not _is_legitimate_onset(
                onset_t, valid_time, valid_f0, rms, time_all,
                expected_pitch, prev_expected_pitch,
            ):
                _diag(f"note={note_idx} cand t={onset_t:.3f} REJ guard3 (gate)")
                continue

            result = _try_match_at(onset_t, expected_pitch, expected_duration,
                                   valid_time, valid_f0,
                                   prev_expected_pitch, next_expected_pitch)
            if result is not None:
                _diag(f"note={note_idx} cand t={onset_t:.3f} ACCEPT seg_start={result['seg_start']:.3f}")
                return result
            else:
                _diag(f"note={note_idx} cand t={onset_t:.3f} REJ _try_match_at returned None")

    # === 同音連続 + Phase 1 全却下: Phase 2 をスキップして None を返す ===
    # PDCA-2-revised (2026-05-26): legato 演奏では音響的に音の境界が無く、
    # Phase 2 cursor scan は前ノートの sustain 内 pitch 一致点を採用して -300ms 偏差を生む。
    # 旧 synth (v20/v21) はテンポ外挿で seg_start を捏造したがアンカーまで歪めたため撤回。
    # 構造的に測定不能な区間は None で返し、evaluate_notes 側で pitch_only 救済する。
    if same_pitch:
        _diag(f"note={note_idx} same_pitch Phase 1 exhausted → None (pitch_only rescue in evaluate_notes)")
        return None

    # === Phase 2: 異音切替時のスキャン探索（フォールバック、無改変） ===
    _diag(f"note={note_idx} Phase 1 exhausted, falling to Phase 2 cursor scan")
    scan_step = 0.02
    t = cursor
    while t < search_end:
        result = _try_match_at(t, expected_pitch, expected_duration,
                               valid_time, valid_f0,
                               prev_expected_pitch, next_expected_pitch)
        if result is not None:
            _diag(f"note={note_idx} Phase 2 matched t={t:.3f} seg_start={result['seg_start']:.3f}")
            return result
        t += scan_step

    _diag(f"note={note_idx} BOTH PHASES FAILED → not_detected")
    return None


def _detect_sound_end(seg_start, detected_pitch, valid_time, valid_f0):
    """seg_start から先に、ピッチが途切れる位置を検出する"""
    max_scan = seg_start + 30.0
    range_mask = (valid_time >= seg_start) & (valid_time <= max_scan)
    if np.sum(range_mask) == 0:
        return seg_start + 0.1

    rt = valid_time[range_mask]
    rf = valid_f0[range_mask]

    last_valid_time = seg_start
    gap_count = 0
    MAX_GAP = 3

    for i in range(len(rf)):
        if rf[i] > 0 and abs(1200.0 * np.log2(rf[i] / detected_pitch)) <= PITCH_TOLERANCE_CENTS:
            last_valid_time = float(rt[i])
            gap_count = 0
        else:
            gap_count += 1
            if gap_count >= MAX_GAP:
                break

    return last_valid_time


# =========================================================
# Step 3: ノートごとの評価
# =========================================================
# (2026-05-26 ⑤⑧ cleanup: 旧 _advance_cursor / _run_lookahead / _try_resync は
#  絶対タイミング + cascade 移行後に dead code 化したため削除)


def _get_rest_duration(all_notes, current_note_end, next_note_start):
    """2つのノート間の休符時間を返す"""
    gap = next_note_start - current_note_end
    return gap if gap > 0.05 else 0.0


# ===================================================================
# v1.7 Phase D (2026-05-23): 重音スペクトル検証層
# ===================================================================
# 設計方針 (DoubleStop Analysis Spec brainstorm §2-3 準拠):
#   - 単音 (len(pitches)==1) は既存 librosa.yin パスで処理 (本層は触らない)
#   - 重音 (len(pitches)>=2) は STFT スペクトルから各 expected pitch を
#     独立にスペクトル検証 (presence + pitch_cents_error)
#   - ピッチ精度: ピーク周辺3点パラボリック補間で本当の周波数を推定
#   - presence: 当該 bin エネルギーが推定ノイズフロアの SNR_FACTOR 倍以上か
#   - 倍音衝突対策: 高い音から検査して固有倍音を優先採用
#   - 3 音以上の真の同時和音は全 pitch 並列検証 (ロール時間分割は Step G で検討)

def _estimate_spectral_noise_floor(
    stft_mag: np.ndarray,
    stft_times: np.ndarray,
    first_sound_time: float,
) -> float:
    """演奏前の無音区間 (first_sound_time - 0.1s より前) から
    STFT 全ビン横断のノイズフロア (中央値) を推定。
    """
    pre_mask = stft_times < max(0.0, first_sound_time - 0.1)
    if pre_mask.sum() >= 3:
        pre = stft_mag[:, pre_mask]
        if pre.size > 0:
            return float(np.median(pre))
    # フォールバック: 録音全体の下位 10 パーセンタイル
    return float(np.percentile(stft_mag, 10))


def _parabolic_peak_freq(
    bins: np.ndarray, freqs: np.ndarray, center_idx: int,
) -> float:
    """3点パラボリック補間でピーク周波数 (Hz) を推定。
    bins[center_idx-1..center_idx+1] と対応 freqs から、サブビン位置 p を計算:
      p = 0.5 * (α - γ) / (α - 2β + γ),  α=左, β=中央, γ=右
    返す周波数 = freqs[center] + p * (freqs[center+1] - freqs[center])
    """
    if center_idx <= 0 or center_idx >= len(bins) - 1:
        return float(freqs[center_idx])
    a = float(bins[center_idx - 1])
    b = float(bins[center_idx])
    c = float(bins[center_idx + 1])
    denom = a - 2.0 * b + c
    if abs(denom) < 1e-12:
        return float(freqs[center_idx])
    p = 0.5 * (a - c) / denom
    p = max(-0.5, min(0.5, p))
    bin_hz = float(freqs[center_idx + 1] - freqs[center_idx])
    return float(freqs[center_idx]) + p * bin_hz


def _verify_pitches_spectral(
    stft_mag: np.ndarray,
    stft_freqs: np.ndarray,
    stft_times: np.ndarray,
    note_start_sec: float,
    note_end_sec: float,
    expected_pitches_hz,
    noise_floor: float,
) -> list:
    """ノートの時間窓に対し、複数 expected pitch を独立スペクトル検証。

    Returns: [{
      "expected_pitch_hz": float,
      "detected_pitch_hz": float | None,
      "pitch_cents_error": float | None,
      "pitch_ok": bool | None,
      "presence_ok": bool | None,
    }, ...] (length == len(expected_pitches_hz))

    倍音衝突対策: 高い音から処理して、低音の倍音と紛らわしい場合に高音側を
    優先確定する (基本和音 G3+D5 で D5 が G3 の 3 倍音と一致する場合等)。
    """
    # 時間窓フレーム選択
    t_mask = (stft_times >= note_start_sec) & (stft_times < note_end_sec)
    if t_mask.sum() < 1:
        # 窓内フレームなし: 全 pitch 判定不能
        return [
            {
                "expected_pitch_hz": float(p),
                "detected_pitch_hz": None,
                "pitch_cents_error": None,
                "pitch_ok": None,
                "presence_ok": None,
            }
            for p in expected_pitches_hz
        ]
    window = stft_mag[:, t_mask]
    # ノート区間中のビン別中央値スペクトラム (時間方向の代表値)
    spectrum = np.median(window, axis=1)

    # 高い音から検査 (倍音衝突優先解決)
    order = sorted(range(len(expected_pitches_hz)),
                   key=lambda i: -expected_pitches_hz[i])

    results_by_idx: dict = {}
    bin_hz = float(stft_freqs[1] - stft_freqs[0]) if len(stft_freqs) > 1 else 1.0

    for idx in order:
        exp_f = float(expected_pitches_hz[idx])
        if exp_f <= 0:
            results_by_idx[idx] = {
                "expected_pitch_hz": exp_f,
                "detected_pitch_hz": None,
                "pitch_cents_error": None,
                "pitch_ok": None,
                "presence_ok": None,
            }
            continue
        center_bin = int(round(exp_f / bin_hz))
        if center_bin < 1 or center_bin >= len(stft_freqs) - 1:
            results_by_idx[idx] = {
                "expected_pitch_hz": exp_f,
                "detected_pitch_hz": None,
                "pitch_cents_error": None,
                "pitch_ok": None,
                "presence_ok": None,
            }
            continue

        # ローカル探索: ±200 cents (PITCH_SEARCH_CENTS) の範囲で最大ビン
        cents_per_bin = 1200.0 * np.log2((stft_freqs[center_bin] + bin_hz)
                                          / max(stft_freqs[center_bin], 1.0))
        search_bins = max(1, int(np.ceil(PITCH_SEARCH_CENTS / max(cents_per_bin, 1.0))))
        lo = max(SPECTRAL_BIN_HALFWIDTH, center_bin - search_bins)
        hi = min(len(stft_freqs) - 1 - SPECTRAL_BIN_HALFWIDTH, center_bin + search_bins)
        if lo >= hi:
            results_by_idx[idx] = {
                "expected_pitch_hz": exp_f,
                "detected_pitch_hz": None,
                "pitch_cents_error": None,
                "pitch_ok": None,
                "presence_ok": None,
            }
            continue
        local_region = spectrum[lo:hi + 1]
        local_peak = int(np.argmax(local_region)) + lo

        peak_energy = float(spectrum[local_peak])
        snr = peak_energy / max(noise_floor, 1e-12)

        # presence 判定
        if snr >= SPECTRAL_PRESENCE_SNR:
            presence_ok: object = True
        elif snr < SPECTRAL_INCONCLUSIVE_SNR:
            presence_ok = None   # 判定不能 (信号弱)
        else:
            presence_ok = False

        # ピッチ補間
        detected_freq = _parabolic_peak_freq(spectrum, stft_freqs, local_peak)
        if detected_freq <= 0:
            results_by_idx[idx] = {
                "expected_pitch_hz": exp_f,
                "detected_pitch_hz": None,
                "pitch_cents_error": None,
                "pitch_ok": False if presence_ok is True else None,
                "presence_ok": presence_ok,
            }
            continue

        cents_error = float(1200.0 * np.log2(detected_freq / exp_f))

        if presence_ok is True:
            pitch_ok: object = abs(cents_error) <= DOUBLE_STOP_CENTS_OK
        elif presence_ok is False:
            # 鳴ってないので音程は false
            pitch_ok = False
        else:
            pitch_ok = None

        results_by_idx[idx] = {
            "expected_pitch_hz": exp_f,
            "detected_pitch_hz": float(detected_freq),
            "pitch_cents_error": cents_error,
            "pitch_ok": pitch_ok,
            "presence_ok": presence_ok,
        }

    # 元の順序で返却
    return [results_by_idx[i] for i in range(len(expected_pitches_hz))]


def _aggregate_double_stop_status(pitch_results: list) -> tuple:
    """重音 pitch_results から evaluation_status と後方互換キーを導出。

    Returns: (status, agg_pitch_ok, agg_expected_hz, agg_detected_hz, agg_cents_error)
    """
    if not pitch_results:
        return ("spectral_inconclusive", None, 0.0, None, None)

    all_presence_none = all(p["presence_ok"] is None for p in pitch_results)
    if all_presence_none:
        return ("spectral_inconclusive",
                None,
                float(pitch_results[0]["expected_pitch_hz"]),
                None,
                None)

    all_ok = all(p["pitch_ok"] is True for p in pitch_results)
    all_ng = all(p["pitch_ok"] is False for p in pitch_results)
    if all_ok:
        status = "double_stop_full"
        agg_pitch_ok: object = True
    elif all_ng:
        status = "double_stop_miss"
        agg_pitch_ok = False
    else:
        status = "double_stop_partial"   # △ (改善ポイント可視化)
        agg_pitch_ok = None

    # 後方互換スカラー = 最低音 (pitches[0]) の値
    p0 = pitch_results[0]
    return (status,
            agg_pitch_ok,
            float(p0["expected_pitch_hz"]),
            p0["detected_pitch_hz"],
            p0["pitch_cents_error"])


# ===================================================================
# v1.7 Phase E (2026-05-23): ハーモニクス純度判定層
# ===================================================================
# 設計方針 (DoubleStop Analysis Spec brainstorm §10-11 準拠):
#   - is_harmonic=true ノート専用 (analyze_musicxml.py Step C で出力)
#   - sounding_pitch_hz をターゲットとして純度判定
#   - 純度指標 2 つ:
#     (A) fundamental_ratio = 基音帯エネルギー / 全体エネルギー
#         (フラジオレットは基音卓越、押さえすぎ普通音は倍音分散)
#     (B) overtone_count = 顕著な倍音本数 (2/3/4/5 倍音帯)
#         (ハーモニクスは倍音少、普通音は多い)
#   - presence: 基音帯エネルギーが noise * SPECTRAL_PRESENCE_SNR を超えるか
#   - 3 状態判定:
#     presence=False                                       → harmonic_miss (×)
#     presence=True ∧ 純度十分 (両指標 OK) ∧ pitch OK     → harmonic_ok (◎)
#     presence=True ∧ 純度不足 (片方 NG)   ∧ pitch OK     → harmonic_normal_tone (△)
#     presence=True ∧ pitch NG                            → harmonic_miss (×)

def _check_harmonic_purity(
    stft_mag: np.ndarray,
    stft_freqs: np.ndarray,
    stft_times: np.ndarray,
    note_start_sec: float,
    note_end_sec: float,
    sounding_pitch_hz: float,
    noise_floor: float,
) -> dict:
    """ハーモニクスノートの純度判定。

    Returns: {
      "fundamental_ratio": float,   # 0.0 〜 1.0
      "overtone_count": int,
      "ok": True | False | None,    # ◎=True / △=None / ×=False
      "presence_ok": bool,
      "detected_pitch_hz": float | None,
      "pitch_cents_error": float | None,
    }
    """
    if sounding_pitch_hz <= 0:
        return {
            "fundamental_ratio": 0.0,
            "overtone_count": 0,
            "ok": False,
            "presence_ok": False,
            "detected_pitch_hz": None,
            "pitch_cents_error": None,
        }

    t_mask = (stft_times >= note_start_sec) & (stft_times < note_end_sec)
    if t_mask.sum() < 1:
        # 窓内フレームなし: 判定不能 (presence False と等価扱い)
        return {
            "fundamental_ratio": 0.0,
            "overtone_count": 0,
            "ok": False,
            "presence_ok": False,
            "detected_pitch_hz": None,
            "pitch_cents_error": None,
        }
    spectrum = np.median(stft_mag[:, t_mask], axis=1)
    bin_hz = float(stft_freqs[1] - stft_freqs[0]) if len(stft_freqs) > 1 else 1.0

    def _bin_index(f: float) -> int:
        return int(round(f / bin_hz))

    # 基音帯エネルギー (基音周辺 ±1 ビン)
    fund_bin = _bin_index(sounding_pitch_hz)
    if fund_bin < SPECTRAL_BIN_HALFWIDTH or fund_bin >= len(stft_freqs) - SPECTRAL_BIN_HALFWIDTH:
        return {
            "fundamental_ratio": 0.0,
            "overtone_count": 0,
            "ok": False,
            "presence_ok": False,
            "detected_pitch_hz": None,
            "pitch_cents_error": None,
        }
    fund_lo = max(0, fund_bin - SPECTRAL_BIN_HALFWIDTH)
    fund_hi = min(len(stft_freqs), fund_bin + SPECTRAL_BIN_HALFWIDTH + 1)
    fund_energy = float(np.sum(spectrum[fund_lo:fund_hi]))
    total_energy = float(np.sum(spectrum)) + 1e-12
    fundamental_ratio = fund_energy / total_energy

    # presence 判定 (基音帯ピークが noise * SNR を超えるか)
    fund_peak = float(np.max(spectrum[fund_lo:fund_hi]))
    presence_ok = (fund_peak / max(noise_floor, 1e-12)) >= SPECTRAL_PRESENCE_SNR

    # 倍音本数 (2/3/4/5 倍音帯で SNR > HARMONIC_OVERTONE_SNR)
    overtone_count = 0
    for mult in (2, 3, 4, 5):
        ot_bin = _bin_index(sounding_pitch_hz * mult)
        if ot_bin >= len(stft_freqs) - SPECTRAL_BIN_HALFWIDTH:
            break
        lo = max(0, ot_bin - SPECTRAL_BIN_HALFWIDTH)
        hi = min(len(stft_freqs), ot_bin + SPECTRAL_BIN_HALFWIDTH + 1)
        ot_peak = float(np.max(spectrum[lo:hi]))
        if (ot_peak / max(noise_floor, 1e-12)) >= HARMONIC_OVERTONE_SNR:
            overtone_count += 1

    # ピーク補間で detected freq + cents_error
    detected_freq: Optional[float] = None
    cents_error: Optional[float] = None
    if presence_ok:
        # 基音周辺で正確なピーク位置
        local_lo = max(SPECTRAL_BIN_HALFWIDTH, fund_bin - 3)
        local_hi = min(len(stft_freqs) - 1 - SPECTRAL_BIN_HALFWIDTH, fund_bin + 3)
        if local_lo < local_hi:
            local_peak = int(np.argmax(spectrum[local_lo:local_hi + 1])) + local_lo
            df = _parabolic_peak_freq(spectrum, stft_freqs, local_peak)
            if df > 0:
                detected_freq = float(df)
                cents_error = float(1200.0 * np.log2(df / sounding_pitch_hz))

    # 純度判定 (基音卓越 ∧ 倍音少 → ◎)
    purity_ok = (
        fundamental_ratio >= HARMONIC_FUND_RATIO_OK
        and overtone_count <= HARMONIC_OVERTONE_MAX
    )

    # pitch 判定 (基音帯にエネルギーがあって cents が許容内か)
    pitch_within = (
        cents_error is not None and abs(cents_error) <= HARMONIC_CENTS_OK
    )

    if not presence_ok:
        ok: Optional[bool] = False              # 鳴らず → ×
    elif not pitch_within:
        ok = False                              # 音程外れ → ×
    elif purity_ok:
        ok = True                               # ◎
    else:
        ok = None                               # △ (鳴ったが純度不足 = 普通の音色)

    return {
        "fundamental_ratio": float(fundamental_ratio),
        "overtone_count": int(overtone_count),
        "ok": ok,
        "presence_ok": bool(presence_ok),
        "detected_pitch_hz": detected_freq,
        "pitch_cents_error": cents_error,
    }


def _is_short_technique_note(note):
    """note 属性に短音奏法フラグがあれば True。MusicXML パース未実装時は常に False。"""
    for attr in SHORT_TECHNIQUE_ATTRS:
        if note.get(attr):
            return True
    return False


def _classify_segment(segment, expected_pos, expected_duration,
                       timing_tolerance, is_short_technique):
    """
    ③ 3軸カスケード評価のためのセグメント分類 (2026-05-26)。

    軸:
      - pitch_close: confidence == "high" (= ±50¢)
      - time_close:  |seg_start - expected_pos| <= timing_tolerance
      - duration_close: actual_dur が expected_duration の 70%〜130%

    分類:
      - "all_match"           (◯ ◯ ◯)             → 即採用 (correct)
      - "short_technique_ok"  (◯ ◯ ✗ + 技法)      → 即採用 (correct、短音技法)
      - "pitch_wrong"         (✗ ◯ ◯)             → 即採用 (pitch_ok=false)
      - "timing_wrong"        (◯ ✗ _)             → 即採用 (start_ok=false)
      - "case_a"              (◯ ◯ ✗ 技法なし)   → fallback A 候補
      - "case_c"              (✗ ✗ ◯)             → fallback C 候補
      - "reject"              その他              → 探索拡大
    """
    pitch_close = segment.get("confidence") == "high"
    time_close = abs(segment["seg_start"] - expected_pos) <= timing_tolerance
    actual_dur = segment["seg_end"] - segment["seg_start"]
    dur_min = expected_duration * (1.0 - DURATION_TOLERANCE_RATIO)
    dur_max = expected_duration * (1.0 + DURATION_TOLERANCE_RATIO)
    duration_close = dur_min <= actual_dur <= dur_max

    if pitch_close and time_close and duration_close:
        return "all_match"
    if pitch_close and time_close and not duration_close and is_short_technique:
        return "short_technique_ok"
    if pitch_close and not time_close:
        return "timing_wrong"
    if not pitch_close and time_close and duration_close:
        return "pitch_wrong"
    if pitch_close and time_close and not duration_close:
        return "case_a"  # 技法なし、fallback
    if not pitch_close and not time_close and duration_close:
        return "case_c"  # ピッチ・タイミング両方 NG、duration だけ合う、fallback
    return "reject"


def evaluate_notes(notes_only, all_notes, valid_time, valid_f0, global_shift, performance_start_time, onset_times=None, time_scale=1.0, timing_tolerance=TIMING_TOLERANCE_BASE, stft_mag=None, stft_freqs=None, stft_times=None, spectral_noise_floor=None, rms=None, time_all=None):
    results = []
    cursor = performance_start_time

    # 2026-05-26: 絶対タイミング評価 (前音アンカー方式 = 改善G は撤回)。
    # テンポガイドラインがあるため演奏全体のドリフトは想定不要。各ノートは
    # expected_pos (= performance_start_time + 楽譜上の相対位置 * time_scale) と
    # 直接比較し、前音検出位置に依存しない構造とする。
    first_es = float(notes_only[0]["start_time_sec"]) if notes_only else 0.0

    # onset 連携: 前ノートの検出終了位置（ガード1 用）
    prev_seg_end = None

    for i, n in enumerate(notes_only):
        note_idx = int(n["note_index"])
        all_expected_pitches = n.get("pitches", [])
        expected_pitch = float(all_expected_pitches[0])
        es = float(n["start_time_sec"])
        ee = float(n["end_time_sec"])
        expected_duration = (ee - es) * time_scale  # テンポスケール適用
        measure_num = n.get("measure_number", 0)
        note_name = n.get("note_name", "")
        is_tied = n.get("is_tied", False)
        is_tremolo = n.get("is_tremolo", False)
        is_trill = n.get("is_trill", False)
        is_chord = n.get("is_chord", False)
        # v1.7 Phase E: ハーモニクス情報 (analyze_musicxml.py Step C 由来)
        is_harmonic = bool(n.get("is_harmonic", False))
        sounding_pitch_hz = n.get("sounding_pitch_hz")

        expected_pos = performance_start_time + (es - first_es) * time_scale

        # 絶対タイミング前提: cursor を毎ノート expected_pos 基準にリセット。
        # 累積カーソルドリフト (medium 誤検出による seg_end 過剰前進等) を防ぐ。
        # 早入り 0.15s 許容、performance_start_time より前には行かない。
        # prev_seg_end は Phase 1 guard1 (find_note_segment 内) で別経路で参照される。
        # ② vulnerability 解消 (2026-05-26): cursor 計算から prev_seg_end 依存を削除。
        # 同音は v25 で別経路、異音は PITCH_SEARCH_CENTS + Improvement J が前 sustain
        # での false-match を防ぐため、cursor を前ノート末尾で押し出す必要なし。
        SEARCH_PRE_BUFFER = 0.15
        cursor = max(expected_pos - SEARCH_PRE_BUFFER, performance_start_time)

        # v1.7 Phase D: 重音 (len(pitches)>=2) はスペクトル検証パスへ分岐。
        # 単音 (len==1) は既存 yin パスに進む。重音時もタイミング判定は
        # 既存 cursor 探索結果を流用 (start_diff_sec/start_ok の互換維持)。
        is_double_stop = (
            len(all_expected_pitches) >= 2
            and stft_mag is not None
            and stft_freqs is not None
            and stft_times is not None
            and spectral_noise_floor is not None
        )

        # ⑧ resync は絶対タイミング cascade では効果なし (cursor は次イテで reset) → 削除

        # --- 区間探索 (③ 3軸カスケード評価、2026-05-26) ---
        # 各候補を pitch/time/duration の 3 軸で分類し、即採用 / fallback / 拡大 を決定。
        # 段階拡大: ±0.15s → ±0.5s → ±1.0s → ±1.5s
        prev_pitch = float(notes_only[i - 1]["pitches"][0]) if i > 0 else None
        next_pitch = float(notes_only[i + 1]["pitches"][0]) if i + 1 < len(notes_only) else None
        use_onsets = onset_times if not (is_tied or is_tremolo or is_trill) else None
        is_short_technique = _is_short_technique_note(notes_only[i])

        # 仕様準拠の cascade (2026-05-26):
        # - Stage 1 (±0.15s) で immediate accept があれば即終了
        # - Stage 1 が case_a → 拡大は (◯◯◯) / technique_ok のみ upgrade
        # - Stage 1 が case_c または何も無し/reject → 拡大は任意の immediate accept で upgrade
        # - 最終: stage 1 fallback を採用 or not_detected
        IMMEDIATE_ACCEPT = ("all_match", "short_technique_ok", "pitch_wrong", "timing_wrong")
        PERFECT_ACCEPT   = ("all_match", "short_technique_ok")

        stage1_outcome = None  # "case_a" | "case_c" | None (= nothing/reject)
        stage1_segment = None
        selected_segment = None
        selected_case = None
        seen_seg_starts = set()

        # --- Stage 1 ---
        stage1_radius = CASCADE_SEARCH_RADII[0]
        stage1_cursor = max(expected_pos - stage1_radius, performance_start_time)
        stage1_search_range = (expected_pos + stage1_radius) - stage1_cursor
        seg = find_note_segment(
            stage1_cursor, expected_pitch, expected_duration, valid_time, valid_f0,
            onset_times=use_onsets,
            prev_expected_pitch=prev_pitch, next_expected_pitch=next_pitch,
            prev_seg_end=prev_seg_end,
            rms=rms, time_all=time_all, note_idx=note_idx,
            search_range_override=stage1_search_range,
        )
        if seg is not None:
            seen_seg_starts.add(round(seg["seg_start"], 3))
            case = _classify_segment(seg, expected_pos, expected_duration,
                                      timing_tolerance, is_short_technique)
            _diag(f"note={note_idx} cascade stage=0 radius={stage1_radius:.2f} "
                  f"seg={seg['seg_start']:.3f} case={case} conf={seg.get('confidence')}")
            if case in IMMEDIATE_ACCEPT:
                selected_segment = seg
                selected_case = case
            elif case == "case_a":
                stage1_outcome = "case_a"
                stage1_segment = seg
            elif case == "case_c":
                stage1_outcome = "case_c"
                stage1_segment = seg
            # case == "reject" → stage1_outcome stays None

        # --- Stages 2-4 (拡大) ---
        # 同音連続では拡大しない (前ノート sustain 内の偽 onset を拾うため)。
        # 同音連続は stage 1 で見つからなければ pitch_only 救済 (find_note_segment None 経由) に任せる。
        same_pitch_local = (
            prev_pitch is not None
            and abs(prev_pitch - expected_pitch) < 1e-6
        )
        if selected_segment is None and not same_pitch_local:
            for stage_idx in range(1, len(CASCADE_SEARCH_RADII)):
                radius = CASCADE_SEARCH_RADII[stage_idx]
                stage_cursor = max(expected_pos - radius, performance_start_time)
                stage_search_range = (expected_pos + radius) - stage_cursor

                seg = find_note_segment(
                    stage_cursor, expected_pitch, expected_duration, valid_time, valid_f0,
                    onset_times=use_onsets,
                    prev_expected_pitch=prev_pitch, next_expected_pitch=next_pitch,
                    prev_seg_end=prev_seg_end,
                    rms=rms, time_all=time_all, note_idx=note_idx,
                    search_range_override=stage_search_range,
                )
                if seg is None:
                    continue
                seg_key = round(seg["seg_start"], 3)
                if seg_key in seen_seg_starts:
                    continue
                seen_seg_starts.add(seg_key)

                case = _classify_segment(seg, expected_pos, expected_duration,
                                          timing_tolerance, is_short_technique)
                _diag(f"note={note_idx} cascade stage={stage_idx} radius={radius:.2f} "
                      f"seg={seg['seg_start']:.3f} case={case} conf={seg.get('confidence')}")

                if stage1_outcome == "case_a":
                    # case_a 経路: (◯◯◯) または technique_ok のみ upgrade
                    if case in PERFECT_ACCEPT:
                        selected_segment = seg
                        selected_case = case
                        break
                else:
                    # case_c または stage 1 何もなし: 任意の immediate accept で upgrade
                    if case in IMMEDIATE_ACCEPT:
                        selected_segment = seg
                        selected_case = case
                        break
                    # 拡大段階で stage1 が None だった場合のみ case_c も拾う
                    if stage1_outcome is None and case == "case_c":
                        stage1_outcome = "case_c"
                        stage1_segment = seg

        # --- 最終 fallback ---
        if selected_segment is None and stage1_segment is not None:
            selected_segment = stage1_segment
            selected_case = "fallback_a" if stage1_outcome == "case_a" else "fallback_c"

        segment = selected_segment
        accepted = segment is not None
        if selected_case is not None:
            _diag(f"note={note_idx} cascade RESULT case={selected_case} "
                  f"seg={segment['seg_start'] if segment else None}")

        if accepted:
            seg_start = segment["seg_start"]
            seg_end = segment["seg_end"]
            avg_pitch = segment["avg_pitch"]
            valid_frames = segment["valid_frames"]
            confidence = segment["confidence"]

            timing_from_start = seg_start - performance_start_time

            pitch_tolerance = 100 if is_chord else PITCH_TOLERANCE_CENTS
            # ⑨ 重複除去 (2026-05-26): _try_match_at で計算済の値を流用
            pitch_cents_error = segment["pitch_cents_error"]
            pitch_ok = abs(pitch_cents_error) <= pitch_tolerance

            # 絶対タイミング評価: expected_pos と直接比較 (前音アンカー方式は撤回)
            start_diff = seg_start - expected_pos
            start_ok = abs(start_diff) <= timing_tolerance

            eval_status = "evaluated"
            if is_tied or is_tremolo or is_trill:
                eval_status = "pitch_only"

            # onset ガード用: 前ノートの終了位置を記録 (find_note_segment guard1 で使用)
            prev_seg_end = seg_end
            # ⑤ cursor の事後更新は dead code (次イテで expected_pos 基準にリセットされる) → 削除

            results.append(_make_result(
                note_idx, measure_num, note_name, global_shift, expected_pos,
                ee + global_shift, expected_pitch,
                safe_float(seg_start), safe_float(avg_pitch),
                safe_float(timing_from_start),
                safe_float(pitch_cents_error), pitch_ok,
                safe_float(start_diff), start_ok,
                valid_frames, eval_status, confidence))

        else:
            # 同音 legato 救済 (2026-05-26): 前ノートと同音で検出器が拾えなかったケースは
            # 構造的に判定不能 (acoustic boundary なし) のため、ピッチ継続を確認した上で
            # pitch_only ステータスで OK 扱いとする。
            same_pitch_local = (
                prev_pitch is not None
                and abs(prev_pitch - expected_pitch) < 1e-6
            )
            rescued_as_pitch_only = False
            if same_pitch_local and len(results) >= 1:
                prev_result = results[-1]
                # prev が not_detected で pitch 情報が無い場合は救済不能 (継承元なし)
                prev_has_pitch_info = (
                    prev_result.get("detected_pitch_hz") is not None
                    and prev_result.get("pitch_ok") is not None
                )
            else:
                prev_has_pitch_info = False

            if same_pitch_local and prev_has_pitch_info:
                # ガード: 期待区間の f0 中央値が prev_pitch ±50¢ 以内 → 同音継続と判定
                # window は expected_pos 基準で取る
                window_start = max(expected_pos - expected_duration * 0.3, performance_start_time)
                window_mask = (valid_time >= window_start) & (valid_time < window_start + expected_duration)
                f_in_window = valid_f0[window_mask]
                if len(f_in_window) >= MIN_VALID_FRAMES:
                    window_med = float(np.median(f_in_window))
                    if window_med > 0:
                        # ⑦ 継承連鎖を断ち切る (2026-05-26): prev_result から継承せず、
                        # 現区間の window_med から fresh に計算する。長い同音連続列で
                        # 誤った prev 値が孫に伝播する問題を解消。
                        cents_signed = float(cents_diff(window_med, expected_pitch))
                        cents_drift = abs(cents_signed)
                        if cents_drift <= PITCH_TOLERANCE_CENTS:
                            _diag(f"note={note_idx} SAME_PITCH_LEGATO_RESCUE "
                                  f"cents_drift={cents_drift:.1f} → pitch_only (fresh from window_med)")
                            # cursor の事後更新は dead code (次イテで reset) → 削除
                            results.append(_make_result(
                                note_idx, measure_num, note_name, global_shift, expected_pos,
                                ee + global_shift, expected_pitch,
                                None,                  # detected_start_sec (sustain 中、開始時刻不明)
                                window_med,            # detected_pitch_hz (current window から)
                                None,                  # timing_from_start
                                cents_signed,          # pitch_cents_error (current window から)
                                True,                  # pitch_ok (guard 通過したので True)
                                None, True,            # start_diff_sec, start_ok
                                0, "pitch_only",
                                "high"))               # match_confidence (cents_drift <= 50 なので high)
                            rescued_as_pitch_only = True

            if not rescued_as_pitch_only:
                # ⑤⑧ cursor 事後更新は dead code (次イテで expected_pos 基準にリセット) → 削除
                results.append(_make_result(
                    note_idx, measure_num, note_name, global_shift, expected_pos,
                    ee + global_shift, expected_pitch,
                    None, None, None, None, None, None, None,
                    0, "not_detected", None))

        # タイ後半 (continuation/stop) のピッチ評価を直前ノートから継承する。
        # スコア側はタイを 2 ノートに時間分割するが、演奏側は 1 弓の continuous tone。
        # 後半は held tone の release 領域 (弓圧変化・押弦緩み) を window として捉えるため、
        # 独立評価では同一音でも pitch ドリフトを拾い NG になりやすく、ユーザー体感と乖離する。
        # 物理的・楽典的に同一音である以上、評価は前半に揃える。
        if is_tied and len(results) >= 2:
            prev = results[-2]
            cur  = results[-1]
            if prev.get("pitch_ok") is not None:
                cur["pitch_ok"]           = prev["pitch_ok"]
                cur["pitch_cents_error"]  = prev["pitch_cents_error"]
                # 後半が not_detected の場合: held tone は実際まだ鳴っているはずなので、
                # 前半の検出ピッチを借りて pitch_only に格上げする。
                if cur.get("evaluation_status") == "not_detected":
                    cur["evaluation_status"] = "pitch_only"
                    if cur.get("detected_pitch_hz") is None:
                        cur["detected_pitch_hz"] = prev.get("detected_pitch_hz")

        # v1.7 Phase D: pitches 配列の付与 (全ノート共通)。重音はスペクトル検証で
        # pitch 系を上書きし evaluation_status を double_stop_* に変える。
        # tied/tremolo/trill 重音は release 領域が不安定なため spectral を走らせず
        # 単音と同じく pitches[0] ラップに留める (前音継承の意図を尊重)。
        if len(results) >= 1:
            cur = results[-1]
            do_spectral = is_double_stop and not (is_tied or is_tremolo or is_trill)
            if do_spectral:
                ds_start = cur.get("detected_start_sec")
                if ds_start is None:
                    win_start = es + global_shift
                    win_end = ee + global_shift
                else:
                    win_start = float(ds_start)
                    win_end = float(ds_start) + expected_duration
                pitch_results = _verify_pitches_spectral(
                    stft_mag, stft_freqs, stft_times,
                    win_start, win_end,
                    all_expected_pitches, float(spectral_noise_floor),
                )
                ds_status, ds_pok, ds_exp_hz, ds_det_hz, ds_cents = \
                    _aggregate_double_stop_status(pitch_results)
                cur["pitches"] = pitch_results
                cur["expected_pitch_hz"] = ds_exp_hz
                cur["detected_pitch_hz"] = ds_det_hz
                cur["pitch_cents_error"] = ds_cents
                cur["pitch_ok"] = ds_pok
                cur["evaluation_status"] = ds_status
            else:
                # 単音 or tied/tremolo/trill: yin 結果を pitches[0] にラップして
                # forward 互換確保 (重音だった場合でも他 pitch は出力しない)
                cur["pitches"] = [{
                    "expected_pitch_hz": float(expected_pitch),
                    "detected_pitch_hz": cur.get("detected_pitch_hz"),
                    "pitch_cents_error": cur.get("pitch_cents_error"),
                    "pitch_ok": cur.get("pitch_ok"),
                    "presence_ok": None,  # yin パスは presence 概念なし
                }]

        # v1.7 Phase E: ハーモニクスノートは純度判定で status と pitch 系を上書き。
        # double_stop パスの後に実行することで、両フラグ重複時はハーモニクスを優先。
        # tied/tremolo/trill は spectral スキップ (前音継承を尊重)。
        if (
            is_harmonic
            and stft_mag is not None
            and stft_freqs is not None
            and stft_times is not None
            and spectral_noise_floor is not None
            and len(results) >= 1
            and not (is_tied or is_tremolo or is_trill)
        ):
            cur = results[-1]
            # sounding_pitch_hz があれば使用、無ければ pitches[0] へフォールバック
            if isinstance(sounding_pitch_hz, (int, float)) and sounding_pitch_hz > 0:
                target_hz = float(sounding_pitch_hz)
            elif all_expected_pitches:
                target_hz = float(all_expected_pitches[0])
            else:
                target_hz = 0.0

            if target_hz > 0:
                ds_start = cur.get("detected_start_sec")
                if ds_start is None:
                    win_start = es + global_shift
                    win_end = ee + global_shift
                else:
                    win_start = float(ds_start)
                    win_end = win_start + expected_duration
                purity = _check_harmonic_purity(
                    stft_mag, stft_freqs, stft_times,
                    win_start, win_end, target_hz, float(spectral_noise_floor),
                )
                cur["harmonic_purity"] = purity
                # status 上書き
                if not purity["presence_ok"]:
                    cur["evaluation_status"] = "harmonic_miss"  # 鳴らず ×
                    cur["pitch_ok"] = False
                elif purity["ok"] is True:
                    cur["evaluation_status"] = "harmonic_ok"   # ◎
                    cur["pitch_ok"] = True
                elif purity["ok"] is None:
                    cur["evaluation_status"] = "harmonic_normal_tone"  # △
                    cur["pitch_ok"] = True
                else:  # ok=False かつ presence=True → 音程外れ
                    cur["evaluation_status"] = "harmonic_miss"
                    cur["pitch_ok"] = False
                cur["expected_pitch_hz"] = target_hz
                if purity.get("detected_pitch_hz") is not None:
                    cur["detected_pitch_hz"] = purity["detected_pitch_hz"]
                    cur["pitch_cents_error"] = purity["pitch_cents_error"]
                # pitches[0] も上書き (forward 互換、consumer は一貫した形を期待)
                if cur.get("pitches"):
                    cur["pitches"][0] = {
                        "expected_pitch_hz": target_hz,
                        "detected_pitch_hz": purity.get("detected_pitch_hz"),
                        "pitch_cents_error": purity.get("pitch_cents_error"),
                        "pitch_ok": cur["pitch_ok"],
                        "presence_ok": purity["presence_ok"],
                    }

    return results


def _make_result(ni, mn, nn, gs, ess, ees, ep,
                 seg_start, avg_pitch, timing_from_start,
                 pce, pok, sd, sok, vf, est, confidence):
    return {
        "note_index": ni,
        "measure_number": mn,
        "note_name": nn,
        "global_shift_sec": float(gs),
        "current_shift_sec": float(gs),
        "expected_start_sec": float(ess),
        "expected_end_sec": float(ees),
        "expected_pitch_hz": float(ep),
        # 区間データ
        "detected_start_sec": seg_start,
        "detected_pitch_hz": avg_pitch,
        "timing_from_start_sec": timing_from_start,
        "match_confidence": confidence,
        # 評価結果
        "pitch_cents_error": pce,
        "pitch_ok": bool(pok) if pok is not None else None,
        "start_diff_sec": sd,           # 絶対タイミングのズレ (= seg_start - expected_pos)
        "start_ok": bool(sok) if sok is not None else None,
        "valid_frames": vf,
        "evaluation_status": est,
    }


# =========================================================
# メイン処理
# =========================================================
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

try:
    if IS_PRACTICE:
        cur.execute("""
            SELECT "audioPath", "practiceItemId"
            FROM "PracticePerformance"
            WHERE id = %s AND "userId" = %s AND "practiceItemId" = %s
        """, (PERFORMANCE_ID, USER_ID, SCORE_ID))
    else:
        cur.execute("""
            SELECT "audioPath", "scoreId"
            FROM "Performance"
            WHERE id = %s AND "userId" = %s AND "scoreId" = %s
        """, (PERFORMANCE_ID, USER_ID, SCORE_ID))

    row = cur.fetchone()
    if not row:
        raise Exception("Performance not found or unauthorized")

    audio_path = row[0]
    print(f"[1/5] audioPath: {audio_path} (practice={IS_PRACTICE})")

    if IS_PRACTICE:
        # PracticeItem.analysisPath からパスを取得
        cur.execute("""
            SELECT "analysisPath" FROM "PracticeItem" WHERE id = %s
        """, (SCORE_ID,))
        item_row = cur.fetchone()
        if not item_row or not item_row[0]:
            raise Exception(f"PracticeItem {SCORE_ID} has no analysisPath")
        analysis_storage_path = item_row[0]
    else:
        # 共有スコア (isShared=true) を別ユーザーが録音した場合、
        # analysis.json は score 作成者の folder にある。
        # USER_ID (録音者の dbUser.id) ではなく Score.createdById を使う。
        cur.execute('SELECT "createdById" FROM "Score" WHERE id = %s', (SCORE_ID,))
        score_row = cur.fetchone()
        if not score_row:
            raise Exception(f"Score {SCORE_ID} not found")
        analysis_storage_path = f"{score_row[0]}/{SCORE_ID}/analysis.json"

    analysis_bytes = download_from_storage(MUSICXML_BUCKET, analysis_storage_path)
    analysis = json.loads(analysis_bytes)

    all_notes = analysis["notes"]
    BPM = float(analysis["bpm"])
    instrument_name = analysis.get("instrument", "unknown")
    print(f"[2/5] analysis.json: {len(all_notes)} entries, BPM={BPM}, instrument={instrument_name}")

    # 音声ダウンロード (拡張子は audio_path から判定)
    audio_bytes = download_from_storage(PERFORMANCE_BUCKET, audio_path)
    ext = os.path.splitext(audio_path)[1].lower()

    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp_input_path = tmp.name
        tmp.write(audio_bytes)

    # WebM/MP4/OGG (browser MediaRecorder 出力) は FFmpeg で WAV 変換。
    # 旧 /api/convert-audio と同等の処理: 44.1kHz mono PCM s16。
    # WAV 入力はそのまま librosa に渡す (後方互換)。
    # tmp_input_path / tmp_wav_path は finally で必ず cleanup する。
    tmp_wav_path: Optional[str] = None
    audio_to_load = tmp_input_path
    try:
        if ext in (".webm", ".mp4", ".ogg"):
            tmp_wav_path = tmp_input_path + ".wav"
            result = subprocess.run(
                ["ffmpeg", "-y", "-i", tmp_input_path,
                 "-ar", "44100", "-ac", "1", "-acodec", "pcm_s16le", tmp_wav_path],
                capture_output=True, text=True, timeout=240,  # 10分音声に対応
            )
            if result.returncode != 0:
                raise Exception(f"FFmpeg 変換エラー: {result.stderr[:300]}")
            audio_to_load = tmp_wav_path

        y, sr = librosa.load(audio_to_load, sr=None)
    finally:
        # FFmpeg 失敗 / librosa 例外時も含めて両 tmp ファイルを cleanup
        for p in (tmp_input_path, tmp_wav_path):
            if p:
                try:
                    os.remove(p)
                except (FileNotFoundError, OSError):
                    pass

    duration_sec = len(y) / sr
    if duration_sec > MAX_DURATION_SEC:
        raise RuntimeError(f"録音が長すぎます ({duration_sec:.0f}秒)。")
    if duration_sec < MIN_DURATION_SEC:
        raise RuntimeError(f"録音が短すぎます ({duration_sec:.1f}秒)。")

    fmin_note, fmax_note = INSTRUMENT_PITCH_RANGE.get(instrument_name, DEFAULT_PITCH_RANGE)
    fmin = librosa.note_to_hz(fmin_note)
    fmax = librosa.note_to_hz(fmax_note)

    f0 = librosa.yin(y, fmin=fmin, fmax=fmax, sr=sr, frame_length=FRAME_LENGTH, hop_length=HOP_LENGTH)
    time_all = librosa.frames_to_time(np.arange(len(f0)), sr=sr, hop_length=HOP_LENGTH)
    rms = librosa.feature.rms(y=y, frame_length=FRAME_LENGTH, hop_length=HOP_LENGTH)[0]

    f0 = np.array(f0)
    rms = np.array(rms)
    time_all = np.array(time_all)

    valid_mask = ~np.isnan(f0) & (rms > RMS_THRESHOLD)
    valid_time = time_all[valid_mask]
    valid_f0 = f0[valid_mask]

    valid_ratio = len(valid_time) / len(time_all) if len(time_all) > 0 else 0
    if valid_ratio == 0:
        raise RuntimeError("演奏が検出されませんでした。")

    print(f"[3/5] Audio: {duration_sec:.1f}s, {len(valid_time)} valid frames ({valid_ratio:.0%})")

    warnings = []
    if valid_ratio < 0.5:
        warnings.append("録音品質が低い可能性があります。静かな環境で再録音してください。")

    notes_only = [n for n in all_notes if n.get("type") == "note" and n.get("pitches")]
    if not notes_only:
        raise RuntimeError("No note entries in analysis.json")

    MIN_SUSTAIN = 15
    pitched_loud = (rms > RMS_THRESHOLD * 2) & (~np.isnan(f0[:len(rms)]))
    first_sound_time = 0.0
    run_count = 0
    for idx in range(len(pitched_loud)):
        if pitched_loud[idx]:
            run_count += 1
            if run_count >= MIN_SUSTAIN:
                first_sound_time = float(time_all[idx - MIN_SUSTAIN + 1])
                break
        else:
            run_count = 0
    if first_sound_time == 0.0:
        loud_idx = np.where(rms > RMS_THRESHOLD * 2)[0]
        if len(loud_idx) > 0:
            first_sound_time = float(time_all[loud_idx[0]])
    print(f"  First sound at: {first_sound_time:.3f}s")

    # ノイズゲートを適用して valid_mask / valid_time / valid_f0 を再構築
    gate_mask  = apply_noise_gate(rms, time_all, f0, first_sound_time)
    valid_mask = ~np.isnan(f0) & gate_mask
    valid_time = time_all[valid_mask]
    valid_f0   = f0[valid_mask]

    global_shift = find_start_position(notes_only, valid_time, valid_f0, first_sound_time)
    print(f"[4/5] global_shift: {global_shift:.3f}s")

    performance_start_time = float(notes_only[0]["start_time_sec"]) + global_shift

    # テンポスケール (2026-05-26: ⑥ 自動推定 fallback を撤去)
    # - recording_bpm 渡された → 正確に算出 (役割 A: 楽譜↔実演奏のスケール変換)
    # - 渡されない → 1.0 fallback (= 楽譜 BPM で弾いた想定)
    # 旧自動推定 (performance_duration / score_duration) は途中停止 / 休止 / リピート逸脱
    # で大きく狂うため削除。recording_bpm はテンポガイド連携でフロントが必ず渡す前提。
    if RECORDING_BPM is not None and RECORDING_BPM > 0:
        time_scale = BPM / RECORDING_BPM
        print(f"  Time scale: {time_scale:.3f} (score_bpm={BPM}, recording_bpm={RECORDING_BPM})")
    else:
        time_scale = 1.0
        # ユーザー向け warning は出さない (ログのみ)。フロント連携時は recording_bpm が
        # 常に渡される想定で、未指定はフロント側 bug を意味する。ユーザーには不要な情報。
        print(f"  WARNING: RECORDING_BPM not provided → time_scale=1.0 fallback (score_bpm={BPM} assumed)")

    # タイミング判定の許容値 (BPM 連動)
    # interval_diff は time_scale で recording_bpm 基準に補正済 → 許容値も同基準で計算
    target_bpm = RECORDING_BPM if (RECORDING_BPM is not None and RECORDING_BPM > 0) else BPM
    timing_tolerance = get_timing_tolerance(target_bpm)
    print(f"  Timing tolerance: ±{timing_tolerance:.3f}s (target_bpm={target_bpm})")

    # Onset 検出（環境変数フラグで有効化）
    onset_times = None
    if USE_ONSET_DETECTION:
        onset_times = detect_onsets(y, sr, hop_length=HOP_LENGTH)
        onset_times = onset_times[onset_times >= first_sound_time]
        print(f"  [Onset] detected {len(onset_times)} onsets (USE_ONSET_DETECTION=true)")
    else:
        print(f"  [Onset] skipped (USE_ONSET_DETECTION=false)")

    # v1.7 Phase D (2026-05-23): 重音スペクトル検証用 STFT を 1 度だけ計算。
    # 単音ノートでは使われない (yin パス温存)。重音ノート (len(pitches)>=2)
    # でのみ参照される共有データ。
    stft_mag = np.abs(librosa.stft(y, n_fft=SPECTRAL_N_FFT, hop_length=HOP_LENGTH))
    stft_freqs = librosa.fft_frequencies(sr=sr, n_fft=SPECTRAL_N_FFT)
    stft_times = librosa.frames_to_time(
        np.arange(stft_mag.shape[1]), sr=sr, hop_length=HOP_LENGTH)
    spectral_noise_floor = _estimate_spectral_noise_floor(
        stft_mag, stft_times, first_sound_time)
    print(f"  [Spectral] STFT shape={stft_mag.shape} "
          f"noise_floor={spectral_noise_floor:.6f}")

    results = evaluate_notes(
        notes_only, all_notes, valid_time, valid_f0,
        global_shift, performance_start_time,
        onset_times=onset_times, time_scale=time_scale,
        timing_tolerance=timing_tolerance,
        stft_mag=stft_mag, stft_freqs=stft_freqs, stft_times=stft_times,
        spectral_noise_floor=spectral_noise_floor,
        rms=rms, time_all=time_all)

    # v3.2 Commit A (C5 + 致命3): 音量フィールド (avg_volume_db / volume_drop_after) を追加
    # 設計書 §14-2 参照。bowing 系 sub task (string_change_volume / string_change_slur) が依存。
    # 致命3: volume_drop_after の計算で次音符の検出時刻 (detected_start_sec) を優先する。
    from lib.audio_volume import (
        calculate_audio_features_per_note,
        merge_audio_features_into_comparison_result,
    )
    audio_features = calculate_audio_features_per_note(
        audio=y,
        sample_rate=sr,
        note_results_notes=notes_only,
        comparison_result=results,
        next_window_sec=0.1,
    )
    results = merge_audio_features_into_comparison_result(results, audio_features)

    # サマリー
    detected = [r for r in results if r["evaluation_status"] in ("evaluated", "pitch_only")]
    pitch_ok_count = sum(1 for r in detected if r["pitch_ok"] is True)
    timing_evaluated = [r for r in results if r["evaluation_status"] == "evaluated"]
    timing_ok_count = sum(1 for r in timing_evaluated if r["start_ok"] is True)
    not_detected = sum(1 for r in results if r["evaluation_status"] == "not_detected")
    high_conf = sum(1 for r in detected if r.get("match_confidence") == "high")
    med_conf = sum(1 for r in detected if r.get("match_confidence") == "medium")

    print(f"[4/5] Results: {len(results)} notes")
    if detected:
        print(f"  Pitch OK: {pitch_ok_count}/{len(detected)} = {pitch_ok_count/len(detected)*100:.0f}%")
        print(f"  Confidence: high={high_conf}, medium={med_conf}")
    if timing_evaluated:
        print(f"  Timing OK: {timing_ok_count}/{len(timing_evaluated)} = {timing_ok_count/len(timing_evaluated)*100:.0f}%")
    print(f"  Not detected: {not_detected}")
    for w in warnings:
        print(f"  WARNING: {w}")

    comparison_output = {
        "version": "3.0",
        "warnings": warnings,
        "results": results,
    }

    comparison_json = json.dumps(comparison_output, indent=2, ensure_ascii=False)
    if IS_PRACTICE:
        comparison_path = f"practice/{USER_ID}/{SCORE_ID}/{PERFORMANCE_ID}/comparison_result.json"
    else:
        comparison_path = f"{USER_ID}/{SCORE_ID}/{PERFORMANCE_ID}/comparison_result.json"
    upload_to_storage(PERFORMANCE_BUCKET, comparison_path, comparison_json.encode("utf-8"))

    # --- サマリー計算 ---
    # v1.5/案 Y: timing → rhythm に正書化。timing_accuracy ローカル変数は維持し、
    #            DB へは timingAccuracy (legacy mirror, P-ア) と rhythmAccuracy (v1.5 正) の両方に
    #            同値を書き込む。
    # v1.5/案 α: overallScore は loop_engine_runner.py (= score_full の後段) で
    #            (pitchAccuracy + rhythmAccuracy + bowingAccuracy) / 3 として計算する。
    #            analyze_performance.py 単独では計算しない。
    #            Score 演奏 (IS_PRACTICE=false) では loop_engine_runner が走らないため、
    #            Phase 3 で対応するまで overallScore は NULL のままとなる。

    # 分母は楽譜上の全音符数（not_detected も「不正解」として扱う）。
    # v1.7 Phase D (2026-05-23): 重音/ハーモニクス用の新 status も評価対象に含める。
    #   - spectral_inconclusive (信号弱・判定保留) は除外 (not_detected と同じ扱い、赤判定にしない)
    #   - double_stop_partial / harmonic_normal_tone (△) は 0.5 点で寄与
    #     (重音 △ overallScore 寄与 = 0.5 点扱い、Tetsuo 承認済)
    total_notes = len(results)
    EVALUATED_STATUSES = (
        "evaluated", "pitch_only",
        "double_stop_full", "double_stop_partial", "double_stop_miss",
        "harmonic_ok", "harmonic_normal_tone", "harmonic_miss",
    )
    evaluated = [r for r in results if r["evaluation_status"] in EVALUATED_STATUSES]

    def _pitch_score(r):
        st = r.get("evaluation_status")
        # △ = 0.5 点 (重音/ハーモニクス共通)
        if st in ("double_stop_partial", "harmonic_normal_tone"):
            return 0.5
        if r.get("pitch_ok") is True:
            return 1.0
        return 0.0

    pitch_score_sum = sum(_pitch_score(r) for r in evaluated)
    pitch_ok_count = pitch_score_sum  # 互換: 既存ログ参照向け (整数とは限らない)
    # rhythm bug fix (2026-05-26): timing_evaluated を evaluated と統一。
    # 旧実装は pitch_only を timing 集計から除外していたが、分母 total_notes はそのままだったため、
    # 同音連続救済 (pitch_only, start_ok=true 固定) が「timing NG」として加算されて
    # UI 緑表示と乖離 (例: 62/64 緑 = 96.9% のはずが、56.2% と表示) していた。
    # pitch_only も timing 集計に含めることで UI と整合。
    # (tremolo/trill が pitch_only に倒れて timing 実測値が無視される件は別 issue
    #  [[tremolo-trill-separate-status]] として将来改善予定)
    timing_evaluated = evaluated
    timing_ok_count = sum(1 for r in timing_evaluated if r["start_ok"] is True)

    pitch_accuracy = round(pitch_score_sum / total_notes * 100, 1) if total_notes > 0 else None
    timing_accuracy = round(timing_ok_count / total_notes * 100, 1) if total_notes > 0 else None
    rhythm_accuracy = timing_accuracy  # v1.5/案 Y: rhythmAccuracy = timingAccuracy 同値で書き込み
    evaluated_notes = len(evaluated)

    # v1.5/案 α: overallScore 計算は loop_engine_runner で実施 (score_full 後段)
    overall_score = None  # placeholder for legacy print/log; DB UPDATE には含めない

    # 拡張用 JSON（将来ビブラート等の指標もここに追加）
    import json as json_module
    analysis_summary = {}

    # --- 最重要の1課題を特定 ---
    primary_issue = None
    primary_advice = None

    if pitch_accuracy is not None and timing_accuracy is not None:
        if pitch_accuracy < timing_accuracy:
            # ピッチが弱い
            pitch_errors = [r for r in evaluated if r.get("pitch_ok") is False]
            if pitch_errors:
                avg_cents = sum(abs(r.get("pitch_cents_error", 0)) for r in pitch_errors) / len(pitch_errors)
                if avg_cents > 30:
                    primary_issue = "pitch_unstable"
                    primary_advice = "音程が不安定です。チューナーのトーンで、1音ずつ確認しながら弾いてみましょう"
                else:
                    primary_issue = "pitch_slight"
                    primary_advice = "音程はほぼ合っています。微調整を意識してもう一度弾いてみましょう"
        else:
            # タイミングが弱い
            timing_errors = [r for r in timing_evaluated if r.get("start_ok") is False]
            if timing_errors:
                late_count = sum(1 for r in timing_errors if r.get("start_diff_sec", 0) > 0)
                early_count = len(timing_errors) - late_count
                if late_count > early_count:
                    primary_issue = "timing_late"
                    primary_advice = "リズムが遅れがちです。メトロノームに合わせて練習しましょう"
                else:
                    primary_issue = "timing_early"
                    primary_advice = "リズムが走りがちです。拍の裏を感じながら弾いてみましょう"

        # 全体スコアが高い場合
        if primary_issue is None:
            if pitch_accuracy is not None and pitch_accuracy < 75:
                primary_issue = "pitch"
                primary_advice = "音程を安定させましょう。開放弦と合わせて確認してください"
            elif timing_accuracy is not None and timing_accuracy < 75:
                primary_issue = "timing"
                primary_advice = "リズムを正確にしましょう。メトロノームを使いましょう"
            else:
                primary_issue = "none"
                primary_advice = "よく弾けています！テンポを少し上げて挑戦しましょう"

    analysis_summary["primaryIssue"] = primary_issue
    analysis_summary["primaryAdvice"] = primary_advice

    print(f"  Summary: pitch={pitch_accuracy}% timing={timing_accuracy}% overall={overall_score}%")
    if primary_issue:
        print(f"  Primary issue: {primary_issue}")

    # v1.5/案 Y + 案 α:
    #   - timingAccuracy 列 (legacy) と rhythmAccuracy 列 (v1.3 正) の両方に同値書き込み (P-ア)
    #   - overallScore は UPDATE に含めない (loop_engine_runner で 3 軸合成して書き込む)
    if IS_PRACTICE:
        cur.execute("""
            UPDATE "PracticePerformance"
            SET "comparisonResultPath" = %s,
                "pitchAccuracy" = %s,
                "timingAccuracy" = %s,
                "rhythmAccuracy" = %s,
                "evaluatedNotes" = %s,
                "analysisSummary" = %s,
                "analysisStatus" = 'done',
                "errorMessage" = NULL
            WHERE id = %s
        """, (
            comparison_path,
            pitch_accuracy,
            timing_accuracy,
            rhythm_accuracy,
            evaluated_notes,
            json_module.dumps(analysis_summary, ensure_ascii=False) if analysis_summary else None,
            PERFORMANCE_ID,
        ))
    else:
        cur.execute("""
            UPDATE "Performance"
            SET "comparisonResultPath" = %s,
                "pitchAccuracy" = %s,
                "timingAccuracy" = %s,
                "rhythmAccuracy" = %s,
                "evaluatedNotes" = %s,
                "analysisSummary" = %s,
                "analysisStatus" = 'done',
                "errorMessage" = NULL
            WHERE id = %s
        """, (
            comparison_path,
            pitch_accuracy,
            timing_accuracy,
            rhythm_accuracy,
            evaluated_notes,
            json_module.dumps(analysis_summary, ensure_ascii=False) if analysis_summary else None,
            PERFORMANCE_ID,
        ))
    conn.commit()

    print(f"[5/5] Uploaded: {comparison_path}")
    print("Performance analysis complete.")

except Exception as e:
    conn.rollback()
    # analysisStatus を error に落として watchdog の誤判定を防ぐ
    # この UPDATE 自体が失敗しても本来の例外を優先する
    try:
        table = "PracticePerformance" if IS_PRACTICE else "Performance"
        cur.execute(
            f'UPDATE "{table}" '
            f'SET "analysisStatus" = \'error\', "errorMessage" = %s '
            f'WHERE id = %s',
            (str(e)[:300], PERFORMANCE_ID),
        )
        conn.commit()
    except Exception:
        pass
    raise e
finally:
    cur.close()
    conn.close()
