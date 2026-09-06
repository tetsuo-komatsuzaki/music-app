"""
offline_analyzer.py — analyze_performance.py の本番経路を DB なしで回す

analyze_performance.py はスクリプトで、DB と Storage から入力を取り、結果を
Storage と DB に書く。ベンチマークやローカル検証ではそれが邪魔になる。
ここではその中身 (音声 → f0 → ノイズゲート → 位置合わせ → evaluate_notes →
音量特徴) を、同じ関数・同じ定数のまま、wav と音符リストから直接呼ぶ。

判定ロジックは一切複製しない。_load_analyzer 経由で本体の関数をそのまま使う。
本体が変われば、ここを通した結果も一緒に変わる。それがベンチマークの意味。

音符リストの出どころ (優先順):
  1. case_dir/analysis.json  — analyze_musicxml の出力そのもの (新規ケースはこれを保存する)
  2. case_dir/comparison_result.json — 旧結果から復元 (expected_start_sec - global_shift_sec)
"""

import json
import pathlib
import sys

import numpy as np
import librosa

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import _load_analyzer  # noqa: E402
from _cache import load_audio  # noqa: E402

A = _load_analyzer.load()

DEFAULT_BPM = 90.0


# ─── 音符リスト ──────────────────────────────────────────────

def notes_from_case(case_dir: pathlib.Path) -> tuple[list, float, dict]:
    """(all_notes, bpm, info) を返す。"""
    case_dir = pathlib.Path(case_dir)
    aj = case_dir / "analysis.json"
    if aj.exists():
        d = json.loads(aj.read_text(encoding="utf-8"))
        return d["notes"], float(d.get("bpm") or DEFAULT_BPM), {"source": "analysis.json"}

    cr = case_dir / "comparison_result.json"
    if not cr.exists():
        raise FileNotFoundError(f"{case_dir.name}: analysis.json も comparison_result.json もない")
    d = json.loads(cr.read_text(encoding="utf-8"))
    results = d["results"]
    gs = None
    for r in results:
        if r.get("global_shift_sec") is not None:
            gs = float(r["global_shift_sec"])
            break
    if gs is None:
        gs = 0.0
    notes = []
    for r in results:
        if r.get("expected_pitch_hz") is None or r.get("expected_start_sec") is None:
            continue
        notes.append({
            "note_index": int(r["note_index"]),
            "type": "note",
            "pitches": [float(r["expected_pitch_hz"])],
            "start_time_sec": float(r["expected_start_sec"]) - gs,
            "end_time_sec": float(r["expected_end_sec"]) - gs,
            "note_name": r.get("note_name"),
            "measure_number": r.get("measure_number"),
        })
    meta = case_dir / "meta.json"
    bpm = DEFAULT_BPM
    if meta.exists():
        m = json.loads(meta.read_text(encoding="utf-8"))
        if m.get("tempo_bpm"):
            bpm = float(m["tempo_bpm"])
    return notes, bpm, {"source": "comparison_result.json", "old_global_shift": gs}


# ─── 本番経路 ────────────────────────────────────────────────

