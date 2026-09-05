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
  pitchNos: 重音 (2026-09-05 Tetsuo)。同時に鳴らす元音符の番号 2〜4個 (pitchNo を含む)。
            あれば1つの和音 (music21 Chord) として書く。例: ①→②→①と②の重音。

対象外の指定 (2026-08-24 Tetsuo追加):
  スコアには冒頭・終わり・途中だけ形が違う小節がある。レシピの
    "skipHead":  先頭から何小節を対象外にするか
    "skipTail":  終わりから何小節を対象外にするか
    "skipMeasures": [3, 7]  対象外にする小節番号 (1始まり) をピンポイントで
  で除外でき、除外した小節にはルールを適用しない (元のまま残す)。
  加えて、先頭単位と形の違う単位は、先頭単位と「頭から一致している部分」にだけ適用し、残りは元のまま残す
  (2026-09-05 Tetsuo確定。カイザー No.10 の4・8小節目は後半2拍だけ形が違う → 前半にだけ適用)。
  境目はレシピの音の区切りと一致するときだけ。合わないときはその単位を丸ごと対象外にする。
"""
from __future__ import annotations

import logging
from copy import deepcopy
from typing import Any

from music21 import articulations, expressions, spanner, stream
from music21 import chord as m21chord
from music21 import note as m21note

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


def note_quarter_length(spec: dict[str, Any]) -> float | None:
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


def apply_rhythm_recipe(score: stream.Score, recipe: dict[str, Any] | None) -> stream.Score:
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

    skip_head = _as_int(recipe.get("skipHead"), 0)
    skip_tail = _as_int(recipe.get("skipTail"), 0)
    skip_set = {_as_int(m, 0) for m in (recipe.get("skipMeasures") or [])}
    skip_set.discard(0)

    out = deepcopy(score)
    applied = skipped = partial = 0
    for part in out.parts:
        measures = list(part.getElementsByClass(stream.Measure))
        if not measures:
            continue
        total_m = len(measures)
        # 対象の起点は「先頭の対象外ぶんを飛ばした位置」。そこの単位を基準の形にする。
        first = min(skip_head, max(0, total_m - unit))
        head_block = [deepcopy(m) for m in measures[first:first + unit]]   # 書き換え前の形を保持 (部分適用の比較用)
        head_sig = _block_signature(head_block)
        for start in range(first, total_m, unit):
            block = measures[start:start + unit]
            if len(block) < unit:
                skipped += 1
                continue
            nums = list(range(start + 1, start + 1 + unit))          # 1始まりの小節番号
            if any(n > total_m - skip_tail for n in nums):           # 終わりから何小節かを除外
                skipped += 1
                continue
            if any(n in skip_set for n in nums):                     # ピンポイント除外
                skipped += 1
                continue
            if _block_signature(block) != head_sig:
                # 形が違う単位: 先頭単位と頭から一致している部分 (拍数 P) にだけ適用する
                prefix_ql = _matching_prefix_ql(head_block, block)
                if prefix_ql <= 0 or not _rewrite_prefix(block, specs, prefix_ql):
                    skipped += 1
                    continue
                partial += 1
                continue
            src_pitches = [n.pitch for m in block for n in m.notes if isinstance(n, m21note.Note)]
            if not src_pitches:
                skipped += 1
                continue
            _rewrite_block(block, src_pitches, specs)
            applied += 1
    logger.info("rhythm recipe applied: unit=%d notes=%d blocks=%d partial=%d skipped=%d",
                unit, len(specs), applied, partial, skipped)
    return out


def _as_int(v: Any, default: int = 0) -> int:
    try:
        return int(v)
    except (TypeError, ValueError):
        return default


def _block_signature(block: list[stream.Measure]) -> str:
    """単位のリズム指紋 (小節ごとの音価の並び)。同じ形かどうかの判定に使う。"""
    parts = []
    for meas in block:
        parts.append(",".join(f"{float(n.duration.quarterLength):.4f}" for n in meas.notesAndRests))
    return "|".join(parts)


def _flat_elements(block: list[stream.Measure]) -> list:
    """単位の音符・休符を並び順に (小節をまたいで) 返す"""
    return [el for meas in block for el in meas.notesAndRests]


def _matching_prefix_ql(head_block: list[stream.Measure], block: list[stream.Measure]) -> float:
    """先頭単位と頭から一致している部分の長さ (quarterLength)。音価の並びで比べる。一致なし=0"""
    a = [float(el.duration.quarterLength) for el in _flat_elements(head_block)]
    b = [float(el.duration.quarterLength) for el in _flat_elements(block)]
    total = 0.0
    for x, y in zip(a, b):
        if abs(x - y) > 1e-6:
            break
        total += x
    return total


def _rewrite_prefix(block: list[stream.Measure], specs: list[dict[str, Any]], prefix_ql: float) -> bool:
    """単位の先頭 prefix_ql 拍ぶんだけをレシピで書き換え、残りは元のまま残す (2026-09-05 部分適用)。
    レシピ側の区切りが prefix_ql にちょうど来ないときは何もせず False。"""
    # レシピの区切りが境目に来るか
    acc = 0.0
    cut = None
    for i, spec in enumerate(specs):
        ql = note_quarter_length(spec)
        if ql is None:
            continue
        acc += ql
        if abs(acc - prefix_ql) < 1e-6:
            cut = i + 1
            break
        if acc > prefix_ql + 1e-6:
            break
    if cut is None:
        return False
    # 元の先頭 prefix_ql 拍ぶんの要素 (音符・休符) を消す。ピッチはその中の音符から引き継ぐ
    removed_ql = 0.0
    src_pitches = []
    for meas in block:
        for el in list(meas.notesAndRests):
            if removed_ql + 1e-6 >= prefix_ql:
                break
            if isinstance(el, m21note.Note):
                src_pitches.append(el.pitch)
            removed_ql += float(el.duration.quarterLength)
            meas.remove(el)
        if removed_ql + 1e-6 >= prefix_ql:
            break
    if not src_pitches:
        return False
    _insert_specs(block, src_pitches, specs[:cut])
    return True


def _rewrite_block(block: list[stream.Measure], src_pitches: list, specs: list[dict[str, Any]]) -> None:
    """単位ぶんの小節群を、レシピどおりの音符列で置き換える (拍割りは順に詰める)。"""
    # 既存の音符・休符を除去 (拍子・調号・小節線などその他の要素は残す)
    for meas in block:
        for el in list(meas.notesAndRests):
            meas.remove(el)
    _insert_specs(block, src_pitches, specs)


def _insert_specs(block: list[stream.Measure], src_pitches: list, specs: list[dict[str, Any]]) -> None:
    """レシピの音符を、単位の先頭から各小節の容量 (barDuration) に順に詰める"""
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
        nos = _chord_indexes(spec, len(src_pitches))
        if nos:
            # 重音: 番号の音を同時に鳴らす (低い方から)
            n = m21chord.Chord([deepcopy(src_pitches[i]) for i in nos])
        else:
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


def _chord_indexes(spec: dict[str, Any], n_src: int) -> list[int]:
    """pitchNos (2〜4個) を元音符の添字 (0始まり・循環・重複なし・昇順) に。単音なら []"""
    raw = spec.get("pitchNos")
    if not isinstance(raw, list):
        return []
    idxs = sorted({(_as_int(x, 0) - 1) % n_src for x in raw if _as_int(x, 0) >= 1})
    return idxs[:4] if len(idxs) >= 2 else []


def _capacity(meas: stream.Measure) -> float:
    """小節の容量 (quarterLength)。拍子が取れないときは 4.0。"""
    try:
        return float(meas.barDuration.quarterLength)
    except Exception:
        return 4.0
