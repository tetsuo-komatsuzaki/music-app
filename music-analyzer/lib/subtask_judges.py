"""
subtask_judges.py — 個別課題 v1 (2026-05-25) スケルトン

旧 9 sub task (pitch_overall/pitch_high/pitch_chromatic、rhythm_overall/rhythm_fast/
rhythm_after_rest、string_change_volume/slur/timing) は完全廃止し、新 57 項目
+ 将来検討 2 = 計 59 項目のスケルトン実装に置換。

各項目の本判定ロジックは別タスクで段階的に充填:
  [[project_subtask_quality_judgment_deferred]] (音色軸の音声側品質判定)
  + 抽出ロジック全般 (Tetsuo 「またあとで精査」確定 2026-05-25)

現状の挙動:
  - 全 sub_task が target_count=0 を返す → skill_aggregator では集計対象外
  - 中項目スコア (pitch / rhythm / bowing) は配下全 0 件のため None になる
  - Phase 3b の MissingPracticeItemFlag 生成は走るが target=0 のため発火せず
  - 既存音響解析 (pitch_ok / start_ok per note) は analyze_performance.py で別途実行
    されており、本ファイル変更の影響なし

本ファイルの判定ロジックを段階的に実装する際は、各 sub_task_id の helper を
追加して run_all_judges からの呼び出しに置換する。
"""

from __future__ import annotations

from typing import Callable, List

from .integrated_note import (
    IntegratedNote,
    IntegratedScoreData,
    SubTaskResult,
    calculate_subtask_score_hybrid,
)


# 解析可能性の検出割合閾値 (旧来踏襲、v3.2 §6-3 A1)
DETECTION_RATE_MIN = 0.50


# 発火条件 (課題カード化) の閾値。
# [[project_skill_scoring_firing_spec]] 2026-06-07 Tetsuo 確定:
#   matched = (target_count >= FIRE_MIN_SAMPLES) かつ (score < FIRE_SCORE_THRESHOLD)
FIRE_MIN_SAMPLES = 3
FIRE_SCORE_THRESHOLD = 70.0


# ---------------------------------------------------------------------------
# 個別課題 v1 全 59 項目の sub_task_id
# (TS app/_libs/skillMaster.ts SUB_TASK_IDS と一対一対応)
# ---------------------------------------------------------------------------

ALL_SUB_TASK_IDS: list[str] = [
    # ─── 音程 (18) ───
    "pitch_position_2", "pitch_position_3", "pitch_position_4", "pitch_position_5plus",
    "pitch_shift_up", "pitch_shift_down",
    "pitch_double_stop_2", "pitch_double_stop_3plus", "pitch_double_stop_continuous",
    "pitch_harmonic",
    "pitch_interval_up_2nd_plus", "pitch_interval_up_3rd_plus",
    "pitch_interval_down_2nd_plus", "pitch_interval_down_3rd_plus",
    "pitch_finger_1", "pitch_finger_2", "pitch_finger_3", "pitch_finger_4",
    # ─── リズム (17、うち 1 将来検討) ───
    "rhythm_value_whole", "rhythm_value_half", "rhythm_value_16th",
    "rhythm_value_32nd_plus", "rhythm_value_dotted",
    "rhythm_pattern_triplet", "rhythm_pattern_2plet_plus",
    "rhythm_entry_after_rest",
    "rhythm_technique_martele", "rhythm_technique_staccato", "rhythm_technique_spiccato",
    "rhythm_technique_ricochet",  # 将来検討
    "rhythm_technique_tremolo", "rhythm_technique_portato", "rhythm_technique_trill",
    "rhythm_technique_arpeggio", "rhythm_technique_glissando",
    # ─── 弦移動 (24、うち 1 将来検討) ───
    "bowing_technique_staccato", "bowing_technique_hooked_staccato",
    "bowing_technique_spiccato",
    "bowing_technique_ricochet",  # 将来検討
    "bowing_technique_pizzicato", "bowing_technique_tremolo",
    "bowing_technique_portato", "bowing_technique_trill",
    "bowing_technique_arpeggio", "bowing_technique_glissando",
    "bowing_technique_harmonic",
    "bowing_string_g", "bowing_string_d", "bowing_string_a", "bowing_string_e",
    "bowing_string_change_g_to_d", "bowing_string_change_d_to_g",
    "bowing_string_change_d_to_a", "bowing_string_change_a_to_d",
    "bowing_string_change_a_to_e", "bowing_string_change_e_to_a",
    "bowing_double_stop_2", "bowing_double_stop_3plus", "bowing_double_stop_continuous",
]


