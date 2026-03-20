from __future__ import annotations

import sys
import json
import os
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
    raise Exception("Usage: python analyze_performance.py USER_ID SCORE_ID PERFORMANCE_ID")

USER_ID = sys.argv[1]
SCORE_ID = sys.argv[2]
PERFORMANCE_ID = sys.argv[3]

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

# ピッチ判定
PITCH_TOLERANCE_CENTS = 50    # ±50cents: ピッチ正確 → confidence "high"
PITCH_SEARCH_CENTS = 200      # ±200cents（±2半音）: ピッチずれ → confidence "medium"
MIN_VALID_FRAMES = 5
CENTER_RATIO = 0.80
TIMING_TOLERANCE = 0.20

# 区間探索
MAX_SEARCH_SEC = 10.0         # 各ノートの前方探索範囲（秒）

# 先読み検証（改善A）
LOOKAHEAD_COUNT = 10          # medium時の先読みノート数
LOOKAHEAD_MATCH_RATE = 0.5    # 先読み成功の閾値（要チューニング）

# ノート飛ばし: section_missing は廃止
# 見つからないノートは not_detected として記録し、探索を継続する

# 制約
MAX_DURATION_SEC = 300
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

def find_note_segment(cursor, expected_pitch, expected_duration, valid_time, valid_f0):
    """
    カーソルから前方に expected_duration 幅の窓を走査し、
    noteの特徴に合う区間を探す。
    見つかったら音の実際の終わりも検出して返す。
    """
    search_end = cursor + MAX_SEARCH_SEC
    scan_step = 0.02

    t = cursor
    while t < search_end:
        seg_start = t
        measure_end = t + expected_duration
        dur = expected_duration
        margin = dur * (1.0 - CENTER_RATIO) / 2.0

        mask = (valid_time >= seg_start + margin) & (valid_time <= measure_end - margin)
        cnt = int(np.sum(mask))

        if cnt >= MIN_VALID_FRAMES:
            med = float(np.median(valid_f0[mask]))
            if med > 0:
                c = abs(1200.0 * np.log2(med / expected_pitch))

                if c <= PITCH_TOLERANCE_CENTS or c <= PITCH_SEARCH_CENTS:
                    confidence = "high" if c <= PITCH_TOLERANCE_CENTS else "medium"
                    actual_end = _detect_sound_end(seg_start, med, valid_time, valid_f0)

                    return {
                        "seg_start": seg_start,
                        "seg_end": actual_end,
                        "avg_pitch": med,
                        "valid_frames": cnt,
                        "confidence": confidence,
                    }

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
        if rf[i] > 0 and abs(1200.0 * np.log2(rf[i] / detected_pitch)) <= PITCH_SEARCH_CENTS:
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
        return seg_end
    else:
        return seg_start + expected_duration


# =========================================================
# Step 3: ノートごとの評価（改善A・G・C反映）
# =========================================================

