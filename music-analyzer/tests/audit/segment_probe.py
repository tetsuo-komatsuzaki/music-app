"""
segment_probe.py — 音声だけから音の塊を切り、いまの検出と突き合わせる

音程側の改善・段階1 の下調べ。
「楽譜の高さで探す」いまの方式が正しく見つけた音の出だしに対して、
楽譜を一切見ずに切った塊の境目がどれだけ一致するかを数字にする。
一致しなければ、切る手法の選び直し。一致すれば、段階1 に進める。

塊の切り方 (楽譜を見ない):
  - 鳴っているか: pYIN の有声確率
  - 弓の返し:     音量の立ち上がり (本体と同じ detect_onsets)
  - 指の移動:     前後 50ms の高さの中央値が 60 セント以上変わる位置
  この3つの境目候補を 40ms 以内で束ね、有声率 50% 以上・40ms 以上の区間を塊にする。

Usage:
  python tests/audit/segment_probe.py <case_id> [--tol-ms 50]
"""

import argparse
import json
import pathlib
import sys
import warnings
warnings.filterwarnings("ignore")

import numpy as np
import librosa

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import _load_analyzer  # noqa: E402
from _cache import local_case, load_audio  # noqa: E402
from offline_analyzer import analyze_case  # noqa: E402

A = _load_analyzer.load()
CASES_DIR = HERE.parent / "cases"

HOP = A.HOP_LENGTH
FRAME = A.FRAME_LENGTH
PITCH_JUMP_CENTS = 60.0
JUMP_WINDOW_SEC = 0.05
MERGE_SEC = 0.04
MIN_SEG_SEC = 0.04
VOICED_PROB = 0.5


def segment(y, sr, fmin, fmax):
    """楽譜を見ずに塊を切る。戻り値: [(start, end, median_hz, n_frames), ...]"""
    f0, vflag, vprob = librosa.pyin(y, fmin=fmin, fmax=fmax, sr=sr,
                                    frame_length=FRAME, hop_length=HOP)
    t = librosa.frames_to_time(np.arange(len(f0)), sr=sr, hop_length=HOP)
    voiced = (vprob >= VOICED_PROB) & ~np.isnan(f0)

    # 境目候補 1: 音量の立ち上がり (本体と同じ)
    onsets = list(np.asarray(A.detect_onsets(y, sr, hop_length=HOP), dtype=float))

    # 境目候補 2: 有声/無声の切り替わり
    edges = []
    for i in range(1, len(voiced)):
        if voiced[i] != voiced[i - 1]:
            edges.append(float(t[i]))

    # 境目候補 3: 高さの跳び (前後 50ms の中央値が 60c 以上違う)
    w = max(1, int(JUMP_WINDOW_SEC * sr / HOP))
    jumps = []
    cents = np.full(len(f0), np.nan)
    cents[voiced] = 1200.0 * np.log2(f0[voiced] / 440.0)
    for i in range(w, len(f0) - w):
        a = cents[i - w:i]; b = cents[i:i + w]
        a = a[~np.isnan(a)]; b = b[~np.isnan(b)]
        if len(a) < w // 2 or len(b) < w // 2:
            continue
        if abs(np.median(b) - np.median(a)) >= PITCH_JUMP_CENTS:
            jumps.append(float(t[i]))

    # 束ねる
    cand = sorted(onsets + edges + jumps)
    bounds = []
    for c in cand:
        if bounds and c - bounds[-1] < MERGE_SEC:
            continue
        bounds.append(c)
    bounds = [0.0] + bounds + [float(t[-1])]

    segs = []
    for s, e in zip(bounds[:-1], bounds[1:]):
        if e - s < MIN_SEG_SEC:
            continue
        m = (t >= s) & (t < e)
        if m.sum() == 0:
            continue
        vr = float(voiced[m].mean())
        if vr < 0.5:
            continue
        hz = float(np.median(f0[m & voiced]))
        segs.append((float(s), float(e), hz, int((m & voiced).sum())))
    return segs, {"onsets": len(onsets), "edges": len(edges), "jumps": len(jumps)}


