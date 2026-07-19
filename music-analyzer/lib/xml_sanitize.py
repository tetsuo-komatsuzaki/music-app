# -*- coding: utf-8 -*-
"""元 MusicXML の未定義HTMLエンティティ (DTD無しでは無効) を parse 可能に整える。
analyze_musicxml から分離 (単体テスト可能にするため)。"""
from __future__ import annotations

import re

# 未定義HTML名前付きエンティティ → 数値参照
HTML_ENTITIES = {
    "copy": "169", "reg": "174", "trade": "8482", "nbsp": "160", "deg": "176",
    "mdash": "8212", "ndash": "8211", "hellip": "8230", "sect": "167", "para": "182",
    "rsquo": "8217", "lsquo": "8216", "rdquo": "8221", "ldquo": "8220", "bull": "8226",
    "eacute": "233", "egrave": "232", "agrave": "224", "uuml": "252", "ouml": "246", "auml": "228",
}

_NAMED = re.compile(r"&([a-zA-Z][a-zA-Z0-9]*);")
_BARE_AMP = re.compile(r"&(?!(?:amp|lt|gt|quot|apos|#[0-9]+|#x[0-9a-fA-F]+);)")


def sanitize_xml_entities(data: bytes) -> bytes:
    """平文XML中の未定義HTMLエンティティを数値参照に置換し、裸の & をエスケープして
    ElementTree/music21 が parse できるようにする。ZIP(.mxl) は呼び出し側で除外。"""
    text = data.decode("utf-8", errors="replace")
    text = _NAMED.sub(
        lambda m: f"&#{HTML_ENTITIES[m.group(1)]};" if m.group(1) in HTML_ENTITIES else m.group(0),
        text,
    )
    # XMLとして正当なエンティティ以外の裸の & を &amp; に (未知の名前付きも含めパース可能化)
    text = _BARE_AMP.sub("&amp;", text)
    return text.encode("utf-8")
