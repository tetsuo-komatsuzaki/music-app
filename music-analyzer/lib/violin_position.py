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


# ---------------------------------------------------------------------------
# 工程B (2026-07-06): 指番号ベースの弦・ポジション導出 + 高音域(MIDI 84+)対応
#
# fingering 運用方針 (設計書 §11 確定):
#   - 記載なし = 1st ポジションで押さえる音 → 音高から推定 (既存 55-83 マップ)
#   - 1st ポジ以外の音 = 指番号(1〜4)だけ記載 → 指番号+音高から弦・ポジを導出
# ポジション推定 2段方式 (議事録 §25 確定):
#   段1: 弦候補の列挙 + 各候補弦でのポジション逆算 (最低ポジション優先)
#   段2: 音脈補正 = 直前音との連続性 (手の移動最小) で確定
#   一意に決まらない音は低信頼フラグ (confidence="low")
# これにより旧 MIDI 84+ 上限 (86% の mxl で高音が欠落) を撤廃する。
# ---------------------------------------------------------------------------

# 物理的な最大ポジション (学びレッスンは 10th まで。余裕を持たせて 12)
MAX_POSITION = 12

# ─── 音名（ダイアトニック）算術 (2026-07-09 Tetsuo 方針・最終形) ───
# ポジションは半音距離ではなく「音名の文字数」で数える（奏者の数え方そのもの）。
#   1指の音名 = 対象音名 − (指番号 − 1) 文字
#   ポジション = 開放弦の音名から 1指の音名までの文字数
# 例: A線・指3のファ(F5) → 1指=レ(D5) → ラから シ,ド,レ = 3 → 第3ポジション。
# ♯♭(alter)は文字を変えないためポジションに影響しない＝半音の帯・オフレット不要。
# 半音(MIDI)は「その弦で物理的に鳴るか(開放弦より上か)」のガードにのみ使う。
_LETTER_INDEX: dict[str, int] = {"C": 0, "D": 1, "E": 2, "F": 3, "G": 4, "A": 5, "B": 6}
# 開放弦の音名: G3 / D4 / A4 / E5 (ダイアトニック番号 = octave*7 + letter)
_OPEN_DIATONIC: dict[str, int] = {"G": 3 * 7 + 4, "D": 4 * 7 + 1, "A": 4 * 7 + 5, "E": 5 * 7 + 2}

# 弦の並び (音程移動の弦距離計算用。G=0 ... E=3)
_STRING_ORDER = ["G", "D", "A", "E"]
_OPEN_MIDI: dict[str, int] = {"G": 55, "D": 62, "A": 69, "E": 76}


def diatonic_index(step: str, octave: int) -> Optional[int]:
    """音名(step)+オクターブ → ダイアトニック番号 (C0=0, D0=1, ... 文字の通し番号)。"""
    li = _LETTER_INDEX.get(step.upper())
    if li is None:
        return None
    return octave * 7 + li


def position_by_letter(
    step: str, octave: int, finger: int, string_id: str
) -> Optional[int]:
    """音名算術によるポジション算出（一意・帯不要）。

    1指の音名 = 対象音名 − (finger−1) 文字
    ポジション = 開放弦音名から 1指音名までの文字数
    範囲外 (1 未満 / MAX_POSITION 超) は None。
    """
    di = diatonic_index(step, octave)
    open_di = _OPEN_DIATONIC.get(string_id)
    if di is None or open_di is None or finger < 1:
        return None
    pos = (di - (finger - 1)) - open_di
    if pos == 0 and finger == 1:
        # ハーフポジション: 開放弦と同じ文字の変化音を指1で押さえるケース
        # (例: G線の G#3 を指1)。1st ポジション扱いに繰り上げる。
        # 指2〜4 の pos0 は「手が開放弦より下」の不自然な解釈なので無効のまま
        # (例: F5 指2 は A線4ポジが標準で、E線ハーフは候補にしない)。
        # 音が開放弦より上であることは呼び出し側の MIDI ガードが保証する。
        return 1
    if pos < 1 or pos > MAX_POSITION:
        return None
    return pos


def position_from_ffs(first_finger_semitones: int) -> Optional[int]:
    """1指の半音距離からポジション番号を導出 (2半音で+1、既存バケツと同一)。
    範囲外 (0以下 / MAX_POSITION 超) は None。"""
    if first_finger_semitones < 1:
        return None
    pos = (first_finger_semitones + 1) // 2  # 1..2→1, 3..4→2, 5..6→3 ...
    if pos > MAX_POSITION:
        return None
    return pos


def _string_distance(a: str, b: str) -> int:
    try:
        return abs(_STRING_ORDER.index(a) - _STRING_ORDER.index(b))
    except ValueError:
        return 0


def _pick_candidate(
    candidates: list[tuple[str, int]],
    prev_string: Optional[str],
    prev_position: Optional[int],
) -> tuple[str, int]:
    """段2: 音脈補正。直前音があれば手の移動最小、無ければ最低ポジション優先。
    同点は高音弦 (E>A>D>G) を選ぶ (慣用)。"""
    def cost(c: tuple[str, int]) -> tuple:
        s, p = c
        if prev_position is not None and prev_string is not None:
            move = abs(p - prev_position) * 2 + _string_distance(s, prev_string)
        else:
            move = p * 2  # 文脈なし → 低ポジ優先
        return (move, p, -_STRING_ORDER.index(s))

    return min(candidates, key=cost)


