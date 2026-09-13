"""弦と運指の両方が書かれた音のポジション導出を、音符要素から通しで確かめる。

2026-09-13 の回帰。♭補正を撤回したとき derive_position から alter を外したが、
_resolve_string_finger_position の「両方注釈あり」分岐だけが複数行の呼び出しで
alter を渡したまま残り、v143 で TypeError になった。既存の196件は
infer_with_finger を直接叩くものばかりで、この分岐を一度も通っていなかった。

ここでは音符の XML から入って、弦・運指・ポジションが返るところまでを見る。
"""
import xml.etree.ElementTree as ET

import pytest

from lib.musicxml_skill_extractor import _resolve_string_finger_position


def note_xml(step, octave, alter=None, string=None, finger=None):
    alter_el = f"<alter>{alter}</alter>" if alter is not None else ""
    tech = ""
    if string is not None or finger is not None:
        inner = ""
        if finger is not None:
            inner += f"<fingering>{finger}</fingering>"
        if string is not None:
            inner += f"<string>{string}</string>"
        tech = f"<notations><technical>{inner}</technical></notations>"
    return ET.fromstring(
        f"<note><pitch><step>{step}</step>{alter_el}<octave>{octave}</octave></pitch>"
        f"<duration>1</duration><voice>1</voice><type>quarter</type>{tech}</note>"
    )


# (音名, オクターブ, alter, 弦番号, 指, 期待ポジション)
# 弦番号は MusicXML の値 1=E 2=A 3=D 4=G
BOTH_ANNOTATED = [
    ("B", 3, -1, 4, 1, 2),    # G線 B♭3 を指1 = 第2 (♭でも枠は下がらない)
    ("B", 3, None, 4, 1, 2),  # G線 B3 を指1 = 第2
    ("E", 4, -1, 4, 4, 2),    # G線 E♭4 を指4 = 第2
    ("A", 5, -1, 1, 1, 3),    # E線 A♭5 を指1 = 文字どおり第3
    ("F", 5, None, 2, 3, 3),  # A線 F5 を指3 = 第3
    ("D", 4, None, 3, 1, 1),  # D線 D4 は開放と同じ高さ = 弾けない
]


@pytest.mark.parametrize("step,octave,alter,string,finger,want", BOTH_ANNOTATED[:5])
def test_both_annotated_returns_position(step, octave, alter, string, finger, want):
    """弦+運指が揃った音は例外を出さず、音名算術どおりのポジションを返す。"""
    s, f, pos, conf, inferred = _resolve_string_finger_position(
        note_xml(step, octave, alter, string, finger), None, None
    )
    assert pos == want, f"{step}{octave} 弦{string} 指{finger}: {pos} != {want}"
    assert f == finger
    assert conf == "annotated"
    assert inferred is False


def test_open_string_pitch_has_no_position():
    """開放弦と同じ高さは、その弦では押さえられないのでポジションを出さない。"""
    _s, _f, pos, _c, _i = _resolve_string_finger_position(
        note_xml("D", 4, None, 3, 1), None, None
    )
    assert pos is None


def test_flat_does_not_shift_the_frame():
    """♭で枠を1つ下げる補正は入れない (2026-09-13 Tetsuo確定「場合による」)。

    変ロ長調・G線の B♭3 を指1 は第2の枠そのもの。補正を入れると第1になり誤る。
    """
    _s, _f, flat, _c, _i = _resolve_string_finger_position(
        note_xml("B", 3, -1, 4, 1), None, None
    )
    _s, _f, nat, _c, _i = _resolve_string_finger_position(
        note_xml("B", 3, None, 4, 1), None, None
    )
    assert flat == nat == 2
