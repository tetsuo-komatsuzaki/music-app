# -*- coding: utf-8 -*-
"""lib/xml_sanitize.sanitize_xml_entities のテスト (メヌエット &copy; 対処 B の回帰防止)。"""
import xml.etree.ElementTree as ET

from lib.xml_sanitize import sanitize_xml_entities


def _s(text: str) -> str:
    return sanitize_xml_entities(text.encode("utf-8")).decode("utf-8")


def test_known_html_entity_to_numeric():
    # &copy; (メヌエットで parse を落としていた) → 数値参照
    assert _s("<x>&copy;</x>") == "<x>&#169;</x>"
    assert _s("<x>&reg;&trade;</x>") == "<x>&#174;&#8482;</x>"


def test_unknown_named_entity_escaped():
    # 未知の名前付きは &amp; にエスケープしてパース可能化
    assert _s("<x>&foo;</x>") == "<x>&amp;foo;</x>"


def test_bare_ampersand_escaped():
    assert _s("<x>R&D</x>") == "<x>R&amp;D</x>"


def test_valid_entities_preserved():
    # 正当なXMLエンティティ・数値参照はそのまま
    for ok in ("&amp;", "&lt;", "&gt;", "&quot;", "&apos;", "&#169;", "&#x41;"):
        assert _s(f"<x>{ok}</x>") == f"<x>{ok}</x>"


def test_result_is_parseable():
    # サニタイズ後は ElementTree で必ず parse できる
    dirty = "<root><a>&copy;</a><b>R&D</b><c>&unknownent;</c></root>"
    clean = sanitize_xml_entities(dirty.encode("utf-8"))
    ET.fromstring(clean)  # 例外を投げなければ OK


def test_returns_bytes():
    assert isinstance(sanitize_xml_entities(b"<x/>"), bytes)


def test_mixed_content():
    assert _s("<x>&copy; and R&D and &amp; ok</x>") == "<x>&#169; and R&amp;D and &amp; ok</x>"