def _run_lookahead(start_index, notes_only, temp_cursor, valid_time, valid_f0):
    """
    start_index から LOOKAHEAD_COUNT ノート分の先読みを実行。
    match_count（high数）と total_checked を返す。
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
            # MISS: カーソルは動かさない
            pass
        elif next_seg["confidence"] == "high":
            # MATCH
            match_count += 1
            temp_cursor = _advance_cursor(next_seg["seg_start"], next_seg["seg_end"], next_dur)
        else:
            # WEAK: カウントしないがカーソルは進める
            temp_cursor = _advance_cursor(next_seg["seg_start"], next_seg["seg_end"], next_dur)

    return match_count, total_checked


def _get_rest_duration(all_notes, current_note_end, next_note_start):
    """2つのノート間の休符時間を返す"""
    gap = next_note_start - current_note_end
    return gap if gap > 0.05 else 0.0


def evaluate_notes(notes_only, all_notes, valid_time, valid_f0, global_shift, performance_start_time):
    results = []
    cursor = performance_start_time

    # 改善G: 相対タイミング用
    prev_detected_start = None
    prev_score_start = None

    for i, n in enumerate(notes_only):
        note_idx = int(n["note_index"])
        expected_pitch = float(n["pitches"][0])
        es = float(n["start_time_sec"])
        ee = float(n["end_time_sec"])
        expected_duration = ee - es
        measure_num = n.get("measure_number", 0)
        note_name = n.get("note_name", "")
        is_tied = n.get("is_tied", False)
        is_tremolo = n.get("is_tremolo", False)
        is_trill = n.get("is_trill", False)
        is_chord = n.get("is_chord", False)

        timing_ref = es + global_shift

        # --- 区間探索 ---
        segment = find_note_segment(cursor, expected_pitch, expected_duration, valid_time, valid_f0)

        accepted = False

        if segment is not None:
            if segment["confidence"] == "high":
                accepted = True
            elif segment["confidence"] == "medium":
                # 先読み検証（改善A）
                temp_cursor = _advance_cursor(segment["seg_start"], segment["seg_end"], expected_duration)
                match_count, total_checked = _run_lookahead(
                    i, notes_only, temp_cursor, valid_time, valid_f0)
                rate = match_count / total_checked if total_checked > 0 else 0
                if rate >= LOOKAHEAD_MATCH_RATE:
                    accepted = True

        if accepted:
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
                score_interval = es - prev_score_start
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
                    cursor += rest_dur

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
            # not_detected: カーソルは動かさない
            # 次のnoteで同じ位置から再探索する
            # → 次のnoteが見つかれば、そこから割り振り再開
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
        "pitch_ok": pok,
        "start_diff_sec": sd,      # 改善G: 相対間隔のズレ
        "start_ok": sok,
        "valid_frames": vf,
        "evaluation_status": est,
    }


# =========================================================
# メイン処理
# =========================================================
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

try:
    cur.execute("""
        SELECT "audioPath", "scoreId"
        FROM "Performance"
        WHERE id = %s AND "userId" = %s AND "scoreId" = %s
    """, (PERFORMANCE_ID, USER_ID, SCORE_ID))

    row = cur.fetchone()
    if not row:
        raise Exception("Performance not found or unauthorized")

    audio_path = row[0]
    print(f"[1/5] audioPath: {audio_path}")

    analysis_storage_path = f"{USER_ID}/{SCORE_ID}/analysis.json"
    analysis_bytes = download_from_storage(MUSICXML_BUCKET, analysis_storage_path)
    analysis = json.loads(analysis_bytes)

    all_notes = analysis["notes"]
    BPM = float(analysis["bpm"])
    instrument_name = analysis.get("instrument", "unknown")
    print(f"[2/5] analysis.json: {len(all_notes)} entries, BPM={BPM}, instrument={instrument_name}")

    wav_bytes = download_from_storage(PERFORMANCE_BUCKET, audio_path)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_wav_path = tmp.name
        tmp.write(wav_bytes)

    y, sr = librosa.load(tmp_wav_path, sr=None)
    os.remove(tmp_wav_path)

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

    global_shift = find_start_position(notes_only, valid_time, valid_f0, first_sound_time)
    print(f"[4/5] global_shift: {global_shift:.3f}s")

    performance_start_time = float(notes_only[0]["start_time_sec"]) + global_shift

    results = evaluate_notes(notes_only, all_notes, valid_time, valid_f0, global_shift, performance_start_time)

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
    comparison_path = f"{USER_ID}/{SCORE_ID}/{PERFORMANCE_ID}/comparison_result.json"
    upload_to_storage(PERFORMANCE_BUCKET, comparison_path, comparison_json.encode("utf-8"))

    cur.execute("""
        UPDATE "Performance"
        SET "comparisonResultPath" = %s
        WHERE id = %s
    """, (comparison_path, PERFORMANCE_ID))
    conn.commit()

    print(f"[5/5] Uploaded: {comparison_path}")
    print("Performance analysis complete.")

except Exception as e:
    conn.rollback()
    raise e
finally:
    cur.close()
    conn.close()
