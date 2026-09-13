"""♭で下がる音のポジション (2026-09-13 Tetsuo確定)。

♯は指を伸ばして同じ枠の中で上げるのでポジションは変わらないが、
♭は半音下がるぶん1つ下の枠になる。
  例: E線の A♭5 を指1 → 文字では E,F,G,A で第3だが、
      鳴る場所は G♯5 と同じなので第2。
この補正が入るまで、♭で書かれた音は1つ上のポジションとして登録されていた
(実素材のポジション移動教材で 521音・16本が該当)。
"""
from lib.violin_position import position_by_letter, derive_position


def test_flat_goes_one_position_lower():
    # E線 (開放 E5)。A♭5 は G♯5 と同じ場所
    assert position_by_letter("A", 5, 1, "E", -1) == 2
    assert position_by_letter("G", 5, 1, "E", 1) == 2     # ♯は枠を変えない
    assert position_by_letter("A", 5, 1, "E", 0) == 3     # ナチュラルは第3


def test_flat_correction_on_other_strings():
    # A線 (開放 A4)。E♭5 を指2 → 1指は C♯/D♭ の場所 = 第2
    assert position_by_letter("E", 5, 2, "A", -1) == 2
    assert position_by_letter("E", 5, 2, "A", 0) == 3


def test_sharp_and_natural_unchanged():
    # 設計書の例: A線・指3のファ(F5) → 第3。補正の前後で変わらない
    assert position_by_letter("F", 5, 3, "A") == 3
    assert position_by_letter("F", 5, 3, "A", 1) == 3


def test_alter_defaults_to_zero():
    # alter を渡さなければ従来どおり
    assert position_by_letter("A", 5, 1, "E") == 3


def test_derive_position_passes_alter():
    # A♭5 = MIDI 80。E線で指1
    assert derive_position(80, "E", 1, "A", 5, -1) == 2
    assert derive_position(80, "E", 1, "G", 5, 1) == 2
