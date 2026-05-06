"""
violin_position.py — バイオリンのファーストポジション推定ロジック（フォールバック専用）

設計書 v3.2 §13-4 に基づく実装。

このモジュールは「フォールバック専用」：
  - 弦・運指は MusicXML の <technical><string> / <fingering> を最優先（Tetsuo 確定方針）
  - データがない場合のみ、ファーストポジションと仮定して読み替える
  - MIDI 範囲は 55-83 のみ対応（Q2 確定、v3.1 高7 の MIDI 91 拡張を巻き戻し）
  - 範囲外（MIDI 84+）は None フォールバック → 弦移動判定対象外

Phase 0.1 Task 5 で発覚：
  既存 mxl の 86%（930件）が MIDI 84+ を含む
  → 「作り直し」プロジェクトは MVP 後に実施（Tetsuo 確定）
  → α MVP では MIDI 84+ の音符は string_id=None として扱う

このモジュールは 2 つの場面で使われる：
1. mxl 再生成時（generate_arpeggio_mxl.py / generate_scale_mxl.py、MVP 後の作り直しで）
   - 音符に <technical><string> / <fingering> を付与する
2. 演奏時（musicxml_skill_extractor.py）
   - MusicXML に注釈がない場合のフォールバック
   - 推定された場合は is_inferred_position=True とフラグ立て

弦番号と弦IDの対応：
  MusicXML 標準（fiddle convention）では数値で表現する
    1 = E弦（最高音）
    2 = A弦
    3 = D弦
    4 = G弦（最低音）
  本プロジェクト内部では文字列 "G"/"D"/"A"/"E" で扱う
    （IntegratedNote.string_id は文字列）
"""

from __future__ import annotations

import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# 弦番号 ⇔ 弦ID 変換
# ---------------------------------------------------------------------------

# MusicXML の <string> 数値 → IntegratedNote.string_id 文字列
_STRING_NUM_TO_ID = {
    "1": "E",
    "2": "A",
    "3": "D",
    "4": "G",
}

_STRING_ID_TO_NUM = {v: k for k, v in _STRING_NUM_TO_ID.items()}


def string_num_to_id(string_num: str) -> Optional[str]:
    """MusicXML の弦番号（"1"〜"4"）を弦ID（"E"/"A"/"D"/"G"）に変換。

    Args:
        string_num: MusicXML の <string> 要素のテキスト値（"1" / "2" / "3" / "4"）

    Returns:
        弦ID。未知の値なら None
    """
    return _STRING_NUM_TO_ID.get(string_num)


def string_id_to_num(string_id: str) -> Optional[str]:
    """弦ID（"E"/"A"/"D"/"G"）を MusicXML の弦番号（"1"〜"4"）に変換。

    Args:
        string_id: 弦ID

    Returns:
        MusicXML の弦番号。未知の値なら None
    """
    return _STRING_ID_TO_NUM.get(string_id)


# ---------------------------------------------------------------------------
# ファーストポジション推定マップ（v3.2 §13-4：MIDI 55-83 のみ）
# ---------------------------------------------------------------------------

# MIDI ピッチ → (string_id, finger)
# v3.2 確定（Q2）：MIDI 55-83 のみ対応、v3.1 高7 の MIDI 91 拡張を巻き戻し
VIOLIN_FIRST_POSITION_MAP: dict[int, tuple[str, int]] = {
    # G弦：MIDI 55-61
    55: ("G", 0),  # G3 開放
    56: ("G", 1),  # G#3
    57: ("G", 1),  # A3
    58: ("G", 2),  # A#3
    59: ("G", 2),  # B3
    60: ("G", 3),  # C4
    61: ("G", 3),  # C#4
    # D弦：MIDI 62-68
    62: ("D", 0),  # D4 開放
    63: ("D", 1),  # D#4
    64: ("D", 1),  # E4
    65: ("D", 2),  # F4
    66: ("D", 2),  # F#4
    67: ("D", 3),  # G4
    68: ("D", 3),  # G#4
    # A弦：MIDI 69-75
    69: ("A", 0),  # A4 開放
    70: ("A", 1),  # A#4
    71: ("A", 1),  # B4
    72: ("A", 2),  # C5
    73: ("A", 2),  # C#5
    74: ("A", 3),  # D5
    75: ("A", 3),  # D#5
    # E弦：MIDI 76-83（ファーストポジション）
    76: ("E", 0),  # E5 開放
    77: ("E", 1),  # F5
    78: ("E", 1),  # F#5
    79: ("E", 2),  # G5
    80: ("E", 2),  # G#5
    81: ("E", 3),  # A5
    82: ("E", 3),  # A#5
    83: ("E", 4),  # B5
}

FIRST_POSITION_MIDI_MIN = 55  # G3
FIRST_POSITION_MIDI_MAX = 83  # B5


def infer_violin_position(midi_pitch: int) -> tuple[str, int]:
    """MIDI ピッチから弦・指を推定（ファーストポジション、フォールバック専用）。

    v3.2 確定（Q2）：MIDI 55-83 の範囲のみ対応。
    範囲外で例外を raise する版（mxl 生成時に使うため、明確にエラーにする）。

    Args:
        midi_pitch: MIDI ピッチ番号（55 〜 83）

    Returns:
        (string_id, finger) のタプル
        例：("A", 0) は A弦・開放

    Raises:
        ValueError: midi_pitch が 55 未満または 83 を超える場合
    """
    if midi_pitch < FIRST_POSITION_MIDI_MIN or midi_pitch > FIRST_POSITION_MIDI_MAX:
        raise ValueError(
            f"MIDI pitch {midi_pitch} is out of first position range "
            f"({FIRST_POSITION_MIDI_MIN}-{FIRST_POSITION_MIDI_MAX}). "
            f"This pitch requires non-first-position playing, which is out of scope for v3.2 MVP. "
            f"Resolution: 'rebuild' project will handle MIDI 84+ in post-MVP phase."
        )
    return VIOLIN_FIRST_POSITION_MAP[midi_pitch]


def try_infer_violin_position(midi_pitch: int) -> Optional[tuple[str, int]]:
    """MIDI ピッチから弦・指を推定（範囲外なら None を返す版）。

    演奏時側のフォールバックで使う。範囲外で例外を投げるとパイプライン全体が
    止まってしまうので、None を返して呼び出し側に判断を委ねる。

    範囲外（MIDI 84+）の音符は v3.2 では string_id=None として扱われ、
    弦移動系判定の対象外となる（Phase 0.1 Task 5 結果反映）。

    Args:
        midi_pitch: MIDI ピッチ番号

    Returns:
        (string_id, finger) のタプル。範囲外なら None（警告ログ出力）
    """
    if midi_pitch < FIRST_POSITION_MIDI_MIN or midi_pitch > FIRST_POSITION_MIDI_MAX:
        logger.warning(
            f"MIDI pitch {midi_pitch} out of first position range "
            f"({FIRST_POSITION_MIDI_MIN}-{FIRST_POSITION_MIDI_MAX}). "
            f"String/finger annotation will be omitted (string_id=None). "
            f"This note will be excluded from string change detection."
        )
        return None
    return VIOLIN_FIRST_POSITION_MAP[midi_pitch]
