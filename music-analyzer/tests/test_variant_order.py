"""パート教材の変換順序 (2026-09-01 Tetsuo指摘)。

除外小節 (skipHead/skipTail/skipMeasures) と単位の位相は「元教材の小節番号」で
決まる指定。範囲切り出しを先にやると残った範囲の1小節目から数え直してしまい、
パート教材だけ通しと違う譜面になる。カイザーNo.2・スタッカート (除外=先頭16/末尾6) の
Part2 (17-28小節) は本来17-22にスタッカートが付くのに1つも付かなかった。

ここでは「通しに適用したものを切り出した結果」と一致することを担保する。
"""
import ast
import io
import os
import sys

import pytest
from music21 import articulations as m21art
from music21 import note as m21note
from music21 import stream

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from lib.difficulty_variant import apply_variant_recipe  # noqa: E402

_ROOT = os.path.join(os.path.dirname(__file__), "..")


def _load_apply_articulation():
    """analyze_musicxml.py は import 時に引数を要求するスクリプトなので、
    必要な関数と定数だけを取り出して評価する。"""
    src = io.open(os.path.join(_ROOT, "analyze_musicxml.py"), encoding="utf-8").read()
    ns: dict = {}
    exec("from music21 import articulations, expressions, spanner, stream", ns)
    for node in ast.parse(src).body:
        if isinstance(node, ast.Assign) and any(getattr(t, "id", "") == "_ART_CLS" for t in node.targets):
            exec(compile(ast.Module([node], []), "<x>", "exec"), ns)
        if isinstance(node, ast.FunctionDef) and node.name in {"_apply_art_to_note", "_slur_bow_staccato_runs", "apply_articulation_variant"}:
            exec(compile(ast.Module([node], []), "<x>", "exec"), ns)
    return ns["apply_articulation_variant"]


def _score(n_measures: int, notes_per_measure: int = 8) -> stream.Score:
    sc = stream.Score()
    part = stream.Part()
    for i in range(1, n_measures + 1):
        meas = stream.Measure(number=i)
        for _ in range(notes_per_measure):
            meas.append(m21note.Note("C4", quarterLength=0.5))
        part.append(meas)
    sc.append(part)
    return sc


def _staccato_per_measure(sc: stream.Score) -> list[int]:
    return [
        sum(1 for n in m.notes for a in n.articulations if isinstance(a, m21art.Staccato))
        for m in sc.parts[0].getElementsByClass(stream.Measure)
    ]


PATTERN = {
    "articulationPattern": {
        "type": "per_note",
        "unitMeasures": 1,
        "skipHead": 16,
        "skipTail": 6,
        "assignments": [{"noteIndex": i, "articulation": "staccato"} for i in range(8)],
    }
}
RANGE = {"rules": [{"type": "measure_range", "from": 17, "to": 28}]}


def test_通しは除外小節のとおりに付く():
    apply_art = _load_apply_articulation()
    sc = apply_art(_score(28), PATTERN)
    assert _staccato_per_measure(sc) == [0] * 16 + [8] * 6 + [0] * 6


def test_パートは通しを切り出したものと一致する():
    """奏法 → 切り出し の順。逆にすると Part2 が全部0になる (2026-09-01 の不具合)。"""
    apply_art = _load_apply_articulation()
    full = apply_art(_score(28), PATTERN)
    expected = _staccato_per_measure(full)[16:28]

    good = apply_variant_recipe(apply_art(_score(28), PATTERN), RANGE)
    assert _staccato_per_measure(good) == expected
    assert expected[:6] == [8] * 6  # 17-22小節ぶんが残っていること

    bad = apply_art(apply_variant_recipe(_score(28), RANGE), PATTERN)
    assert _staccato_per_measure(bad) != expected  # 旧順序は一致しない (退行検知の記録)


def test_解析本体も奏法リズムのあとで切り出している():
    """analyze_musicxml.py の適用順そのものを固定する。"""
    src = io.open(os.path.join(_ROOT, "analyze_musicxml.py"), encoding="utf-8").read()
    body = src[src.index("if IS_PRACTICE_ITEM:"):src.index("    else:\n        # 曲の難易度変種")]
    i_art = body.index("apply_articulation_variant(score, pi_metadata)")
    i_rhythm = body.index("apply_rhythm_recipe(score, rhythm_recipe)")
    i_range = body.index("apply_variant_recipe(score, score_variant_recipe)")
    assert i_range > i_art, "範囲切り出しは奏法のあとで行うこと"
    assert i_range > i_rhythm, "範囲切り出しはリズムのあとで行うこと"
