"""最良の単一位置にしたとき、検出音の何%が許容内に入るか（R1 の代替指標）"""
import pathlib, sys, warnings
warnings.filterwarnings("ignore")
import numpy as np
HERE = pathlib.Path("tests/audit").resolve(); sys.path.insert(0, str(HERE))
from _cache import local_case
import offline_analyzer as OA
A = OA.A
for cid, lab in [("cmplsqe3i000004i61gisxyp5","実演奏A"),("cmnl2fcv800000ojywq952uxk","糸"),
                 ("cmofva0fb0005zsjy86sy0n9c","実演奏B")]:
    case = local_case(HERE.parent / "cases" / cid)
    res = OA.analyze_case(case); rs = res["results"]
    _, bpm, _ = OA.notes_from_case(case)
    tol = A.get_timing_tolerance(bpm)
    d = np.array([r["start_diff_sec"] for r in rs if r.get("start_diff_sec") is not None])
    if len(d) == 0:
        print(f"{lab}: 検出で時刻を持つ音が 0。ゲートの床を直すまで測れない\n"); continue
    grid = np.arange(-3, 3.001, 0.01)
    cnt = np.array([np.sum(np.abs(d - x) <= tol) for x in grid])
    bi = int(np.argmax(cnt)); best_d, best_n = float(grid[bi]), int(cnt[bi])
    cur = int(np.sum(np.abs(d) <= tol))
    print(f"=== {lab}  許容±{tol:.2f}s  検出で時刻を持つ音 {len(d)}")
    print(f"   現行位置:        {cur:>3}/{len(d)} ({cur/len(d)*100:4.1f}%) が許容内")
    print(f"   最良の単一位置 ({best_d:+.2f}s): {best_n:>3}/{len(d)} ({best_n/len(d)*100:4.1f}%) が許容内")
    print(f"   → 単一位置をどこに置いても、検出音の {100-best_n/len(d)*100:.0f}% は許容の外に残る")
    print(f"   ずれの分布: 中央{np.median(d):+.2f}  4分位{np.percentile(d,25):+.2f}〜{np.percentile(d,75):+.2f}  "
          f"最小{d.min():+.2f} 最大{d.max():+.2f}  標準偏差{d.std():.2f}\n")
