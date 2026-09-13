"""位置は「どの音がどれか」で選び、リズムは元の基準のまま報告する案を測る。

現行コードは expected_pos (探す) と expected_pos_judge (判定する) を分けており、
judge_start_time が None のとき両者が一致する (= 旧録音・ガイド無し)。
探す位置だけ Δ 動かし、判定の基準は動かさないとどうなるか。
"""
import pathlib, sys, warnings
warnings.filterwarnings("ignore")
import numpy as np
HERE = pathlib.Path("tests/audit").resolve(); sys.path.insert(0, str(HERE))
from _cache import local_case
import offline_analyzer as OA
A = OA.A
EV = ("evaluated","pitch_only","double_stop_full","double_stop_partial","double_stop_miss",
      "harmonic_ok","harmonic_normal_tone","harmonic_miss")
case = local_case(HERE.parent/"cases"/"cmplsqe3i000004i61gisxyp5")
_, bpm, _ = OA.notes_from_case(case); tol = A.get_timing_tolerance(bpm)
ORIG_F, ORIG_E = A.find_start_position, A.evaluate_notes

def run(delta, keep_judge):
    A.find_start_position = (lambda *a, **k: ORIG_F(*a, **k) + delta) if delta else ORIG_F
    if keep_judge and delta:
        def ev(notes_only, all_notes, vt, vf, gs, pst, judge=None, *a, **k):
            return ORIG_E(notes_only, all_notes, vt, vf, gs, pst, pst - delta, *a, **k)
        A.evaluate_notes = ev
    try: rs = OA.analyze_case(case)["results"]
    finally: A.find_start_position, A.evaluate_notes = ORIG_F, ORIG_E
    det = {r["note_index"] for r in rs if r["evaluation_status"] in EV}
    d = [r["start_diff_sec"] for r in rs if r.get("start_diff_sec") is not None]
    pool = [r for r in rs if r["evaluation_status"] != "pitch_only"]
    ok = sum(1 for r in pool if r.get("start_ok") is True)
    def ps(r):
        if r.get("evaluation_status") in ("double_stop_partial","harmonic_normal_tone"): return 0.5
        return 1.0 if r.get("pitch_ok") is True else 0.0
    pitch = sum(ps(r) for r in rs if r["evaluation_status"] in EV)/len(rs)*100
    return det, d, len(det), pitch, ok/max(1,len(pool))*100

print("実演奏A  許容±%.2fs\n" % tol)
print("  案                                   検出   音程   リズム  ずれの中央  ずれの範囲")
for lab, dl, kj in [("現行", 0.0, False),
                    ("探すのも判定も動かす (v12 の案)", 1.30, False),
                    ("探すのだけ動かし判定は据え置き", 1.30, True)]:
    det, d, nd, p, rh = run(dl, kj)
    d = np.array(d)
    print(f"  {lab:<34} {nd:>4}  {p:5.1f}  {rh:6.1f}   {np.median(d):+6.2f}s"
          f"   {np.percentile(d,10):+.2f}〜{np.percentile(d,90):+.2f}s")
