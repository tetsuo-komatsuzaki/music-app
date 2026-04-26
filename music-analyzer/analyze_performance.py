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
TIMING_TOLERANCE = 0.20

# 区間探索
SEARCH_DURATION_MULTIPLIER = 3.0  # expected_duration × この倍率

# 再同期（Improvement K）
RESYNC_AFTER_MISS = 3             # この回数連続 not_detected で再同期を試みる
RESYNC_CONFIRM_COUNT = 2          # 連続一致で再同期を確定
RESYNC_MAX_JUMP = 1.2             # ジャンプ距離の上限（秒）

# 先読み検証（改善A）
LOOKAHEAD_COUNT = 10          # medium時の先読みノート数
LOOKAHEAD_MATCH_RATE = 0.5    # 先読み成功の閾値（要チューニング）

# Onset 検出（環境変数フラグで有効化）
USE_ONSET_DETECTION = os.environ.get("USE_ONSET_DETECTION", "false") == "true"
ONSET_PITCH_CHANGE_CENTS = 30     # onset 前後のピッチ変化閾値（cents）
ONSET_PITCH_CHANGE_WINDOW = 0.03  # onset 前後の比較窓（秒）

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


def _has_pitch_change_at_onset(onset_t, valid_time, valid_f0):
    """
    onset 前後でピッチが変化しているか確認。
    レガート中の偽 onset（弓圧変化等）を除外するためのガード。
    30 cents 未満の変化はビブラートの範囲内と判断し False を返す。
    """
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

    c = abs(1200.0 * np.log2(med / expected_pitch))
    if c > PITCH_SEARCH_CENTS:
        return None

    confidence = "high" if c <= PITCH_TOLERANCE_CENTS else "medium"

    # Improvement J: medium match 時、前の音か次の音に近ければ skip
    if confidence == "medium":
        if prev_expected_pitch is not None:
            c_prev = abs(1200.0 * np.log2(med / prev_expected_pitch))
            if c_prev < c:
                return None
        if next_expected_pitch is not None:
            c_next = abs(1200.0 * np.log2(med / next_expected_pitch))
            if c_next < c:
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
    }


def find_note_segment(cursor, expected_pitch, expected_duration, valid_time, valid_f0,
                      onset_times=None, prev_expected_pitch=None, next_expected_pitch=None,
                      prev_seg_end=None):
    """
    カーソルから前方に expected_duration 幅の窓を走査し、
    noteの特徴に合う区間を探す。

    Phase 1: onset_times を優先候補として探索（ガード条件付き）
    Phase 2: 既存のスキャン探索（フォールバック）
    """
    search_range = max(expected_duration * SEARCH_DURATION_MULTIPLIER, 1.5)
    search_range = min(search_range, 3.0)
    search_end = cursor + search_range

    # === Phase 1: onset ベース探索 ===
    if onset_times is not None and len(onset_times) > 0:
        candidate_onsets = onset_times[(onset_times >= cursor) & (onset_times < search_end)]
        for onset_t in candidate_onsets:
            # ガード1: 前ノートの持続中の偽 onset を無視
            if prev_seg_end is not None and onset_t < prev_seg_end - 0.05:
                continue
            # ガード2: 期待タイミングから大幅に外れた onset は無視
            timing_gap = abs(onset_t - cursor)
            if timing_gap > expected_duration * 2.0:
                continue
            # ガード3: ピッチ変化のない onset は偽 onset として無視
            if not _has_pitch_change_at_onset(onset_t, valid_time, valid_f0):
                continue

            result = _try_match_at(onset_t, expected_pitch, expected_duration,
                                   valid_time, valid_f0,
                                   prev_expected_pitch, next_expected_pitch)
            if result is not None:
                return result

    # === Phase 2: 既存のスキャン探索（フォールバック） ===
    scan_step = 0.02
    t = cursor
    while t < search_end:
        result = _try_match_at(t, expected_pitch, expected_duration,
                               valid_time, valid_f0,
                               prev_expected_pitch, next_expected_pitch)
        if result is not None:
            return result
        t += scan_step

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


