"""
side_effects.py — 解析器を直したときの副作用を数える (解析器は変更しない)

(A) 位置合わせの幅を広げる副作用: shift を ±12s 走査したときの一致率の形。
    鋭い山が1つなら広げても安全。近い高さの山が複数あるなら、広げるほど誤った位置を選ぶ。
    先頭15音 (現行の判定材料) と 全音 の両方で測る。
(B) 検出を直したときの採点への副作用: 第1層の音が検出されるようになった場合の
    pitchAccuracy / rhythmAccuracy の変化 (分母は楽譜の全音数、not_detected は不正解)。
(C) 長さの扱いを変える副作用: 楽譜の隣り合う音が 200c 以内である割合 (終端の許容を広げると隣に融合する)。

Usage: python tests/audit/side_effects.py <case_id> [...]
"""
import json
import pathlib
import sys
import warnings
warnings.filterwarnings("ignore")
from collections import Counter

import numpy as np
import librosa

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import _load_analyzer  # noqa: E402
from _cache import local_case, load_audio  # noqa: E402
import offline_analyzer as OA  # noqa: E402

A = _load_analyzer.load()
CASES_DIR = HERE.parent / "cases"
HOP, FRAME = A.HOP_LENGTH, A.FRAME_LENGTH
SCAN_SEC, SCAN_STEP, MIN_FRAMES = 12.0, 0.02, 5


def cents(f, e):
    return 1200.0 * np.log2(f / e)


