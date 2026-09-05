"""小節番号の正規化 (カイザー No.6 の 66.1 → 661 問題)。"""
from music21 import converter, stream

from lib.measure_number import normalize_measure_numbers, parse_measure_number_attr

_XML = """<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1"><part-list><score-part id="P1"><part-name>V</part-name></score-part></part-list>
<part id="P1">
<measure number="0" implicit="yes"><attributes><divisions>1</divisions><time><beats>2</beats><beat-type>4</beat-type></time></attributes>
  <note><pitch><step>G</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note></measure>
<measure number="1"><note><pitch><step>A</step><octave>4</octave></pitch><duration>2</duration><type>half</type></note></measure>
<measure number="2"><note><pitch><step>B</step><octave>4</octave></pitch><duration>2</duration><type>half</type></note></measure>
<measure number="2.1"><note><pitch><step>C</step><octave>5</octave></pitch><duration>1</duration><type>quarter</type></note></measure>
<measure number="3"><note><pitch><step>D</step><octave>5</octave></pitch><duration>2</duration><type>half</type></note></measure>
</part></score-partwise>"""


def _numbers(score):
    return [m.number for m in score.parts[0].getElementsByClass(stream.Measure)]


def test_music21_reads_dotted_number_as_concatenated_int():
    """前提の確認: music21 は "2.1" を 21 (接尾辞 ".") と読む。No.6 では 66.1 → 661。"""
    s = converter.parse(_XML, format="musicxml")
    assert _numbers(s) == [0, 1, 2, 21, 3]


def test_normalize_gives_split_measure_the_previous_number():
    s = converter.parse(_XML, format="musicxml")
    changed = normalize_measure_numbers(s)
    assert changed == 1
    assert _numbers(s) == [0, 1, 2, 2, 3]
    assert all(not m.numberSuffix for m in s.parts[0].getElementsByClass(stream.Measure))


def test_normalize_is_idempotent_and_keeps_pickup_zero():
    s = converter.parse(_XML, format="musicxml")
    normalize_measure_numbers(s)
    assert normalize_measure_numbers(s) == 0
    assert _numbers(s)[0] == 0


def test_measures_range_now_includes_split_measure():
    """パート切り出し measures(from, to) に割られた小節も含まれる (Part3 の最後の和音が欠けない)。"""
    s = converter.parse(_XML, format="musicxml")
    normalize_measure_numbers(s)
    cut = s.measures(2, 3)
    notes = [n.nameWithOctave for n in cut.recurse().notes]
    assert notes == ["B4", "C5", "D5"]


def test_parse_attr():
    assert parse_measure_number_attr("66", None) == 66
    assert parse_measure_number_attr("66.1", 66) == 66
    assert parse_measure_number_attr(" 7 ", 3) == 7
    assert parse_measure_number_attr("X1", 12) == 12
    assert parse_measure_number_attr("X1", None) is None
    assert parse_measure_number_attr(None, 4) == 4