def infer_with_finger(
    midi_pitch: int,
    finger: int,
    prev_string: Optional[str] = None,
    prev_position: Optional[int] = None,
    step: Optional[str] = None,
    octave: Optional[int] = None,
) -> Optional[tuple[str, Optional[int], str]]:
    """指番号 + 音名から (string_id, position, confidence) を導出する（音名算術）。

    考え方 (2026-07-09 Tetsuo 方針・音名算術):
      ポジションは音名の文字数で一意に決まる（帯・オフセット不要）。
      例: F5(ファ) に指3 → 1指=レ(D5) → A線なら第3ポジション。
          E線では 1指=レ は開放(ミ)より下 → 弾けない → 候補から除外。
      複数の弦で可能な場合のみ音脈補正で選択（そこだけ低信頼）。

    Returns:
        (string_id, position, confidence)。confidence: "high"=弦が一意 /
        "low"=複数弦の候補から音脈補正で選択 (§25: 低信頼は移動系集計から除外)。
        導出不能なら None。開放弦 (finger=0) は position=None。
    """
    if finger == 0:
        # 開放弦: 音高が開放弦と一致する弦のみ
        for s, open_midi in _OPEN_MIDI.items():
            if midi_pitch == open_midi:
                return (s, None, "high")
        return None

    if step is None or octave is None:
        return None  # 音名なしでは算出しない（呼び手は必ず step/octave を渡す）

    candidates: list[tuple[str, int]] = []
    for s, open_midi in _OPEN_MIDI.items():
        if midi_pitch <= open_midi:
            continue  # 物理ガード: 開放弦以下の音はその弦で鳴らない
        pos = position_by_letter(step, octave, finger, s)
        if pos is not None:
            candidates.append((s, pos))

    if not candidates:
        return None
    if len(candidates) == 1:
        s, p = candidates[0]
        return (s, p, "high")
    s, p = _pick_candidate(candidates, prev_string, prev_position)
    return (s, p, "low")


def infer_pitch_only(
    midi_pitch: int,
    prev_string: Optional[str] = None,
    prev_position: Optional[int] = None,
    step: Optional[str] = None,
    octave: Optional[int] = None,
) -> Optional[tuple[str, Optional[int], int, str]]:
    """指番号なしの音の弦・ポジション・指を推定する（音名算術）。

    - MIDI 55-83: 既存の 1st ポジションマップ (fingering 方針: 記載なし=1stポジ)。
      = 音高帯で自然な弦を決める。confidence="estimated"。
    - MIDI 84+: 1st ポジで弾けない高音 (方針上は指番号が付くべきだが未付与の
      既存教材向けフォールバック)。音名算術で 各弦×各指 の候補を出し、
      音脈補正で選択し confidence="low"。旧実装の string_id=None 欠落を解消。

    Returns:
        (string_id, position, finger, confidence) または None (MIDI 55 未満)。
    """
    if midi_pitch < FIRST_POSITION_MIDI_MIN:
        return None

    if midi_pitch <= FIRST_POSITION_MIDI_MAX:
        # 音高帯で自然な弦 (= 1st ポジションの音域ゾーン)。fingering 方針の既定。
        s, f = VIOLIN_FIRST_POSITION_MAP[midi_pitch]
        return (s, None if f == 0 else 1, f, "estimated")

    # MIDI 84+: 音名算術で候補列挙 (高い指ほど低ポジションで届く)
    if step is None or octave is None:
        return None
    candidates: list[tuple[str, int, int]] = []  # (string, pos, finger)
    for s, open_midi in _OPEN_MIDI.items():
        if midi_pitch <= open_midi:
            continue
        for f in (4, 3, 2, 1):
            pos = position_by_letter(step, octave, f, s)
            if pos is not None:
                candidates.append((s, pos, f))
    if not candidates:
        return None
    s, p = _pick_candidate(
        list({(c[0], c[1]) for c in candidates}), prev_string, prev_position
    )
    # 選ばれた (弦, ポジ) で届く指のうち高い指を採用 (低ポジで自然)
    finger = max((c[2] for c in candidates if c[0] == s and c[1] == p), default=1)
    return (s, p, finger, "low")


def derive_position(
    midi_pitch: int,
    string_id: str,
    finger: Optional[int],
    step: Optional[str] = None,
    octave: Optional[int] = None,
) -> Optional[int]:
    """弦 (+任意で指) が既知のとき、音名算術でポジションを導出する。
    指が不明なら各指 (4→1) で最も低いポジションを返す。"""
    open_midi = _OPEN_MIDI.get(string_id)
    if open_midi is None or midi_pitch <= open_midi:
        return None
    if finger == 0:
        return None  # 開放弦
    if step is None or octave is None:
        return None
    fingers = [finger] if finger in (1, 2, 3, 4) else [4, 3, 2, 1]
    positions = [
        p for f in fingers if (p := position_by_letter(step, octave, f, string_id)) is not None
    ]
    return min(positions) if positions else None