def run(case_id, v18_json=None):
    case = local_case(CASES_DIR / case_id)
    y, sr = load_audio(str(case / "recording.wav"))
    res = OA.analyze_case(case)
    S = res["summary"]
    gs, beat = float(S["global_shift"]), float(S["beat_sec"])
    results = res["results"]
    an_notes, bpm, info = OA.notes_from_case(case)
    instrument = info.get("instrument", "unknown")
    fmin_note, fmax_note = A.INSTRUMENT_PITCH_RANGE.get(instrument, A.DEFAULT_PITCH_RANGE)
    fmin, fmax = librosa.note_to_hz(fmin_note), librosa.note_to_hz(fmax_note)
    notes = [n for n in an_notes if n.get("type") == "note" and n.get("pitches")]

    f0, vflag, vprob = librosa.pyin(y, fmin=fmin, fmax=fmax, sr=sr, frame_length=FRAME, hop_length=HOP)
    voiced = (vprob >= 0.5) & ~np.isnan(f0)
    n_frames = len(f0)

    def idx(t0, t1):
        a = int(max(0, np.floor(t0 * sr / HOP))); b = int(min(n_frames, np.ceil(t1 * sr / HOP)))
        return np.arange(a, max(a, b))

    def ratio_at(shift, pool):
        m = 0
        for nt in pool:
            t0, t1 = float(nt["start_time_sec"]) + shift, float(nt["end_time_sec"]) + shift
            mg = (t1 - t0) * 0.1
            ii = idx(t0 + mg, t1 - mg)
            if len(ii) == 0: continue
            vi = ii[voiced[ii]]
            if len(vi) >= MIN_FRAMES and abs(cents(float(np.median(f0[vi])), float(nt["pitches"][0]))) <= 50:
                m += 1
        return m / max(1, len(pool))

    print(f"\n===== {case_id}  ({len(notes)} notes, 現行 shift={gs:.3f}s, beat={beat:.3f}s, {instrument}) =====", flush=True)

    # (A) 一致率の形
    shifts = np.arange(gs - SCAN_SEC, gs + SCAN_SEC + 1e-9, SCAN_STEP)
    head = notes[:min(15, len(notes))]
    prof = np.array([ratio_at(sh, head) for sh in shifts])
    best_i = int(np.argmax(prof)); best = float(prof[best_i]); best_sh = float(shifts[best_i])
    # 近い高さの山: 最良の 90% 以上で、最良から 0.3s 以上離れた位置
    near = [(float(shifts[i]), float(prof[i])) for i in range(len(prof))
            if prof[i] >= 0.9 * best and abs(shifts[i] - best_sh) >= 0.3]
    # 山を 0.3s 単位でまとめる
    peaks = []
    for sh, r in sorted(near):
        if not peaks or sh - peaks[-1][0] > 0.3:
            peaks.append((sh, r))
        elif r > peaks[-1][1]:
            peaks[-1] = (sh, r)
    cur = ratio_at(gs, head)
    print(f"(A) 先頭15音の一致率: 現行 {cur:.2f} / 最良 {best:.2f} (現行から {best_sh - gs:+.2f}s)")
    print(f"    最良の 90% 以上で 0.3s 以上離れた「対抗の山」: {len(peaks)} 個  {[(round(s - gs, 2), round(r, 2)) for s, r in peaks[:8]]}")
    prof_all = np.array([ratio_at(sh, notes) for sh in shifts[::5]])   # 全音は粗く
    ai = int(np.argmax(prof_all)); a_best = float(prof_all[ai]); a_sh = float(shifts[::5][ai])
    print(f"    全音での最良: {a_best:.2f} (現行から {a_sh - gs:+.2f}s) / 現行位置 {ratio_at(gs, notes):.2f}")
    print(f"    → 先頭15音の最良と全音の最良のずれ: {abs(a_sh - best_sh):.2f}s")

    # (B) 採点への影響
    EV = ("evaluated", "pitch_only", "double_stop_full", "double_stop_partial", "double_stop_miss",
          "harmonic_ok", "harmonic_normal_tone", "harmonic_miss")
    total = len(results)
    def pscore(r):
        if r.get("evaluation_status") in ("double_stop_partial", "harmonic_normal_tone"): return 0.5
        return 1.0 if r.get("pitch_ok") is True else 0.0
    cur_p = sum(pscore(r) for r in results if r["evaluation_status"] in EV) / total * 100
    pool = [r for r in results if r["evaluation_status"] != "pitch_only"]
    cur_t = sum(1 for r in pool if r.get("start_ok") is True) / max(1, len(pool)) * 100
    tol = A.get_timing_tolerance(bpm)
    print(f"(B) 現行 pitchAccuracy {cur_p:.1f} / rhythmAccuracy {cur_t:.1f}  (許容 ±{tol:.2f}s)")
    if v18_json and pathlib.Path(v18_json).exists():
        lab = json.loads(pathlib.Path(v18_json).read_text(encoding="utf-8"))["labels"]
        L1 = {int(k): v for k, v in lab.items() if v.get("layer") == "search"}
        add_p = add_t = 0
        for ni, v in L1.items():
            dev = v.get("dev_c")
            if dev is None: dev = v.get("med_c", 0.0)
            if abs(float(dev)) <= 50: add_p += 1
            off = v.get("offset_from_expected_s", 0.0) or 0.0
            if abs(float(off)) <= tol: add_t += 1
        new_p = (sum(pscore(r) for r in results if r["evaluation_status"] in EV) + add_p) / total * 100
        new_t = (sum(1 for r in pool if r.get("start_ok") is True) + add_t) / max(1, len(pool)) * 100
        print(f"    第1層 {len(L1)} 音が検出されたら: pitchAccuracy {new_p:.1f} ({new_p - cur_p:+.1f}) / "
              f"rhythmAccuracy {new_t:.1f} ({new_t - cur_t:+.1f})   音程合格 {add_p}/{len(L1)}・時刻内 {add_t}/{len(L1)}")

    # (C) 隣が近い割合
    es = [float(n["pitches"][0]) for n in notes]
    d = [abs(cents(es[i + 1], es[i])) for i in range(len(es) - 1)]
    within = [sum(1 for x in d if x <= c) / max(1, len(d)) for c in (50, 100, 200.5)]
    print(f"(C) 隣り合う音の高さの差: ±50c 以内 {within[0]:.0%} / ±100c 以内 {within[1]:.0%} / ±200c 以内 {within[2]:.0%}"
          f"  (終端の許容を 200c にすると、この割合の音が隣に融合しうる)")


if __name__ == "__main__":
    S = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else None
    for cid in sys.argv[1].split(","):
        j = str(S / f"v18_{cid}.json") if S else None
        try:
            run(cid, j)
        except Exception as e:
            print(f"{cid}: 失敗 {type(e).__name__}: {e}")
