"""
ab_test_fixes.py — 改善案を「本体の関数を差し替えて通しで走らせ」、現行と音単位で差分を取る

机上の分類ではなく、evaluate_notes のカスケード・fallback・prev_seg_end ガードの連鎖まで含めて
本物の経路を通す。解析器のファイルは書き換えない (実行時に関数を差し替えるだけ)。

変種:
  V1 終端のみ: _detect_sound_end を「seg_start から最初に ±50c に入ったコマまで飛ばしてから
     連続を追う」に。飛ばす上限は音価の SKIP_FRAC。seg_start は動かさない。
  V2 出だしのみ: _refine_onset の判定を ±200c → ±50c に。
  V3 両方。

Usage: python tests/audit/ab_test_fixes.py <case_id>[,<case_id>...]
"""
import copy
import pathlib
import sys
import warnings
warnings.filterwarnings("ignore")
from collections import Counter

import numpy as np
import librosa

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from _cache import local_case  # noqa: E402
import offline_analyzer as OA  # noqa: E402

# 差し替え先は offline_analyzer が使っている名前空間 (load() は呼ぶたびに別インスタンスを作る)
A = OA.A
CASES_DIR = HERE.parent / "cases"
SKIP_FRAC = 0.5

ORIG_END = A._detect_sound_end
ORIG_REFINE = A._refine_onset
ORIG_TRY = A._try_match_at
A._CUR_DUR = None


def try_wrapper(t, ep, ed, vt, vf, prev=None, nxt=None):
    A._CUR_DUR = ed
    return ORIG_TRY(t, ep, ed, vt, vf, prev, nxt)


def end_skip_lead(seg_start, detected_pitch, valid_time, valid_f0):
    """V1: 最初に ±50c に入ったコマまで飛ばしてから連続を追う (飛ばす上限 = 音価 × SKIP_FRAC)"""
    dur = A._CUR_DUR or 0.5
    lim = seg_start + SKIP_FRAC * dur
    m = (valid_time >= seg_start) & (valid_time <= seg_start + 30.0)
    rt, rf = valid_time[m], valid_f0[m]
    if len(rf) == 0:
        return seg_start + 0.1
    s = None
    for i in range(len(rf)):
        if rt[i] > lim:
            break
        if rf[i] > 0 and abs(1200.0 * np.log2(rf[i] / detected_pitch)) <= A.PITCH_TOLERANCE_CENTS:
            s = i
            break
    if s is None:
        return ORIG_END(seg_start, detected_pitch, valid_time, valid_f0)
    last = float(rt[s]); gap = 0
    for i in range(s, len(rf)):
        if rf[i] > 0 and abs(1200.0 * np.log2(rf[i] / detected_pitch)) <= A.PITCH_TOLERANCE_CENTS:
            last = float(rt[i]); gap = 0
        else:
            gap += 1
            if gap >= 3:
                break
    return last


def refine_tight(seg_start, expected_pitch, expected_duration, valid_time, valid_f0):
    """V2: 出だしの判定を ±200c → ±50c"""
    window_end = seg_start + expected_duration
    m = (valid_time >= seg_start) & (valid_time <= window_end)
    wt, wf = valid_time[m], valid_f0[m]
    if len(wf) == 0:
        return seg_start
    c0 = abs(1200.0 * np.log2(wf[0] / expected_pitch)) if wf[0] > 0 else 9999
    if c0 <= A.PITCH_TOLERANCE_CENTS:
        return seg_start
    run = 0
    for i in range(len(wf)):
        if wf[i] > 0 and abs(1200.0 * np.log2(wf[i] / expected_pitch)) <= A.PITCH_TOLERANCE_CENTS:
            run += 1
            if run >= 3:
                return float(wt[i - 2])
        else:
            run = 0
    return seg_start


