"""
pitch_probe.py — 音程検出の応答を既知量で測る

録音を既知のセント量だけピッチシフトし、解析器と同じ設定で f0 を取り直して
「報告されるべき量」と「実際に測れる量」を突き合わせる。

正解が人の耳ではなく数式で決まるので、演奏を待たずに検出精度を測れる。

Usage:
  python tests/audit/pitch_probe.py <recording.wav> [--seconds 30] [--cents -60,-40,...]
"""

import argparse
import json
import warnings
warnings.filterwarnings("ignore")
import pathlib
import sys

import numpy as np
import librosa

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import _load_analyzer  # noqa: E402
from _cache import load_audio  # noqa: E402

_A = _load_analyzer.load()
HOP_LENGTH = _A.HOP_LENGTH
FRAME_LENGTH = _A.FRAME_LENGTH
RMS_THRESHOLD = _A.RMS_THRESHOLD
INSTRUMENT_PITCH_RANGE = _A.INSTRUMENT_PITCH_RANGE
apply_noise_gate = _A.apply_noise_gate

DEFAULT_CENTS = [-60, -40, -20, -10, -5, 0, 5, 10, 20, 40, 60]


def compute_f0(y, sr, fmin, fmax):
    """analyze_performance と同じ設定で f0 / rms / time を出す。"""
    f0 = np.array(librosa.yin(y, fmin=fmin, fmax=fmax, sr=sr,
                              frame_length=FRAME_LENGTH, hop_length=HOP_LENGTH))
    rms = np.array(librosa.feature.rms(y=y, frame_length=FRAME_LENGTH,
                                       hop_length=HOP_LENGTH)[0])
    time_all = np.array(librosa.frames_to_time(np.arange(len(f0)), sr=sr,
                                               hop_length=HOP_LENGTH))
    return f0, rms, time_all


def first_sound_time_of(f0, rms, time_all, min_sustain=15):
    """analyze_performance の「最初の音」判定をそのまま写す。"""
    pitched_loud = (rms > RMS_THRESHOLD * 2) & (~np.isnan(f0[:len(rms)]))
    run = 0
    for idx in range(len(pitched_loud)):
        if pitched_loud[idx]:
            run += 1
            if run >= min_sustain:
                return float(time_all[idx - min_sustain + 1])
        else:
            run = 0
    loud_idx = np.where(rms > RMS_THRESHOLD * 2)[0]
    return float(time_all[loud_idx[0]]) if len(loud_idx) else 0.0


def gated_valid(f0, rms, time_all):
    """ノイズゲート後の有効フレーム mask。本番と同じ経路。"""
    fst = first_sound_time_of(f0, rms, time_all)
    gate_mask = apply_noise_gate(rms, time_all, f0, fst, 0.0)
    return (~np.isnan(f0)) & gate_mask


def probe(y, sr, cents_list, fmin, fmax):
    base_f0, base_rms, base_t = compute_f0(y, sr, fmin, fmax)
    base_valid = gated_valid(base_f0, base_rms, base_t)
    rows = []
    for c in cents_list:
        if c == 0:
            y_s = librosa.effects.pitch_shift(y, sr=sr, n_steps=0.0,
                                              bins_per_octave=1200)
        else:
            y_s = librosa.effects.pitch_shift(y, sr=sr, n_steps=float(c),
                                              bins_per_octave=1200)
        f0_s, rms_s, t_s = compute_f0(y_s, sr, fmin, fmax)
        valid_s = gated_valid(f0_s, rms_s, t_s)

        n = min(len(base_f0), len(f0_s))
        both = base_valid[:n] & valid_s[:n]
        if both.sum() == 0:
            rows.append({"truth_cents": c, "frames": 0})
            continue

        measured = 1200.0 * np.log2(f0_s[:n][both] / base_f0[:n][both])
        err = measured - c
        rows.append({
            "truth_cents": c,
            "frames": int(both.sum()),
            "coverage": round(float(both.sum()) / float(base_valid[:n].sum()), 3),
            "measured_median": round(float(np.median(measured)), 2),
            "err_median": round(float(np.median(err)), 2),
            "err_p25": round(float(np.percentile(err, 25)), 2),
            "err_p75": round(float(np.percentile(err, 75)), 2),
            "err_p95_abs": round(float(np.percentile(np.abs(err), 95)), 2),
            "within_5c": round(float(np.mean(np.abs(err) <= 5.0)), 3),
            "within_10c": round(float(np.mean(np.abs(err) <= 10.0)), 3),
            # 外れ値の正体を分ける: 10〜100c は滲み/揺れ、100c 超はオクターブ級の取り違え
            "err_10_100c": round(float(np.mean((np.abs(err) > 10.0) & (np.abs(err) <= 100.0))), 3),
            "err_gt100c": round(float(np.mean(np.abs(err) > 100.0)), 3),
        })
    return rows, int(base_valid.sum()), len(base_f0)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("wav")
    ap.add_argument("--seconds", type=float, default=0.0,
                    help="先頭から何秒だけ使うか。0 なら全体")
    ap.add_argument("--offset", type=float, default=0.0)
    ap.add_argument("--cents", type=str, default="")
    ap.add_argument("--instrument", default="violin")
    ap.add_argument("--out", default="")
    args = ap.parse_args()

    cents_list = ([int(x) for x in args.cents.split(",")] if args.cents
                  else DEFAULT_CENTS)
    fmin_note, fmax_note = INSTRUMENT_PITCH_RANGE.get(args.instrument,
                                                      ("G3", "E6"))
    fmin, fmax = librosa.note_to_hz(fmin_note), librosa.note_to_hz(fmax_note)

    y, sr = load_audio(args.wav)
    if args.offset > 0:
        y = y[int(args.offset * sr):]
    if args.seconds > 0:
        y = y[:int(args.seconds * sr)]
    print(f"audio: {len(y)/sr:.1f}s @ {sr}Hz  range {fmin_note}-{fmax_note}")

    rows, valid_frames, total_frames = probe(y, sr, cents_list, fmin, fmax)
    print(f"base valid frames: {valid_frames}/{total_frames} "
          f"({valid_frames/total_frames:.1%})\n")

    hdr = (f"{'真値':>6} {'測定中央':>9} {'誤差中央':>9} {'誤差p25':>8} {'誤差p75':>8} "
           f"{'|誤差|p95':>9} {'±5c内':>7} {'±10c内':>7} {'10-100c':>8} {'>100c':>7} {'frames':>7}")
    print(hdr)
    print("-" * len(hdr))
    for r in rows:
        if r.get("frames", 0) == 0:
            print(f"{r['truth_cents']:>6} {'(比較フレームなし)':>20}")
            continue
        print(f"{r['truth_cents']:>6} {r['measured_median']:>9.2f} "
              f"{r['err_median']:>9.2f} {r['err_p25']:>8.2f} {r['err_p75']:>8.2f} "
              f"{r['err_p95_abs']:>9.2f} {r['within_5c']:>7.1%} "
              f"{r['within_10c']:>7.1%} {r['err_10_100c']:>8.1%} "
              f"{r['err_gt100c']:>7.1%} {r['frames']:>7}")

    if args.out:
        pathlib.Path(args.out).write_text(
            json.dumps({"wav": args.wav, "sr": sr,
                        "seconds": len(y) / sr, "rows": rows},
                       ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"\nwrote {args.out}")


if __name__ == "__main__":
    main()
