"""
triage_v18.py — 「検出できず」の分解ロジック v18 を実データに走らせる

v16 からの変更:
  - 交差窓の印は t の窓の yin 側の内容 (straddle 0.3〜0.7) と位置 (窓と V_i の交差 ≥ 0.25 dur) で決める。
    t の窓の pYIN 側の e_i フレーム割合 < 0.25 なら crossover_weak (印は付けるが弱い) として区別する
v17 からの変更 (批判 v17 への応答):
  - dev_W / dev_V を付けてから境界の理由を組む (第2層の dev_V の境界に理由が付かなかった)
  - 境界の比較は丸めた値 (小数 2 桁) で行い、表示と判定を一致させる
v15 からの変更 (批判 v15 への応答):
  - boundary: need_present ±max(2, 10%) / e_ratio 0.5±0.05 / S0 中央値 ±100±5c / straddle 0.7・0.3 ±0.05 / dev ±5c / lag ±0.05 拍。すべてに理由を記録
  - (v16 で試した「交差窓の印に pYIN の e_i 割合 ≥ 0.25 を要求」は v17 で撤回し、weak の印にした)
v14 からの変更 (批判 v14 への応答):
  - boundary 印を need_present ±4 フレーム (W_i / V_i) と 0.7 ±0.05 (straddle / straddle_seg) にも付ける
  - 交差窓の「V_i との重なり」は V_i の e_i フレームの区間との重なりで判定し、重なり ≥ 0.25 dur を要求
  - 層の集計を「交差窓」「境界」で分けて出す
v13 からの変更 (批判 v13 への応答):
  - boundary_straddle / straddle_no_e_nearby を状態から外す。case_a の交差窓 (t の窓で e_i 0.3〜0.7 かつ V_i と重なる) は
    印 case_a_crossover として、通常の S1〜S11 の状態に付ける
  - 単峰の判定は t の窓または seg の窓 (refine 後) のどちらかが > 0.7。seg で単峰になる音は end_asymmetry
    (開始判定 ±200c と終端判定 ±50c の非対称で長さ 0) として found_but_dropped の sub に
  - V_i の e_i フレーム数 ÷ need_present を連続量 v_ratio として記録 (0.5 で層を分けない)
  - lag_i が 0 になった理由 (near_n / iqr / med) を記録
v12 からの変更 (批判 v12 への応答):
  - straddle は探索が high と判定した候補時刻 t の窓で測る (ログの ACCEPT / Phase 2 matched の t)。seg の窓の値は別欄
  - 窓の残りのフレームが隣の音 (prev/next の楽譜の高さ ±50c) である割合 neighbor_frac を記録
  - straddle の音にも (ii) を走らせ、V_i に e_i があれば第1層 boundary_straddle、無ければ別枠 straddle_no_e_nearby
  - straddle < 0.3 は scattered_window (mostly_neighbor を改名)。窓の中身が多山であることを示す
v11 からの変更 (批判 v11 への応答):
  - case_a の音は、まず探索窓 [seg, seg+dur] の中央 80% で yin+ゲートの e_i (±50c) 割合を測る。
    0.3〜0.7 なら boundary_straddle (窓が e_i と隣の境目をまたぐ。第1層・探索の死角の一種)。
    S0 の検証・short の判定は単峰 (> 0.7) の窓にだけ適用。estimator_disagreement は廃止し、
    単峰なのに pYIN の中央値が ±100c に無い音は voicing_diff (別枠) とする
  - case_a 23 音全部に (i) の測定値 (e_ratio・straddle_ratio) を記録
v10 からの変更 (批判 v10 への応答):
  - S0 の量は「連続長」ではなく総量: case_a 区間 [seg, seg+dur] の e_i のフレーム (±200c・隣の除外つき・§2 の定義) ÷ N_i。途切れの回数と最長の途切れを記録
  - S0 で比 < 0.5 の音は short_at_search_position (S7 の short_sounding とは別名)。ただし先に (ii) W_i/V_i を試し、満たせば第1層
  - boundary 印を S0 の中央値 (±100±5c)・dev_V・lag の境界にも
v9 からの変更 (批判 v9 への応答):
  - case_a のログがあるのに pYIN で確認できない音は estimator_disagreement (どちらの層にも入れない)
  - case_a の区間から pYIN で e_i の連続長を測り、期待長比 < 0.5 なら short_sounding (第2層・探索は見つけていた印つき)
  - log_i はログの事実だけ。pYIN 検証の結果は s0_check (ok / short / no_e / after_end) に分ける
  - 境界 ±5c・±0.05 拍に乗った音に boundary 印
  - 第2層の音にも dev_V (V_i の e_i フレームのずれ) を記録
v8 からの変更:
  - 第1層の境界を ±100c に。100〜200c は第2層 wrong_pitch_in_place (演奏の事実)
  - S0 は case_a 区間に e_i (±200c・隣の除外つき) が need_present 以上あることを要求
  - log の優先順位を明記 (case_a > medium > same_pitch > nothing)。case_a で区間に e_i が無いものは case_a_no_e_in_seg
  - §7 用に第2層・演奏中の log 分布を機械集計
v7 からの変更:
  - 2 層に分ける: 第1層 = 楽譜の高さが鳴っていたのに not_detected (探索の死角、理由はログ)、
    第2層 = 楽譜の高さが鳴っていなかった (演奏の事実、音声で分ける)
  - S0 found_but_dropped は演奏終了後を除き、区間に pYIN 有声フレームがあることを要求
  - sub は事実だけを表す名前 (medium_only_matches / same_pitch_chain / nothing_matched)。全音に log を残す
  - displaced に dev_c と h_W を記録、lag の限界は「未満」
  - G1: best_ratio − aligned_ratio ≥ 0.3 なら alignable_elsewhere を優先
v6 からの変更:
  - G0: 位置合わせを広く走査し (pYIN, ±12 s)、現行 shift で一致しない録音を
        「別の shift なら一致する (alignable_elsewhere)」と「どこでも一致しない (unaligned)」に分ける
  - 探索ログ (ANALYZE_DIAG 相当) を捕まえ、現行の探索が高信頼の区間を見つけながら捨てた音を
        found_but_dropped として S1〜S11 の前に別枠で出す。sub_reason はログから付ける
  - lag_i は近傍の found の start_diff が揃う (IQR ≤ 0.25 拍) かつ |中央値| ≤ 0.5 拍のときだけ使う
  - within_search / after_end / gate_suppressed は lag なしの expected_pos で判定
  - S7 short_sounding を 50/100/200c で分ける

解析器本体は変更しない。
"""

