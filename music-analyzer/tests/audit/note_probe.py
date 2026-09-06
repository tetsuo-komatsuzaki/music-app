"""
note_probe.py — 音符単位で「アプリが報告するセント誤差」の応答を測る

pitch_probe.py がフレーム単位の f0 を見るのに対し、こちらは本番と同じ
_try_match_at (中央80%の中央値) を通した後の値、つまりユーザーが実際に
見る数字の応答を測る。

真値の作り方:
  元録音でアプリが報告した値 base[i] に、既知のシフト量 c を足したもの。
  演奏者の音程が完璧でなくても、「c だけ動かしたら報告も c だけ動くべき」
  という関係は厳密に成り立つ。

Usage:
  python tests/audit/note_probe.py <case_dir> [--cents ...] [--out x.json]
"""

import argparse
import json
import pathlib
import sys
import warnings
warnings.filterwarnings("ignore")

import numpy as np
import librosa

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import _load_analyzer  # noqa: E402
from pitch_probe import compute_f0, gated_valid
from _cache import load_audio, local_case  # noqa: E402

_A = _load_analyzer.load()
_try_match_at = _A._try_match_at
PITCH_TOLERANCE_CENTS = _A.PITCH_TOLERANCE_CENTS
INSTRUMENT_PITCH_RANGE = _A.INSTRUMENT_PITCH_RANGE

DEFAULT_CENTS = [-60, -40, -20, -10, 0, 10, 20, 40, 60]


def load_notes(case_dir: pathlib.Path):
    d = json.loads((case_dir / "comparison_result.json").read_text(encoding="utf-8"))
    notes = []
    for r in d["results"]:
        if r.get("expected_pitch_hz") and r.get("expected_start_sec") is not None:
            notes.append({
                "note_index": r["note_index"],
                "note_name": r.get("note_name"),
                "start": float(r["expected_start_sec"]),
                "dur": float(r["expected_end_sec"]) - float(r["expected_start_sec"]),
                "hz": float(r["expected_pitch_hz"]),
                "old_cents": r.get("pitch_cents_error"),
            })
    return notes


def report_notes(notes, valid_time, valid_f0):
    out = []
    for n in notes:
        res = _try_match_at(n["start"], n["hz"], n["dur"], valid_time, valid_f0)
        out.append(None if res is None else float(res["pitch_cents_error"]))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("case_dir")
    ap.add_argument("--cents", type=str, default="")
    ap.add_argument("--instrument", default="violin")
    ap.add_argument("--out", default="")
    args = ap.parse_args()
    case_dir = local_case(pathlib.Path(args.case_dir))
    cents_list = ([int(x) for x in args.cents.split(",")] if args.cents
                  else DEFAULT_CENTS)

    fmin_note, fmax_note = INSTRUMENT_PITCH_RANGE.get(args.instrument, ("G3", "E6"))
    fmin, fmax = librosa.note_to_hz(fmin_note), librosa.note_to_hz(fmax_note)

    notes = load_notes(case_dir)
    y, sr = load_audio(str(case_dir / "recording.wav"))
    print(f"case {case_dir.name}: {len(notes)} notes, audio {len(y)/sr:.1f}s", flush=True)

    f0, rms, t = compute_f0(y, sr, fmin, fmax)
    vm = gated_valid(f0, rms, t)
    base = report_notes(notes, t[vm], f0[vm])
    n_base = sum(v is not None for v in base)
    print(f"base: {n_base}/{len(notes)} notes matched", flush=True)

    rows = []
    for c in cents_list:
        y_s = librosa.effects.pitch_shift(y, sr=sr, n_steps=float(c), bins_per_octave=1200)
        f0s, rmss, ts = compute_f0(y_s, sr, fmin, fmax)
        vms = gated_valid(f0s, rmss, ts)
        rep = report_notes(notes, ts[vms], f0s[vms])

        errs, lost, flips = [], 0, {"should_fail_but_pass": 0, "should_pass_but_fail": 0}
        for b, r in zip(base, rep):
            if b is None:
                continue
            truth = b + c
            if r is None:
                lost += 1
                continue
            errs.append(r - truth)
            # 合否ラインの検査: 真値で ±50c を跨ぐか vs 報告値で跨ぐか
            truth_pass = abs(truth) <= PITCH_TOLERANCE_CENTS
            rep_pass = abs(r) <= PITCH_TOLERANCE_CENTS
            if not truth_pass and rep_pass:
                flips["should_fail_but_pass"] += 1
            if truth_pass and not rep_pass:
                flips["should_pass_but_fail"] += 1
        errs = np.array(errs) if errs else np.array([0.0])
        rows.append({
            "truth_cents": c, "compared": int(len(errs)), "lost": lost,
            "err_median": round(float(np.median(errs)), 2),
            "err_p95_abs": round(float(np.percentile(np.abs(errs), 95)), 2),
            "err_max_abs": round(float(np.max(np.abs(errs))), 2),
            "within_5c": round(float(np.mean(np.abs(errs) <= 5.0)), 3),
            **flips,
        })
        r_ = rows[-1]
        print(f"{c:>5}c  compared={r_['compared']:>3} lost={lost:>2}  "
              f"err_med={r_['err_median']:>6.2f}  |err|p95={r_['err_p95_abs']:>6.2f}  "
              f"max={r_['err_max_abs']:>6.2f}  ±5c={r_['within_5c']:.1%}  "
              f"誤合格={flips['should_fail_but_pass']} 誤不合格={flips['should_pass_but_fail']}",
              flush=True)

    if args.out:
        pathlib.Path(args.out).write_text(json.dumps({
            "case": case_dir.name, "notes": len(notes), "base_matched": n_base,
            "base_cents": base, "rows": rows}, ensure_ascii=False, indent=2),
            encoding="utf-8")
        print(f"wrote {args.out}")


if __name__ == "__main__":
    main()
