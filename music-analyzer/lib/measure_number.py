"""measure_number.py — 楽譜の小節番号を「1つの整数」にそろえる (2026-09-05)。

【きっかけ】カイザー No.6 の総小節数が 661 と表示された (Tetsuo報告)。
原譜 MusicXML の最終小節が number="66.1" (途中の縦線で割られた小節の続き) で、
music21 はこれを number=661・numberSuffix="." と読む。解析は int(measure.number) を
そのまま使っていたため、小節 661 が生まれ、ダイアログの「全N小節」は最大値の 661 になった。
パート教材の切り出し (measures(from, to)) からもこの小節が漏れ、Part3 の最後の和音が欠けていた。

【規則】番号に接尾辞が付く小節 (66.1 / X1 など) は「直前の小節の続き」とみなし、直前の番号を与える。
  - 66.1 → 66 (割られた小節の後半)
  - X1 (MuseScore の「小節数に数えない」小節) → 直前の番号 (先頭なら 0 = 弱起扱い)
  - 接尾辞なしの整数はそのまま (弱起の 0 も含む)
"""
from __future__ import annotations

import re

_SPLIT_RE = re.compile(r"^\s*(\d+)\s*\.\s*\d+\s*$")   # "66.1"
_INT_RE = re.compile(r"^\s*(-?\d+)\s*$")


def parse_measure_number_attr(raw: str | None, prev: int | None) -> int | None:
    """MusicXML の number 属性 (文字列) を整数の小節番号にする。
    整数ならそのまま、"66.1" は 66、それ以外 ("X1" など) は直前の番号 (無ければ None)。"""
    if raw is None:
        return prev
    m = _INT_RE.match(raw)
    if m:
        return int(m.group(1))
    m = _SPLIT_RE.match(raw)
    if m:
        return int(m.group(1))
    return prev


def normalize_measure_numbers(score) -> int:
    """music21 の Score/Part の全小節について、接尾辞付きの番号を直前の小節の番号にそろえる。
    書き換えた小節の数を返す。パートごとに独立に走る。"""
    from music21 import stream

    parts = list(score.parts) if hasattr(score, "parts") and len(getattr(score, "parts", [])) else [score]
    changed = 0
    for part in parts:
        prev: int | None = None
        for meas in part.getElementsByClass(stream.Measure):
            suffix = getattr(meas, "numberSuffix", None)
            if suffix:
                fixed = prev if prev is not None else 0
                if meas.number != fixed:
                    changed += 1
                meas.number = fixed
                meas.numberSuffix = None
            prev = int(meas.number) if meas.number is not None else prev
    return changed