import argparse
import json
import pathlib
import re
import sys
import warnings
warnings.filterwarnings("ignore")
from collections import Counter, defaultdict

import numpy as np
import librosa

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import _load_analyzer  # noqa: E402
from _cache import local_case, load_audio  # noqa: E402
import offline_analyzer as OA  # noqa: E402

A = _load_analyzer.load()
CASES_DIR = HERE.parent / "cases"
HOP, FRAME = A.HOP_LENGTH, A.FRAME_LENGTH

PV = 0.25
MIN_FRAMES = 5
MATCH_C = 60.0
WIDE_C = 200.0
PRESENT_FRAC = 0.5
PRESENT_FRAC_SHORT = 0.15
CLUSTER_GAP_C = 60.0
CLUSTER_MAX_WIDTH_C = 120.0
V_PAD_BEATS = 0.5
RUN_MIN = 3
K_MAX = 6
ALIGN_MIN_RATIO = 0.2
SCAN_SEC = 12.0
SCAN_STEP = 0.02
LAG_NEIGHBORS = 5
LAG_MAX_DIST = 8
LAG_IQR_BEATS = 0.25
LAG_MAX_BEATS = 0.5
SHORT_ATTRS = A.SHORT_TECHNIQUE_ATTRS


def cents(f, e):
    return 1200.0 * np.log2(f / e)


class Audio:
    def __init__(self, y, sr, fmin, fmax):
        self.sr = sr
        f0, vflag, vprob = librosa.pyin(y, fmin=fmin, fmax=fmax, sr=sr, frame_length=FRAME, hop_length=HOP)
        self.f0 = f0
        self.voiced = (vprob >= 0.5) & ~np.isnan(f0)
        self.t = librosa.frames_to_time(np.arange(len(f0)), sr=sr, hop_length=HOP)
        self.n = len(f0)
        self.c440 = np.where(self.voiced, 1200.0 * np.log2(np.where(self.voiced, f0, 1.0) / 440.0), np.nan)

    def idx(self, t0, t1):
        a = int(max(0, np.floor(t0 * self.sr / HOP)))
        b = int(min(self.n, np.ceil(t1 * self.sr / HOP)))
        return np.arange(a, max(a, b))


def cluster_h(f0_vals):
    if len(f0_vals) < MIN_FRAMES:
        return None, "too_few"
    c = np.sort(cents(f0_vals, 440.0))
    cuts = np.where(np.diff(c) > CLUSTER_GAP_C)[0] + 1
    parts = np.split(c, cuts)
    cand = [p for p in parts if (p.max() - p.min()) <= CLUSTER_MAX_WIDTH_C]
    if not cand:
        return None, "gliding"
    best = max(cand, key=len)
    if len(best) < MIN_FRAMES or len(best) < 0.5 * len(c):
        return None, "no_majority"
    return 440.0 * 2 ** (np.median(best) / 1200.0), "ok"


def diag_summary(lines):
    """探索ログを音ごとにまとめる"""
    per = defaultdict(lambda: {"cases": [], "confs": [], "same_pitch_exhausted": False, "both_failed": False,
                               "guard1": 0, "guard3": 0, "cand_none": 0, "phase2": False, "result": None})
    rx_note = re.compile(r"note=(\d+)")
    rx_case = re.compile(r"cascade stage=(\d+) radius=([\d.]+) seg=([\d.\-]+) case=(\w+) conf=(\w+)")
    rx_res = re.compile(r"cascade RESULT case=(\w+)")
    rx_t1 = re.compile(r"cand t=([\d.\-]+) ACCEPT seg_start=([\d.\-]+)")
    rx_t2 = re.compile(r"Phase 2 matched t=([\d.\-]+) seg_start=([\d.\-]+)")
    for ln in lines:
        m = rx_note.search(ln)
        if not m:
            continue
        d = per[int(m.group(1))]
        d.setdefault("t_of_seg", {})
        mt = rx_t1.search(ln) or rx_t2.search(ln)
        if mt:
            d["t_of_seg"][round(float(mt.group(2)), 3)] = float(mt.group(1))
        mc = rx_case.search(ln)
        if mc:
            d["cases"].append((int(mc.group(1)), mc.group(4), mc.group(5))); continue
        mr = rx_res.search(ln)
        if mr:
            d["result"] = mr.group(1); continue
        if "same_pitch Phase 1 exhausted" in ln: d["same_pitch_exhausted"] = True
        elif "BOTH PHASES FAILED" in ln: d["both_failed"] = True
        elif "REJ guard1" in ln: d["guard1"] += 1
        elif "REJ guard3" in ln: d["guard3"] += 1
        elif "_try_match_at returned None" in ln: d["cand_none"] += 1
        elif "Phase 2 matched" in ln: d["phase2"] = True
    return per


