"""判定の基準を 0 秒(=録音開始=1拍目) にする。Web版の録音はこれが正しい。"""
import pathlib, sys, warnings
warnings.filterwarnings("ignore")
import numpy as np
HERE = pathlib.Path("tests/audit").resolve(); sys.path.insert(0, str(HERE))
from _cache import local_case
import offline_analyzer as OA
A = OA.A
EV = ("evaluated","pitch_only","double_stop_full","double_stop_partial","double_stop_miss",
      "harmonic_ok","harmonic_normal_tone","harmonic_miss")
ORIG_F, ORIG_E = A.find_start_position, A.evaluate_notes
for cid, lab, delta in [("cmplsqe3i000004i61gisxyp5","実演奏A", 1.30),
                        ("cmnl2fcv800000ojywq952uxk","糸", -0.50),
                        ("cmofva0fb0005zsjy86sy0n9c","実演奏B", -2.50)]:
    case = local_case(HERE.parent/"cases"/cid)
    _, bpm, _ = OA.notes_from_case(case); tol = A.get_timing_tolerance(bpm)
    def run(d, judge_zero):
        A.find_start_position = (lambda *a, **k: ORIG_F(*a, **k) + d) if d else ORIG_F
        if judge_zero:
            def ev(notes_only, all_notes, vt, vf, gs, pst, j=None, *a, **k):
                # 楽譜の1音目が鳴るべき録音上の時刻 = 0 + 1音目の楽譜時刻
                return ORIG_E(notes_only, all_notes, vt, vf, gs, pst,
                              float(notes_only[0]["start_time_sec"]), *a, **k)
            A.evaluate_notes = ev
        try: rs = OA.analyze_case(case)["results"]
        finally: A.find_start_position, A.evaluate_notes = ORIG_F, ORIG_E
        det = sum(1 for r in rs if r["evaluation_status"] in EV)
        dd = np.array([r["start_diff_sec"] for r in rs if r.get("start_diff_sec") is not None])
        pool = [r for r in rs if r["evaluation_status"] != "pitch_only"]
        ok = sum(1 for r in pool if r.get("start_ok") is True)
        def ps(r):
            if r.get("evaluation_status") in ("double_stop_partial","harmonic_normal_tone"): return 0.5
            return 1.0 if r.get("pitch_ok") is True else 0.0
        p = sum(ps(r) for r in rs if r["evaluation_status"] in EV)/len(rs)*100
        return det, p, ok/max(1,len(pool))*100, (np.median(dd) if len(dd) else float('nan')), \
               (np.percentile(dd,10) if len(dd) else 0), (np.percentile(dd,90) if len(dd) else 0)
    print(f"\n=== {lab}  許容±{tol:.2f}s")
    print("  案                                      検出   音程   リズム   ずれ中央   1〜9割")
    for name, d, jz in [("現行(判定=探す位置と兼用)", 0.0, False),
                        ("判定=0秒(1拍目)・探すのは現行", 0.0, True),
                        ("判定=0秒(1拍目)・探すのは最良", delta, True)]:
        det,p,rh,md,lo,hi = run(d, jz)
        print(f"  {name:<36} {det:>4}  {p:5.1f}  {rh:6.1f}   {md:+6.2f}s   {lo:+.2f}〜{hi:+.2f}s")