def _advance_cursor(seg_start, seg_end, expected_duration):
    """レガート判定付きカーソル進行。進行先の時刻を返す。"""
    actual_dur = seg_end - seg_start
    if actual_dur <= expected_duration * 1.5:
        new_cursor = seg_end
    else:
        new_cursor = seg_start + expected_duration
    # IMPROVEMENT cursor_overshoot: 同一seg_startへの再マッチを防止 — 2026-04-05
    # 最低でも expected_duration の半分は前進する
    min_advance = seg_start + expected_duration * 0.5
    return max(new_cursor, min_advance)


# =========================================================
# Step 3: ノートごとの評価（改善A・G・C反映）
# =========================================================

def _run_lookahead(start_index, notes_only, temp_cursor, valid_time, valid_f0):
    """
    start_index から LOOKAHEAD_COUNT ノート分の先読みを実行。
    match_count（high or medium で検出できた数）と total_checked を返す。
    """
    match_count = 0
    total_checked = 0

    for k in range(1, LOOKAHEAD_COUNT + 1):
        idx = start_index + k
        if idx >= len(notes_only):
            break

        next_note = notes_only[idx]
        next_pitch = float(next_note["pitches"][0])
        next_es = float(next_note["start_time_sec"])
        next_ee = float(next_note["end_time_sec"])
        next_dur = next_ee - next_es

        next_seg = find_note_segment(temp_cursor, next_pitch, next_dur, valid_time, valid_f0)
        total_checked += 1

        if next_seg is None:
            # MISS: カーソルを音の長さ分だけ進めて次の音を探す
            temp_cursor += next_dur
        else:
            # high でも medium でも、音が見つかったらカウント
            match_count += 1
            temp_cursor = _advance_cursor(next_seg["seg_start"], next_seg["seg_end"], next_dur)

    return match_count, total_checked


def _try_resync(cursor, note_index, notes_only, valid_time, valid_f0):
    """
    not_detected が連続した際に、カーソルを演奏に再同期させる。
    note_index から RESYNC_CONFIRM_COUNT 音分を連続マッチできる
    位置を探し、見つかればその位置を返す。
    """
    if note_index + RESYNC_CONFIRM_COUNT > len(notes_only):
        return None

    confirm_notes = notes_only[note_index:note_index + RESYNC_CONFIRM_COUNT]
    first_dur = float(confirm_notes[0]["end_time_sec"]) - float(confirm_notes[0]["start_time_sec"])
    search_end = cursor + RESYNC_MAX_JUMP

    scan_step = min(0.01, first_dur / 10)

    t = cursor
    while t < search_end:
        temp_cursor = t
        all_match = True

        for k, cn in enumerate(confirm_notes):
            cp = float(cn["pitches"][0])
            cd = float(cn["end_time_sec"]) - float(cn["start_time_sec"])

            seg = find_note_segment(temp_cursor, cp, cd, valid_time, valid_f0)

            if seg is None:
                all_match = False
                break

            if seg["confidence"] not in ("high", "medium"):
                all_match = False
                break

            # ピッチ精度チェック: ±40cents以内
            pitch_cents = abs(1200.0 * np.log2(seg["avg_pitch"] / cp))
            if pitch_cents > 40:
                all_match = False
                break

            temp_cursor = _advance_cursor(seg["seg_start"], seg["seg_end"], cd)

        if all_match:
            return t

        t += scan_step

    return None


def _get_rest_duration(all_notes, current_note_end, next_note_start):
    """2つのノート間の休符時間を返す"""
    gap = next_note_start - current_note_end
    return gap if gap > 0.05 else 0.0