def dropped_kind(d):
    """not_detected に終わった音の、探索ログから見た事実"""
    cases = d["cases"]
    n_med = sum(1 for _, c, conf in cases if conf == "medium")
    stages = sorted({st for st, _, _ in cases})
    if any(c == "case_a" for _, c, _ in cases):
        return "case_a_found", f"case_a_found(stages={stages})"
    if n_med:
        return None, f"medium_only_matches(n={n_med},stages={stages})"
    if d["same_pitch_exhausted"]:
        return None, "same_pitch_chain"
    if d["both_failed"] or d["cand_none"] or d["guard1"] or d["guard3"]:
        return None, "nothing_matched"
    return None, "no_log"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("case_id")
    ap.add_argument("--out", default="")
    ap.add_argument("--show", type=int, default=6)
    args = ap.parse_args()

    case = local_case(CASES_DIR / args.case_id)
    y, sr = load_audio(str(case / "recording.wav"))

    # 探索ログを捕まえる (解析器の _diag を差し替える。判定には影響しない)
    diag_lines = []
    OA.A._diag = lambda msg: diag_lines.append(msg)
    res = OA.analyze_case(case)
    diag = diag_summary(diag_lines)

    S = res["summary"]
    gs, beat, ts = float(S["global_shift"]), float(S["beat_sec"]), float(S["time_scale"])
    results = res["results"]
    an_notes, bpm, info_src = OA.notes_from_case(case)
    instrument = info_src.get("instrument", "unknown")
    fmin_note, fmax_note = A.INSTRUMENT_PITCH_RANGE.get(instrument, A.DEFAULT_PITCH_RANGE)
    fmin, fmax = librosa.note_to_hz(fmin_note), librosa.note_to_hz(fmax_note)
    an = {int(n["note_index"]): n for n in an_notes if n.get("type") == "note" and n.get("pitches")}
    order = [int(r["note_index"]) for r in results]
    pos_of = {ni: p for p, ni in enumerate(order)}
    by = {int(r["note_index"]): r for r in results}
    params = json.loads((case / "params.json").read_text(encoding="utf-8")) if (case / "params.json").exists() else {}
    guide = params.get("guide_offset_sec")
    ignore_before = max(0.0, float(guide) - 0.3) if guide is not None else 0.0
    print(f"[{args.case_id}] {len(results)} notes, shift={gs:.3f}s beat={beat:.3f}s ts={ts} "
          f"instrument={instrument!r} → range {fmin_note}-{fmax_note}  diag lines={len(diag_lines)}", flush=True)

    au = Audio(y, sr, fmin, fmax)
    out = {"case": args.case_id, "instrument": instrument, "pitch_range": [fmin_note, fmax_note],
           "recording_flags": {}, "labels": {}}
    flags = out["recording_flags"]

    # ── G0/G1: 位置合わせ。現行 shift での一致 (ゲート版 / pYIN 版) と、広い走査での最良 shift ──
    yin = np.array(librosa.yin(y, fmin=fmin, fmax=fmax, sr=sr, frame_length=FRAME, hop_length=HOP))
    rms = np.array(librosa.feature.rms(y=y, frame_length=FRAME, hop_length=HOP)[0])
    gate = A.apply_noise_gate(rms, au.t, yin, float(S["first_sound_time"]), ignore_before)
    vmask = ~np.isnan(yin) & gate
    if ignore_before > 0:
        vmask &= au.t >= ignore_before
    vt, vf = au.t[vmask], yin[vmask]
    notes_only = [an[ni] for ni in order if ni in an]
    check = notes_only[:min(15, len(notes_only))]

    def count_matches_pyin(shift):
        m = 0
        for nt in check:
            t0, t1 = float(nt["start_time_sec"]) + shift, float(nt["end_time_sec"]) + shift
            mg = (t1 - t0) * 0.1
            idx = au.idx(t0 + mg, t1 - mg)
            if len(idx) == 0: continue
            vi = idx[au.voiced[idx]]
            if len(vi) >= MIN_FRAMES:
                med = float(np.median(au.f0[vi]))
                if abs(cents(med, float(nt["pitches"][0]))) <= A.PITCH_TOLERANCE_CENTS:
                    m += 1
        return m

    if len(check) < 2:
        flags["alignment"] = "too_short_to_align"
    else:
        m_gate = 0
        for nt in check:
            t0, t1 = float(nt["start_time_sec"]) + gs, float(nt["end_time_sec"]) + gs
            mg = (t1 - t0) * 0.1
            mk = (vt >= t0 + mg) & (vt <= t1 - mg)
            if mk.sum() >= MIN_FRAMES:
                med = float(np.median(vf[mk]))
                if med > 0 and abs(cents(med, float(nt["pitches"][0]))) <= A.PITCH_TOLERANCE_CENTS:
                    m_gate += 1
        m_cur = count_matches_pyin(gs)
        best_shift, best_m = gs, m_cur
        for d in np.arange(-SCAN_SEC, SCAN_SEC + 1e-9, SCAN_STEP):
            mm = count_matches_pyin(gs + d)
            if mm > best_m or (mm == best_m and abs(d) < abs(best_shift - gs)):
                best_m, best_shift = mm, gs + d
        n = len(check)
        flags.update({
            "gate_visible_ratio": round(m_gate / n, 3),
            "aligned_ratio": round(m_cur / n, 3),
            "best_shift_delta_s": round(best_shift - gs, 2),
            "best_ratio": round(best_m / n, 3),
        })
        if m_cur / n >= ALIGN_MIN_RATIO and (best_m - m_cur) / n < 0.3:
            flags["alignment"] = "aligned"
        elif best_m / n >= ALIGN_MIN_RATIO:
            flags["alignment"] = "alignable_elsewhere"
        else:
            flags["alignment"] = "unaligned"
        flags["gate_suppressed"] = bool(flags["gate_visible_ratio"] < ALIGN_MIN_RATIO <= flags["aligned_ratio"])
    print(f"  G1: {flags}", flush=True)

    # ── G2 ──
    T_end = float(au.t[np.where(au.voiced)[0][-1]]) if au.voiced.sum() else None
    flags["performance_end"] = T_end
    aligned = flags["alignment"] == "aligned"
    after_end = {int(r["note_index"]): (None if (T_end is None or r.get("expected_start_sec") is None or not aligned)
                                        else bool(float(r["expected_start_sec"]) > T_end + V_PAD_BEATS * beat))
                 for r in results}
    out["after_performance_end_count"] = sum(1 for v in after_end.values() if v)

    labels = {}
    nd = [int(r["note_index"]) for r in results if r["evaluation_status"] == "not_detected"]
    if not aligned:
        print(f"  {flags['alignment']} → 音単位の判定は行わない", flush=True)
        for ni in nd:
            labels[ni] = {"state": f"({flags['alignment']})"}
        out["labels"] = labels; _report(out, results, labels, args); return
    if T_end is None:
        for ni in nd:
            labels[ni] = {"state": "not_played", "why": "no_voiced_in_recording"}
        out["labels"] = labels; _report(out, results, labels, args); return

    # ── 局所的な遅れ (揃っているときだけ使う) ──
    found_d = [(pos_of[int(r["note_index"])], float(r["detected_start_sec"]) - float(r["expected_start_sec"]))
               for r in results if r["evaluation_status"] != "not_detected"
               and r.get("detected_start_sec") is not None and r.get("expected_start_sec") is not None]
    lag_detail = {}
    def lag_at(p):
        near = [(abs(q - p), d) for q, d in found_d if abs(q - p) <= LAG_MAX_DIST]
        near = [d for _, d in sorted(near)[:LAG_NEIGHBORS]]
        if len(near) < 3:
            lag_detail[p] = {"n": len(near)}
            return 0.0, "few"
        q1, q3 = np.percentile(near, [25, 75]); med = float(np.median(near))
        lag_detail[p] = {"n": len(near), "iqr_beats": round(float(q3 - q1) / beat, 2), "med_beats": round(med / beat, 2)}
        if (q3 - q1) >= LAG_IQR_BEATS * beat or abs(med) >= LAG_MAX_BEATS * beat:
            return 0.0, "unstable"
        near_edge = (abs((q3 - q1) - LAG_IQR_BEATS * beat) <= 0.05 * beat
                     or abs(abs(med) - LAG_MAX_BEATS * beat) <= 0.05 * beat)
        return med, ("applied_boundary" if near_edge else "applied")
    if found_d:
        allds = np.array([d for _, d in found_d])
        flags["found_start_diff_median_s"] = round(float(np.median(allds)), 3)
        flags["found_start_diff_p90_abs_s"] = round(float(np.percentile(np.abs(allds), 90)), 3)

    def is_target(ni):
        r, n = by[ni], an.get(ni)
        if r["evaluation_status"] != "not_detected" or n is None: return False
        if len(n.get("pitches", [])) != 1 or n.get("is_harmonic") or n.get("is_tied"): return False
        if n.get("is_trill") or n.get("is_tremolo"): return False
        return True
    targets = [ni for ni in order if is_target(ni)]
    print(f"  not_detected {len(nd)} / 対象音 {len(targets)}", flush=True)

    def e_of(ni):
        n = an.get(ni); return float(n["pitches"][0]) if n else None
    def seg_of(ni):
        r = by.get(ni)
        if r is None or r["evaluation_status"] == "not_detected" or r.get("detected_start_sec") is None: return None
        a, b = float(r["detected_start_sec"]), r.get("detected_end_sec"); return (a, float(b) if b else a + 0.1)
    def exclude_same_pitch_neighbor(idx, ni, e):
        p = pos_of[ni]; keep = np.ones(len(idx), bool)
        for q in (p - 1, p + 1):
            if 0 <= q < len(order):
                ej = e_of(order[q])
                if ej is not None and abs(cents(ej, e)) < 1.0:
                    sg = seg_of(order[q])
                    if sg: keep &= ~((au.t[idx] >= sg[0]) & (au.t[idx] <= sg[1]))
        return idx[keep]
    def present_frames(idx, ni, e, width):
        vi = idx[au.voiced[idx]]
        if len(vi) == 0: return vi
        c = np.abs(cents(au.f0[vi], e)); ok = c <= width
        p = pos_of[ni]
        for q in (p - 1, p + 1):
            if 0 <= q < len(order):
                ej = e_of(order[q])
                if ej is not None and abs(cents(ej, e)) >= 1.0:
                    ok &= c < np.abs(cents(au.f0[vi], ej))
        return vi[ok]
    def gate_frames_in(t0, t1):
        return int(((vt >= t0) & (vt <= t1)).sum())

    # ── 先に: 探索ログで「見つけたのに捨てた」音を別枠に ──
    lag_applied = 0
    info = {}
    for ni in targets:
        r, n = by[ni], an[ni]; e = e_of(ni)
        state0, sub = dropped_kind(diag.get(ni, {"cases": [], "same_pitch_exhausted": False, "both_failed": False,
                                                 "guard1": 0, "guard3": 0, "cand_none": 0}))
        exp0 = float(r["expected_start_sec"])
        lag, lag_why = lag_at(pos_of[ni])
        if lag_why.startswith("applied"): lag_applied += 1
        base = exp0 + lag
        dur = (float(n["end_time_sec"]) - float(n["start_time_sec"])) * ts
        N = max(1, int(round(dur * sr / HOP)))
        short = any(n.get(a) for a in SHORT_ATTRS)
        W = exclude_same_pitch_neighbor(au.idx(base, base + dur), ni, e)
        V = exclude_same_pitch_neighbor(au.idx(base - V_PAD_BEATS * beat, base + dur + V_PAD_BEATS * beat), ni, e)
        need_sound = MIN_FRAMES if short else max(MIN_FRAMES, int(np.ceil(PV * N)))
        need_present = max(MIN_FRAMES, int(np.ceil((PRESENT_FRAC_SHORT if short else PRESENT_FRAC) * N)))
        d = dict(e=e, exp0=exp0, base=base, dur=dur, N=N, short=short, lag=lag, lag_why=lag_why, W=W, V=V,
                 vW=int(au.voiced[W].sum()), vV=int(au.voiced[V].sum()),
                 need_sound=need_sound, need_present=need_present,
                 pW=present_frames(W, ni, e, WIDE_C), pV=present_frames(V, ni, e, WIDE_C),
                 gate0=gate_frames_in(exp0, exp0 + dur), sub=sub,
                 prev_e=e_of(order[pos_of[ni]-1]) if pos_of[ni] > 0 else None,
                 next_e=e_of(order[pos_of[ni]+1]) if pos_of[ni]+1 < len(order) else None)
        info[ni] = d
        d["log"] = sub
        d["s0_check"] = None
        d_prev_e = e_of(order[pos_of[ni]-1]) if pos_of[ni] > 0 else None
        d_next_e = e_of(order[pos_of[ni]+1]) if pos_of[ni]+1 < len(order) else None
        if state0 == "case_a_found":
            if after_end.get(ni):
                d["s0_check"] = "after_end"
            else:
                segs = [float(m.group(3)) for ln in diag_lines for m in [re.search(
                            rf"note={ni} cascade stage=(\d+) radius=([\d.]+) seg=([\d.\-]+) case=case_a", ln)] if m]
                best = None
                t_map = diag.get(ni, {}).get("t_of_seg", {})
                for sg in segs:
                    mg = dur * (1.0 - A.CENTER_RATIO) / 2.0
                    t_cand = t_map.get(round(sg, 3), sg)
                    # 探索が high と判定した候補時刻 t の窓 (中央 80%) の yin+ゲートのフレームで e_i (±50c) の割合
                    gm = (vt >= t_cand + mg) & (vt <= t_cand + dur - mg)
                    gf = vf[gm]
                    straddle = float((np.abs(cents(gf, e)) <= 50).mean()) if len(gf) >= MIN_FRAMES else None
                    # 残りのフレームが隣の音の高さ (±50c) である割合
                    nb = 0.0
                    if len(gf) >= MIN_FRAMES:
                        m_nb = np.zeros(len(gf), bool)
                        for ej in (d_prev_e, d_next_e):
                            if ej is not None and abs(cents(ej, e)) >= 1.0:
                                m_nb |= np.abs(cents(gf, ej)) <= 50
                        nb = float(m_nb.mean())
                    gm2 = (vt >= sg + mg) & (vt <= sg + dur - mg)
                    gf2 = vf[gm2]
                    straddle_seg = float((np.abs(cents(gf2, e)) <= 50).mean()) if len(gf2) >= MIN_FRAMES else None
                    idx = au.idx(sg + mg, sg + dur - mg)
                    vi = idx[au.voiced[idx]]
                    med_c = float(cents(float(np.median(au.f0[vi])), e)) if len(vi) >= MIN_FRAMES else None
                    win = au.idx(sg, sg + dur)
                    pf = present_frames(win, ni, e, WIDE_C)
                    ratio = len(pf) / N if N > 0 else 0.0
                    gaps = np.diff(pf) - 1 if len(pf) > 1 else np.array([])
                    gaps = gaps[gaps > 0]
                    cand = dict(sg=sg, t=t_cand, straddle=straddle, straddle_seg=straddle_seg, neighbor_frac=nb,
                                med_c=med_c, e_ratio=ratio,
                                gaps=int(len(gaps)), max_gap=int(gaps.max()) if len(gaps) else 0,
                                yin_n=int(len(gf)), pyin_n=int(len(vi)))
                    if best is None or (cand["straddle"] or 0) > (best["straddle"] or 0):
                        best = cand
                d["case_a_measure"] = {k: (round(v, 2) if isinstance(v, float) else v) for k, v in best.items()} if best else None
                if best is None or best["straddle"] is None:
                    d["s0_check"] = "no_gate_frames"
                else:
                    t_c = best["t"]
                    # 重なり: t の窓の有声フレームのうち e_i のフレーム (隣の除外つき) の割合 ≥ 0.25、かつ窓と V_i の交差 ≥ 0.25 dur
                    win_t = au.idx(t_c, t_c + dur)
                    n_voiced_t = int(au.voiced[win_t].sum())
                    e_frac_t = (len(present_frames(win_t, ni, e, WIDE_C)) / n_voiced_t) if n_voiced_t else 0.0
                    V0 = exp0 - V_PAD_BEATS * beat; V1 = exp0 + dur + V_PAD_BEATS * beat
                    ov = max(0.0, min(t_c + dur, V1) - max(t_c, V0))
                    overlaps_V = ov >= 0.25 * dur
                    weak = e_frac_t < 0.25
                    d["case_a_measure"]["e_frac_in_t_window"] = round(e_frac_t, 2)
                    d["case_a_measure"]["overlap_with_V_s"] = round(ov, 2)
                    unimodal_t = best["straddle"] > 0.7
                    unimodal_seg = best["straddle_seg"] is not None and best["straddle_seg"] > 0.7
                    d["case_a_measure"]["overlaps_V"] = bool(overlaps_V)
                    if 0.3 <= best["straddle"] <= 0.7 and overlaps_V and not unimodal_seg:
                        d["s0_check"] = "crossover"
                        d["case_a_crossover"] = {"straddle_t": round(best["straddle"], 2), "neighbor_frac": round(best["neighbor_frac"], 2),
                                                 "t_minus_exp_s": round(t_c - exp0, 2), "e_frac_pyin": round(e_frac_t, 2), "weak": bool(weak)}
                        if weak:
                            d["s0_check"] = "crossover_weak"
                    elif unimodal_t or unimodal_seg:
                        if best["med_c"] is None or abs(best["med_c"]) > 100:
                            d["s0_check"] = "voicing_diff"
                            labels[ni] = {"state": "voicing_diff", "layer": "unresolved", "sub": sub,
                                          "straddle_t": round(best["straddle"], 2), "yin_frames": best["yin_n"], "pyin_frames": best["pyin_n"]}
                        else:
                            d["s0_check"] = "ok"
                            kind = "end_asymmetry" if (not unimodal_t and unimodal_seg) else ("unimodal" if best["e_ratio"] >= 0.5 else "unimodal_short")
                            labels[ni] = {"state": "found_but_dropped", "layer": "search", "sub": sub, "kind": kind,
                                          "straddle_t": round(best["straddle"], 2), "straddle_seg": None if best["straddle_seg"] is None else round(best["straddle_seg"], 2),
                                          "e_ratio": round(best["e_ratio"], 2), "med_c": round(best["med_c"], 1),
                                          "refine_shift_s": round(best["sg"] - t_c, 3)}
                    elif best["straddle"] < 0.3:
                        d["s0_check"] = "scattered_window"
                    else:
                        d["s0_check"] = "crossover_outside_V"
                        d["case_a_crossover"] = {"straddle_t": round(best["straddle"], 2), "neighbor_frac": round(best["neighbor_frac"], 2),
                                                 "t_minus_exp_s": round(t_c - exp0, 2), "outside_V": True}
    flags["lag_applied_count"] = lag_applied

    def sub_of(d):
        if d["gate0"] < MIN_FRAMES: return "gate_suppressed"
        return d.get("log", d["sub"])

    # ── 4.1 ──
    for ni in targets:
        if ni in labels: continue
        d = info[ni]; e = d["e"]
        if d["vV"] < d["need_sound"]:
            labels[ni] = {"state": "not_played_after_end" if after_end.get(ni) else "not_played"}; continue
        devW = float(np.median(cents(au.f0[d["pW"]], e))) if len(d["pW"]) >= d["need_present"] else None
        devV = float(np.median(cents(au.f0[d["pV"]], e))) if len(d["pV"]) >= d["need_present"] else None
        d["devW"], d["devV"] = devW, devV
        def bnd(v):
            return bool(v is not None and min(abs(abs(v) - 50), abs(abs(v) - 100), abs(abs(v) - 200)) <= 5)
        if devW is not None and abs(devW) <= 100:
            st = "missed" if abs(devW) <= 50 else "missed_out_of_tune"
            labels[ni] = {"state": st, "layer": "search", "dev_c": round(devW, 1), "boundary": bnd(devW),
                          "sub": sub_of(d), "lag_s": round(d["lag"], 2)}; continue
        if devV is not None and abs(devV) <= 100 and devW is None:
            center = float(np.mean(au.t[d["pV"]]))
            off0 = center - (d["exp0"] + d["dur"] / 2)
            hW, _ = cluster_h(au.f0[d["W"][au.voiced[d["W"]]]])
            labels[ni] = {"state": "displaced", "layer": "search", "offset_s": round(center - (d["base"] + d["dur"] / 2), 2),
                          "offset_from_expected_s": round(off0, 2), "within_search": bool(abs(off0) <= beat),
                          "dev_c": round(devV, 1), "boundary": bnd(devV), "h_W": librosa.hz_to_note(hW) if hW else None,
                          "sub": sub_of(d), "lag_s": round(d["lag"], 2)}; continue
        if d.get("s0_short"):
            labels[ni] = {"state": "short_at_search_position", "layer": "performance", "sub": d["sub"],
                          "search_found_case_a": True, **d["s0_short"]}; continue
        if d["vW"] < d["need_sound"]:
            labels[ni] = {"state": "gap"}; continue
        h, why = cluster_h(au.f0[d["W"][au.voiced[d["W"]]]])
        d["h"] = h
        if h is None:
            labels[ni] = {"state": "unstable", "why": why}

    # ── 4.2 ──
    stable_set = set(ni for ni in targets if ni not in labels)
    def runs_of(cands):
        runs, cur = [], []
        for ni in order:
            if ni in cands: cur.append(ni)
            elif ni in labels and labels[ni].get("state") == "unstable": continue
            else:
                if cur: runs.append(cur)
                cur = []
        if cur: runs.append(cur)
        return runs
    def span_c(nis):
        hs = np.array([cents(info[x]["h"], 440.0) for x in nis]); return float(hs.max() - hs.min())
    for run in runs_of(stable_set):
        i = 0
        while i < len(run):
            j = i
            while j + 1 < len(run) and span_c(run[i:j+2]) <= MATCH_C: j += 1
            seg = run[i:j+1]
            if len(seg) >= RUN_MIN:
                es = [info[x]["e"] for x in seg]
                if any(abs(cents(es[a+1], es[a])) > MATCH_C for a in range(len(es)-1)):
                    for x in seg:
                        labels[x] = {"state": "stalled", "run_len": len(seg), "heard": librosa.hz_to_note(info[x]["h"])}
            i = j + 1
    def assign_misaligned(pool):
        if len(pool) < RUN_MIN: return
        best = None
        for k in [kk for kk in range(-K_MAX, K_MAX + 1) if kk != 0]:
            for s in range(len(pool)):
                L = 0
                while s + L < len(pool):
                    x = pool[s + L]; q = pos_of[x] + k
                    if not (0 <= q < len(order)) or e_of(order[q]) is None: break
                    if abs(cents(info[x]["h"], e_of(order[q]))) > MATCH_C: break
                    L += 1
                if L >= RUN_MIN and span_c(pool[s:s+L]) > MATCH_C:
                    cand = (L, -abs(k), 1 if k < 0 else 0, -s, k)
                    if best is None or cand > best: best = cand
        if best is None: return
        L, _, _, ns, k = best; s = -ns
        for x in pool[s:s+L]:
            labels[x] = {"state": "misaligned", "k": k, "run_len": L, "heard": librosa.hz_to_note(info[x]["h"])}
        assign_misaligned(pool[:s]); assign_misaligned(pool[s+L:])
    for run in runs_of(set(ni for ni in stable_set if ni not in labels)):
        assign_misaligned(list(run))

    # ── 4.3 ──
    for ni in targets:
        if ni in labels: continue
        d = info[ni]; h = d["h"]; e = d["e"]; heard = librosa.hz_to_note(h)
        dv = float(cents(h, e))
        if abs(dv) <= WIDE_C:
            st = "short_sounding" if abs(dv) <= 50 else ("short_out_of_tune" if abs(dv) <= 100 else "wrong_pitch_in_place")
            labels[ni] = {"state": st, "heard": heard, "dev_c": round(dv, 1)}; continue
        W = d["W"]; vW = W[au.voiced[W]]
        def occupies(ej):
            return ej is not None and len(vW) > 0 and (np.abs(cents(au.f0[vW], ej)) <= MATCH_C).mean() >= 0.5
        if d["prev_e"] is not None and abs(cents(h, d["prev_e"])) <= MATCH_C and occupies(d["prev_e"]):
            labels[ni] = {"state": "held_previous", "heard": heard}; continue
        if d["next_e"] is not None and abs(cents(h, d["next_e"])) <= MATCH_C and occupies(d["next_e"]):
            labels[ni] = {"state": "early_next", "heard": heard}; continue
        if abs(abs(dv) - 1200) <= MATCH_C:
            labels[ni] = {"state": "octave_mismatch", "heard": heard}; continue
        p = pos_of[ni]; near = None
        for k in range(-K_MAX, K_MAX + 1):
            if k == 0: continue
            q = p + k
            if 0 <= q < len(order) and e_of(order[q]) is not None:
                c = abs(cents(h, e_of(order[q])))
                if near is None or c < near[1]: near = (k, c)
        labels[ni] = {"state": "unexplained", "heard": heard,
                      "nearest_k": near[0] if near else None, "nearest_c": round(near[1], 1) if near else None}

    for ni, v in labels.items():
        if ni in info:
            v.setdefault("layer", "performance")
            v.setdefault("log", info[ni].get("log"))
            v["v_ratio"] = round(len(info[ni]["pV"]) / max(1, info[ni]["need_present"]), 2)
            v["w_ratio"] = round(len(info[ni]["pW"]) / max(1, info[ni]["need_present"]), 2)
            if v["layer"] == "performance":
                if info[ni].get("devW") is not None:
                    v.setdefault("dev_W", round(info[ni]["devW"], 1))
                if info[ni].get("devV") is not None:
                    v.setdefault("dev_V", round(info[ni]["devV"], 1))
            npres = info[ni]["need_present"]
            band = max(2, int(round(0.1 * npres)))
            why = []
            if abs(len(info[ni]["pV"]) - npres) <= band: why.append("need_present_V")
            if abs(len(info[ni]["pW"]) - npres) <= band: why.append("need_present_W")
            cm = info[ni].get("case_a_measure") or {}
            for key in ("straddle", "straddle_seg"):
                if cm.get(key) is not None and round(abs(round(cm[key], 2) - 0.7), 3) <= 0.05: why.append(f"{key}~0.7")
                if cm.get(key) is not None and round(abs(round(cm[key], 2) - 0.3), 3) <= 0.05: why.append(f"{key}~0.3")
            if cm.get("e_ratio") is not None and round(abs(round(cm["e_ratio"], 2) - 0.5), 3) <= 0.05: why.append("e_ratio~0.5")
            if cm.get("med_c") is not None and abs(abs(round(cm["med_c"], 1)) - 100) <= 5: why.append("s0_med~100c")
            for key in ("dev_c", "dev_W", "dev_V"):
                val = v.get(key)
                if val is not None and min(abs(abs(val) - 50), abs(abs(val) - 100), abs(abs(val) - 200)) <= 5: why.append(f"{key}~50/100/200")
            if info[ni].get("lag_why") == "applied_boundary": why.append("lag_limit")
            if why:
                v["boundary"] = True; v["boundary_why"] = why
            elif v.get("boundary"):
                v["boundary_why"] = ["unclassified"]
            if info[ni].get("case_a_crossover"):
                v["case_a_crossover"] = info[ni]["case_a_crossover"]
            if info[ni].get("lag_why") in ("few", "unstable"):
                v["lag_off"] = {"why": info[ni]["lag_why"], **lag_detail.get(pos_of[ni], {})}
            if info[ni].get("s0_check") is not None:
                v.setdefault("s0_check", info[ni]["s0_check"])
                if info[ni].get("case_a_measure"):
                    v.setdefault("case_a_measure", info[ni]["case_a_measure"])
            if v["layer"] == "performance":
                if info[ni].get("devW") is not None:
                    v.setdefault("dev_W", round(info[ni]["devW"], 1))
                if info[ni].get("devV") is not None:
                    v.setdefault("dev_V", round(info[ni]["devV"], 1))
                    if min(abs(abs(info[ni]["devV"]) - 50), abs(abs(info[ni]["devV"]) - 100), abs(abs(info[ni]["devV"]) - 200)) <= 5:
                        v["boundary"] = True
            if info[ni].get("lag_why") == "applied_boundary":
                v["boundary"] = True
    out["labels"] = labels
    out["sub_reason_counts"] = dict(Counter(re.sub(r"\(.*\)", "", str(v.get("log"))) for v in labels.values() if v.get("log")))
    out["layer_counts"] = dict(Counter(v.get("layer") for v in labels.values()))
    out["layer2_in_performance_logs"] = dict(Counter(re.sub(r"\(.*\)", "", str(v.get("log")))
        for ni, v in labels.items() if v.get("layer") == "performance" and v["state"] != "not_played_after_end"))
    out["layer1_logs"] = dict(Counter(re.sub(r"\(.*\)", "", str(v.get("log")))
        for ni, v in labels.items() if v.get("layer") == "search"))
    out["s0_check_counts"] = dict(Counter(v.get("s0_check") for v in labels.values() if v.get("s0_check")))
    out["boundary_count"] = sum(1 for v in labels.values() if v.get("boundary"))
    out["case_a_straddle_ratios"] = sorted(round(info[n]["case_a_measure"]["straddle"], 2) for n in info if info[n].get("case_a_measure") and info[n]["case_a_measure"].get("straddle") is not None)
    out["case_a_e_ratios"] = sorted(round(info[n]["case_a_measure"]["e_ratio"], 2) for n in info if info[n].get("case_a_measure"))
    out["short_at_search_position_ratios"] = sorted(v["e_ratio"] for v in labels.values() if v["state"] == "short_at_search_position")
    out["found_but_dropped_ratios"] = sorted(v["e_ratio"] for v in labels.values() if v["state"] == "found_but_dropped")
    out["found_but_dropped_strict_present"] = sum(1 for v in labels.values() if v["state"] == "found_but_dropped" and v.get("strict_present"))
    out["displaced_dev_range"] = [min((v["dev_c"] for v in labels.values() if v["state"] == "displaced"), default=None),
                                  max((v["dev_c"] for v in labels.values() if v["state"] == "displaced"), default=None)]
    _report(out, results, labels, args)


