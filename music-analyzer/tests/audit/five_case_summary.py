"""5本まとめて 検出/音程/リズム/ずれ を出す。変更前後の比較用。"""
import pathlib, sys, warnings
warnings.filterwarnings("ignore")
import numpy as np
HERE = pathlib.Path(__file__).resolve().parent; sys.path.insert(0, str(HERE))
from _cache import local_case
import offline_analyzer as OA
A = OA.A
EV = ("evaluated","pitch_only","double_stop_full","double_stop_partial","double_stop_miss",
      "harmonic_ok","harmonic_normal_tone","harmonic_miss")
CASES=[("cmplsqe3i000004i61gisxyp5","実演奏A"),("cmnl2fcv800000ojywq952uxk","糸"),
       ("cmofva0fb0005zsjy86sy0n9c","実演奏B"),("cmnka2oac00000ojy19pke52r","sample1"),
       ("cmovg8b5y0000u4jydnjrl7m0","無音")]
print("  録音        音符  検出  音程合格  音程   リズム  位置      一致    ずれ中央")
for cid, lab in CASES:
    try:
        case = local_case(HERE.parent/"cases"/cid)
        res = OA.analyze_case(case); rs = res["results"]; S = res["summary"]
        det=[r for r in rs if r["evaluation_status"] in EV]
        pok=sum(1 for r in rs if r.get("pitch_ok") is True)
        pool=[r for r in rs if r["evaluation_status"]!="pitch_only"]
        ok=sum(1 for r in pool if r.get("start_ok") is True)
        def ps(r):
            if r.get("evaluation_status") in ("double_stop_partial","harmonic_normal_tone"): return 0.5
            return 1.0 if r.get("pitch_ok") is True else 0.0
        p=sum(ps(r) for r in det)/len(rs)*100
        d=[r["start_diff_sec"] for r in rs if r.get("start_diff_sec") is not None]
        al=getattr(A,"_ALIGN_DIAG",{})
        print(f"  {lab:<10} {len(rs):>4} {len(det):>5} {pok:>8} {p:7.1f} {ok/max(1,len(pool))*100:7.1f}"
              f"  {float(S['global_shift']):+7.3f} {al.get('matches','?'):>3}/{al.get('check_notes','?'):<3}"
              f" {np.median(d) if d else float('nan'):+7.2f}s")
    except Exception as e:
        print(f"  {lab:<10} 失敗 {type(e).__name__}: {e}")
