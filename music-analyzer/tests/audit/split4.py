"""判定の基準の候補を4つ比べる。3本すべてで。"""
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
CASES = [("cmplsqe3i000004i61gisxyp5","実演奏A", 1.30, 0.023),
         ("cmnl2fcv800000ojywq952uxk","糸", -0.50, 0.476),
         ("cmofva0fb0005zsjy86sy0n9c","実演奏B", -2.50, 2.293)]
for cid, lab, delta, anchor in CASES:
    case = local_case(HERE.parent/"cases"/cid)
    _, bpm, _ = OA.notes_from_case(case); tol = A.get_timing_tolerance(bpm)
    def run(d, judge):   # judge: None=兼用 / "freeze"=現行位置 / "anchor"=最初の音
        A.find_start_position = (lambda *a, **k: ORIG_F(*a, **k) + d) if d else ORIG_F
        if judge:
            off = (-d) if judge=="freeze" else None
            def ev(notes_only, all_notes, vt, vf, gs, pst, j=None, *a, **k):
                js = pst + off if off is not None else anchor + float(notes_only[0]["start_time_sec"])
                return ORIG_E(notes_only, all_notes, vt, vf, gs, pst, js, *a, **k)
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
    print(f"\n=== {lab}  探す位置 Δ={delta:+.2f}s  許容±{tol:.2f}s  anchor={anchor:+.3f}s")
    print("  判定の基準                    検出   音程   リズム   ずれ中央   1〜9割")
    for name, d, j in [("現行(そのまま)", 0.0, None),
                       ("探すのも判定も動かす", delta, None),
                       ("判定=現行位置で凍結", delta, "freeze"),
                       ("判定=最初の音(anchor)", delta, "anchor"),
                       ("探さない・判定=anchorのみ", 0.0, "anchor")]:
        det,p,rh,md,lo,hi = run(d, j)
        print(f"  {name:<26} {det:>4}  {p:5.1f}  {rh:6.1f}   {md:+6.2f}s   {lo:+.2f}〜{hi:+.2f}s")
