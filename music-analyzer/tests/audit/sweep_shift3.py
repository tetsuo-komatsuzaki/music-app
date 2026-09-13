"""Δ 走査を糸と実演奏B にも広げる。B は床 0.01 も併用する。"""
import pathlib, sys, warnings
warnings.filterwarnings("ignore")
import numpy as np
HERE = pathlib.Path("tests/audit").resolve(); sys.path.insert(0, str(HERE))
from _cache import local_case
import offline_analyzer as OA
A = OA.A
EV = ("evaluated","pitch_only","double_stop_full","double_stop_partial","double_stop_miss",
      "harmonic_ok","harmonic_normal_tone","harmonic_miss")
ORIG_F, ORIG_G = A.find_start_position, A.apply_noise_gate
def gate_fixed(rms, t, f0, fst, ib=0.0):
    raw = rms > 0.01
    return A._remove_short_runs(A._remove_short_runs(A._fill_gaps(raw, A.GATE_HOLD_FRAMES),
                                A.GATE_ATTACK_FRAMES), A.GATE_MIN_RUN_FRAMES)

def sweep(cid, lab, deltas, fix_gate=False):
    case = local_case(HERE.parent/"cases"/cid)
    _, bpm, _ = OA.notes_from_case(case); tol = A.get_timing_tolerance(bpm)
    def run(d):
        A.find_start_position = (lambda *a, **k: ORIG_F(*a, **k) + d) if d else ORIG_F
        if fix_gate: A.apply_noise_gate = gate_fixed
        try: rs = OA.analyze_case(case)["results"]
        finally: A.find_start_position, A.apply_noise_gate = ORIG_F, ORIG_G
        det = {r["note_index"] for r in rs if r["evaluation_status"] in EV}
        tim = {r["note_index"]: r["start_diff_sec"] for r in rs if r.get("start_diff_sec") is not None}
        pool = [r for r in rs if r["evaluation_status"] != "pitch_only"]
        ok = sum(1 for r in pool if r.get("start_ok") is True)
        def ps(r):
            if r.get("evaluation_status") in ("double_stop_partial","harmonic_normal_tone"): return 0.5
            return 1.0 if r.get("pitch_ok") is True else 0.0
        return det, len(tim), sum(1 for v in tim.values() if abs(v)<=tol), \
               sum(ps(r) for r in rs if r["evaluation_status"] in EV)/len(rs)*100, ok/max(1,len(pool))*100
    base, *_ = run(0.0)
    print(f"\n=== {lab}  許容±{tol:.2f}s" + ("  [床0.01]" if fix_gate else ""))
    print("  Δ      検出  時刻音  許容内         音程   リズム   新規  喪失")
    best=None
    for d in deltas:
        det,nt,w,p,rh = run(d)
        star = ""
        if best is None or rh > best[1]: best = (d, rh); 
        print(f"  {d:+.2f}  {len(det):>5} {nt:>6}  {w:>4} ({w/max(1,nt)*100:4.1f}%)  {p:5.1f}  {rh:6.1f}"
              f"  {len(det-base):>5} {len(base-det):>5}{star}")
    print(f"  → リズム最良は Δ={best[0]:+.2f} ({best[1]:.1f})")

sweep("cmnl2fcv800000ojywq952uxk","糸", [0.0,-0.2,-0.35,-0.5,-0.65,-0.8,-1.0,-1.3,0.2,0.5])
sweep("cmofva0fb0005zsjy86sy0n9c","実演奏B", [0.0,-1.0,-2.0,-2.5,-2.9,-3.2,-3.6,-4.2], fix_gate=True)
