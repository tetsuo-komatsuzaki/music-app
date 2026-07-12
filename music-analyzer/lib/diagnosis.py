# -*- coding: utf-8 -*-
"""
diagnosis.py — 診断エンジン（工程C-2・2026-07-11）

役割（kouteiC-design.md §3 / 検出方法設計書v1.1 / spec§3）:
  採点表(comparison_result) × カルテ(note_karte) を展開対応表で結合し、
  決定関数で per-note 小課題タグを導出 → 集計 → 木ごとの発生数上位2つ = 診断。
  崩壊小節(工程E)も同じ結合レコードから同時算出して同梱する。

計算は1つ・読み出しは2つ（Tetsuo確定 2026-07-11）:
  - per_subtask カウント（miss/target）が唯一の計算結果
  - 窓① 診断 = 今回演奏の木ごと top-2（演奏直後のフィードバック・β伝達文）
  - 窓② 累積 = per_subtask を UserSkillSubScore に足し込み（C-3。傾向・推薦）

C-5 選出ルール改定（Tetsuo確定 2026-07-11・version 2）:
  - top-2 は「ミス数順」→「ミス率順」（広い箱が母数の力で勝つ構造を排除）
  - 対象音数 < MIN_TARGET_FOR_DIAGNOSIS は足切り（1〜2回の事故が率100%になるのを防ぐ）
  - 「変化なし箱」（同一ポジ内 X→X・同一弦×順次）は選出から除外
    （正本カタログの diagnosable=False。カウントは継続＝累積・前提条件に使う）
  - miss_patterns: ミス音符の4軸組（ポジ移動×移弦×指移動 or 音価×技術）を同梱。
    診断には使わず、累積の詳細傾向分析・内訳表示用（§26-4 詳細層の思想）。

ミス大分類の決定（§3）:
  pitch_ok=False → 音程の木 / start_ok=False → リズムの木（両方NGなら両木に独立）
  not_detected（未検知）→ 音程・リズム両木のミスとして扱う（弾けなかった音）

決定関数（§26 の音符属性・遷移属性から機械導出。独立した割り振り工程なし）:
  posshift : position_from×position_to（同ポジ含む25。低信頼は除外 §25 A案）
  double   : chord_intervals×連続/単発（隣接カルテの is_chord で連続判定）
  tech     : karte.technique_tags（13と1:1）
  interval : 弦遷移区分×方向×距離（順次=2度以下/跳躍=3度以上）＋移弦ユニゾン
             （弦依存のため低信頼は除外）
  value    : note_type（付点は基本音価タグ＋付点タグの複数付与 §4-1b）
  tuplet   : analysis.json の tuplet_actual（3/5/6/7以上）
  entry    : rest_before_beats（短≤0.5拍/中≤2拍/長>2拍）×拍表裏
"""
from __future__ import annotations

from typing import List, Optional

from .collapse_detector import detect_collapsed_measures
from .subtask_catalog import diagnosable_ids, v1_active_ids

DIAGNOSIS_TOP_N = 2  # 各木の上位2つ (§26-4)
# C-5 (2026-07-11 Tetsuo確定): 診断はミス率順。対象音数が少なすぎるタグは
# 1〜2回の事故が率100%で最上位に来るため足切りする（カウント自体は継続）。
MIN_TARGET_FOR_DIAGNOSIS = 3
# 累積の詳細分析用 miss_patterns の上限（1木あたり）
MISS_PATTERNS_CAP = 30

# 技術タグ名(正本13・日本語) → カタログID接尾辞
# 2026-07-14 用語改定: ボウ・スタッカート→連続スタッカート / モルデント→プラルトリラーとモルデント
# (カタログID接尾辞 bow_staccato/mordent は歴史的データ互換のため不変)
_TECH_SUFFIX = {
    "スラー": "slur", "ポルタート": "portato", "スタッカート": "staccato",
    "連続スタッカート": "bow_staccato", "スピッカート": "spiccato",
    "リコシェ": "ricochet", "ピチカート": "pizzicato", "トレモロ": "tremolo",
    "ビブラート": "vibrato", "トリル": "trill", "プラルトリラーとモルデント": "mordent",
    "グリッサンド": "glissando", "ナチュラル・ハーモニクス": "harmonic",
}
# 重音の音程種別 → カタログ種別（10度等は「その他」へ §26-4）
_DOUBLE_KIND = {"3度": "third", "4度": "fourth", "5度": "fifth",
                "6度": "sixth", "オクターブ": "octave"}
_STRING_KIND = {"same": "same", "adjacent": "adj", "skip": "skip"}


def _pos_bucket(p: Optional[int]) -> Optional[str]:
    if p is None:
        return None
    return str(p) if p <= 4 else "5plus"


