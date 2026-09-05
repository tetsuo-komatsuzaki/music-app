"""rhythm_recipe のテスト (2026-08-24 リズムパターン変種)。"""
from music21 import articulations, chord, meter, note, spanner, stream

from lib.rhythm_recipe import apply_rhythm_recipe, note_quarter_length, recipe_total_ql


def _src(measures: int = 2, per: int = 8) -> stream.Score:
    """4/4 ・ 8分音符 per 個 × measures 小節の譜面を作る。"""
    part = stream.Part()
    part.append(meter.TimeSignature("4/4"))
    names = ["A4", "B4", "C#5", "D5", "E5", "F#5", "G#5", "A5"]
    for _ in range(measures):
        for i in range(per):
            n = note.Note(names[i % len(names)])
            n.duration.quarterLength = 4.0 / per
            part.append(n)
    sc = stream.Score()
    sc.append(part)
    for p in sc.parts:
        p.makeMeasures(inPlace=True)
    return sc


def _notes(sc: stream.Score):
    return list(sc.recurse().notes)


def test_quarter_length_dot_and_triplet():
    assert note_quarter_length({"base": "e"}) == 0.5
    assert note_quarter_length({"base": "e", "dot": True}) == 0.75
    assert note_quarter_length({"base": "q", "triplet": True}) == 1.0 * 2 / 3
    assert note_quarter_length({"base": "x"}) is None


def test_total_and_replacement_16x8_then_8x4():
    """16分×8 → 8分×4 (合計4拍) が全単位に適用される。"""
    recipe = {
        "unitMeasures": 1,
        "notes": [{"base": "s", "pitchNo": i + 1} for i in range(8)]
        + [{"base": "e", "pitchNo": i + 1} for i in range(4)],
    }
    assert abs(recipe_total_ql(recipe) - 4.0) < 1e-9
    out = apply_rhythm_recipe(_src(measures=2), recipe)
    ns = _notes(out)
    assert len(ns) == 24                      # 12音 × 2小節
    assert ns[0].duration.quarterLength == 0.25
    assert ns[8].duration.quarterLength == 0.5


def test_pitch_follows_number_not_order():
    """高さは pitchNo が指すとおりに入る (順送りではない)。"""
    recipe = {"unitMeasures": 1, "notes": [
        {"base": "q", "pitchNo": 8}, {"base": "q", "pitchNo": 1},
        {"base": "q", "pitchNo": 8}, {"base": "q", "pitchNo": 1},
    ]}
    out = apply_rhythm_recipe(_src(measures=1), recipe)
    names = [n.pitch.nameWithOctave for n in _notes(out)]
    assert names == ["A5", "A4", "A5", "A4"]


def test_articulation_and_slur():
    recipe = {"unitMeasures": 1, "notes": [
        {"base": "q", "pitchNo": 1, "articulation": "staccato"},
        {"base": "q", "pitchNo": 2, "slurId": 1},
        {"base": "q", "pitchNo": 3, "slurId": 1},
        {"base": "q", "pitchNo": 4, "articulation": "accent"},
    ]}
    out = apply_rhythm_recipe(_src(measures=1), recipe)
    ns = _notes(out)
    assert any(isinstance(a, articulations.Staccato) for a in ns[0].articulations)
    assert any(isinstance(a, articulations.Accent) for a in ns[3].articulations)
    assert len(list(out.recurse().getElementsByClass(spanner.Slur))) == 1


def test_multi_measure_unit():
    """2小節を1単位にすると、2小節ぶん (8拍) のレシピが2ブロックに適用される。"""
    recipe = {"unitMeasures": 2, "notes": [{"base": "q", "pitchNo": i + 1} for i in range(8)]}
    out = apply_rhythm_recipe(_src(measures=4), recipe)
    assert len(_notes(out)) == 16             # 8音 × 2ブロック


def test_noop_when_recipe_empty():
    sc = _src(measures=1)
    assert apply_rhythm_recipe(sc, None) is sc
    assert apply_rhythm_recipe(sc, {"notes": []}) is sc


