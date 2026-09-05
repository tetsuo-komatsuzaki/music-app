"""連続スタッカート (サルタート・2026-09-05 Tetsuo): 選んだ音符はすべてスラーでつながり、スタッカートの点が付く。"""
import os
import sys

from music21 import articulations as m21art
from music21 import note as m21note
from music21 import stream

sys.path.insert(0, os.path.dirname(__file__))
from test_variant_order import _load_apply_articulation


def _score(n_measures: int, notes_per_measure: int = 4) -> stream.Score:
    sc = stream.Score()
    part = stream.Part()
    for i in range(1, n_measures + 1):
        meas = stream.Measure(number=i)
        for _ in range(notes_per_measure):
            meas.append(m21note.Note("D4", quarterLength=1.0))
        part.append(meas)
    sc.append(part)
    return sc


def _slurs(sc):
    return list(sc.parts[0].spannerBundle.getByClass("Slur"))


def _staccato_notes(sc):
    return [n for n in sc.recurse().notes if any(isinstance(a, m21art.Staccato) for a in n.articulations)]


def test_uniform_saltato_slurs_each_measure_and_dots_every_note():
    apply = _load_apply_articulation()
    sc = apply(_score(3), {"articulationPattern": {"type": "uniform", "articulation": "bow_staccato"}})
    assert len(_staccato_notes(sc)) == 12                       # 全音に点
    slurs = _slurs(sc)
    assert len(slurs) == 3                                       # 小節ごとに1本
    assert all(len(sl.getSpannedElements()) == 4 for sl in slurs)


def test_per_note_saltato_connects_consecutive_assigned_notes_only():
    apply = _load_apply_articulation()
    # 単位2小節 (8音): 0〜2 サルタート, 3 スタッカート, 4〜5 サルタート, 6〜7 なし
    pat = {"articulationPattern": {"type": "per_note", "unitMeasures": 2, "assignments": [
        {"noteIndex": 0, "articulation": "bow_staccato"}, {"noteIndex": 1, "articulation": "bow_staccato"}, {"noteIndex": 2, "articulation": "bow_staccato"},
        {"noteIndex": 3, "articulation": "staccato"},
        {"noteIndex": 4, "articulation": "bow_staccato"}, {"noteIndex": 5, "articulation": "bow_staccato"},
    ]}}
    sc = apply(_score(4), pat)
    slurs = _slurs(sc)
    assert sorted(len(sl.getSpannedElements()) for sl in slurs) == [2, 2, 3, 3]   # 単位2回 × (3音の並び + 2音の並び)
    assert len(_staccato_notes(sc)) == 12                                          # 点は 6音 × 2単位 (サルタート5 + スタッカート1)


def test_single_saltato_note_gets_dot_but_no_slur():
    apply = _load_apply_articulation()
    pat = {"articulationPattern": {"type": "per_note", "unitMeasures": 1, "assignments": [{"noteIndex": 1, "articulation": "bow_staccato"}]}}
    sc = apply(_score(2), pat)
    assert len(_staccato_notes(sc)) == 2
    assert _slurs(sc) == []
