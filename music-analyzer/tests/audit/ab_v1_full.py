"""
ab_v1_full.py — V1 (終端の測り始めを直す) を 5 ケースすべてで通しで測り、判断材料を出す

出すもの:
  1) 状態の遷移を全部 (not_detected→x だけでなく、格下げ evaluated→pitch_only も)
  2) timing_pool の大きさ (リズムの分母。pitch_only が増えると縮む)
  3) 長さの変化の分布 (既存の検出音の (detected_end - detected_start)/音価。durRatio の代理)
  4) 位置合わせの広い走査を「本番と同じ yin + ノイズゲート」と「pYIN」の両方で

Usage: python tests/audit/ab_v1_full.py <case_id>[,...]
"""
import pathlib
import sys
import warnings
warnings.filterwarnings("ignore")
from collections import Counter

import numpy as np
import librosa

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from _cache import local_case, load_audio  # noqa: E402
import offline_analyzer as OA  # noqa: E402

A = OA.A
CASES_DIR = HERE.parent / "cases"
HOP, FRAME = A.HOP_LENGTH, A.FRAME_LENGTH
SKIP_FRAC = 0.5
SCAN_SEC, SCAN_STEP, MIN_FRAMES = 12.0, 0.02, 5

ORIG_END, ORIG_TRY = A._detect_sound_end, A._try_match_at
A._CUR_DUR = None


def try_wrapper(t, ep, ed, vt, vf, prev=None, nxt=None):
    A._CUR_DUR = ed
    return ORIG_TRY(t, ep, ed, vt, vf, prev, nxt)


def end_skip_lead(seg_start, detected_pitch, valid_time, valid_f0):
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
            s = i; break
    if s is None:
        return ORIG_END(seg_start, detected_pitch, valid_time, valid_f0)
    last = float(rt[s]); gap = 0
    for i in range(s, len(rf)):
        if rf[i] > 0 and abs(1200.0 * np.log2(rf[i] / detected_pitch)) <= A.PITCH_TOLERANCE_CENTS:
            last = float(rt[i]); gap = 0
        else:
            gap += 1
            if gap >= 3: break
    return last


def acc(results):
    total = len(results)
    EV = ("evaluated", "pitch_only", "double_stop_full", "double_stop_partial", "double_stop_miss",
          "harmonic_ok", "harmonic_normal_tone", "harmonic_miss")
    def ps(r):
        if r.get("evaluation_status") in ("double_stop_partial", "harmonic_normal_tone"): return 0.5
        return 1.0 if r.get("pitch_ok") is True else 0.0
    pool = [r for r in results if r["evaluation_status"] != "pitch_only"]
    ok = sum(1 for r in pool if r.get("start_ok") is True)
    return dict(pitch=sum(ps(r) for r in results if r["evaluation_status"] in EV) / total * 100,
                rhythm=ok / max(1, len(pool)) * 100, pool=len(pool), ok=ok,
                det=sum(1 for r in results if r["evaluation_status"] != "not_detected"), total=total)


