"""shift_and_gate_run.py — 位置と床を実際に動かして本番経路を通す

find_start_position / apply_noise_gate を実行時に差し替えて比較する。
机上の計算 (rhythm_shift.py) と違い、検出集合そのものが変わるのを見る。

実測 (2026-09-13):
  実演奏A を +0.44s ずらす: 検出197→222 音程54.3→62.3 リズム25.8→46.9
    新規検出54 / 喪失29 / 新規に時刻を持った46音の72%が許容内
  床を0.01に落とす: 無音の録音で「正しい高さ」判定が 4→8 に倍増

解析器のコードは変更していない (実行時の差し替えのみ)。
"""
import pathlib, sys, warnings
warnings.filterwarnings("ignore")
import numpy as np
HERE = pathlib.Path("tests/audit").resolve(); sys.path.insert(0, str(HERE))
from _cache import local_case
import offline_analyzer as OA
A = OA.A
CASES = HERE.parent / "cases"
EV = ("evaluated","pitch_only","double_stop_full","double_stop_partial","double_stop_miss",
      "harmonic_ok","harmonic_normal_tone","harmonic_miss")

def summarize(res, bpm, label):
    rs = res["results"]; tol = A.get_timing_tolerance(bpm)
    det = [r for r in rs if r["evaluation_status"] in EV]
    d = [r["start_diff_sec"] for r in rs if r.get("start_diff_sec") is not None]
    pool = [r for r in rs if r["evaluation_status"] != "pitch_only"]
    ok = sum(1 for r in pool if r.get("start_ok") is True)
    def ps(r):
        if r.get("evaluation_status") in ("double_stop_partial","harmonic_normal_tone"): return 0.5
        return 1.0 if r.get("pitch_ok") is True else 0.0
    pitch = sum(ps(r) for r in det)/len(rs)*100
    within = sum(1 for x in d if abs(x) <= tol)
    print(f"  {label:<12} 検出{len(det):>4}  時刻を持つ音{len(d):>4}  許容内{within:>4} ({within/max(1,len(d))*100:4.1f}%)"
          f"  音程{pitch:5.1f}  リズム{ok/max(1,len(pool))*100:5.1f} ({ok}/{len(pool)})")
    return {r["note_index"]: r["evaluation_status"] for r in rs}, {r["note_index"] for r in det}, \
           {r["note_index"] for r in rs if r.get("start_diff_sec") is not None}, tol

# ---- T1 / T2 ----
cid = "cmplsqe3i000004i61gisxyp5"
case = local_case(CASES / cid); _, bpm, _ = OA.notes_from_case(case)
print("=== T1/T2  実演奏A ・ 位置を +0.44 s ずらして本番経路を通す")
base = OA.analyze_case(case)
_, det0, tim0, tol = summarize(base, bpm, "現行")
ORIG = A.find_start_position
A.find_start_position = lambda *a, **k: ORIG(*a, **k) + 0.44
try:
    shifted = OA.analyze_case(case)
    _, det1, tim1, _ = summarize(shifted, bpm, "+0.44 固定")
finally:
    A.find_start_position = ORIG
print(f"     新たに検出 {len(det1-det0)}   失った {len(det0-det1)}")
new_t = tim1 - tim0
dm = {r["note_index"]: r["start_diff_sec"] for r in shifted["results"] if r.get("start_diff_sec") is not None}
nin = sum(1 for i in new_t if abs(dm[i]) <= tol)
print(f"     新規に時刻を持った {len(new_t)} 音のうち 許容内 {nin} ({nin/max(1,len(new_t))*100:.0f}%)")

# ---- T4 ----
print("\n=== T4  床を固定しきい値 0.01 に落としたときの副作用")
ORIG_G = A.apply_noise_gate
def gate_fixed(rms, time_all, f0, first_sound_time, ignore_before=0.0):
    raw = rms > 0.01
    return A._remove_short_runs(A._remove_short_runs(A._fill_gaps(raw, A.GATE_HOLD_FRAMES),
                                A.GATE_ATTACK_FRAMES), A.GATE_MIN_RUN_FRAMES)
for c, lab in [("cmnka3x3i00010ojyf8kuaftx","sample1"),("cmovg8b5y0000u4jydnjrl7m0","無音?"),
               ("cmplsqe3i000004i61gisxyp5","実演奏A")]:
    try:
        cs = local_case(CASES / c); _, b, _ = OA.notes_from_case(cs)
        r0 = OA.analyze_case(cs)
        n0 = sum(1 for r in r0["results"] if r["evaluation_status"] in EV)
        p0 = sum(1 for r in r0["results"] if r.get("pitch_ok") is True)
        A.apply_noise_gate = gate_fixed
        r1 = OA.analyze_case(cs)
        n1 = sum(1 for r in r1["results"] if r["evaluation_status"] in EV)
        p1 = sum(1 for r in r1["results"] if r.get("pitch_ok") is True)
        A.apply_noise_gate = ORIG_G
        print(f"  {lab:<10} 検出 {n0} → {n1}   音程合格 {p0} → {p1}")
    except Exception as e:
        A.apply_noise_gate = ORIG_G
        print(f"  {lab}: 失敗 {type(e).__name__}: {e}")
