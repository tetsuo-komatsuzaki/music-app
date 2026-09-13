"""
check_gate_and_len.py — 2 点の確認

(1) ノイズ床の推定が位置合わせを左右するか。
    apply_noise_gate は first_sound_time より前の無音から床を推定し、無ければ f0=NaN の
    フレームから推定する。実演奏B で、本番と同じ first_sound_time を使った場合と、
    0.0 を渡した場合（= NaN フレームからの推定）で、広い走査の最良一致が変わるかを見る。

(2) V1 で長さが変わる既存音は、変更前にどんな長さだったか。
    「長さ 0 のまま検出されている音」がどれだけあるかで、V1 が奏法の土台を
    壊すのか直すのかが決まる。

Usage: python tests/audit/check_gate_and_len.py
"""
import pathlib
import sys
import warnings
warnings.filterwarnings("ignore")

import numpy as np
import librosa

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from _cache import local_case, load_audio  # noqa: E402
import offline_analyzer as OA  # noqa: E402

A = OA.A
CASES_DIR = HERE.parent / "cases"
HOP, FRAME, MIN_FRAMES = A.HOP_LENGTH, A.FRAME_LENGTH, 5
SKIP_FRAC = 0.5
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
        if rt[i] > lim: break
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


def first_sound_time(rms, t_all, f0):
    MIN_SUSTAIN = 15
    pl = (rms > A.RMS_THRESHOLD * 2) & (~np.isnan(f0[:len(rms)]))
    run = 0
    for i in range(len(pl)):
        if pl[i]:
            run += 1
            if run >= MIN_SUSTAIN:
                return float(t_all[i - MIN_SUSTAIN + 1])
        else:
            run = 0
    li = np.where(rms > A.RMS_THRESHOLD * 2)[0]
    return float(t_all[li[0]]) if len(li) else 0.0


def part1():
    print("=== (1) ノイズ床の推定と位置合わせ (実演奏B) ===", flush=True)
    case = local_case(CASES_DIR / "cmofva0fb0005zsjy86sy0n9c")
    y, sr = load_audio(str(case / "recording.wav"))
    an, bpm, info = OA.notes_from_case(case)
    fmin_n, fmax_n = A.INSTRUMENT_PITCH_RANGE.get(info.get("instrument", "unknown"), A.DEFAULT_PITCH_RANGE)
    fmin, fmax = librosa.note_to_hz(fmin_n), librosa.note_to_hz(fmax_n)
    notes = [x for x in an if x.get("type") == "note" and x.get("pitches")][:15]
    yin = np.array(librosa.yin(y, fmin=fmin, fmax=fmax, sr=sr, frame_length=FRAME, hop_length=HOP))
    t_all = np.array(librosa.frames_to_time(np.arange(len(yin)), sr=sr, hop_length=HOP))
    rms = np.array(librosa.feature.rms(y=y, frame_length=FRAME, hop_length=HOP)[0])
    fs = first_sound_time(rms, t_all, yin)
    res = OA.analyze_case(case)["results"]
    gs = next((float(r["global_shift_sec"]) for r in res if r.get("global_shift_sec") is not None), 0.0)
    print(f"  first_sound_time = {fs:.3f}s, global_shift = {gs:.3f}s", flush=True)

    for label, fsv in (("本番と同じ first_sound_time", fs), ("0.0 を渡す (NaN フレームから床を推定)", 0.0)):
        gate = A.apply_noise_gate(rms, t_all, yin, fsv, 0.0)
        vm = ~np.isnan(yin) & gate
        vt, vf = t_all[vm], yin[vm]
        def cnt(sh):
            m = 0
            for nt in notes:
                t0, t1 = float(nt["start_time_sec"]) + sh, float(nt["end_time_sec"]) + sh
                mg = (t1 - t0) * 0.1
                k = (vt >= t0 + mg) & (vt <= t1 - mg)
                if k.sum() >= MIN_FRAMES and abs(1200 * np.log2(np.median(vf[k]) / float(nt["pitches"][0]))) <= 50:
                    m += 1
            return m
        cur = cnt(gs); best, bs = cur, gs
        for d in np.arange(-12.0, 12.0 + 1e-9, 0.02):
            c = cnt(gs + d)
            if c > best: best, bs = c, gs + d
        print(f"  [{label}] 有効フレーム {int(vm.sum())}/{len(vm)}  現行 {cur}/15 → 最良 {best}/15 ({bs-gs:+.2f}s)", flush=True)


def part2():
    print("\n=== (2) V1 で長さが変わる既存音の、変更前の長さ (実演奏A) ===", flush=True)
    case = local_case(CASES_DIR / "cmplsqe3i000004i61gisxyp5")
    try:
        A._detect_sound_end, A._try_match_at = ORIG_END, try_wrapper
        base = OA.analyze_case(case)["results"]
        A._detect_sound_end = end_skip_lead
        new = OA.analyze_case(case)["results"]
    finally:
        A._detect_sound_end, A._try_match_at = ORIG_END, ORIG_TRY
    b = {int(r["note_index"]): r for r in base}
    n = {int(r["note_index"]): r for r in new}
    before, after = [], []
    for ni, rb in b.items():
        rn = n.get(ni)
        if rn is None or rb["evaluation_status"] == "not_detected" or rn["evaluation_status"] == "not_detected":
            continue
        s0, e0 = rb.get("detected_start_sec"), rb.get("detected_end_sec")
        s1, e1 = rn.get("detected_start_sec"), rn.get("detected_end_sec")
        exp = (rb.get("expected_end_sec") or 0) - (rb.get("expected_start_sec") or 0)
        if None in (s0, e0, s1, e1) or exp <= 0: continue
        d0, d1 = (float(e0) - float(s0)) / exp, (float(e1) - float(s1)) / exp
        if abs(d1 - d0) > 0.01:
            before.append(d0); after.append(d1)
    before, after = np.array(before), np.array(after)
    print(f"  長さが変わった既存音: {len(before)}")
    print(f"  変更前の 長さ/音価: ちょうど 0 が {int((before <= 0.001).sum())} 音、0.5 以下が {int((before <= 0.5).sum())} 音、"
          f"中央 {np.median(before):.2f}")
    print(f"  変更後の 長さ/音価: 0.5 以下が {int((after <= 0.5).sum())} 音、中央 {np.median(after):.2f}")
    flip_ng = int(((before <= 0.5) & (after > 0.5)).sum())
    flip_ok = int(((before > 0.5) & (after <= 0.5)).sum())
    print(f"  スタッカートの合否が変わる音: 合格→不合格 {flip_ng}、不合格→合格 {flip_ok}")
    # 全検出音のうち、変更前に長さ 0 の音
    z = sum(1 for ni, rb in b.items() if rb["evaluation_status"] != "not_detected"
            and rb.get("detected_start_sec") is not None and rb.get("detected_end_sec") is not None
            and abs(float(rb["detected_end_sec"]) - float(rb["detected_start_sec"])) < 0.01)
    det = sum(1 for r in base if r["evaluation_status"] != "not_detected")
    print(f"  参考: 現行の検出音 {det} のうち、長さがほぼ 0 の音は {z} 音")


if __name__ == "__main__":
    part1()
    part2()
