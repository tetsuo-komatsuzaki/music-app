"""
rhythm_recipe.py — くり返し単位のリズムを組み替える (2026-08-24 要件確定)

Tetsuo確定仕様:
  - 反復教材 (同じリズムの小節がくり返される譜面) で、1単位ぶんのリズムを
    自由に組み替えると、同じ形の単位すべてに同じ変換が適用される。
  - 新しい音符は「長さ (音価) + 高さ (元の音符の通し番号) + 弾き方 (奏法)」で決まる。
    高さは自動で順送りせず、レシピが番号で明示する。
  - 拍の合計は単位の長さと一致していること (UI とここの両方で検証する)。
  - スラーは範囲 (slurId が同じ連続音) を1本の弧にする。

レシピ形式:
  {
    "name": "16分8つ→8分4つ",
    "unitMeasures": 1,
    "notes": [
      {"base": "s", "dot": false, "triplet": false, "pitchNo": 1,
       "articulation": "staccato", "slurId": null},
      ...
    ]
  }
  base: w=全 h=2分 q=4分 e=8分 s=16分 t=32分 (dot=1.5倍 / triplet=2/3倍)
  pitchNo: その単位内の元音符の通し番号 (1始まり)。範囲外は循環させる。
"""
from __future__ import annotations

import logging
from copy import deepcopy
from typing import Any, Optional

from music21 import articulations, expressions, note as m21note, spanner, stream

logger = logging.getLogger(__name__)

# 音価 (4分音符=1.0 の quarterLength)
BASE_QL = {"w": 4.0, "h": 2.0, "q": 1.0, "e": 0.5, "s": 0.25, "t": 0.125}

ART_CLS = {
    "legato": articulations.Tenuto,
    "tenuto": articulations.Tenuto,
    "staccato": articulations.Staccato,
    "spiccato": articulations.Spiccato,
    "martele": articulations.StrongAccent,
    "portato": articulations.DetachedLegato,
    "accent": articulations.Accent,
}


def note_quarter_length(spec: dict[str, Any]) -> Optional[float]:
    """1音のレシピから quarterLength を求める。base が不正なら None。"""
    ql = BASE_QL.get(str(spec.get("base", "")))
    if ql is None:
        return None
    if spec.get("dot"):
        ql *= 1.5
    if spec.get("triplet"):
        ql *= 2.0 / 3.0
    return ql


def recipe_total_ql(recipe: dict[str, Any]) -> float:
    """レシピ1単位ぶんの合計 quarterLength。"""
    total = 0.0
    for spec in recipe.get("notes", []):
        ql = note_quarter_length(spec)
        if ql:
            total += ql
    return total


def apply_rhythm_recipe(score: stream.Score, recipe: Optional[dict[str, Any]]) -> stream.Score:
    """rhythmRecipe を適用した Score を返す。対象外ならそのまま返す。

    単位 (unitMeasures 小節) ごとに、その単位内の音符の高さを番号で引き継ぎつつ、
    レシピのリズム・奏法・スラーで小節を作り直す。単位内の音符数が 0 の区間
    (全休符など) は変換しない。
    """
    if not recipe or not isinstance(recipe, dict):
        return score
    specs = [s for s in recipe.get("notes", []) if isinstance(s, dict) and note_quarter_length(s)]
    if not specs:
        return score
    try:
        unit = max(1, int(recipe.get("unitMeasures") or 1))
    except (ValueError, TypeError):
        unit = 1

    out = deepcopy(score)
    for part in out.parts:
        measures = list(part.getElementsByClass(stream.Measure))
        if not measures:
            continue
        for start in range(0, len(measures), unit):
            block = measures[start:start + unit]
            src_pitches = [n.pitch for m in block for n in m.notes if isinstance(n, m21note.Note)]
            if not src_pitches:
                continue
            _rewrite_block(block, src_pitches, specs)
    logger.info("rhythm recipe applied: unit=%d notes=%d", unit, len(specs))
    return out


def _rewrite_block(block: list[stream.Measure], src_pitches: list, specs: list[dict[str, Any]]) -> None:
    """単位ぶんの小節群を、レシピどおりの音符列で置き換える (拍割りは順に詰める)。"""
    # 既存の音符・休符を除去 (拍子・調号・小節線などその他の要素は残す)
    for meas in block:
        for el in list(meas.notesAndRests):
            meas.remove(el)

    # レシピの音符を、各小節の容量 (barDuration) に順に詰める
    slur_groups: dict[Any, list[m21note.Note]] = {}
    mi, offset = 0, 0.0
    cap = _capacity(block[0])
    for spec in specs:
        ql = note_quarter_length(spec)
        if ql is None:
            continue
        if mi >= len(block):
            break
        if offset + ql > cap + 1e-9:      # 小節をまたぐときは次の小節へ (端数は詰めない)
            mi += 1
            if mi >= len(block):
                break
            offset = 0.0
            cap = _capacity(block[mi])
        n = m21note.Note()
        idx = (int(spec.get("pitchNo", 1)) - 1) % len(src_pitches)
        n.pitch = deepcopy(src_pitches[idx])
        n.duration.quarterLength = ql
        art_id = str(spec.get("articulation") or "")
        if art_id == "tremolo":
            t = expressions.Tremolo()
            try:
                t.numberOfMarks = 2
            except Exception:
                pass
            n.expressions.append(t)
        elif art_id in ART_CLS:
            n.articulations.append(ART_CLS[art_id]())
        block[mi].insert(offset, n)
        offset += ql
        sid = spec.get("slurId")
        if sid:
            slur_groups.setdefault(sid, []).append(n)

    # スラー (同じ slurId の音を1本の弧で結ぶ。2音以上のときだけ)
    for notes in slur_groups.values():
        if len(notes) >= 2:
            block[0].insert(0, spanner.Slur(notes))


def _capacity(meas: stream.Measure) -> float:
    """小節の容量 (quarterLength)。拍子が取れないときは 4.0。"""
    try:
        return float(meas.barDuration.quarterLength)
    except Exception:
        return 4.0