def compare(segs, detected_starts, tol):
    seg_starts = np.array([s for s, _, _, _ in segs])
    det = np.array(detected_starts)
    if len(det) == 0 or len(seg_starts) == 0:
        return {"recall": 0.0, "precision": 0.0, "n_det": len(det), "n_seg": len(seg_starts)}
    d1 = np.min(np.abs(det[:, None] - seg_starts[None, :]), axis=1)
    recall = float(np.mean(d1 <= tol))
    lo, hi = det.min() - 0.5, det.max() + 0.5
    inrange = seg_starts[(seg_starts >= lo) & (seg_starts <= hi)]
    d2 = np.min(np.abs(inrange[:, None] - det[None, :]), axis=1) if len(inrange) else np.array([])
    precision = float(np.mean(d2 <= tol)) if len(d2) else 0.0
    return {"recall": round(recall, 3), "precision": round(precision, 3),
            "n_det": int(len(det)), "n_seg_in_range": int(len(inrange)), "n_seg": int(len(seg_starts)),
            "median_abs_ms": round(float(np.median(d1) * 1000), 1)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("case_id")
    ap.add_argument("--tol-ms", type=float, default=50.0)
    ap.add_argument("--out", default="")
    args = ap.parse_args()

    case = local_case(CASES_DIR / args.case_id)
    y, sr = load_audio(str(case / "recording.wav"))
    fmin_note, fmax_note = A.INSTRUMENT_PITCH_RANGE["violin"]
    fmin, fmax = librosa.note_to_hz(fmin_note), librosa.note_to_hz(fmax_note)

    print(f"[1/2] 楽譜なしで塊を切る ({len(y)/sr:.1f}s)", flush=True)
    segs, counts = segment(y, sr, fmin, fmax)
    print(f"  候補: {counts}  → 塊 {len(segs)} 個", flush=True)

    print("[2/2] いまの方式の検出結果と突き合わせ", flush=True)
    res = analyze_case(case)
    ok = [r for r in res["results"] if r["evaluation_status"] in ("evaluated", "pitch_only")
          and r.get("detected_start_sec") is not None]
    det_starts = [float(r["detected_start_sec"]) for r in ok]
    cmp = compare(segs, det_starts, args.tol_ms / 1000.0)
    print(f"  いまの方式が見つけた音: {cmp['n_det']} / 塊 (同じ範囲内): {cmp.get('n_seg_in_range')}")
    print(f"  再現率 (見つけた出だしの ±{args.tol_ms:.0f}ms に塊の境目がある): {cmp['recall']:.1%}")
    print(f"  適合率 (塊の境目の ±{args.tol_ms:.0f}ms に見つけた出だしがある): {cmp['precision']:.1%}")
    print(f"  出だし→最寄りの境目 の中央値: {cmp.get('median_abs_ms')} ms")

    # いまの方式が見つけられなかった区間に、塊は何を見つけたか
    nd = [r for r in res["results"] if r["evaluation_status"] == "not_detected"]
    print(f"  いまの方式が「検出できず」: {len(nd)} 音")
    if nd and segs:
        gs = res["summary"]["global_shift"]
        shown = 0
        for r in nd[:200]:
            exp_t = float(r["expected_start_sec"]) if r.get("expected_start_sec") is not None else None
            if exp_t is None:
                continue
            near = [s for s in segs if abs(s[0] - exp_t) <= 0.3]
            if near and shown < 12:
                s = min(near, key=lambda s: abs(s[0] - exp_t))
                c = 1200.0 * np.log2(s[2] / float(r["expected_pitch_hz"])) if r.get("expected_pitch_hz") else float("nan")
                print(f"    #{r['note_index']:>3} {r.get('note_name','')!s:4} 期待 {exp_t:6.2f}s → 塊 {s[0]:6.2f}s "
                      f"{librosa.hz_to_note(s[2])} ({c:+.0f}c) 長さ {s[1]-s[0]:.2f}s")
                shown += 1
        if shown == 0:
            print("    (期待位置 ±0.3s に塊なし)")

    if args.out:
        pathlib.Path(args.out).write_text(json.dumps({
            "case": args.case_id, "counts": counts, "compare": cmp,
            "segments": [{"start": s, "end": e, "hz": hz, "note": librosa.hz_to_note(hz), "frames": n}
                         for s, e, hz, n in segs]}, ensure_ascii=False, indent=2), encoding="utf-8")
        print("wrote", args.out)


if __name__ == "__main__":
    main()
