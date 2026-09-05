# -*- coding: utf-8 -*-
"""lib/piece_summary — カルテ→曲要約の集約 & 展開対応表（工程A-3）。"""
from types import SimpleNamespace

from lib.piece_summary import (
    build_piece_summary,
    build_expansion_map,
    _key_alter,
    _trill_upper_midi,
)


def _kn(idx, *, is_rest=False, is_on_beat=True, midi=None, chord_midis=None,
        step=None, octave=None, position=None, note_type=None, is_dotted=False,
        is_tuplet=False, is_grace=False, rest_before_beats=0, beat_offset=0.0,
        duration_beats=1.0, is_chord=False, chord_intervals=None, is_in_slur=False,
        artic=None, measure_index=0, note_index=None, measure_number=None):
    """build_piece_summary が読む属性を備えた最小カルテ音符。"""
    return SimpleNamespace(
        is_rest=is_rest, is_on_beat=is_on_beat, midi=midi, chord_midis=chord_midis,
        step=step, octave=octave, position=position, note_type=note_type,
        is_dotted=is_dotted, is_tuplet=is_tuplet, is_grace=is_grace,
        rest_before_beats=rest_before_beats, beat_offset=beat_offset,
        duration_beats=duration_beats, is_chord=is_chord,
        chord_intervals=chord_intervals, is_in_slur=is_in_slur, _artic=artic or {},
        measure_index=measure_index,
        note_index=note_index if note_index is not None else idx,
        measure_number=measure_number,
        technique_tags=None, technique_ambiguous=False,
    )


# ─── 調号ヘルパ ──────────────────────────────────────────────────────────

def test_key_alter_sharps_and_flats():
    # fifths=2 → F#,C# が付く（シャープ順 F,C,...）
    assert _key_alter(2, "F") == 1
    assert _key_alter(2, "C") == 1
    assert _key_alter(2, "G") == 0
    # fifths=-2 → Bb,Eb
    assert _key_alter(-2, "B") == -1
    assert _key_alter(-2, "E") == -1
    assert _key_alter(-2, "A") == 0
    assert _key_alter(0, "F") == 0


def test_trill_upper_midi_diatonic_step():
    # A4(step A oct4)・調号なし → 上側は B4 = midi 71
    assert _trill_upper_midi("A", 4, 0) == 71
    # B4 の上は C5（オクターブ跨ぎ）
    assert _trill_upper_midi("B", 4, 0) == 72


# ─── build_piece_summary ─────────────────────────────────────────────────

def test_summary_basic_feature_tags_and_range():
    notes = [
        _kn(0, midi=69, step="A", octave=4, position=1, note_type="eighth"),
        _kn(1, is_rest=True, is_on_beat=True),  # 拍頭休符
    ]
    out = build_piece_summary(notes, {}, None)
    assert out["pitch_min"] == 69
    assert out["pitch_max"] == 69
    assert out["positions"] == [1]
    assert "8分音符" in out["feature_tags"]
    assert "拍頭休符" in out["feature_tags"]
    assert out["technique_tags"] == []


def test_summary_dotted_tuplet_grace_tags():
    notes = [
        _kn(0, midi=67, note_type="16th", is_dotted=True, is_tuplet=True, is_grace=True),
    ]
    out = build_piece_summary(notes, {}, None)
    ft = set(out["feature_tags"])
    assert {"16分音符", "付点", "連符", "装飾音符"} <= ft


def test_summary_trill_upper_extends_range():
    notes = [_kn(0, midi=69, step="A", octave=4)]
    analysis = {"notes": [{"is_trill": True}]}  # index_aligned (len 1 == 1)
    out = build_piece_summary(notes, {}, analysis)
    assert out["index_aligned"] is True
    assert out["pitch_max"] == 71  # トリル上側音 B4 を範囲に加算
    assert "トリル" in out["technique_tags"]


def test_summary_staccato_is_ambiguous_and_recorded():
    notes = [_kn(0, midi=69, artic={"staccato": True}, is_in_slur=False)]
    out = build_piece_summary(notes, {}, None)
    assert "スタッカート" in out["technique_tags"]
    assert notes[0].technique_ambiguous is True  # 曖昧記号として要確認
    patterns = {nc["pattern"] for nc in out["needs_confirmation"]}
    assert "staccato_outside_slur" in patterns


def test_summary_slur_writes_back_technique_tag():
    notes = [_kn(0, midi=69, is_in_slur=True)]
    out = build_piece_summary(notes, {}, None)
    assert "スラー" in out["technique_tags"]
    assert notes[0].technique_tags == ["スラー"]


def test_summary_sub_keys_from_key_change():
    # 主調(fifths0=C) → 途中でfifths2(D major)へ転調
    meta = {"key_fifths_changes": [
        {"fifths": 0, "measure_index": 0},
        {"fifths": 2, "measure_index": 8},
    ]}
    out = build_piece_summary([_kn(0, is_rest=True)], meta, None)
    assert len(out["sub_keys"]) == 1
    assert out["sub_keys"][0]["tonic"] == "D"
    assert out["sub_keys"][0]["measure_index"] == 8


def test_summary_harmonic_uses_sounding_pitch_for_range():
    # ハーモニクス: 記譜音ではなく実音(sounding_pitch_hz)で音域判定
    notes = [_kn(0, midi=60, step="C", octave=4)]
    analysis = {"notes": [{"is_harmonic": True, "sounding_pitch_hz": 880.0}]}  # A5=midi81
    out = build_piece_summary(notes, {}, analysis)
    assert out["pitch_min"] == 81 and out["pitch_max"] == 81
    assert "ナチュラル・ハーモニクス" in out["technique_tags"]


