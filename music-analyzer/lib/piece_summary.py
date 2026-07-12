# -*- coding: utf-8 -*-
"""
piece_summary.py — 音符カルテ(note_karte)から「曲の要約」を集約する（工程A-3・2026-07-10）

役割（設計書 kouteiA-design.md §1-2/§2-3〜§2-6）:
  カルテ(全音符の属性) + analysis.json(music21由来のオーナメント情報) を材料に、
  曲/教材単位の要約 = 音域・ポジション・副次調・特徴タグ・技術タグ・要確認キュー
  を作る。カルテが原本、要約は目次。

同時に per-note の technique_tags / technique_ambiguous をカルテに書き戻す。

方針:
  - 特徴タグ名は FeatureTag マスタ(工程Fシード)と同一文字列。
  - 技術タグ名は正本13(TechniqueTag マスタ)と同一文字列。
  - スタッカート点は曖昧記号(§18-2) → 「スタッカート」を仮付与 + needs_confirmation に記録。
  - タグ付与は閾値なし(1回の出現で付与 §17)。
"""
from __future__ import annotations

import math
from typing import List, Optional

from .violin_position import diatonic_index

# ---------------------------------------------------------------------------
# 調号 (fifths) → 主音。mode は主調の mode を引き継ぐ (§2-4 決定ルール)
# ---------------------------------------------------------------------------
_FIFTHS_MAJOR = {0: "C", 1: "G", 2: "D", 3: "A", 4: "E", 5: "B", 6: "F#", 7: "C#",
                 -1: "F", -2: "Bb", -3: "Eb", -4: "Ab", -5: "Db", -6: "Gb", -7: "Cb"}
_FIFTHS_MINOR = {0: "A", 1: "E", 2: "B", 3: "F#", 4: "C#", 5: "G#", 6: "D#", 7: "A#",
                 -1: "D", -2: "G", -3: "C", -4: "F", -5: "Bb", -6: "Eb", -7: "Ab"}

# 調号による各音名の変化 (シャープはF C G D A E B の順、フラットは B E A D G C F)
_SHARP_ORDER = ["F", "C", "G", "D", "A", "E", "B"]
_FLAT_ORDER = ["B", "E", "A", "D", "G", "C", "F"]
_LETTER_SEMITONE = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
_NEXT_LETTER = {"C": "D", "D": "E", "E": "F", "F": "G", "G": "A", "A": "B", "B": "C"}


def _key_alter(fifths: int, letter: str) -> int:
    """調号 fifths のもとで音名 letter に付く変化 (+1/0/-1)。"""
    if fifths > 0:
        return 1 if letter in _SHARP_ORDER[:fifths] else 0
    if fifths < 0:
        return -1 if letter in _FLAT_ORDER[:abs(fifths)] else 0
    return 0


def _trill_upper_midi(step: str, octave: int, fifths: int) -> Optional[int]:
    """トリルの上側音の MIDI (§25: 上側音は調に応じて推定加算)。"""
    up = _NEXT_LETTER.get(step)
    if up is None:
        return None
    up_octave = octave + 1 if step == "B" else octave
    return (up_octave + 1) * 12 + _LETTER_SEMITONE[up] + _key_alter(fifths, up)


def _hz_to_midi(hz: float) -> Optional[int]:
    if not hz or hz <= 0:
        return None
    return round(69 + 12 * math.log2(hz / 440.0))


# ---------------------------------------------------------------------------
# 本体
# ---------------------------------------------------------------------------


