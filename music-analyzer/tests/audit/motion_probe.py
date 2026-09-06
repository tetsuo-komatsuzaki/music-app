"""
motion_probe.py — 「音の中で動く音程」を解析器がどう報告するかを測る

仮説: 1音の音程を中央80%の中央値1つで表すため、出だしが低くて途中で直す
      ような癖は潰れて「合っている」と報告される。

合成音 (倍音つき) に既知の音程軌道を与え、本番と同じ _try_match_at を通して
報告されるセント値と、先生が耳で言うであろう内容 (最初の30%で何セント外れて
いたか等) を並べる。演奏録音は不要。
"""

import json
import pathlib
import sys
import warnings
warnings.filterwarnings("ignore")

import numpy as np
import librosa

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import _load_analyzer  # noqa: E402
from pitch_probe import compute_f0, gated_valid  # noqa: E402

_A = _load_analyzer.load()
_try_match_at = _A._try_match_at
TOL = _A.PITCH_TOLERANCE_CENTS

SR = 44100
BASE_HZ = 440.0
PAD = 1.0          # 前後の無音
AMP = 0.3


def synth(dur, cents_of_t, sr=SR):
    """cents_of_t(u) : u∈[0,1] → セント偏差。倍音6本の音を位相積分で合成。"""
    n = int(dur * sr)
    u = np.linspace(0.0, 1.0, n, endpoint=False)
    dev = np.array([cents_of_t(x) for x in u])
    hz = BASE_HZ * 2.0 ** (dev / 1200.0)
    phase = 2 * np.pi * np.cumsum(hz) / sr
    y = np.zeros(n)
    for k in range(1, 7):
        y += (1.0 / k) * np.sin(k * phase)
    y *= AMP / np.max(np.abs(y))
    # 立ち上がり/減衰 20ms
    r = int(0.02 * sr)
    env = np.ones(n); env[:r] = np.linspace(0, 1, r); env[-r:] = np.linspace(1, 0, r)
    y *= env
    pad = np.zeros(int(PAD * sr))
    out = np.concatenate([pad, y, pad]).astype(np.float32)
    out += (np.random.default_rng(0).standard_normal(len(out)) * 1e-4).astype(np.float32)
    return out, dev


def human_view(dev):
    """先生が耳で言いそうな要約。"""
    n = len(dev)
    head = dev[: int(n * 0.3)]
    return {
        "head30_mean": round(float(head.mean()), 1),
        "head30_extreme": round(float(head[np.argmax(np.abs(head))]), 1),
        "whole_mean": round(float(dev.mean()), 1),
        "frac_over_25c": round(float(np.mean(np.abs(dev) > 25)), 2),
        "frac_over_50c": round(float(np.mean(np.abs(dev) > 50)), 2),
    }


PROFILES = {
    "static_0":        lambda u: 0.0,
    "static_+30":      lambda u: 30.0,
    "static_+60":      lambda u: 60.0,
    "scoop_-40_fix40%": lambda u: -40.0 * max(0.0, 1 - u / 0.4),
    "scoop_-80_fix40%": lambda u: -80.0 * max(0.0, 1 - u / 0.4),
    "late_fix_-40_60%": lambda u: -40.0 if u < 0.6 else 0.0,
    "overshoot_+40_fix40%": lambda u: 40.0 * max(0.0, 1 - u / 0.4),
    "slide_-100_in30%": lambda u: -100.0 * max(0.0, 1 - u / 0.3),
    "drift_0_to_+40":  lambda u: 40.0 * u,
    "drift_0_to_+80":  lambda u: 80.0 * u,
    "vibrato_±30_6Hz": lambda u: 30.0 * np.sin(2 * np.pi * 6 * u * DUR_HOLDER[0]),
    "vibrato_±60_6Hz": lambda u: 60.0 * np.sin(2 * np.pi * 6 * u * DUR_HOLDER[0]),
    "wobble_end_+50":  lambda u: 0.0 if u < 0.8 else 50.0,
}
DUR_HOLDER = [0.667]


def run(dur):
    DUR_HOLDER[0] = dur
    rows = []
    for name, f in PROFILES.items():
        y, dev = synth(dur, f)
        f0, rms, t = compute_f0(y, SR, librosa.note_to_hz("G3"), librosa.note_to_hz("E7"))
        vm = gated_valid(f0, rms, t)
        res = _try_match_at(PAD, BASE_HZ, dur, t[vm], f0[vm])
        hv = human_view(dev)
        rep = None if res is None else round(float(res["pitch_cents_error"]), 1)
        conf = None if res is None else ("high" if abs(res["pitch_cents_error"]) <= TOL else "medium")
        rows.append({"dur": dur, "profile": name, "reported": rep, "confidence": conf, **hv})
        print(f"{dur:.2f}s {name:22} 報告={str(rep):>6} {str(conf):6} | "
              f"頭30%平均={hv['head30_mean']:>6} 頭30%極値={hv['head30_extreme']:>6} "
              f"全体平均={hv['whole_mean']:>5} 25c超={hv['frac_over_25c']:.0%} 50c超={hv['frac_over_50c']:.0%}",
              flush=True)
    return rows


if __name__ == "__main__":
    out = []
    for d in (0.333, 0.667, 1.333):
        out += run(d)
        print()
    if len(sys.argv) > 1:
        pathlib.Path(sys.argv[1]).write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
        print("wrote", sys.argv[1])