def analyze(wav_path, all_notes: list, bpm: float, *,
            recording_bpm: float | None = None,
            guide_offset_sec: float | None = None,
            instrument: str = "violin",
            use_onset: bool | None = None,
            range_from: int | None = None,
            range_to: int | None = None,
            verbose: bool = False) -> dict:
    """analyze_performance.py の [3/5]〜[4/5] をそのまま辿る。"""
    log = print if verbose else (lambda *a, **k: None)

    # 本体が module global として参照する値を合わせる
    A.RECORDING_BPM = recording_bpm
    A.GUIDE_OFFSET_SEC = guide_offset_sec
    if use_onset is not None:
        A.USE_ONSET_DETECTION = use_onset

    y, sr = load_audio(wav_path)
    duration_sec = len(y) / sr
    if duration_sec > A.MAX_DURATION_SEC:
        raise RuntimeError(f"録音が長すぎます ({duration_sec:.0f}秒)")
    if duration_sec < A.MIN_DURATION_SEC:
        raise RuntimeError(f"録音が短すぎます ({duration_sec:.1f}秒)")

    fmin_note, fmax_note = A.INSTRUMENT_PITCH_RANGE.get(instrument, A.DEFAULT_PITCH_RANGE)
    fmin, fmax = librosa.note_to_hz(fmin_note), librosa.note_to_hz(fmax_note)

    f0 = np.array(librosa.yin(y, fmin=fmin, fmax=fmax, sr=sr,
                              frame_length=A.FRAME_LENGTH, hop_length=A.HOP_LENGTH))
    time_all = np.array(librosa.frames_to_time(np.arange(len(f0)), sr=sr, hop_length=A.HOP_LENGTH))
    rms = np.array(librosa.feature.rms(y=y, frame_length=A.FRAME_LENGTH, hop_length=A.HOP_LENGTH)[0])

    valid_mask = ~np.isnan(f0) & (rms > A.RMS_THRESHOLD)
    valid_ratio = float(valid_mask.sum()) / len(time_all) if len(time_all) else 0.0
    if valid_ratio == 0:
        raise RuntimeError("演奏が検出されませんでした")

    warnings = []
    if valid_ratio < 0.5:
        warnings.append("録音品質が低い可能性があります。静かな環境で再録音してください。")

    notes_only = [n for n in all_notes if n.get("type") == "note" and n.get("pitches")]
    if not notes_only:
        raise RuntimeError("音符が0件")

    # 区間録音 (本体と同じ: 3音未満なら全体採点に倒す)
    if range_from is not None and range_to is not None:
        lo, hi = int(range_from), int(range_to)
        sliced = [n for n in notes_only if lo <= int(n["note_index"]) <= hi]
        if len(sliced) >= 3:
            notes_only = sliced
            log(f"  range: note_index {lo}..{hi} → {len(sliced)} notes")

    # 最初の音 (本体と同じ手順)
    MIN_SUSTAIN = 15
    pitched_loud = (rms > A.RMS_THRESHOLD * 2) & (~np.isnan(f0[:len(rms)]))
    if guide_offset_sec is not None:
        pitched_loud = pitched_loud & (time_all[:len(pitched_loud)] >= max(0.0, guide_offset_sec - 0.3))
    first_sound_time = 0.0
    run = 0
    for idx in range(len(pitched_loud)):
        if pitched_loud[idx]:
            run += 1
            if run >= MIN_SUSTAIN:
                first_sound_time = float(time_all[idx - MIN_SUSTAIN + 1])
                break
        else:
            run = 0
    if first_sound_time == 0.0:
        loud_idx = np.where(rms > A.RMS_THRESHOLD * 2)[0]
        if len(loud_idx) > 0:
            first_sound_time = float(time_all[loud_idx[0]])
    log(f"  First sound at: {first_sound_time:.3f}s")

    _ignore_before = max(0.0, guide_offset_sec - 0.3) if guide_offset_sec is not None else 0.0
    gate_mask = A.apply_noise_gate(rms, time_all, f0, first_sound_time, _ignore_before)
    valid_mask = ~np.isnan(f0) & gate_mask
    if _ignore_before > 0.0:
        valid_mask = valid_mask & (time_all >= _ignore_before)
    valid_time = time_all[valid_mask]
    valid_f0 = f0[valid_mask]

    _tb = recording_bpm if (recording_bpm and recording_bpm > 0) else bpm
    beat_sec = 60.0 / _tb if _tb else 60.0 / 90.0
    global_shift = A.find_start_position(notes_only, valid_time, valid_f0, first_sound_time, beat_sec)
    performance_start_time = float(notes_only[0]["start_time_sec"]) + global_shift
    log(f"  global_shift: {global_shift:.3f}s")

    time_scale = (bpm / recording_bpm) if (recording_bpm and recording_bpm > 0) else 1.0
    target_bpm = recording_bpm if (recording_bpm and recording_bpm > 0) else bpm
    timing_tolerance = A.get_timing_tolerance(target_bpm)

    onset_times = None
    if A.USE_ONSET_DETECTION:
        onset_times = A.detect_onsets(y, sr, hop_length=A.HOP_LENGTH)
        onset_times = onset_times[onset_times >= first_sound_time]

    stft_mag = np.abs(librosa.stft(y, n_fft=A.SPECTRAL_N_FFT, hop_length=A.HOP_LENGTH))
    stft_freqs = librosa.fft_frequencies(sr=sr, n_fft=A.SPECTRAL_N_FFT)
    stft_times = librosa.frames_to_time(np.arange(stft_mag.shape[1]), sr=sr, hop_length=A.HOP_LENGTH)
    spectral_noise_floor = A._estimate_spectral_noise_floor(
        stft_mag, stft_times, first_sound_time, _ignore_before)

    results = A.evaluate_notes(
        notes_only, all_notes, valid_time, valid_f0,
        global_shift, performance_start_time, guide_offset_sec, beat_sec,
        onset_times=onset_times, time_scale=time_scale,
        timing_tolerance=timing_tolerance,
        stft_mag=stft_mag, stft_freqs=stft_freqs, stft_times=stft_times,
        spectral_noise_floor=spectral_noise_floor,
        rms=rms, time_all=time_all)

    try:
        from lib.audio_volume import (
            calculate_audio_features_per_note,
            merge_audio_features_into_comparison_result,
        )
        feats = calculate_audio_features_per_note(
            audio=y, sample_rate=sr, note_results_notes=notes_only,
            comparison_result=results, next_window_sec=0.1)
        results = merge_audio_features_into_comparison_result(results, feats)
    except Exception as e:  # 音量特徴は判定に影響しない。落ちても結果は返す
        warnings.append(f"audio_volume skipped: {e}")

    detected = [r for r in results if r["evaluation_status"] in ("evaluated", "pitch_only")]
    summary = {
        "notes": len(results),
        "detected": len(detected),
        "pitch_ok": sum(1 for r in detected if r.get("pitch_ok") is True),
        "timing_evaluated": sum(1 for r in results if r["evaluation_status"] == "evaluated"),
        "timing_ok": sum(1 for r in results
                         if r["evaluation_status"] == "evaluated" and r.get("start_ok") is True),
        "not_detected": sum(1 for r in results if r["evaluation_status"] == "not_detected"),
        "valid_ratio": round(valid_ratio, 3),
        "first_sound_time": round(first_sound_time, 3),
        "global_shift": round(float(global_shift), 3),
        "beat_sec": round(beat_sec, 4),
        "time_scale": round(time_scale, 4),
        "timing_tolerance": round(float(timing_tolerance), 4),
    }
    return {"version": "3.0-offline", "warnings": warnings,
            "summary": summary, "results": results}


