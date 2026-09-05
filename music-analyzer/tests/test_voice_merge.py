"""声部2 を 1 本にまとめる (カイザーNo.20/17/28/8/29・レジェンド・メヌエット・ガボットの小節が落ちていた件)。"""
from music21 import chord, converter, note, stream

from lib.voice_merge import merge_voices

HEAD = """<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1"><part-list><score-part id="P1"><part-name>V</part-name></score-part></part-list><part id="P1">"""
TAIL = "</part></score-partwise>"
ATTR = "<attributes><divisions>4</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes>"


def _n(step, octave, dur, voice, typ, extra=""):
    return f"<note><pitch><step>{step}</step><octave>{octave}</octave></pitch><duration>{dur}</duration><voice>{voice}</voice><type>{typ}</type>{extra}</note>"


def _r(dur, voice, typ):
    return f"<note><rest/><duration>{dur}</duration><voice>{voice}</voice><type>{typ}</type></note>"


def _parse(body):
    return converter.parse(HEAD + body + TAIL, format="musicxml")


def _flat(s):
    m = s.parts[0].getElementsByClass(stream.Measure)[0]
    return list(m.notesAndRests)


def test_before_merge_measure_direct_children_are_empty():
    s = _parse(f'<measure number="1">{ATTR}{_n("A",4,8,1,"half")}{_r(8,1,"half")}<backup><duration>16</duration></backup>{_r(8,2,"half")}{_n("D",4,8,2,"half")}</measure>')
    assert _flat(s) == []          # これが「落ちる」原因


def test_alternating_voices_become_one_line():
    """声部2 が声部1 の休符を埋める (メヌエット / No.20 の pizz)。"""
    s = _parse(f'<measure number="1">{ATTR}{_n("A",4,8,1,"half")}{_r(8,1,"half")}<backup><duration>16</duration></backup>{_r(8,2,"half")}{_n("D",4,8,2,"half")}</measure>')
    assert merge_voices(s) == 1
    els = _flat(s)
    assert [(type(e).__name__, float(e.offset), float(e.duration.quarterLength)) for e in els] == [("Note", 0.0, 2.0), ("Note", 2.0, 2.0)]
    assert [e.nameWithOctave for e in els] == ["A4", "D4"]
    m = s.parts[0].getElementsByClass(stream.Measure)[0]
    assert not list(m.voices)


def test_sustained_over_moving_becomes_tied_chords():
    """声部1 の 2 分音符の下で声部2 が 8 分で動く (レジェンド / No.17 / No.28) → 動く音ごとの重音、持続音はタイ。"""
    v2 = "".join(_n(st, 3, 2, 2, "eighth") for st in ("A", "B", "C", "D"))
    s = _parse(f'<measure number="1">{ATTR}{_n("D",4,8,1,"half")}{_r(8,1,"half")}<backup><duration>16</duration></backup>{v2}{_r(8,2,"half")}</measure>')
    merge_voices(s)
    els = _flat(s)
    assert len(els) == 5
    chords = els[:4]
    assert all(isinstance(c, chord.Chord) for c in chords)
    assert [sorted(p.nameWithOctave for p in c.pitches) for c in chords] == [["A3", "D4"], ["B3", "D4"], ["C3", "D4"], ["D3", "D4"]]
    assert all(float(c.duration.quarterLength) == 0.5 for c in chords)
    d4_ties = [next(n for n in c.notes if n.pitch.nameWithOctave == "D4").tie for c in chords]
    assert [t.type if t else None for t in d4_ties] == ["start", "continue", "continue", "stop"]
    moving_ties = [next(n for n in c.notes if n.pitch.nameWithOctave != "D4").tie for c in chords]
    assert all(t is None for t in moving_ties)
    assert isinstance(els[4], note.Rest) and float(els[4].duration.quarterLength) == 2.0