# ---------------------------------------------------------------------------
# 解析可能性チェック (旧来踏襲、v3 §6-3 A1)
# ---------------------------------------------------------------------------


def is_performance_analyzable(data: IntegratedScoreData) -> bool:
    """A1 確定：検出割合 < 50% なら解析スキップ。

    Returns:
        True なら解析可能、False なら全 sub task 判定をスキップして null を返す
    """
    non_rest_notes = [n for n in data.notes if not n.is_rest]
    if not non_rest_notes:
        return False

    detected_count = sum(1 for n in non_rest_notes if n.is_detected)
    detection_rate = detected_count / len(non_rest_notes)

    return detection_rate >= DETECTION_RATE_MIN


# ---------------------------------------------------------------------------
# スケルトン判定 (target_count=0 で集計対象外を返す)
# ---------------------------------------------------------------------------


def _skipped_result(sub_task_id: str) -> SubTaskResult:
    """個別課題 v1 暫定スケルトン: 評価対象なし (target_count=0) を返す。

    各項目の本実装は別タスクで段階的に充填する。
    """
    return SubTaskResult(
        sub_task_id=sub_task_id,
        score=0.0,
        matched=False,
        sample_size=0,
        target_count=0,
        bad_count=0,
        details=None,
        details_with_count=None,
    )


# ---------------------------------------------------------------------------
# 第一弾スキル判定 (属性で即時実装可能、IntegratedNote に属性あり)
# [[project_skill_scoring_firing_spec]] 2026-06-07 確定:
#   ① 点 = 対象音符のうち OK だった割合 (calculate_subtask_score_hybrid)
#       - 音程系 → OK = pitch_ok
#       - リズム系 → OK = start_ok
#       - 弓・弦系 → OK = pitch_ok かつ start_ok
#       対象 = 属性で絞った非休符音符のうち、該当 ok が None でない (評価可能) もの
#   ② 発火 (matched=True) = target_count >= 3 かつ score < 70
# ---------------------------------------------------------------------------


# 弦 ID は IntegratedNote.string_id では大文字 ("G"/"D"/"A"/"E")、
# sub_task_id では小文字 (g/d/a/e) のため対応表で橋渡しする。
_STRING_LABEL: dict[str, str] = {"g": "G", "d": "D", "a": "A", "e": "E"}


def _pitch_evaluable(n: IntegratedNote) -> bool:
    """音程系: pitch_ok が判定済み (None でない) なら評価可能。"""
    return n.pitch_ok is not None


def _pitch_bad(n: IntegratedNote) -> bool:
    return n.pitch_ok is False


def _timing_evaluable(n: IntegratedNote) -> bool:
    """リズム系: start_ok が判定済みなら評価可能。"""
    return n.start_ok is not None


def _timing_bad(n: IntegratedNote) -> bool:
    return n.start_ok is False


def _bow_evaluable(n: IntegratedNote) -> bool:
    """弓・弦系: pitch_ok と start_ok の両方が判定済みなら評価可能。"""
    return n.pitch_ok is not None and n.start_ok is not None


def _bow_bad(n: IntegratedNote) -> bool:
    return n.pitch_ok is False or n.start_ok is False