def summarize(results):
    total = len(results)
    EV = ("evaluated", "pitch_only", "double_stop_full", "double_stop_partial", "double_stop_miss",
          "harmonic_ok", "harmonic_normal_tone", "harmonic_miss")
    def ps(r):
        if r.get("evaluation_status") in ("double_stop_partial", "harmonic_normal_tone"):
            return 0.5
        return 1.0 if r.get("pitch_ok") is True else 0.0
    pitch = sum(ps(r) for r in results if r["evaluation_status"] in EV) / total * 100
    pool = [r for r in results if r["evaluation_status"] != "pitch_only"]
    rhythm = sum(1 for r in pool if r.get("start_ok") is True) / max(1, len(pool)) * 100
    det = sum(1 for r in results if r["evaluation_status"] != "not_detected")
    return dict(pitch=round(pitch, 1), rhythm=round(rhythm, 1), detected=det,
                timing_pool=len(pool), total=total)


def diff(base, new):
    b = {int(r["note_index"]): r for r in base}
    n = {int(r["note_index"]): r for r in new}
    gained, lost, end_changed, pitch_flip, start_flip = [], [], [], [], []
    for ni in b:
        rb, rn = b[ni], n.get(ni)
        if rn is None:
            continue
        was = rb["evaluation_status"] != "not_detected"
        now = rn["evaluation_status"] != "not_detected"
        if not was and now:
            gained.append((ni, rn["evaluation_status"], rn.get("pitch_ok"), rn.get("start_ok")))
        if was and not now:
            lost.append((ni, rb["evaluation_status"]))
        eb, en = rb.get("detected_end_sec"), rn.get("detected_end_sec")
        if was and now and eb is not None and en is not None and abs(float(en) - float(eb)) > 0.005:
            end_changed.append((ni, round(float(eb), 3), round(float(en), 3)))
        if was and now and rb.get("pitch_ok") != rn.get("pitch_ok"):
            pitch_flip.append((ni, rb.get("pitch_ok"), rn.get("pitch_ok")))
        if was and now and rb.get("start_ok") != rn.get("start_ok"):
            start_flip.append((ni, rb.get("start_ok"), rn.get("start_ok")))
    return gained, lost, end_changed, pitch_flip, start_flip


def run(case_id):
    case = local_case(CASES_DIR / case_id)
    A._detect_sound_end, A._refine_onset, A._try_match_at = ORIG_END, ORIG_REFINE, try_wrapper
    base = OA.analyze_case(case)["results"]
    sb = summarize(base)
    print(f"\n===== {case_id} =====", flush=True)
    print(f"  現行: 検出 {sb['detected']}/{sb['total']}  音程 {sb['pitch']}  リズム {sb['rhythm']}", flush=True)

    for name, end_fn, ref_fn in (("V1 終端のみ", end_skip_lead, ORIG_REFINE),
                                 ("V2 出だしのみ", ORIG_END, refine_tight),
                                 ("V3 両方", end_skip_lead, refine_tight)):
        A._detect_sound_end, A._refine_onset = end_fn, ref_fn
        res = OA.analyze_case(case)["results"]
        s = summarize(res)
        g, l, ec, pf, sf = diff(base, res)
        print(f"  [{name}] 検出 {s['detected']} ({s['detected']-sb['detected']:+d})  "
              f"音程 {s['pitch']} ({s['pitch']-sb['pitch']:+.1f})  リズム {s['rhythm']} ({s['rhythm']-sb['rhythm']:+.1f})",
              flush=True)
        print(f"      新たに検出 {len(g)} / 失った {len(l)} / 終端が変わった既存音 {len(ec)} / "
              f"音程の合否が変わった {len(pf)} / 時刻の合否が変わった {len(sf)}", flush=True)
        if g:
            print(f"      新規の内訳: {dict(Counter(x[1] for x in g))}  音程合格 {sum(1 for x in g if x[2] is True)}  時刻合格 {sum(1 for x in g if x[3] is True)}")
        if l:
            print(f"      失った音: {l[:8]}")
        if pf or sf:
            print(f"      合否の反転: 音程 {pf[:5]}  時刻 {sf[:5]}")
    A._detect_sound_end, A._refine_onset, A._try_match_at = ORIG_END, ORIG_REFINE, ORIG_TRY


if __name__ == "__main__":
    for cid in sys.argv[1].split(","):
        try:
            run(cid)
        except Exception as e:
            import traceback; traceback.print_exc()
            print(f"{cid}: 失敗 {type(e).__name__}: {e}")
