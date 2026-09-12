"""
undetected_probe.py — 「検出できず」の中身を3つに分ける可能性の調査

いまの解析器は、楽譜の音が見つからないと一律 not_detected にする。その中には
  1. 本当に弾いていない (飛ばした・止まった)
  2. 弾いたが、楽譜と違う音だった
  3. 楽譜通りに弾いたが、解析器が拾えなかった
が混ざる。解析器を変えずに、各 not_detected 音の「あるべき区間」の音声を直接見て、
どれかを判別できるかを数字にする。

判別の材料 (楽譜の高さは使わない・音声だけ):
  - 鳴っていたか: pYIN の有声率と音量 (RMS)
  - 何が鳴っていたか: 有声フレームの高さの中央値 → 楽譜の高さとのセント差
  - 隣の音の続きか: 中央値が前後の音の楽譜の高さに近いか

Usage:
  python tests/audit/undetected_probe.py <case_id> [--out x.json]
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
HOP, FRAME = A.HOP_LENGTH, A.FRAME_LENGTH

PAD_SEC = 0.10          # あるべき区間の前後に見る余裕
VOICED_PROB = 0.5
SILENT_VOICED_RATIO = 0.25   # これ未満なら「鳴っていない」
RMS_SILENT_MULT = 2.0        # ノイズフロアの何倍未満なら無音扱い
NEAR_CENTS = 200             # これ以内なら「楽譜の高さで鳴っていた」= 見逃し
NEIGHBOR_CENTS = 60          # 前後の音の高さにこれ以内なら「隣の音の続き」


SHIFT_RANGE = 6   # 前後この音数以内の楽譜の音に一致すれば「ずれ」(演奏者が別の場所にいる)


def classify(voiced_ratio, rms_ratio, cents, cents_prev, cents_next, cents_around=()):
    if voiced_ratio < SILENT_VOICED_RATIO or rms_ratio < RMS_SILENT_MULT:
        return "1_not_played"
    if cents is None:
        return "1_not_played"
    if abs(cents) <= NEAR_CENTS:
        return "3_missed"
    if (cents_prev is not None and abs(cents_prev) <= NEIGHBOR_CENTS) or \
       (cents_next is not None and abs(cents_next) <= NEIGHBOR_CENTS):
        return "3b_merged_with_neighbor"
    # 2 と「ずれ」の区別: 聞こえた高さが前後 SHIFT_RANGE 音以内の楽譜の音に一致するか
    if any(c is not None and abs(c) <= NEIGHBOR_CENTS for c in cents_around):
        return "4_misaligned"
    return "2_wrong_note"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("case_id")
    ap.add_argument("--out", default="")
    ap.add_argument("--show", type=int, default=15)
    args = ap.parse_args()

    case = local_case(CASES_DIR / args.case_id)
    y, sr = load_audio(str(case / "recording.wav"))
    fmin_note, fmax_note = A.INSTRUMENT_PITCH_RANGE["violin"]
    fmin, fmax = librosa.note_to_hz(fmin_note), librosa.note_to_hz(fmax_note)

    print(f"[1/3] 本番経路で解析 ({len(y)/sr:.1f}s)", flush=True)
    res = analyze_case(case)
    gs = float(res["summary"]["global_shift"])
    results = res["results"]
    nd = [r for r in results if r["evaluation_status"] == "not_detected"]
    print(f"  {len(results)} 音中 not_detected {len(nd)} 音", flush=True)

    print("[2/3] pYIN で有声率と高さ", flush=True)
    f0, vflag, vprob = librosa.pyin(y, fmin=fmin, fmax=fmax, sr=sr, frame_length=FRAME, hop_length=HOP)
    t = librosa.frames_to_time(np.arange(len(f0)), sr=sr, hop_length=HOP)
    rms = librosa.feature.rms(y=y, frame_length=FRAME, hop_length=HOP)[0]
    voiced = (vprob >= VOICED_PROB) & ~np.isnan(f0)
    # ノイズフロア: 音量の下位10%の中央値
    floor = float(np.median(np.sort(rms)[: max(1, len(rms) // 10)])) or 1e-6
    end_of_audio = float(t[-1])

    by_index = {int(r["note_index"]): r for r in results}
    order = [int(r["note_index"]) for r in results]

    print("[3/3] 各 not_detected 音のあるべき区間を見る", flush=True)
    rows = []
    for r in nd:
        ni = int(r["note_index"])
        es = r.get("expected_start_sec"); ee = r.get("expected_end_sec")
        if es is None or ee is None:
            continue
        s, e = float(es) - PAD_SEC, float(ee) + PAD_SEC
        if s >= end_of_audio:
            rows.append({"note_index": ni, "note": r.get("note_name"), "cls": "0_after_recording_end",
                         "expected_start": round(float(es), 2)})
            continue
        m = (t >= s) & (t <= e)
        if m.sum() == 0:
            continue
        vr = float(voiced[m].mean())
        rr = float(np.median(rms[m])) / floor
        vf = f0[m & voiced]
        hz = float(np.median(vf)) if len(vf) else None
        exp_hz = r.get("expected_pitch_hz")
        cents = 1200 * np.log2(hz / exp_hz) if (hz and exp_hz) else None
        pos = order.index(ni)
        prev_r = by_index.get(order[pos - 1]) if pos > 0 else None
        next_r = by_index.get(order[pos + 1]) if pos + 1 < len(order) else None
        cp = 1200 * np.log2(hz / prev_r["expected_pitch_hz"]) if (hz and prev_r and prev_r.get("expected_pitch_hz")) else None
        cn = 1200 * np.log2(hz / next_r["expected_pitch_hz"]) if (hz and next_r and next_r.get("expected_pitch_hz")) else None
        around = []
        for k in range(-SHIFT_RANGE, SHIFT_RANGE + 1):
            if k in (-1, 0, 1) or not (0 <= pos + k < len(order)):
                continue
            rr_ = by_index.get(order[pos + k])
            eh = rr_.get("expected_pitch_hz") if rr_ else None
            around.append(1200 * np.log2(hz / eh) if (hz and eh) else None)
        cls = classify(vr, rr, cents, cp, cn, around)
        rows.append({"note_index": ni, "note": r.get("note_name"), "cls": cls,
                     "expected_start": round(float(es), 2), "voiced_ratio": round(vr, 2),
                     "rms_x_floor": round(rr, 1), "heard": librosa.hz_to_note(hz) if hz else None,
                     "cents_vs_expected": round(float(cents), 0) if cents is not None else None,
                     "cents_vs_prev": round(float(cp), 0) if cp is not None else None,
                     "cents_vs_next": round(float(cn), 0) if cn is not None else None})

    from collections import Counter
    c = Counter(x["cls"] for x in rows)
    print("\n内訳:")
    for k in sorted(c):
        print(f"  {k:28} {c[k]:>4}")
    print(f"\n例 (先頭 {args.show} 件・録音終了後は除く):")
    shown = 0
    for x in rows:
        if x["cls"].startswith("0_") or shown >= args.show:
            continue
        print(f"  #{x['note_index']:>3} {str(x['note']):4} {x['expected_start']:6.2f}s  {x['cls']:24} "
              f"有声{x['voiced_ratio']:.2f} 音量x{x['rms_x_floor']:.0f}  聞こえた={x['heard']} "
              f"({x['cents_vs_expected']:+.0f}c)  前{x['cents_vs_prev']} 次{x['cents_vs_next']}"
              if x.get("heard") else
              f"  #{x['note_index']:>3} {str(x['note']):4} {x['expected_start']:6.2f}s  {x['cls']:24} "
              f"有声{x['voiced_ratio']:.2f} 音量x{x['rms_x_floor']:.0f}  (無音)")
        shown += 1

    if args.out:
        pathlib.Path(args.out).write_text(json.dumps({"case": args.case_id, "counts": dict(c), "rows": rows},
                                                     ensure_ascii=False, indent=2), encoding="utf-8")
        print("wrote", args.out)


if __name__ == "__main__":
    main()
