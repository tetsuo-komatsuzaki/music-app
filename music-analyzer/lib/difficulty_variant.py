"""
difficulty_variant.py — 曲の難易度変種の機械変換 (2026-08-24 要件確定)

Score.variantRecipe を analyze_musicxml が読み、parse 直後の music21 Score に適用する。
既存の移調変種 (PracticeItem.metadata.transposeSource) と同じ「解析時変換」方式。

確定ルール (Tetsuo 2026-08-24。この3つ以外は入れない ・ 移調/オクターブ下げは禁止):
  1. measure_range   : 使用する小節範囲の限定 {type, from, to} (1始まり・両端含む)
  2. split_repeat    : 1音を半分の音価×2個の同音連打に置換 (合計音価は不変)
  3. double_duration : 全音符の音価を2倍 (テンポ表記はそのまま)

適用順は 範囲限定 → 分割 → 音価2倍 で固定 (範囲を先にやると後段が軽く、
分割後に音価を倍にすると「元の音価で同音2回」という自然な初級形になる)。
"""
from __future__ import annotations

import logging
from copy import deepcopy
from typing import Any, Optional

from music21 import note as m21note, repeat as m21repeat, stream

logger = logging.getLogger(__name__)

RULE_TYPES = ("measure_range", "split_repeat", "double_duration")


def apply_variant_recipe(score: stream.Score, recipe: Optional[dict[str, Any]]) -> stream.Score:
    """variantRecipe を適用した Score を返す。recipe が無ければそのまま返す。
    未知の rule type は無視 (前方互換)。"""
    if not recipe or not isinstance(recipe, dict):
        return score
    rules = {r.get("type"): r for r in recipe.get("rules", []) if isinstance(r, dict)}
    if not rules:
        return score

    if "measure_range" in rules:
        r = rules["measure_range"]
        try:
            score = _apply_measure_range(score, int(r["from"]), int(r["to"]))
        except (KeyError, ValueError, TypeError):
            logger.warning("measure_range の指定が不正: %s", r)
    if "split_repeat" in rules:
        score = _apply_split_repeat(score)
    if "double_duration" in rules:
        score = _apply_double_duration(score)
    logger.info("difficulty variant applied: %s", [t for t in RULE_TYPES if t in rules])
    return score


def _expand_repeats_renumbered(score: stream.Score) -> Optional[stream.Score]:
    """繰り返しを展開し、小節番号を演奏順の連番 (1..N) に振り直した Score を返す。
    繰り返しが無い・展開に失敗したときは None。"""
    has_repeat = any(
        getattr(b, "direction", None) in ("start", "end")
        for b in score.recurse().getElementsByClass("Repeat")
    )
    if not has_repeat:
        return None
    try:
        expanded = score.expandRepeats()
    except Exception:
        try:
            exp = m21repeat.Expander(score.parts[0])
            part = exp.process()
            expanded = stream.Score()
            expanded.append(part)
        except Exception:
            logger.warning("measure_range: 繰り返し展開に失敗。原譜番号で切り出す")
            return None
    for part in expanded.parts:
        for i, meas in enumerate(part.getElementsByClass(stream.Measure)):
            meas.number = i + 1
    return expanded


def _apply_measure_range(score: stream.Score, m_from: int, m_to: int) -> stream.Score:
    """from〜to 小節だけを残す。measures() が調号・拍子・クレフを先頭へ引き継ぐ。

    【2026-08-29 修正 (カイザーNo.23/24 Tetsuo報告)】
    パートの小節番号は、アプリの譜面表示と同じ「繰り返し展開後の演奏小節」基準。
    原譜に繰り返しがあると物理小節番号とずれる (No.23: 物理56小節・演奏70小節。
    Part4=49-70 が物理49-56の8小節に化けていた)。繰り返しがある場合は先に展開して
    連番を振り直してから切り出す。展開後は繰り返し記号が消えるため、
    後段の再展開 (performance_part) はそのまま素通りする。"""
    if m_from < 1 or m_to < m_from:
        return score
    expanded = _expand_repeats_renumbered(score)
    src = expanded if expanded is not None else score
    out = src.measures(m_from, m_to)
    return out


def _apply_split_repeat(score: stream.Score) -> stream.Score:
    """各単音を半分の音価×2個の同音連打へ。休符・和音はそのまま。
    アーティキュレーション・装飾は前半の音に残す (後半は素の反復)。"""
    s = deepcopy(score)
    for part in s.parts:
        for meas in part.getElementsByClass(stream.Measure):
            for n in list(meas.notes):
                if not isinstance(n, m21note.Note):
                    continue
                half = n.duration.quarterLength / 2
                if half <= 0:
                    continue
                off = n.offset
                first = deepcopy(n)
                first.duration.quarterLength = half
                second = m21note.Note(n.pitch)
                second.duration.quarterLength = half
                meas.remove(n)
                meas.insert(off, first)
                meas.insert(off + half, second)
    return s


def _apply_double_duration(score: stream.Score) -> stream.Score:
    """全音符・休符の音価を2倍。テンポ表記 (MetronomeMark) は不変 (Tetsuo確定)。
    既存の小節に入れたまま倍にすると小節あふれで割りが崩れるため、
    いったん平坦化してから makeMeasures で再割り付けする (拍子そのまま → 小節数が約2倍)。"""
    s = deepcopy(score)
    out = stream.Score()
    for part in s.parts:
        # augmentOrDiminish(2) = 音価もオフセットも2倍 (音価だけ倍にすると
        # 絶対オフセットが据え置かれ、音が重なって小節割りが崩れる)
        try:
            doubled = part.flatten().augmentOrDiminish(2)
            rebuilt = doubled.makeMeasures()
        except Exception:
            logger.warning("augmentOrDiminish/makeMeasures failed; 変換なしで続行")
            rebuilt = part
        out.append(rebuilt)
    return out