def _context_suffixes(k: dict, is_chord_neighbor: bool, tuplet_actual) -> dict:
    """カルテ1音から文脈タグの接尾辞を導出する（決定関数の本体）。
    戻り値: {"pitch_ctx": [...], "rhythm_only_ctx": [...]}
      pitch_ctx  = posshift/double/tech/interval（音程の木・リズムの木で共用）
      rhythm_only_ctx = value/tuplet/entry（リズムの木のみ）
    """
    ctx: List[str] = []
    low_conf = k.get("position_confidence") == "low"

    # posshift（同ポジ含む完全網羅。弦/ポジ依存 → 低信頼は除外）
    if not low_conf:
        f_b = _pos_bucket(k.get("position_from"))
        t_b = _pos_bucket(k.get("position_to"))
        if f_b is not None and t_b is not None:
            ctx.append(f"posshift_{f_b}_{t_b}")

    # double（重音種別×連続/単発）
    if k.get("is_chord"):
        cont = "cont" if is_chord_neighbor else "single"
        for label in k.get("chord_intervals") or []:
            kind = _DOUBLE_KIND.get(label, "other")
            ctx.append(f"double_{kind}_{cont}")

    # tech（13と1:1）
    for name in k.get("technique_tags") or []:
        sfx = _TECH_SUFFIX.get(name)
        if sfx:
            ctx.append(f"tech_{sfx}")

    # interval（弦遷移×方向×距離。弦依存 → 低信頼は除外）
    if not low_conf:
        kind = _STRING_KIND.get(k.get("string_change_kind") or "")
        deg = k.get("interval_degree")
        if kind is not None and deg is not None:
            if abs(deg) == 1:
                if kind != "same":
                    ctx.append("interval_unison_crossing")
            else:
                direction = "up" if deg > 0 else "down"
                dist = "step" if abs(deg) <= 2 else "leap"
                ctx.append(f"interval_{kind}_{direction}_{dist}")

    # ── リズムの木のみの文脈 ──
    rctx: List[str] = []
    nt = k.get("note_type")
    value_map = {"whole": "whole", "half": "half", "quarter": "quarter",
                 "eighth": "eighth", "16th": "16th",
                 "32nd": "32nd_plus", "64th": "32nd_plus", "128th": "32nd_plus"}
    if nt in value_map:
        rctx.append(f"value_{value_map[nt]}")
    if k.get("is_dotted"):
        rctx.append("value_dotted")  # 付点は基本音価タグと複数付与 (§4-1b)
    if k.get("is_tuplet"):
        ta = tuplet_actual
        if ta in (3, 5, 6):
            rctx.append(f"tuplet_{ta}")
        elif isinstance(ta, int) and ta >= 7:
            rctx.append("tuplet_7plus")
        elif ta is None:
            rctx.append("tuplet_3")  # actual不明時は最頻の三連符に既定
    rb = k.get("rest_before_beats") or 0
    if rb > 0:
        length = "short" if rb <= 0.5 else ("mid" if rb <= 2 else "long")
        beat = "onbeat" if k.get("is_on_beat") else "offbeat"
        rctx.append(f"entry_{length}_{beat}")

    return {"pitch_ctx": ctx, "rhythm_only_ctx": rctx}


