"""
skill_aggregator.py — 中項目スコア集計（v3.2 §7 Q5 確定）

設計書 v3.2 §7 に基づく実装。

集計ルール（2026-06-07 更新、発火ルールと統一）：
  中項目スコア = 配下 sub task のうち target_count >= FIRE_MIN_SAMPLES(3) のものの score 平均
              = target_count < 3 の sub task は集計から除外（発火 matched と同じ最低数）
              = 該当が 0 件 → 中項目スコア = None
  (旧 v3.2 Q5: target_count > 0 で集計 → 1-2音の偶発ミスが中項目を不当に下げる問題を解消)

中項目構成：
  pitch  = (pitch_overall + pitch_high + pitch_chromatic) の有効平均
  rhythm = (rhythm_overall + rhythm_fast + rhythm_after_rest) の有効平均
  bowing = (string_change_volume + string_change_slur + string_change_timing) の有効平均

v3 / v3.1 と v3.2 の違い:
  v3 / v3.1: target_count = 0 の sub_task は score=100 でフォールバックして集計に含める
  v3.2 (Q5): target_count = 0 の sub_task は集計から除外、全配下0件なら中項目=None

v3.2 の利点:
  - 「弦移動なし曲」（スケール等）→ bowingSkillScore = None
  - 自動的にグレード昇格副作用（v3.1 高9 で問題化）が解消
  - ユーザー UI で「該当なし」が明示される
  - is_practice_item_eligible_for_grade_progress を簡素化可能
"""

from __future__ import annotations

from typing import Optional

from .integrated_note import SubTaskResult
from .subtask_judges import FIRE_MIN_SAMPLES


# 個別課題 v1 (2026-05-25): 中項目 → 配下 sub task のマップを 57 項目スキームに更新。
# 旧 9 sub_task は完全廃止。将来検討 (ricochet x2) は MVP では target=0 で集計除外される
# ので含めても影響なし。app/_libs/skillMaster.ts SUB_TASK_IDS と一対一対応。
SKILL_TASK_MAP: dict[str, list[str]] = {
    "pitch": [
        "pitch_position_2", "pitch_position_3", "pitch_position_4", "pitch_position_5plus",
        "pitch_shift_up", "pitch_shift_down",
        "pitch_double_stop_2", "pitch_double_stop_3plus", "pitch_double_stop_continuous",
        "pitch_harmonic",
        "pitch_interval_up_2nd_plus", "pitch_interval_up_3rd_plus",
        "pitch_interval_down_2nd_plus", "pitch_interval_down_3rd_plus",
        "pitch_finger_1", "pitch_finger_2", "pitch_finger_3", "pitch_finger_4",
    ],
    "rhythm": [
        "rhythm_value_whole", "rhythm_value_half", "rhythm_value_16th",
        "rhythm_value_32nd_plus", "rhythm_value_dotted",
        "rhythm_pattern_triplet", "rhythm_pattern_2plet_plus",
        "rhythm_entry_after_rest",
        "rhythm_technique_staccato", "rhythm_technique_spiccato",
        "rhythm_technique_tremolo", "rhythm_technique_portato", "rhythm_technique_trill",
        "rhythm_technique_glissando",
    ],
    "bowing": [
        "bowing_technique_staccato",
        "bowing_technique_spiccato",
        "bowing_technique_pizzicato", "bowing_technique_tremolo",
        "bowing_technique_portato", "bowing_technique_trill",
        "bowing_technique_glissando",
        "bowing_technique_harmonic",
        "bowing_technique_staccato_continuous", "bowing_technique_spiccato_continuous",
        "bowing_string_g", "bowing_string_d", "bowing_string_a", "bowing_string_e",
        "bowing_string_change_g_to_d", "bowing_string_change_d_to_g",
        "bowing_string_change_d_to_a", "bowing_string_change_a_to_d",
        "bowing_string_change_a_to_e", "bowing_string_change_e_to_a",
        "bowing_double_stop_2", "bowing_double_stop_3plus", "bowing_double_stop_continuous",
    ],
}


def aggregate_skill_scores(
    sub_task_results: dict[str, SubTaskResult],
) -> dict[str, Optional[float]]:
    """中項目スコアを集計する（v3.2 Q5 確定）。

    Args:
        sub_task_results: sub_task_id → SubTaskResult の辞書

    Returns:
        {"pitch": float | None, "rhythm": float | None, "bowing": float | None}
        target_count = 0 の sub task は除外して平均する。
        全配下が 0 件なら None を返す。
    
    Examples:
        # スケール演奏（弦移動なし）
        # - pitch 系: 全 target > 0 → pitch = 平均
        # - rhythm 系: 全 target > 0 → rhythm = 平均
        # - bowing 系: 全 target = 0 → bowing = None
        
        # 弦移動を含む曲
        # - 全中項目が target > 0 → 全中項目で平均算出
        
        # rhythm_after_rest だけ target = 0 の曲
        # - rhythm = (rhythm_overall + rhythm_fast) / 2  # after_rest は除外
    """
    aggregated: dict[str, Optional[float]] = {}

    for skill_task, sub_task_ids in SKILL_TASK_MAP.items():
        valid_scores: list[float] = []
        for sub_task_id in sub_task_ids:
            result = sub_task_results.get(sub_task_id)
            if result is None:
                continue
            # 2026-06-07 確定: 集計も発火と同じ最低サンプル数 (FIRE_MIN_SAMPLES=3) で揃える。
            # target_count < 3 は除外 (1-2音の偶発ミスが中項目を不当に引き下げ、
            # 誤って課題化するのを防ぐ。発火ルール matched と一貫させる)。
            if result.target_count < FIRE_MIN_SAMPLES:
                continue
            valid_scores.append(result.score)

        if not valid_scores:
            # 全配下 0 件 → 中項目 = None
            aggregated[skill_task] = None
        else:
            aggregated[skill_task] = round(sum(valid_scores) / len(valid_scores), 1)

    return aggregated