def test_summary_empty_range_when_all_rests():
    out = build_piece_summary([_kn(0, is_rest=True, is_on_beat=False)], {}, None)
    assert out["pitch_min"] is None and out["pitch_max"] is None


# ─── build_expansion_map ─────────────────────────────────────────────────

def _en(note_index, measure_number, measure_index=0):
    return SimpleNamespace(
        note_index=note_index, measure_number=measure_number, measure_index=measure_index
    )


def test_expansion_map_ok_linear():
    karte = [_en(0, 1), _en(1, 1), _en(2, 2), _en(3, 2)]
    analysis = [{"measure_number": 1}, {"measure_number": 1},
                {"measure_number": 2}, {"measure_number": 2}]
    mapping, status = build_expansion_map(karte, analysis)
    assert status == "ok"
    assert mapping == [0, 1, 2, 3]


def test_expansion_map_repeat_expansion():
    # 演奏順で小節1が2周される → カルテの同じ note_index を再度並べる
    karte = [_en(0, 1), _en(1, 1), _en(2, 2), _en(3, 2)]
    analysis = [{"measure_number": 1}, {"measure_number": 1},
                {"measure_number": 2}, {"measure_number": 2},
                {"measure_number": 1}, {"measure_number": 1}]
    mapping, status = build_expansion_map(karte, analysis)
    assert status == "ok"
    assert mapping == [0, 1, 2, 3, 0, 1]


def test_expansion_map_no_measure_number():
    karte = [_en(0, 1)]
    mapping, status = build_expansion_map(karte, [{"measure_number": None}])
    assert mapping is None
    assert status == "no_measure_number"


def test_expansion_map_measure_missing():
    karte = [_en(0, 1), _en(1, 1)]
    mapping, status = build_expansion_map(karte, [{"measure_number": 3}])
    assert mapping is None
    assert status == "measure_missing:3"


def test_expansion_map_count_mismatch():
    # 楽譜小節1は2音だが演奏に3音 → 安全装置で対応表を作らない
    karte = [_en(0, 1), _en(1, 1)]
    analysis = [{"measure_number": 1}, {"measure_number": 1}, {"measure_number": 1}]
    mapping, status = build_expansion_map(karte, analysis)
    assert mapping is None
    assert status == "count_mismatch:1"


# ─── 奏法の書き出し (2026-09-04 回帰) ────────────────────────────────────
# build_piece_summary は音符に technique_tags を書き戻すが、SkillInfoNote に
# その宣言が無いと dataclasses.asdict() が拾わず、書き出しから静かに落ちる。
# 落ちると diagnosis.py が奏法を読めず pitch_tech_* が永久に0行になる。
# 上のヘルパは SimpleNamespace なのでこの欠落を検出できない。実体で確かめる。

def test_skillinfonote_serializes_technique_tags():
    import dataclasses
    from lib.musicxml_skill_extractor import SkillInfoNote

    fields = {f.name for f in dataclasses.fields(SkillInfoNote)}
    assert "technique_tags" in fields
    assert "technique_ambiguous" in fields

    n = SkillInfoNote(note_index=0, measure_index=0, is_rest=False)
    n.technique_tags = ["スラー"]
    n.technique_ambiguous = True
    d = dataclasses.asdict(n)
    assert d["technique_tags"] == ["スラー"]
    assert d["technique_ambiguous"] is True


def test_build_piece_summary_writes_tags_onto_real_note():
    """スラー内の音符に、実体の SkillInfoNote でもタグが載り書き出される。"""
    import dataclasses
    from lib.musicxml_skill_extractor import SkillInfoNote

    notes = [
        SkillInfoNote(note_index=i, measure_index=0, is_rest=False, midi=69 + i,
                      step="A", octave=4, note_type="quarter", duration_beats=1.0,
                      beat_offset=float(i), is_on_beat=True, position=1,
                      is_in_slur=(i < 2))
        for i in range(3)
    ]
    summary = build_piece_summary(notes, {"key_fifths": 0}, {"notes": [{} for _ in range(3)]})
    assert "スラー" in summary["technique_tags"]
    dumped = [dataclasses.asdict(n) for n in notes]
    assert dumped[0]["technique_tags"] == ["スラー"]
    assert dumped[2]["technique_tags"] is None


def test_staccato_inside_slur_is_bow_staccato_and_not_ambiguous():
    """2026-09-05 Tetsuo確定: スラーの中のスタッカート点 = 連続スタッカート (要確認に入れない)。スラー外は従来どおり"""
    notes = [
        _kn(0, midi=62, step="D", octave=4, is_in_slur=True, artic={"staccato": True}),
        _kn(1, midi=64, step="E", octave=4, is_in_slur=True, artic={"staccato": True}),
        _kn(2, midi=66, step="F", octave=4, is_in_slur=False, artic={"staccato": True}),
        _kn(3, midi=67, step="G", octave=4),
    ]
    out = build_piece_summary(notes, {}, None)
    assert "連続スタッカート" in out["technique_tags"]
    assert "スタッカート" in out["technique_tags"]  # スラー外の点は従来どおり
    assert notes[0].technique_tags == ["スラー", "連続スタッカート"] and notes[0].technique_ambiguous is False
    assert "スタッカート" in notes[2].technique_tags and notes[2].technique_ambiguous is True
    patterns = {e["pattern"] for e in out["needs_confirmation"]} if isinstance(out.get("needs_confirmation"), list) else set(out.get("needs_confirmation") or {})
    assert "staccato_inside_slur" not in patterns and "staccato_outside_slur" in patterns
