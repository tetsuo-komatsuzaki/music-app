"""rhythm_shift.py — リズム判定の起点を Δ だけ動かしたときの時刻合格数。

既存の start_diff_sec から計算するので走査は不要。検出は固定なので、
実際に位置を動かしたときの変化とは一致しない (検出集合も変わるため)。
解析器は変更しない。
"""
import pathlib, sys, warnings
warnings.filterwarnings("ignore")
import numpy as np
HERE = pathlib.Path("tests/audit").resolve(); sys.path.insert(0, str(HERE))
from _cache import local_case
import offline_analyzer as OA
A = OA.A
CASES = HERE.parent / "cases"
for cid, lab in [("cmplsqe3i000004i61gisxyp5","実演奏A"),("cmnl2fcv800000ojywq952uxk","糸")]:
    case = local_case(CASES / cid)
    res = OA.analyze_case(case); rs = res["results"]
    _, bpm, _ = OA.notes_from_case(case)
    tol = A.get_timing_tolerance(bpm)
    pool = [r for r in rs if r["evaluation_status"] != "pitch_only"]
    diffs = [(r, r.get("start_diff_sec")) for r in rs if r.get("start_diff_sec") is not None]
    cur = sum(1 for r in pool if r.get("start_ok") is True)
    print(f"\n=== {lab}  許容 ±{tol:.2f}s  リズムの分母 {len(pool)}  検出で時刻を持つ音 {len(diffs)}")
    print(f"  現行のずれ: 中央値 {np.median([d for _,d in diffs]):+.3f}s  "
          f"平均 {np.mean([d for _,d in diffs]):+.3f}s  標準偏差 {np.std([d for _,d in diffs]):.3f}s")
    print("  基準をずらす量   時刻合格   リズム点")
    for delta in [0.0, 0.30, 0.45, 0.63, 0.75, 0.90, 1.05, 1.20]:
        ok = sum(1 for r,d in diffs if abs(d - delta) <= tol)
        # pool に含まれ、かつ検出で時刻を持つ音のみが合格しうる
        ok = sum(1 for r,d in diffs if r["evaluation_status"] != "pitch_only" and abs(d - delta) <= tol)
        print(f"    {delta:+.2f}s          {ok:>3}      {ok/len(pool)*100:5.1f}" + ("   ←現行" if delta==0 else ""))
    print(f"  （現行の start_ok 実数 = {cur}, 上表の +0.00 と一致するはず）")
