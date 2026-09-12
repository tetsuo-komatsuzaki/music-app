# -*- coding: utf-8 -*-
"""未検出の理由を数える (2026-09-12)。

「なぜ未検出になるのか」を、本番と同じ判定式で音符ごとに切り分けて数える。
_diag_match.py が特定のケース向けに書かれていたので、どのケースでも回せる形にした。
解析器は変更しない。読むだけ。

判定の並びは analyze_performance._try_match_at と同じ:
  1. 中央 CENTER_RATIO の区間に有効な f0 が MIN_VALID_FRAMES 以上あるか
  2. その中央値が期待音高から PITCH_SEARCH_CENTS 以内か
  3. 前後の音のほうが近くないか

期待位置そのままで見る (探索窓を動かさない)。位置合わせで救われる音は
「窓をずらせば当たる」に分類されるので、探索半径を変えて何音が救われるかも出す。

  python tests/audit/reject_probe.py tests/cases/<case_id>
"""
import collections
import json
import pathlib
import sys
import warnings

warnings.filterwarnings("ignore")
import numpy as np  # noqa: E402
import librosa  # noqa: E402

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import _load_analyzer  # noqa: E402
from pitch_probe import compute_f0, gated_valid  # noqa: E402
from _cache import load_audio, local_case  # noqa: E402
from note_probe import load_notes  # noqa: E402

A = _load_analyzer.load()


def explain(t, hz, dur, vt, vf, prev_hz=None, next_hz=None):
    """その時刻を起点にしたとき、どの条件で落ちるか"""
    margin = dur * (1.0 - A.CENTER_RATIO) / 2.0
    mask = (vt >= t + margin) & (vt <= t + dur - margin)
    cnt = int(mask.sum())
    if cnt < A.MIN_VALID_FRAMES:
        return f"音が足りない (有効f0 {cnt}/{A.MIN_VALID_FRAMES})"
    med = float(np.median(vf[mask]))
    c = float(A.cents_diff(med, hz))
    if abs(c) > A.PITCH_SEARCH_CENTS:
        return f"音高が遠い ({c:+.0f}c)"
    if abs(c) > A.PITCH_TOLERANCE_CENTS:
        if prev_hz and abs(A.cents_diff(med, prev_hz)) < abs(c):
            return "前の音のほうが近い"
        if next_hz and abs(A.cents_diff(med, next_hz)) < abs(c):
            return "次の音のほうが近い"
    return "一致"


def best_within(t0, hz, dur, vt, vf, prev_hz, next_hz, radius, step=0.02):
    """期待位置の前後 radius 秒をずらして探し、当たる時刻があるか"""
    t = t0 - radius
    while t <= t0 + radius:
        if explain(t, hz, dur, vt, vf, prev_hz, next_hz) == "一致":
            return round(t - t0, 3)
        t += step
    return None


def main() -> None:
    case = local_case(pathlib.Path(sys.argv[1]))
    notes = load_notes(case)
    y, sr = load_audio(str(case / "recording.wav"))
    fmin, fmax = librosa.note_to_hz("G3"), librosa.note_to_hz("E7")
    f0, rms, t = compute_f0(y, sr, fmin, fmax)
    vm = gated_valid(f0, rms, t)
    vt, vf = t[vm], f0[vm]

    print(f"ケース: {case.name}")
    print(f"  音符 {len(notes)} 個 ・ 有効フレーム {int(vm.sum())}/{len(vm)}")
    print(f"  設定: 中央{A.CENTER_RATIO:.0%} ・ 最低{A.MIN_VALID_FRAMES}フレーム ・ 探索±{A.PITCH_SEARCH_CENTS}c ・ 合格±{A.PITCH_TOLERANCE_CENTS}c")

    reasons = collections.Counter()
    misses = []
    for i, n in enumerate(notes):
        prev_hz = notes[i - 1]["hz"] if i > 0 else None
        next_hz = notes[i + 1]["hz"] if i + 1 < len(notes) else None
        r = explain(n["start"], n["hz"], n["dur"], vt, vf, prev_hz, next_hz)
        reasons[r.split(" (")[0]] += 1
        if r != "一致":
            misses.append((i, n, prev_hz, next_hz, r))

    print("\n【期待位置そのままで見たとき】")
    for k, v in reasons.most_common():
        print(f"  {k.ljust(22)} {v:>4}音  {v / len(notes):.0%}")

    # 窓をずらせば当たるか = 位置合わせで救える音
    print("\n【外れた音を、前後にずらして探したとき】")
    saved = collections.Counter()
    for radius in (0.1, 0.3, 0.6, 1.2):
        n_ok = 0
        for _, n, prev_hz, next_hz, _ in misses:
            if best_within(n["start"], n["hz"], n["dur"], vt, vf, prev_hz, next_hz, radius) is not None:
                n_ok += 1
        saved[radius] = n_ok
        print(f"  ±{radius:.1f}秒 まで許すと {n_ok}/{len(misses)}音 が当たる")

    # ずらしても当たらない音の内訳
    hopeless = []
    for i, n, prev_hz, next_hz, r in misses:
        if best_within(n["start"], n["hz"], n["dur"], vt, vf, prev_hz, next_hz, 1.2) is None:
            hopeless.append((i, n, r))
    print(f"\n【±1.2秒ずらしても当たらない音 ・ {len(hopeless)}音】")
    hr = collections.Counter(r.split(" (")[0] for _, _, r in hopeless)
    for k, v in hr.most_common():
        print(f"  {k.ljust(22)} {v:>4}音")
    for i, n, r in hopeless[:12]:
        print(f"    #{i:>3} {n.get('note_name', '?'):5} 音価{n['dur']:.2f}秒  {r}")


if __name__ == "__main__":
    main()
