# -*- coding: utf-8 -*-
"""lib/violin_position — 既存 test_violin_position.py が薄い純関数を厚くする。

対象: diatonic_index / position_by_letter / position_from_ffs / derive_position /
      infer_with_finger の弦一意性・信頼度 / infer_pitch_only 高音域 /
      infer_violin_position の範囲外例外。
"""
import pytest

from lib.violin_position import (
    diatonic_index,
    position_by_letter,
    position_from_ffs,
    derive_position,
    infer_with_finger,
    infer_pitch_only,
    infer_violin_position,
    try_infer_violin_position,
    MAX_POSITION,
    FIRST_POSITION_MIDI_MIN,
    FIRST_POSITION_MIDI_MAX,
)


# ─── diatonic_index ──────────────────────────────────────────────────────

def test_diatonic_index_letter_arithmetic():
    # C0=0, D0=1 ... オクターブ毎に +7
    assert diatonic_index("C", 0) == 0
    assert diatonic_index("D", 0) == 1
    assert diatonic_index("C", 1) == 7
    assert diatonic_index("A", 4) == 4 * 7 + 5  # A4


def test_diatonic_index_case_insensitive_and_invalid():
    assert diatonic_index("a", 4) == diatonic_index("A", 4)
    assert diatonic_index("H", 4) is None  # 不正な音名


# ─── position_by_letter ──────────────────────────────────────────────────

def test_position_by_letter_documented_example_F5_finger3_on_A():
    # docstring例: A線・指3のファ(F5) → 第3ポジション
    assert position_by_letter("F", 5, 3, "A") == 3


def test_position_by_letter_open_string_first_finger_is_pos1():
    # A線・指1・シ(B4) → 1指=シ → ラから1文字 = 第1ポジション
    assert position_by_letter("B", 4, 1, "A") == 1


def test_position_by_letter_half_position_promotes_to_1():
    # G線 G#3 を指1（開放と同じ文字の変化音）→ ハーフポジは 1st に繰り上げ
    assert position_by_letter("G", 3, 1, "G") == 1


def test_position_by_letter_out_of_range_returns_none():
    assert position_by_letter("C", 0, 1, "A") is None       # 開放より下
    assert position_by_letter("A", 4, 0, "A") is None       # finger < 1
    assert position_by_letter("F", 5, 3, "Z") is None       # 未知の弦


def test_position_by_letter_above_max_position_none():
    # 極端に高い音は MAX_POSITION 超で None
    assert position_by_letter("C", 9, 1, "G") is None


# ─── position_from_ffs ───────────────────────────────────────────────────

def test_position_from_ffs_buckets():
    assert position_from_ffs(1) == 1
    assert position_from_ffs(2) == 1
    assert position_from_ffs(3) == 2
    assert position_from_ffs(4) == 2


def test_position_from_ffs_out_of_range():
    assert position_from_ffs(0) is None
    assert position_from_ffs(-3) is None
    assert position_from_ffs(2 * MAX_POSITION + 1) is None  # pos > MAX


# ─── derive_position (弦既知) ────────────────────────────────────────────

def test_derive_position_with_known_finger():
    # A線・F5・指3 → 3rd
    assert derive_position(77, "A", 3, step="F", octave=5) == 3


def test_derive_position_unknown_finger_takes_lowest():
    # 指不明 → 各指で最も低いポジションを返す（高い指ほど低ポジで届く）
    assert derive_position(77, "A", None, step="F", octave=5) == 2


def test_derive_position_open_string_and_below_return_none():
    assert derive_position(69, "A", 1, step="A", octave=4) is None  # A4=開放以下
    assert derive_position(77, "A", 0, step="F", octave=5) is None  # finger 0=開放
    assert derive_position(77, "A", 3) is None                      # step/octave 欠落


def test_derive_position_unknown_string_none():
    assert derive_position(77, "Z", 3, step="F", octave=5) is None


# ─── infer_with_finger ───────────────────────────────────────────────────

def test_infer_with_finger_open_string_high_confidence():
    # 指0 は音高が開放弦一致の弦のみ・position None・confidence high
    assert infer_with_finger(69, 0) == ("A", None, "high")
    assert infer_with_finger(76, 0) == ("E", None, "high")


def test_infer_with_finger_open_string_no_match_none():
    assert infer_with_finger(70, 0) is None  # A#4 はどの開放弦とも不一致


def test_infer_with_finger_multiple_strings_is_low_confidence():
    # F5 指3 は G/D/A 3弦で可能 → 音脈補正で最低ポジの A線3rd, confidence low
    r = infer_with_finger(77, 3, step="F", octave=5)
    assert r == ("A", 3, "low")


def test_infer_with_finger_context_pulls_toward_prev_string():
    # 直前が E線なら手の移動最小で高音弦寄りに引かれる（低信頼選択の音脈補正）
    r = infer_with_finger(77, 3, prev_string="E", prev_position=1, step="F", octave=5)
    # 候補は G/D/A。E線に最も近いのは A → A線を選ぶ
    assert r[0] == "A"
    assert r[2] == "low"


def test_infer_with_finger_requires_step_octave_for_nonzero():
    assert infer_with_finger(77, 3) is None  # 音名なしでは算出しない


# ─── infer_pitch_only 高音域・境界 ───────────────────────────────────────

def test_infer_pitch_only_high_note_uses_letter_arithmetic():
    # E6(88) は 1st では弾けない → 音名算術で 2nd 以上・low
    r = infer_pitch_only(88, step="E", octave=6)
    assert r is not None
    s, pos, finger, conf = r
    assert pos is not None and pos >= 2
    assert finger >= 1
    assert conf == "low"


def test_infer_pitch_only_high_note_needs_step_octave():
    assert infer_pitch_only(90) is None  # 84+ で音名なし → None


def test_infer_pitch_only_boundary_83_is_estimated():
    # 境界 83(B5) は 1st マップ内 → estimated
    r = infer_pitch_only(FIRST_POSITION_MIDI_MAX, step="B", octave=5)
    assert r is not None
    assert r[3] == "estimated"


def test_infer_pitch_only_boundary_84_is_low():
    r = infer_pitch_only(FIRST_POSITION_MIDI_MAX + 1, step="C", octave=6)
    assert r is not None
    assert r[3] == "low"


def test_infer_pitch_only_below_min_none():
    assert infer_pitch_only(FIRST_POSITION_MIDI_MIN - 1) is None


# ─── infer_violin_position 例外/範囲 ─────────────────────────────────────

def test_infer_violin_position_raises_out_of_range():
    with pytest.raises(ValueError):
        infer_violin_position(FIRST_POSITION_MIDI_MAX + 1)
    with pytest.raises(ValueError):
        infer_violin_position(FIRST_POSITION_MIDI_MIN - 1)


def test_try_infer_returns_none_out_of_range_no_raise():
    assert try_infer_violin_position(84) is None
    assert try_infer_violin_position(54) is None
    assert try_infer_violin_position(69) == ("A", 0)  # 範囲内は値