def test_only_same_rhythm_blocks_are_rewritten():
    """形の違う小節 (終止など) は書き換えない (2026-08-24 確定仕様)。"""
    part = stream.Part()
    part.append(meter.TimeSignature("4/4"))
    for _ in range(8):                      # 1小節目: 8分×8
        part.append(note.Note("A4", quarterLength=0.5))
    for _ in range(4):                      # 2小節目: 4分×4 (形が違う)
        part.append(note.Note("B4", quarterLength=1.0))
    for _ in range(8):                      # 3小節目: 8分×8 (1小節目と同形)
        part.append(note.Note("C5", quarterLength=0.5))
    sc = stream.Score(); sc.append(part)
    for p in sc.parts:
        p.makeMeasures(inPlace=True)

    recipe = {"unitMeasures": 1, "notes": [{"base": "s", "pitchNo": i + 1} for i in range(16)]}
    out = apply_rhythm_recipe(sc, recipe)
    ms = list(out.parts[0].getElementsByClass(stream.Measure))
    assert len(list(ms[0].notes)) == 16      # 同形 → 書き換え
    assert len(list(ms[1].notes)) == 4       # 形が違う → そのまま
    assert len(list(ms[2].notes)) == 16      # 同形 → 書き換え


def test_skip_head_tail_and_pinpoint():
    """先頭・末尾・ピンポイントの対象外指定 (2026-08-24 Tetsuo追加)。"""
    sc = _src(measures=6)                     # 6小節すべて 8分×8 の同形
    recipe = {
        "unitMeasures": 1,
        "skipHead": 1, "skipTail": 1, "skipMeasures": [4],
        "notes": [{"base": "s", "pitchNo": i + 1} for i in range(16)],
    }
    out = apply_rhythm_recipe(sc, recipe)
    counts = [len(list(m.notes)) for m in out.parts[0].getElementsByClass(stream.Measure)]
    # 1小節目=先頭除外 / 4小節目=ピンポイント除外 / 6小節目=末尾除外 → 元の8音のまま
    assert counts == [8, 16, 16, 8, 16, 8]


def test_chord_recipe_plays_numbered_notes_together():
    """重音 (2026-09-05 Tetsuo): ①→②→①と②の重音。pitchNos の音が1つの和音になる"""
    recipe = {"unitMeasures": 1, "notes": [
        {"base": "q", "pitchNo": 1}, {"base": "q", "pitchNo": 2},
        {"base": "h", "pitchNo": 1, "pitchNos": [2, 1], "articulation": "staccato"},
    ]}
    out = apply_rhythm_recipe(_src(measures=1), recipe)
    ns = _notes(out)
    assert len(ns) == 3
    assert isinstance(ns[0], note.Note) and isinstance(ns[1], note.Note)
    ch = ns[2]
    assert isinstance(ch, chord.Chord)
    assert [p.nameWithOctave for p in ch.pitches] == ["A4", "B4"]   # ①=A4 ②=B4 を同時に
    assert ch.duration.quarterLength == 2.0
    assert any(isinstance(a, articulations.Staccato) for a in ch.articulations)


def test_chord_recipe_three_notes_and_single_when_one_number():
    recipe = {"unitMeasures": 1, "notes": [
        {"base": "q", "pitchNo": 1}, {"base": "q", "pitchNo": 2}, {"base": "q", "pitchNo": 3},
        {"base": "q", "pitchNo": 1, "pitchNos": [1, 2, 3]},
    ]}
    ns = _notes(apply_rhythm_recipe(_src(measures=1), recipe))
    assert isinstance(ns[3], chord.Chord) and [p.nameWithOctave for p in ns[3].pitches] == ["A4", "B4", "C#5"]
    # pitchNos が1個なら単音のまま
    one = {"unitMeasures": 1, "notes": [{"base": "w", "pitchNo": 2, "pitchNos": [2]}]}
    ns1 = _notes(apply_rhythm_recipe(_src(measures=1), one))
    assert isinstance(ns1[0], note.Note) and ns1[0].pitch.nameWithOctave == "B4"
