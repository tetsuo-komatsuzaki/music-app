"""sweep_shift.py — Δ を振って毎回本番経路を通す (机上の計算ではない)

実演奏A 実測 (2026-09-13):
  Δ      検出  時刻音  許容内   音程  リズム  新規 喪失
  +0.00   197   167   45.5%   54.3   25.8    0    0   現行
  +0.44   222   186   72.6%   62.3   46.9   54   29   机上の最良
  +1.05   245   207   90.8%   69.4   65.7   64   16   全音基準
  +1.30   258   216   93.5%   72.5   71.6   70    9   実際の最良
  +2.50   243   199   50.8%   67.6   36.1   71   25

結論:
  効果が大きいΔほど失う音は少ない。中途半端なΔだけが害を出す。
  机上の計算(rhythm_shift.py)が指す+0.44は実際の最良から0.86s外れる。
  最もよく当たったのは shift_profile.py の区間ごとの中央(+1.15)。

解析器のコードは変更していない (実行時の差し替えのみ)。
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
ORIG = A.find_start_position
def run(delta):
    A.find_start_position = (lambda *a, **k: ORIG(*a, **k) + delta) if delta else ORIG
    try: rs = OA.analyze_case(case)["results"]
    finally: A.find_start_position = ORIG
    det = {r["note_index"] for r in rs if r["evaluation_status"] in EV}
    tim = {r["note_index"]: r["start_diff_sec"] for r in rs if r.get("start_diff_sec") is not None}
    pool = [r for r in rs if r["evaluation_status"] != "pitch_only"]
    ok = sum(1 for r in pool if r.get("start_ok") is True)
    def ps(r):
        if r.get("evaluation_status") in ("double_stop_partial","harmonic_normal_tone"): return 0.5
        return 1.0 if r.get("pitch_ok") is True else 0.0
    pitch = sum(ps(r) for r in rs if r["evaluation_status"] in EV)/len(rs)*100
    within = sum(1 for v in tim.values() if abs(v) <= tol)
    return det, tim, len(det), len(tim), within, pitch, ok/max(1,len(pool))*100
base_det, base_tim, *b = run(0.0)
print(f"実演奏A  許容±{tol:.2f}s  探索幅±{max(1.76*1.5,0.5):.2f}s")
print("  Δ      検出  時刻音  許容内         音程   リズム   新規  喪失")
for d in [0.0,0.2,0.44,0.6,0.8,1.05,1.3,1.5,1.8,2.1,2.5]:
    det,tim,nd,nt,w,p,rh = run(d)
    print(f"  {d:+.2f}  {nd:>5} {nt:>6}  {w:>4} ({w/max(1,nt)*100:4.1f}%)  {p:5.1f}  {rh:6.1f}"
          f"  {len(det-base_det):>5} {len(base_det-det):>5}")