def _judge(
    sub_task_id: str,
    target_notes: List[IntegratedNote],
    is_bad: Callable[[IntegratedNote], bool],
) -> SubTaskResult:
    """対象音符と is_bad から SubTaskResult を組み立てる (① 点 + ② 発火)。

    target_notes は呼び出し側で「属性で絞った非休符かつ評価可能」に絞り込み済み。
    target_count == 0 のときは calculate_subtask_score_hybrid が score=100 を返し、
    matched=False (skill_aggregator が集計から除外) になる。
    """
    score, target_count, bad_count = calculate_subtask_score_hybrid(
        target_notes, is_bad
    )
    matched = target_count >= FIRE_MIN_SAMPLES and score < FIRE_SCORE_THRESHOLD
    return SubTaskResult(
        sub_task_id=sub_task_id,
        score=score,
        matched=matched,
        sample_size=target_count,
        target_count=target_count,
        bad_count=bad_count,
        details=None,
        details_with_count=None,
    )


def _judge_string(data: IntegratedScoreData, sub_task_id: str, label: str) -> SubTaskResult:
    """bowing_string_{g,d,a,e}: 指定弦上の非休符音符。OK = 音程かつタイミング。"""
    targets = [
        n
        for n in data.notes
        if not n.is_rest and n.string_id == label and _bow_evaluable(n)
    ]
    return _judge(sub_task_id, targets, _bow_bad)


def _judge_finger(data: IntegratedScoreData, sub_task_id: str, finger: int) -> SubTaskResult:
    """pitch_finger_{1..4}: 指定運指の非休符音符。OK = 音程。"""
    targets = [
        n
        for n in data.notes
        if not n.is_rest and n.finger == finger and _pitch_evaluable(n)
    ]
    return _judge(sub_task_id, targets, _pitch_bad)


def _judge_string_change(
    data: IntegratedScoreData, sub_task_id: str, src: str, dst: str
) -> SubTaskResult:
    """bowing_string_change_{src}_to_{dst}: 連続非休符で src→dst に弦移動した音符。

    対象 = 直前の非休符音符が src 弦、当該音符が dst 弦の遷移先音符。OK = 音程かつタイミング。
    """
    non_rest = [n for n in data.notes if not n.is_rest]
    targets = [
        curr
        for prev, curr in zip(non_rest, non_rest[1:])
        if prev.string_id == src and curr.string_id == dst and _bow_evaluable(curr)
    ]
    return _judge(sub_task_id, targets, _bow_bad)


def _judge_after_rest(data: IntegratedScoreData) -> SubTaskResult:
    """rhythm_entry_after_rest: 直前が休符だった音符の入り。OK = タイミング。"""
    targets = [
        n
        for n in data.notes
        if not n.is_rest and n.is_after_rest and _timing_evaluable(n)
    ]
    return _judge("rhythm_entry_after_rest", targets, _timing_bad)


# ---------------------------------------------------------------------------
# 第二弾 2a: 重音 (double stop) / ハーモニクス (2026-06-07)
# is_chord / pitch_count / is_harmonic は note_integration が analysis.json から配線。
# ---------------------------------------------------------------------------


def _continuous_chord_ids(data: IntegratedScoreData) -> set[int]:
    """連続する重音（前後どちらかの非休符音符も重音）の id 集合を返す。"""
    non_rest = [n for n in data.notes if not n.is_rest]
    result: set[int] = set()
    for i, n in enumerate(non_rest):
        if not n.is_chord:
            continue
        prev_chord = i > 0 and non_rest[i - 1].is_chord
        next_chord = i < len(non_rest) - 1 and non_rest[i + 1].is_chord
        if prev_chord or next_chord:
            result.add(id(n))
    return result


def _judge_double_stop(
    data: IntegratedScoreData,
    sub_task_id: str,
    predicate: Callable[[IntegratedNote], bool],
    is_pitch_axis: bool,
) -> SubTaskResult:
    """重音 sub_task。pitch 系は OK=音程、bowing 系は OK=音程かつタイミング。"""
    evaluable = _pitch_evaluable if is_pitch_axis else _bow_evaluable
    is_bad = _pitch_bad if is_pitch_axis else _bow_bad
    targets = [
        n
        for n in data.notes
        if not n.is_rest and n.is_chord and predicate(n) and evaluable(n)
    ]
    return _judge(sub_task_id, targets, is_bad)