def diagnose(
    comparison_results: List[dict],
    note_karte: dict,
    analysis_notes: Optional[List[dict]] = None,
) -> dict:
    """1演奏を診断する（案3: 結果は呼び手が保存・カウンタ加算する）。

    Args:
        comparison_results: comparison_result.json の results[]（演奏順）
        note_karte: note_karte.json の dict（notes / expanded_index_map）
        analysis_notes: analysis.json の notes[]（tuplet_actual 用・任意）

    Returns:
        {version, map_available, per_subtask: {id: {miss, target}},
         diagnosis: {pitch: [id..], rhythm: [id..]}, collapse: {...},
         totals: {played, pitch_miss, rhythm_miss}}
    """
    collapse = detect_collapsed_measures(comparison_results)
    emap = note_karte.get("expanded_index_map")
    karte_notes = note_karte.get("notes") or []

    # 結合キーは comparison の note_index（演奏順=analysis順の通し番号）。
    # comparison は休符を含まないため位置(zip)ではなく note_index で emap を引く。
    if not emap:
        return {
            "version": 2,
            "map_available": False,
            "per_subtask": {},
            "diagnosis": {"pitch": [], "rhythm": []},
            "miss_patterns": {"pitch": [], "rhythm": []},
            "collapse": collapse,
            "totals": {"played": len(comparison_results)},
        }

    karte_by_index = {n["note_index"]: n for n in karte_notes}
    # 連続重音の判定用: 前後の非休符カルテが is_chord か
    ordered = [n for n in karte_notes if not n.get("is_rest")]
    chord_neighbor: dict = {}
    for i, n in enumerate(ordered):
        prev_c = i > 0 and ordered[i - 1].get("is_chord")
        next_c = i + 1 < len(ordered) and ordered[i + 1].get("is_chord")
        chord_neighbor[n["note_index"]] = bool(n.get("is_chord") and (prev_c or next_c))

    active = v1_active_ids()
    per: dict = {}

    def bump(sid: str, miss: bool) -> None:
        if sid not in active:
            return
        d = per.setdefault(sid, {"miss": 0, "target": 0})
        d["target"] += 1
        if miss:
            d["miss"] += 1

    pitch_miss_total = rhythm_miss_total = 0
    # C-5: ミス音符の4軸組パターン（累積の詳細傾向分析用。Tetsuo確定 2026-07-11）
    #   pitch  = ポジション移動 × 移弦 × 指の移動 × 技術タグ
    #   rhythm = ポジション移動 × 移弦 × 音価 × 技術タグ
    pattern_counts: dict = {"pitch": {}, "rhythm": {}}

    for pos, r in enumerate(comparison_results):
        i = r.get("note_index", pos)  # 演奏順の通し番号（休符を含む番号体系）
        if not isinstance(i, int) or i < 0 or i >= len(emap):
            continue
        k = karte_by_index.get(emap[i])
        if k is None or k.get("is_rest"):
            continue
        ta = None
        if analysis_notes and i < len(analysis_notes):
            ta = analysis_notes[i].get("tuplet_actual")
        cx = _context_suffixes(k, chord_neighbor.get(k["note_index"], False), ta)

        undetected = r.get("evaluation_status") == "not_detected"
        pitch_miss = undetected or r.get("pitch_ok") is False
        rhythm_miss = undetected or r.get("start_ok") is False
        pitch_miss_total += 1 if pitch_miss else 0
        rhythm_miss_total += 1 if rhythm_miss else 0

        for sfx in cx["pitch_ctx"]:
            bump(f"pitch_{sfx}", pitch_miss)
            bump(f"rhythm_{sfx}", rhythm_miss)
        for sfx in cx["rhythm_only_ctx"]:
            bump(f"rhythm_{sfx}", rhythm_miss)

        if pitch_miss or rhythm_miss:
            posshift = None
            if k.get("position_from") is not None and k.get("position_to") is not None:
                posshift = f"{_pos_bucket(k['position_from'])}_{_pos_bucket(k['position_to'])}"
            string = k.get("string_change_kind")
            deg = k.get("interval_degree")
            move = None
            if deg is not None:
                if abs(deg) == 1:
                    move = "unison"
                else:
                    move = f"{'up' if deg > 0 else 'down'}_{'step' if abs(deg) <= 2 else 'leap'}"
            tech = ",".join(sorted(
                _TECH_SUFFIX[n] for n in (k.get("technique_tags") or [])
                if n in _TECH_SUFFIX)) or None
            value = k.get("note_type")
            if k.get("is_dotted"):
                value = f"dotted_{value}"
            if pitch_miss:
                key = (posshift, string, move, tech)
                pattern_counts["pitch"][key] = pattern_counts["pitch"].get(key, 0) + 1
            if rhythm_miss:
                key = (posshift, string, value, tech)
                pattern_counts["rhythm"][key] = pattern_counts["rhythm"].get(key, 0) + 1

    # C-5 選出ルール（Tetsuo確定 2026-07-11）:
    #   ①ミス率順（率同点はミス数、次にID） ②対象<3は足切り
    #   ③「変化なし箱」(diagnosable=False: 同一ポジ内/同一弦×順次) は選出対象外
    #     — カウント/累積には全タグ残る（教材選びの前提条件・詳細分析用）
    diag_ok = diagnosable_ids()

    def top_n(tree: str) -> List[str]:
        cand = [(sid, d) for sid, d in per.items()
                if sid.startswith(f"{tree}_") and d["miss"] > 0
                and sid in diag_ok and d["target"] >= MIN_TARGET_FOR_DIAGNOSIS]
        cand.sort(key=lambda x: (-x[1]["miss"] / x[1]["target"], -x[1]["miss"], x[0]))
        return [sid for sid, _ in cand[:DIAGNOSIS_TOP_N]]

    def patterns_out(tree: str) -> List[dict]:
        fields = ("posshift", "string", "move", "tech") if tree == "pitch" \
            else ("posshift", "string", "value", "tech")
        items = sorted(pattern_counts[tree].items(), key=lambda x: (-x[1], str(x[0])))
        return [dict(zip(fields, key), count=n) for key, n in items[:MISS_PATTERNS_CAP]]

    return {
        "version": 2,
        "map_available": True,
        "per_subtask": per,
        "diagnosis": {"pitch": top_n("pitch"), "rhythm": top_n("rhythm")},
        "miss_patterns": {"pitch": patterns_out("pitch"), "rhythm": patterns_out("rhythm")},
        "collapse": collapse,
        "totals": {
            "played": len(comparison_results),
            "pitch_miss": pitch_miss_total,
            "rhythm_miss": rhythm_miss_total,
        },
    }
