# -*- coding: utf-8 -*-
"""lib/violin_position の運指・弦・ポジション推定テスト (運指表示機能 v75 の核)。"""
from lib.violin_position import (
    infer_pitch_only,
    infer_with_finger,
    string_id_to_num,
    string_num_to_id,
    VIOLIN_FIRST_POSITION_MAP,
    FIRST_POSITION_MIDI_MIN,
    FIRST_POSITION_MIDI_MAX,
)


def test_string_id_num_roundtrip():
    # MusicXML <string> 番号: 1=E(最高), 2=A, 3=D, 4=G(最低)
    assert string_id_to_num("E") == "1"
    assert string_id_to_num("A") == "2"
    assert string_id_to_num("D") == "3"
    assert string_id_to_num("G") == "4"
    for sid in ("G", "D", "A", "E"):
        assert string_num_to_id(string_id_to_num(sid)) == sid


def test_open_string_A4():
    # A4 (midi 69) は A 線開放 → finger 0, position None
    r = infer_pitch_only(69, step="A", octave=4)
    assert r is not None
    string_id, position, finger, conf = r
    assert string_id == "A"
    assert finger == 0
    assert position is None  # 開放


def test_first_position_range_gives_position_1_or_open():
    # 音域内(55-83)の非開放音は 1st ポジ扱い (position=1) が既定
    r = infer_pitch_only(67, step="G", octave=4)  # G4 = D線3の指(1stポジ)
    assert r is not None
    _s, position, finger, _c = r
    assert position in (1, None)
    assert finger is not None and finger >= 0


def test_below_range_returns_none():
    # G3(55)未満は None
    assert infer_pitch_only(FIRST_POSITION_MIDI_MIN - 1) is None


def test_high_note_estimates_higher_position():
    # 音域外の高音(84+)は音名算術で 2nd 以上のポジを推定
    r = infer_pitch_only(88, step="E", octave=6)  # E6
    assert r is not None
    _s, position, finger, _c = r
    assert position is not None and position >= 2
    assert finger is not None and finger >= 1


def test_infer_with_finger_derives_position():
    # 指番号ありは (弦, ポジ, 信頼度) を導出。F5 に指3 → 3rd ポジ級
    r = infer_with_finger(77, 3, step="F", octave=5)
    assert r is not None
    string_id, position, conf = r
    assert string_id in ("G", "D", "A", "E")
    assert position is not None and position >= 1


def test_first_position_map_covers_range():
    # 1stポジマップは音域内 midi を網羅している (infer_pitch_only が KeyError にならない前提)
    for midi in range(FIRST_POSITION_MIDI_MIN, FIRST_POSITION_MIDI_MAX + 1):
        assert midi in VIOLIN_FIRST_POSITION_MAP, f"midi {midi} not in first-position map"


def test_display_rule_open_note_hidden():
    # 表示ルール: 開放弦(finger 0)は指を出さない (position None)
    r = infer_pitch_only(69, step="A", octave=4)
    _s, position, finger, _c = r
    # ルール: position>=2 かつ finger>=1 のときだけ表示 → 開放は非表示
    show_finger = position is not None and position >= 2 and finger is not None and finger >= 1
    assert show_finger is False