def build_piece_summary(
    karte_notes: List,
    karte_meta: dict,
    analysis_result: Optional[dict] = None,
) -> dict:
    """カルテ + analysis.json から曲の要約を作り、per-note technique_tags を書き戻す。

    Args:
        karte_notes: extract_note_karte() の notes (SkillInfoNote)。
                     ミュータブル: technique_tags / technique_ambiguous を書き戻す。
        karte_meta:  extract_note_karte() の meta (key_fifths_changes 含む)。
        analysis_result: analyze_musicxml が構築する analysis.json 相当 dict
                     (notes[].is_tremolo/is_trill/is_harmonic/sounding_pitch_hz/
                      is_glissando/is_mordent/is_tied, spanners.hairpins, key)。
                     None の場合はカルテのみで判定できる範囲に縮退。

    Returns:
        piece 要約 dict (§1-2): pitch_min/pitch_max/positions/sub_keys/
        feature_tags/technique_tags/needs_confirmation/has_multiple_voices/
        index_aligned
    """
    a_notes = (analysis_result or {}).get("notes", [])
    index_aligned = len(a_notes) == len(karte_notes)
    key_info = (analysis_result or {}).get("key") or {}
    main_mode = str(key_info.get("mode") or "major").lower()

    fifths_changes = karte_meta.get("key_fifths_changes") or []
    main_fifths = fifths_changes[0]["fifths"] if fifths_changes else 0

    midis: list[int] = []
    positions: set[int] = set()
    feature_tags: set[str] = set()
    technique_tags: set[str] = set()
    needs_confirmation: dict[str, dict] = {}

    consecutive_chords = 0

    for i, n in enumerate(karte_notes):
        a = a_notes[i] if (index_aligned and i < len(a_notes)) else {}

        if n.is_rest:
            if n.is_on_beat:
                feature_tags.add("拍頭休符")
            consecutive_chords = 0
            continue

        # ── 音域走査 (§2-3: 重音全構成音・装飾音符を含む) ──
        note_midis = list(n.chord_midis) if n.chord_midis else ([n.midi] if n.midi else [])
        if a.get("is_harmonic"):
            # ハーモニクスは実音で判定 (記譜音は範囲に入れない)
            sm = _hz_to_midi(a.get("sounding_pitch_hz") or 0)
            if sm is not None:
                note_midis = [sm]
        midis.extend(m for m in note_midis if m is not None)
        if a.get("is_trill") and n.step is not None and n.octave is not None:
            upper = _trill_upper_midi(n.step, n.octave, main_fifths)
            if upper is not None:
                midis.append(upper)

        # ── ポジション ──
        if n.position is not None:
            positions.add(n.position)

        # ── リズム系 FeatureTag (§2-5) ──
        if n.note_type == "eighth":
            feature_tags.add("8分音符")
        elif n.note_type == "16th":
            feature_tags.add("16分音符")
        elif n.note_type in ("32nd", "64th", "128th"):
            feature_tags.add("32分音符")
        if n.is_dotted:
            feature_tags.add("付点")
        if n.is_tuplet:
            feature_tags.add("連符")
        if n.is_grace:
            feature_tags.add("装飾音符")
        if n.rest_before_beats and n.rest_before_beats > 0 and n.is_on_beat is False:
            feature_tags.add("裏拍開始")
        # シンコペーション: 拍境界を跨ぐタイ (§19-2)
        if (
            a.get("is_tied")
            and n.beat_offset is not None and n.duration_beats is not None
            and math.floor(n.beat_offset + n.duration_beats - 1e-6) > math.floor(n.beat_offset + 1e-6)
        ):
            feature_tags.add("シンコペーション")

        # ── 重音系 FeatureTag ──
        if n.is_chord:
            for label in n.chord_intervals or []:
                feature_tags.add(label)
            consecutive_chords += 1
            if consecutive_chords >= 2:
                feature_tags.add("連続重音")
        else:
            consecutive_chords = 0

        # ── 技術タグ (per-note 書き戻し + 曲集約) ──
        tags: set[str] = set()
        ambiguous = False
        if n.is_in_slur:
            tags.add("スラー")
        artic = getattr(n, "_artic", {}) or {}
        if artic.get("spiccato"):
            tags.add("スピッカート")  # 明示要素は信頼 (§18-2)
        if artic.get("detached_legato"):
            tags.add("ポルタート")  # 明示要素は信頼
        if artic.get("pizzicato") or "Pizzicato" in (a.get("articulations") or []):
            tags.add("ピチカート")
        if artic.get("staccato") or "Staccato" in (a.get("articulations") or []):
            # 曖昧記号: スタッカート点 → 仮付与 + 要確認 (§18-2, 決定#4)
            tags.add("スタッカート")
            ambiguous = True
            pattern = "staccato_inside_slur" if n.is_in_slur else "staccato_outside_slur"
            entry = needs_confirmation.setdefault(
                pattern, {"pattern": pattern, "measure_indexes": [], "note_indexes": []}
            )
            if n.measure_index not in entry["measure_indexes"]:
                entry["measure_indexes"].append(n.measure_index)
            entry["note_indexes"].append(n.note_index)
        if a.get("is_tremolo"):
            tags.add("トレモロ")
        if a.get("is_trill"):
            tags.add("トリル")
        if a.get("is_mordent"):
            # 2026-07-14 用語改定: 旧称モルデント (Mordent/InvertedMordent両方を検出)
            tags.add("プラルトリラーとモルデント")
        if a.get("is_glissando"):
            tags.add("グリッサンド")
        if a.get("is_harmonic"):
            tags.add("ナチュラル・ハーモニクス")

        n.technique_tags = sorted(tags) if tags else None
        n.technique_ambiguous = ambiguous
        technique_tags.update(tags)

    # ── 強弱 FeatureTag (analysis.json の hairpins から) ──
    for hp in ((analysis_result or {}).get("spanners") or {}).get("hairpins", []) or []:
        hp_type = str(hp.get("type", "")).lower()
        if "cresc" in hp_type or hp_type == "<":
            feature_tags.add("クレッシェンド")
        elif "dim" in hp_type or "decresc" in hp_type or hp_type == ">":
            feature_tags.add("デクレッシェンド")
        else:
            # type 情報が無い hairpin は両方の可能性 → 保守的にクレッシェンドのみ付与しない
            pass

    # ── 副次調 (§2-4: 調号変更のみ・mode は主調を引き継ぐ・主調と同一は除外) ──
    sub_keys: list[dict] = []
    table = _FIFTHS_MINOR if main_mode == "minor" else _FIFTHS_MAJOR
    seen: set[tuple] = set()
    for i, ch in enumerate(fifths_changes[1:], start=1):
        tonic = table.get(ch["fifths"])
        if tonic is None or ch["fifths"] == main_fifths:
            continue
        key = (tonic, main_mode)
        if key in seen:
            continue
        seen.add(key)
        sub_keys.append(
            {"tonic": tonic, "mode": main_mode, "sort_order": len(sub_keys) + 1,
             "measure_index": ch["measure_index"]}
        )

    return {
        "pitch_min": min(midis) if midis else None,
        "pitch_max": max(midis) if midis else None,
        "positions": sorted(positions),
        "sub_keys": sub_keys,
        "feature_tags": sorted(feature_tags),
        "technique_tags": sorted(technique_tags),
        "needs_confirmation": list(needs_confirmation.values()),
        "has_multiple_voices": bool(karte_meta.get("has_multiple_voices")),
        "index_aligned": index_aligned,
    }