def test_unison_in_both_voices_is_one_note():
    """No.8 / No.29: 同じ D4 が両声部に同じ長さで → 音 1 つ (2 音の重音にしない)。"""
    s = _parse(f'<measure number="1">{ATTR}{_n("D",4,16,1,"whole")}<backup><duration>16</duration></backup>{_n("D",4,16,2,"whole")}</measure>')
    merge_voices(s)
    els = _flat(s)
    assert len(els) == 1 and isinstance(els[0], note.Note) and els[0].nameWithOctave == "D4"
    assert float(els[0].duration.quarterLength) == 4.0


def test_voice2_rests_only_keeps_voice1_objects_and_articulations():
    """ガボット: 声部2 が休符だけ → 声部1 の音符オブジェクトをそのまま使う (スタッカート・運指を保つ)。"""
    art = "<notations><articulations><staccato/></articulations><technical><fingering>2</fingering></technical></notations>"
    s = _parse(f'<measure number="1">{ATTR}{_n("G",4,8,1,"half",art)}{_n("A",4,8,1,"half")}<backup><duration>16</duration></backup>{_r(16,2,"whole")}</measure>')
    merge_voices(s)
    els = _flat(s)
    assert [e.nameWithOctave for e in els] == ["G4", "A4"]
    names = [type(a).__name__ for a in els[0].articulations]
    assert "Staccato" in names and "Fingering" in names


def test_slur_survives_when_notes_are_replaced():
    """声部1 のスラーの中の音が重音に置き換わっても、スラーは新しい音を指す。"""
    v1 = _n("D", 4, 8, 1, "half", '<notations><slur type="start" number="1"/></notations>') + _n("E", 4, 8, 1, "half", '<notations><slur type="stop" number="1"/></notations>')
    v2 = _n("A", 3, 8, 2, "half") + _r(8, 2, "half")
    s = _parse(f'<measure number="1">{ATTR}{v1}<backup><duration>16</duration></backup>{v2}</measure>')
    merge_voices(s)
    els = _flat(s)
    assert isinstance(els[0], chord.Chord) and isinstance(els[1], note.Note)
    slurs = list(s.recurse().getElementsByClass("Slur"))
    assert len(slurs) == 1
    spanned = slurs[0].getSpannedElements()
    assert els[0] in spanned and els[1] in spanned


def test_single_voice_measures_untouched():
    s = _parse(f'<measure number="1">{ATTR}{_n("A",4,16,1,"whole")}</measure>')
    assert merge_voices(s) == 0
    assert [e.nameWithOctave for e in _flat(s)] == ["A4"]


def test_rest_boundary_in_other_voice_does_not_split_sustained_note():
    """メヌエット m16: 声部1 の 2 分音符の下で声部2 が 4 分休符→4 分休符→… でも、声部1 の音は割れない。"""
    s = _parse(f'<measure number="1">{ATTR}{_n("G",4,8,1,"half")}{_r(8,1,"half")}<backup><duration>16</duration></backup>{_r(4,2,"quarter")}{_r(4,2,"quarter")}{_n("G",3,8,2,"half")}</measure>')
    merge_voices(s)
    els = _flat(s)
    assert [(e.nameWithOctave, float(e.duration.quarterLength), e.tie) for e in els] == [("G4", 2.0, None), ("G3", 2.0, None)]


def test_leading_rest_in_all_voices_is_one_rest():
    s = _parse(f'<measure number="1">{ATTR}{_r(4,1,"quarter")}{_n("A",4,12,1,"half","<dot/>")}<backup><duration>16</duration></backup>{_r(8,2,"half")}{_n("D",4,8,2,"half")}</measure>')
    merge_voices(s)
    els = _flat(s)
    assert isinstance(els[0], note.Rest) and float(els[0].duration.quarterLength) == 1.0
    assert [float(e.offset) for e in els] == [0.0, 1.0, 2.0]
    assert isinstance(els[2], chord.Chord) and sorted(p.nameWithOctave for p in els[2].pitches) == ["A4", "D4"]