def _report(out, results, labels, args):
    c = Counter(v["state"] for v in labels.values())
    f = out["recording_flags"]
    print(f"  after_performance_end (全音): {out.get('after_performance_end_count')}  "
          f"found start_diff 中央値={f.get('found_start_diff_median_s')} p90|.|={f.get('found_start_diff_p90_abs_s')}  "
          f"lag 適用={f.get('lag_applied_count')}")
    print("  状態の内訳:")
    for k in sorted(c):
        print(f"    {k:22} {c[k]:>4}")
    if out.get("layer_counts"):
        print(f"  層: {out['layer_counts']}")
    if out.get("sub_reason_counts"):
        print(f"  ログ (全対象音): {out['sub_reason_counts']}")
        print(f"  ログ (第1層): {out.get('layer1_logs')}   ログ (第2層・演奏中): {out.get('layer2_in_performance_logs')}   displaced dev 範囲: {out.get('displaced_dev_range')}")
        print(f"  s0_check: {out.get('s0_check_counts')}   境界に乗った音: {out.get('boundary_count')}")
        print(f"  S0 の e_ratio: {out.get('found_but_dropped_ratios')}   short_at_search_position の e_ratio: {out.get('short_at_search_position_ratios')}")
        print(f"  case_a 音の straddle 分布 (t の窓): {out.get('case_a_straddle_ratios')}")
        cx = {ni: v for ni, v in labels.items() if v.get("case_a_crossover")}
        for layer in ("search", "performance", "unresolved"):
            L = [v for v in labels.values() if v.get("layer") == layer and v["state"] != "not_played_after_end"]
            print(f"  層 {layer}: {len(L)}  うち交差窓 {sum(1 for v in L if v.get('case_a_crossover'))}  うち境界 {sum(1 for v in L if v.get('boundary'))}")
        print(f"  境界の理由: {dict(Counter(w for v in labels.values() for w in v.get('boundary_why', [])))}")
        print(f"  交差窓 (case_a_crossover) の状態: {dict(Counter(v['state'] for v in cx.values()))}")
        print(f"  交差窓の v_ratio (V_i の e_i フレーム ÷ need_present): {sorted(v['v_ratio'] for v in cx.values())}")
        print(f"  交差窓の t−exp: {sorted(v['case_a_crossover']['t_minus_exp_s'] for v in cx.values())}")
        print(f"  交差窓の pYIN 側 e_i 割合 (t の窓): {sorted(v['case_a_crossover']['e_frac_pyin'] for v in cx.values())}   weak: {sum(1 for v in cx.values() if v['case_a_crossover'].get('weak'))}")
        lo = [v['lag_off'] for v in labels.values() if v.get('lag_off')]
        print(f"  lag が 0 になった音: {len(lo)}  理由: {dict(Counter(x['why'] for x in lo))}  iqr_beats 中央値: {np.median([x.get('iqr_beats', 0) for x in lo if 'iqr_beats' in x]) if any('iqr_beats' in x for x in lo) else None}")

        print(f"  case_a 音の e_ratio 分布: {out.get('case_a_e_ratios')}")
    by = {int(r["note_index"]): r for r in results}
    shown = Counter()
    print(f"  代表例 (各状態 {args.show} 件まで):")
    for ni, v in labels.items():
        st = v["state"]
        if shown[st] >= args.show: continue
        shown[st] += 1
        r = by[ni]
        extra = {k: x for k, x in v.items() if k != "state"}
        print(f"    #{ni:>3} {str(r.get('note_name')):5} {float(r.get('expected_start_sec') or 0):7.2f}s  {st:20} {extra}")
    if args.out:
        pathlib.Path(args.out).write_text(json.dumps({**out, "labels": {str(k): v for k, v in labels.items()}},
                                                     ensure_ascii=False, indent=2, default=str), encoding="utf-8")
        print("  wrote", args.out)


if __name__ == "__main__":
    main()
