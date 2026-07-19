#!/usr/bin/env python3
"""
bowing_score.py — マスター判定用の弓（bowing）採点パイプライン（C-6b 2026-07-11）

【役割 — 他の人が読むときはここだけ理解すればOK】
  **弓の点(bowingScore)はこのパイプラインが唯一の製造元**で、
  弦ごとの安定性・弦移動・重音・奏法品質の23項目（lib/subtask_judges.py）を
  平均して 0-100 点にし、bowingAccuracy として保存する。
  教材の skillSubTaskTags はこの採点の関係で残っている。

  【マスター判定との関係】旧 overallScore=(音程+リズム+弓)÷3 の平均90点は 2026-06-07 廃止。
  現行マスター判定は (pitchAccuracy+timingAccuracy)/2 の直近5回平均≥90 で弓は含まれない
  （lib/achievement.py が唯一の判定元）。bowingAccuracy はマスターには流れない。

【旧 score_full.py からの変更（2026-07-11）】
  旧55課題体系の「課題化」用途（音程/リズムのスキルスコア・skillSubScores・
  気になる箇所）は217診断体系(lib/diagnosis.py)に置換されたため削除。
  弓採点のみを残して改名した。旧実装は git 履歴 6a35f16 以前を参照。

呼び手: loop_engine_runner.py（演奏完了処理 step 3）
出力: {"performance_id", "status": "done"|"skipped", "skipped_reason",
       "detection_rate", "bowingScore": float | None}
  弦移動・奏法が無い曲（音階等）では対象0件のため bowingScore=None（弓は測定なし）。
"""

from __future__ import annotations

from typing import Optional

from lib import (
    build_integrated_score_data,
    is_performance_analyzable,
    run_bowing_judges,
)
from lib.subtask_judges import FIRE_MIN_SAMPLES


def run_pipeline(
    *,
    comparison_result_path: str,
    note_results_path: str,
    musicxml_skill_info_path: str,
    performance_id: str,
    user_id: str,
    practice_item_id: str,
    practice_item_difficulty: int,
    skill_sub_task_tags: list[str],
) -> dict:
    """弓採点を実行する。

    1. 3つの JSON を統合して IntegratedScoreData を構築
    2. 解析可能性チェック（検出割合 < 50% はスキップ）
    3. 弓23項目の判定（lib/subtask_judges.run_bowing_judges）
    4. bowingScore = target_count >= 3 の項目の score 平均（0件なら None）
    """
    data = build_integrated_score_data(
        comparison_result_path=comparison_result_path,
        note_results_path=note_results_path,
        musicxml_skill_info_path=musicxml_skill_info_path,
        performance_id=performance_id,
        user_id=user_id,
        practice_item_id=practice_item_id,
        practice_item_difficulty=practice_item_difficulty,
        skill_sub_task_tags=skill_sub_task_tags,
    )

    if not is_performance_analyzable(data):
        return {
            "performance_id": performance_id,
            "status": "skipped",
            "skipped_reason": "low_detection_rate",
            "detection_rate": data.detection_rate,
            "bowingScore": None,
        }

    results = run_bowing_judges(data)

    # 集計: 1〜2音の偶発ミスで点が暴れないよう最低サンプル数で足切り
    # （旧 skill_aggregator と同ルール）
    valid = [r.score for r in results.values() if r.target_count >= FIRE_MIN_SAMPLES]
    bowing_score: Optional[float] = (
        round(sum(valid) / len(valid), 1) if valid else None
    )

    return {
        "performance_id": performance_id,
        "status": "done",
        "skipped_reason": None,
        "detection_rate": data.detection_rate,
        "bowingScore": bowing_score,
    }