def _judge_harmonic(
    data: IntegratedScoreData, sub_task_id: str, is_pitch_axis: bool
) -> SubTaskResult:
    """ハーモニクス sub_task。pitch 系は OK=音程、bowing 系は OK=音程かつタイミング。"""
    evaluable = _pitch_evaluable if is_pitch_axis else _bow_evaluable
    is_bad = _pitch_bad if is_pitch_axis else _bow_bad
    targets = [
        n
        for n in data.notes
        if not n.is_rest and n.is_harmonic and evaluable(n)
    ]
    return _judge(sub_task_id, targets, is_bad)


def _run_chord_harmonic_judges(data: IntegratedScoreData) -> dict[str, SubTaskResult]:
    """第二弾 2a: 重音 (2/3plus/continuous) × pitch/bowing + ハーモニクス × pitch/bowing。"""
    cont_ids = _continuous_chord_ids(data)
    preds: dict[str, Callable[[IntegratedNote], bool]] = {
        "2": lambda n: n.pitch_count == 2,
        "3plus": lambda n: n.pitch_count >= 3,
        "continuous": lambda n: id(n) in cont_ids,
    }
    results: dict[str, SubTaskResult] = {}
    for suffix, pred in preds.items():
        results[f"pitch_double_stop_{suffix}"] = _judge_double_stop(
            data, f"pitch_double_stop_{suffix}", pred, is_pitch_axis=True
        )
        results[f"bowing_double_stop_{suffix}"] = _judge_double_stop(
            data, f"bowing_double_stop_{suffix}", pred, is_pitch_axis=False
        )
    results["pitch_harmonic"] = _judge_harmonic(data, "pitch_harmonic", is_pitch_axis=True)
    results["bowing_technique_harmonic"] = _judge_harmonic(
        data, "bowing_technique_harmonic", is_pitch_axis=False
    )
    return results


def _run_first_batch_judges(
    data: IntegratedScoreData,
) -> dict[str, SubTaskResult]:
    """第一弾スキルの本判定を実行し sub_task_id → SubTaskResult を返す。"""
    results: dict[str, SubTaskResult] = {}

    # 弦 (G/D/A/E)
    for key, label in _STRING_LABEL.items():
        results[f"bowing_string_{key}"] = _judge_string(
            data, f"bowing_string_{key}", label
        )

    # 運指 (1〜4)
    for finger in (1, 2, 3, 4):
        results[f"pitch_finger_{finger}"] = _judge_finger(
            data, f"pitch_finger_{finger}", finger
        )

    # 弦移動 (隣接弦の双方向)
    for src_key, dst_key in (
        ("g", "d"), ("d", "g"), ("d", "a"), ("a", "d"), ("a", "e"), ("e", "a"),
    ):
        sub_id = f"bowing_string_change_{src_key}_to_{dst_key}"
        results[sub_id] = _judge_string_change(
            data, sub_id, _STRING_LABEL[src_key], _STRING_LABEL[dst_key]
        )

    # 休符明けの入り
    results["rhythm_entry_after_rest"] = _judge_after_rest(data)

    return results


def run_all_judges(data: IntegratedScoreData) -> dict[str, SubTaskResult]:
    """個別課題 v1 全 59 項目の判定を実行する。

    第一弾 (弦・運指・弦移動・休符明け) + 第二弾 2a (重音・ハーモニクス) は
    本判定を行い、それ以外はスケルトン (target_count=0、集計対象外) を返す。
    残りの第二弾 (ポジション/音程跳躍/音価/連符/奏法) は属性追加 or 音声側品質
    判定が必要なため別 PR で段階的に充填する ([[project_skill_scoring_firing_spec]])。

    Returns:
        sub_task_id をキーとする SubTaskResult の辞書 (全 59 エントリ)
    """
    implemented: dict[str, SubTaskResult] = {}
    implemented.update(_run_first_batch_judges(data))
    implemented.update(_run_chord_harmonic_judges(data))
    return {
        sub_id: implemented.get(sub_id) or _skipped_result(sub_id)
        for sub_id in ALL_SUB_TASK_IDS
    }
