"""
skill_aggregator.py — 中項目スコア集計（v3.2 §7 Q5 確定）

設計書 v3.2 §7 に基づく実装。

集計ルール（v3.2 Q5 確定、v3 / v3.1 から変更）：
  中項目スコア = 配下 sub task のうち target_count > 0 のものの score 平均
              = target_count = 0 の sub task は集計から除外
              = 全配下が 0 件 → 中項目スコア = None

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


# 中項目 → 配下 sub task のマップ
SKILL_TASK_MAP: dict[str, list[str]] = {
    "pitch": ["pitch_overall", "pitch_high", "pitch_chromatic"],
    "rhythm": ["rhythm_overall", "rhythm_fast", "rhythm_after_rest"],
    "bowing": ["string_change_volume", "string_change_slur", "string_change_timing"],
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
            # v3.2 Q5：target_count = 0 は集計対象外（該当音符なし）
            if result.target_count == 0:
                continue
            valid_scores.append(result.score)

        if not valid_scores:
            # 全配下 0 件 → 中項目 = None
            aggregated[skill_task] = None
        else:
            aggregated[skill_task] = round(sum(valid_scores) / len(valid_scores), 1)

    return aggregated