# ---------------------------------------------------------------------------
# 展開対応表 (工程C 前提・2026-07-10 Tetsuo 承認方式)
#
# 演奏順 (analysis.json / comparison_result の並び = リピート展開後) の i 番目の音が
# 「書かれた楽譜のどのカルテか」を引くリストを作る。
#   実証: きらきら星 = analysis 64音の小節番号列が 1..8, 1..8(2周目), 9..24 と
#   元の小節番号のまま繰り返して記録されている (32/32 区間一致・2026-07-10 実測)。
#   → 判断は不要、小節番号列を写すだけの機械作業。
# 安全装置: 1区間でも「その小節の音数」がカルテと一致しなければ対応表を作らない
#   (誤対応で誤診断するくらいなら音符単位分析をスキップ)。
# ---------------------------------------------------------------------------


def build_expansion_map(karte_notes: List, analysis_notes: List[dict]):
    """演奏順 → カルテ note_index の対応表を構築する。

    Returns:
        (mapping, status)
        mapping: list[int] (長さ = len(analysis_notes)) または None
        status : "ok" / "no_measure_number" / "measure_missing:<m>" / "count_mismatch:<m>"
    """
    # カルテを小節番号ごとに (楽譜の順で) グループ化
    by_measure: dict[int, list[int]] = {}
    for n in karte_notes:
        m = n.measure_number if n.measure_number is not None else n.measure_index + 1
        by_measure.setdefault(m, []).append(n.note_index)

    # 演奏順を「同一小節の連続区間」に圧縮
    runs: list[tuple[int, int]] = []  # (measure_number, count)
    for a in analysis_notes:
        m = a.get("measure_number")
        if m is None:
            return None, "no_measure_number"
        if runs and runs[-1][0] == m:
            runs[-1] = (m, runs[-1][1] + 1)
        else:
            runs.append((m, 1))

    # 検証: 全区間の音数がカルテの当該小節の音数と一致すること
    for m, cnt in runs:
        karte_measure = by_measure.get(m)
        if karte_measure is None:
            return None, f"measure_missing:{m}"
        if len(karte_measure) != cnt:
            return None, f"count_mismatch:{m}"

    # 構築: 区間ごとにカルテの該当小節の note_index をそのまま並べる
    mapping: list[int] = []
    for m, _cnt in runs:
        mapping.extend(by_measure[m])
    return mapping, "ok"