def evaluate_notes(notes_only, all_notes, valid_time, valid_f0, global_shift, performance_start_time, onset_times=None, time_scale=1.0):
    results = []
    cursor = performance_start_time

    # 改善G: 相対タイミング用
    prev_detected_start = None
    prev_score_start = None

    # 改善K: 再同期用
    consecutive_miss = 0

    # onset 連携: 前ノートの検出終了位置（ガード1 用）
    prev_seg_end = None

    for i, n in enumerate(notes_only):
        note_idx = int(n["note_index"])
        expected_pitch = float(n["pitches"][0])
        es = float(n["start_time_sec"])
        ee = float(n["end_time_sec"])
        expected_duration = (ee - es) * time_scale  # テンポスケール適用
        measure_num = n.get("measure_number", 0)
        note_name = n.get("note_name", "")
        is_tied = n.get("is_tied", False)
        is_tremolo = n.get("is_tremolo", False)
        is_trill = n.get("is_trill", False)
        is_chord = n.get("is_chord", False)

        timing_ref = es + global_shift

        # --- 改善K: 再同期 ---
        if consecutive_miss >= RESYNC_AFTER_MISS:
            resync_pos = _try_resync(cursor, i, notes_only, valid_time, valid_f0)
            if resync_pos is not None:
                jump = resync_pos - cursor
                print(f"  [RESYNC] note {i} ({note_name}) cursor {cursor:.2f}->{resync_pos:.2f} (jump={jump:+.2f}s, miss={consecutive_miss})")
                cursor = resync_pos
                consecutive_miss = 0
                prev_detected_start = None
                prev_score_start = None

        # --- 区間探索 ---
        prev_pitch = float(notes_only[i - 1]["pitches"][0]) if i > 0 else None
        next_pitch = float(notes_only[i + 1]["pitches"][0]) if i + 1 < len(notes_only) else None
        # onset_times は tied/tremolo/trill ノートには渡さない（Phase 1 スキップ）
        use_onsets = onset_times if not (is_tied or is_tremolo or is_trill) else None
        segment = find_note_segment(cursor, expected_pitch, expected_duration, valid_time, valid_f0,
                                    onset_times=use_onsets,
                                    prev_expected_pitch=prev_pitch, next_expected_pitch=next_pitch,
                                    prev_seg_end=prev_seg_end)

        accepted = False

        if segment is not None:
            if segment["confidence"] == "high":
                accepted = True
            elif segment["confidence"] == "medium":
                # 先読み検証（改善A）
                temp_cursor = _advance_cursor(segment["seg_start"], segment["seg_end"], expected_duration)
                match_count, total_checked = _run_lookahead(
                    i, notes_only, temp_cursor, valid_time, valid_f0)
                rate = match_count / total_checked if total_checked > 0 else 1.0
                if rate >= LOOKAHEAD_MATCH_RATE:
                    accepted = True

        if accepted:
            consecutive_miss = 0
            seg_start = segment["seg_start"]
            seg_end = segment["seg_end"]
            avg_pitch = segment["avg_pitch"]
            valid_frames = segment["valid_frames"]
            confidence = segment["confidence"]

            timing_from_start = seg_start - performance_start_time

            pitch_tolerance = 100 if is_chord else PITCH_TOLERANCE_CENTS
            pitch_cents_error = float(cents_diff(avg_pitch, expected_pitch))
            pitch_ok = abs(pitch_cents_error) <= pitch_tolerance

            # 改善G: 相対タイミング評価
            if prev_detected_start is not None and prev_score_start is not None:
                actual_interval = seg_start - prev_detected_start
                score_interval = (es - prev_score_start) * time_scale
                interval_diff = actual_interval - score_interval
                start_ok = abs(interval_diff) <= TIMING_TOLERANCE
            else:
                interval_diff = seg_start - timing_ref
                start_ok = abs(interval_diff) <= TIMING_TOLERANCE

            eval_status = "evaluated"
            if is_tied or is_tremolo or is_trill:
                eval_status = "pitch_only"

            # カーソル進行（レガート判定付き）
            cursor = _advance_cursor(seg_start, seg_end, expected_duration)

            # 改善C: 休符分カーソルを追加で進める
            if i + 1 < len(notes_only):
                next_es = float(notes_only[i + 1]["start_time_sec"])
                rest_dur = _get_rest_duration(all_notes, ee, next_es)
                if rest_dur > 0:
                    cursor += rest_dur * time_scale

            # onset ガード用: 前ノートの終了位置を記録
            prev_seg_end = seg_end

            # high confidence のみ基準として採用（ドリフト防止）
            if confidence == "high":
                prev_detected_start = seg_start
                prev_score_start = es

            results.append(_make_result(
                note_idx, measure_num, note_name, global_shift, timing_ref,
                ee + global_shift, expected_pitch,
                safe_float(seg_start), safe_float(avg_pitch),
                safe_float(timing_from_start),
                safe_float(pitch_cents_error), pitch_ok,
                safe_float(interval_diff), start_ok,
                valid_frames, eval_status, confidence))

        else:
            # not_detected: カーソルを演奏基準で前進させる
            consecutive_miss += 1
            if prev_detected_start is not None and prev_score_start is not None:
                expected_gap = (es - prev_score_start) * time_scale
                cursor = min(
                    prev_detected_start + expected_gap,
                    cursor + expected_duration * 1.5
                )
            else:
                cursor += expected_duration

            results.append(_make_result(
                note_idx, measure_num, note_name, global_shift, timing_ref,
                ee + global_shift, expected_pitch,
                None, None, None, None, None, None, None,
                0, "not_detected", None))

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
        "start_diff_sec": sd,           # 改善G: 相対間隔のズレ
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

    # テンポスケール推定（Improvement L）
    if RECORDING_BPM is not None and RECORDING_BPM > 0:
        # ユーザーが録音テンポを指定 → 楽譜BPM / 録音BPM で算出（正確）
        time_scale = BPM / RECORDING_BPM
        print(f"  Time scale: {time_scale:.3f} (score_bpm={BPM}, recording_bpm={RECORDING_BPM})")
    else:
        # フォールバック: 演奏の実際の長さから自動推定
        last_sound_time = float(valid_time[-1]) if len(valid_time) > 0 else duration_sec
        performance_duration = last_sound_time - first_sound_time
        score_duration = float(notes_only[-1]["end_time_sec"]) - float(notes_only[0]["start_time_sec"])
        time_scale = performance_duration / score_duration if score_duration > 0 else 1.0
        print(f"  Time scale: {time_scale:.3f} (score={score_duration:.1f}s, perf={performance_duration:.1f}s) [auto-estimated]")

    # Onset 検出（環境変数フラグで有効化）
    onset_times = None
    if USE_ONSET_DETECTION:
        onset_times = detect_onsets(y, sr, hop_length=HOP_LENGTH)
        onset_times = onset_times[onset_times >= first_sound_time]
        print(f"  [Onset] detected {len(onset_times)} onsets (USE_ONSET_DETECTION=true)")
    else:
        print(f"  [Onset] skipped (USE_ONSET_DETECTION=false)")

    results = evaluate_notes(notes_only, all_notes, valid_time, valid_f0, global_shift, performance_start_time, onset_times=onset_times, time_scale=time_scale)

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
    PITCH_WEIGHT = 0.6
    TIMING_WEIGHT = 0.4

    # 分母は楽譜上の全音符数（not_detected も「不正解」として扱う）
    total_notes = len(results)
    evaluated = [r for r in results if r["evaluation_status"] in ("evaluated", "pitch_only")]
    pitch_ok_count = sum(1 for r in evaluated if r["pitch_ok"] is True)
    timing_evaluated = [r for r in results if r["evaluation_status"] == "evaluated"]
    timing_ok_count = sum(1 for r in timing_evaluated if r["start_ok"] is True)

    pitch_accuracy = round(pitch_ok_count / total_notes * 100, 1) if total_notes > 0 else None
    timing_accuracy = round(timing_ok_count / total_notes * 100, 1) if total_notes > 0 else None
    evaluated_notes = len(evaluated)

    # overallScore 計算
    overall_score = None
    if pitch_accuracy is not None and timing_accuracy is not None:
        overall_score = round(pitch_accuracy * PITCH_WEIGHT + timing_accuracy * TIMING_WEIGHT, 1)
    elif pitch_accuracy is not None:
        overall_score = pitch_accuracy

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

    if IS_PRACTICE:
        cur.execute("""
            UPDATE "PracticePerformance"
            SET "comparisonResultPath" = %s,
                "pitchAccuracy" = %s,
                "timingAccuracy" = %s,
                "overallScore" = %s,
                "evaluatedNotes" = %s,
                "analysisSummary" = %s,
                "analysisStatus" = 'done',
                "errorMessage" = NULL
            WHERE id = %s
        """, (
            comparison_path,
            pitch_accuracy,
            timing_accuracy,
            overall_score,
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
                "overallScore" = %s,
                "evaluatedNotes" = %s,
                "analysisSummary" = %s,
                "analysisStatus" = 'done',
                "errorMessage" = NULL
            WHERE id = %s
        """, (
            comparison_path,
            pitch_accuracy,
            timing_accuracy,
            overall_score,
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
