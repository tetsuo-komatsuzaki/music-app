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

from .integrated_note import IntegratedScoreData, SubTaskResult


# 解析可能性の検出割合閾値 (旧来踏襲、v3.2 §6-3 A1)
DETECTION_RATE_MIN = 0.50


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


def run_all_judges(data: IntegratedScoreData) -> dict[str, SubTaskResult]:
    """個別課題 v1 全 59 項目の判定を実行する。

    現状: 全項目スケルトン (target_count=0)。
    本実装は項目ごとに別 PR で段階的に充填する。

    Returns:
        sub_task_id をキーとする SubTaskResult の辞書 (全 59 エントリ)
    """
    return {sub_id: _skipped_result(sub_id) for sub_id in ALL_SUB_TASK_IDS}