def analyze_case(case_dir, **kw) -> dict:
    """case_dir (ローカル写し済み) を丸ごと解析する。"""
    case_dir = pathlib.Path(case_dir)
    notes, bpm, info = notes_from_case(case_dir)
    # 本番の録音条件 (fetch_case_inputs.py が保存)。呼び出し側の明示指定が優先
    pj = case_dir / "params.json"
    if pj.exists():
        p = json.loads(pj.read_text(encoding="utf-8"))
        kw.setdefault("recording_bpm", p.get("recording_bpm"))
        kw.setdefault("guide_offset_sec", p.get("guide_offset_sec"))
        kw.setdefault("range_from", p.get("range_from_note"))
        kw.setdefault("range_to", p.get("range_to_note"))
        info = {**info, "params": {k: p.get(k) for k in
                                   ("recording_bpm", "guide_offset_sec", "range_from_note", "range_to_note")}}
    out = analyze(case_dir / "recording.wav", notes, bpm, **kw)
    out["notes_source"] = info
    out["bpm"] = bpm
    return out


if __name__ == "__main__":
    import argparse
    from _cache import local_case
    ap = argparse.ArgumentParser()
    ap.add_argument("case_dir")
    ap.add_argument("--out", default="")
    ap.add_argument("--no-onset", action="store_true")
    args = ap.parse_args()
    res = analyze_case(local_case(pathlib.Path(args.case_dir)),
                       use_onset=(False if args.no_onset else None), verbose=True)
    print(json.dumps({"summary": res["summary"], "warnings": res["warnings"],
                      "notes_source": res["notes_source"]}, ensure_ascii=False, indent=2))
    if args.out:
        pathlib.Path(args.out).write_text(json.dumps(res, ensure_ascii=False, indent=2), encoding="utf-8")
        print("wrote", args.out)