def run(case_id):
    case = local_case(CASES_DIR / case_id)
    try:
        A._detect_sound_end, A._try_match_at = ORIG_END, try_wrapper
        base = OA.analyze_case(case)["results"]
        A._detect_sound_end = end_skip_lead
        new = OA.analyze_case(case)["results"]
    finally:
        A._detect_sound_end, A._try_match_at = ORIG_END, ORIG_TRY

    ab, an_ = acc(base), acc(new)
    print(f"\n===== {case_id} =====", flush=True)
    print(f"  検出 {ab['det']}→{an_['det']} ({an_['det']-ab['det']:+d})/{ab['total']}   "
          f"音程 {ab['pitch']:.1f}→{an_['pitch']:.1f} ({an_['pitch']-ab['pitch']:+.1f})   "
          f"リズム {ab['rhythm']:.1f}→{an_['rhythm']:.1f} ({an_['rhythm']-ab['rhythm']:+.1f})")
    print(f"  リズムの分子/分母: {ab['ok']}/{ab['pool']} → {an_['ok']}/{an_['pool']}   "
          f"(分母を固定したときのリズム: {ab['ok']/max(1,ab['pool'])*100:.1f}→{an_['ok']/max(1,ab['pool'])*100:.1f})")

    b = {int(r["note_index"]): r for r in base}
    n = {int(r["note_index"]): r for r in new}
    trans = Counter()
    for ni, rb in b.items():
        rn = n.get(ni)
        if rn is None: continue
        if rb["evaluation_status"] != rn["evaluation_status"]:
            trans[f"{rb['evaluation_status']}→{rn['evaluation_status']}"] += 1
    print(f"  状態の遷移: {dict(trans) if trans else 'なし'}")

    # 長さの変化 (既存の検出音)
    ratios = []
    for ni, rb in b.items():
        rn = n.get(ni)
        if rn is None or rb["evaluation_status"] == "not_detected" or rn["evaluation_status"] == "not_detected":
            continue
        s0, e0 = rb.get("detected_start_sec"), rb.get("detected_end_sec")
        s1, e1 = rn.get("detected_start_sec"), rn.get("detected_end_sec")
        exp = (rb.get("expected_end_sec") or 0) - (rb.get("expected_start_sec") or 0)
        if None in (s0, e0, s1, e1) or exp <= 0: continue
        d0, d1 = float(e0) - float(s0), float(e1) - float(s1)
        if abs(d1 - d0) > 0.005:
            ratios.append((ni, round(d0 / exp, 2), round(d1 / exp, 2), round(d1 - d0, 2)))
    if ratios:
        longer = sum(1 for r in ratios if r[3] > 0); shorter = len(ratios) - longer
        deltas = sorted(r[3] for r in ratios)
        after = sorted(r[2] for r in ratios)
        print(f"  長さが変わった既存音: {len(ratios)}  長くなる {longer} / 短くなる {shorter}  "
              f"伸びの中央値 {np.median(deltas):+.2f}s 最大 {deltas[-1]:+.2f}s")
        print(f"    変更後の 長さ/音価 の分布: 最小 {after[0]} / 中央 {np.median(after):.2f} / 最大 {after[-1]}"
              f"   0.5 以下 (スタッカート合格の域) {sum(1 for x in after if x <= 0.5)} 音")
        print(f"    外れ値 (上位3): {sorted(ratios, key=lambda r: -r[3])[:3]}")
    else:
        print("  長さが変わった既存音: 0")

    # 位置合わせの広い走査: 本番の経路 (yin+ゲート) と pYIN
    y, sr = load_audio(str(case / "recording.wav"))
    an_notes, bpm, info = OA.notes_from_case(case)
    fmin_note, fmax_note = A.INSTRUMENT_PITCH_RANGE.get(info.get("instrument", "unknown"), A.DEFAULT_PITCH_RANGE)
    fmin, fmax = librosa.note_to_hz(fmin_note), librosa.note_to_hz(fmax_note)
    notes = [x for x in an_notes if x.get("type") == "note" and x.get("pitches")][:15]
    yin = np.array(librosa.yin(y, fmin=fmin, fmax=fmax, sr=sr, frame_length=FRAME, hop_length=HOP))
    t_all = np.array(librosa.frames_to_time(np.arange(len(yin)), sr=sr, hop_length=HOP))
    rms = np.array(librosa.feature.rms(y=y, frame_length=FRAME, hop_length=HOP)[0])
    # base の shift と first_sound を使う
    import json as _j
    S = OA.analyze_case(case)["summary"] if False else None
    gs = float(base[0].get("global_shift_sec") or 0.0)
    fs = 0.0
    for r in base:
        if r.get("global_shift_sec") is not None:
            gs = float(r["global_shift_sec"]); break
    gate = A.apply_noise_gate(rms, t_all, yin, fs, 0.0)
    vm = ~np.isnan(yin) & gate
    vt_g, vf_g = t_all[vm], yin[vm]
    f0p, _, vp = librosa.pyin(y, fmin=fmin, fmax=fmax, sr=sr, frame_length=FRAME, hop_length=HOP)
    voiced = (vp >= 0.5) & ~np.isnan(f0p)

    def count(shift, mode):
        m = 0
        for nt in notes:
            t0, t1 = float(nt["start_time_sec"]) + shift, float(nt["end_time_sec"]) + shift
            mg = (t1 - t0) * 0.1
            if mode == "gate":
                k = (vt_g >= t0 + mg) & (vt_g <= t1 - mg)
                if k.sum() >= MIN_FRAMES and abs(1200 * np.log2(np.median(vf_g[k]) / float(nt["pitches"][0]))) <= 50: m += 1
            else:
                a = int(max(0, np.floor((t0 + mg) * sr / HOP))); bq = int(min(len(f0p), np.ceil((t1 - mg) * sr / HOP)))
                ii = np.arange(a, max(a, bq)); vi = ii[voiced[ii]] if len(ii) else ii
                if len(vi) >= MIN_FRAMES and abs(1200 * np.log2(np.median(f0p[vi]) / float(nt["pitches"][0]))) <= 50: m += 1
        return m

    for mode, label in (("gate", "本番の経路 yin+ゲート"), ("pyin", "pYIN")):
        cur = count(gs, mode)
        best, bsh = cur, gs
        for d in np.arange(-SCAN_SEC, SCAN_SEC + 1e-9, SCAN_STEP):
            c = count(gs + d, mode)
            if c > best: best, bsh = c, gs + d
        print(f"  位置合わせ [{label}]: 現行 {cur}/{len(notes)} → 最良 {best}/{len(notes)} ({bsh-gs:+.2f}s)")


if __name__ == "__main__":
    for cid in sys.argv[1].split(","):
        try:
            run(cid)
        except Exception as e:
            import traceback; traceback.print_exc()
            print(f"{cid}: 失敗 {type(e).__name__}: {e}")
