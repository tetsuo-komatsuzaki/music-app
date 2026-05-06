#!/usr/bin/env python3
"""
score_full.py — 上達ループエンジンのエントリポイント（v3.2 §14-4 Commit C）

Cloud Run Jobs の score_full モードから起動される。
4つの JSON を統合して 9 sub task の判定を実行し、結果を result.json として出力する。

使い方：
    python score_full.py \\
        --comparison-result <path> \\
        --note-results <path> \\
        --musicxml-skill-info <path> \\
        --output <path> \\
        --performance-id <id> \\
        --user-id <id> \\
        --practice-item-id <id> \\
        --practice-item-difficulty <int> \\
        [--skill-sub-task-tags <comma-separated>]

入力（v3.2、4つの JSON、すべて必須）：
  - comparison_result.json: analyze_performance.py が生成（v3.2: flat array、Phase 0.1 Task 1）
  - note_results.json: analyze_performance.py が生成（time_signature は dict、Phase 0.1 Task 2）
  - 既存 analysis.json: analyze_musicxml.py の既存出力（変更しない、温存）
  - musicxml_skill_info.json: analyze_musicxml.py が新規生成（v3.2 Q6 確定、Commit D）

注：score_full は 4 つすべてを直接読まず、note_integration.py 経由で：
   - comparison_result, note_results, musicxml_skill_info の 3 つを読み込む
   - 既存 analysis.json は score_full では読まない（既存 build_score 等が読む）

出力（result.json）：
  {
    "performance_id": "...",
    "status": "done" | "skipped",
    "pitchSkillScore": 78.5 | null,
    "rhythmSkillScore": 72.3 | null,
    "bowingSkillScore": 65.8 | null,  # v3.2: 弦移動なし曲では None になる（Q5）
    "skillSubScores": {
      "pitch_overall": { "score": 75.0, "matched": false, ... },
      ...
    },
    "detection_rate": 0.85,
    "skipped_reason": null | "low_detection_rate"
  }

エラー時：
  exit code 1、result.json は出力されない、stderr にエラーメッセージ
"""

from __future__ import annotations

import argparse
import json
import sys
import traceback
from typing import Optional

from lib import (
    SubTaskResult,
    aggregate_skill_scores,
    build_integrated_score_data,
    is_performance_analyzable,
    run_all_judges,
)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def parse_args(argv: Optional[list[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run upskilling loop engine (9 sub task evaluation)"
    )
    parser.add_argument("--comparison-result", required=True, help="Path to comparison_result.json (v3.2: flat array)")
    parser.add_argument("--note-results", required=True, help="Path to note_results.json")
    parser.add_argument(
        "--musicxml-skill-info", required=True, help="Path to musicxml_skill_info.json (v3.2 Q6: new file)"
    )
    parser.add_argument("--output", required=True, help="Path to output result.json")
    parser.add_argument("--performance-id", required=True)
    parser.add_argument("--user-id", required=True)
    parser.add_argument("--practice-item-id", required=True)
    parser.add_argument("--practice-item-difficulty", type=int, required=True)
    parser.add_argument(
        "--skill-sub-task-tags",
        default="",
        help="Comma-separated list of skill_sub_task_tags",
    )
    return parser.parse_args(argv)


# ---------------------------------------------------------------------------
# メインパイプライン
# ---------------------------------------------------------------------------


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
    """解析パイプラインの全段階を実行する（v3.2）。

    1. 3つの JSON を統合して IntegratedScoreData を構築
       - is_string_change_from_prev は note_integration.py で生成（v3.2 Q7）
    2. 解析可能性チェック（A1：検出割合 < 50% フィルタ）
    3. 9 sub task の判定（v3.2 修正済み：問題1 A 解釈等）
    4. 中項目スコア集計（v3.2 Q5：target_count=0 は集計除外）
    5. 結果を辞書として返す

    気になる箇所生成（§8）と DB 累積更新（§7-4）は本パイプラインの責務外。
    score_full の出力を受け取った Next.js 側（または別ジョブ）で実施する。

    Returns:
        result 辞書（status="done" or status="skipped"）
    """
    # 1. データ統合（v3.2: 3 JSON → IntegratedScoreData）
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

    # 2. 解析可能性チェック
    if not is_performance_analyzable(data):
        return {
            "performance_id": performance_id,
            "status": "skipped",
            "skipped_reason": "low_detection_rate",
            "detection_rate": data.detection_rate,
            "pitchSkillScore": None,
            "rhythmSkillScore": None,
            "bowingSkillScore": None,
            "skillSubScores": {},
        }

    # 3. 9 sub task 判定
    sub_task_results = run_all_judges(data)

    # 4. 中項目スコア集計（v3.2 Q5：target_count=0 除外、None 許容）
    skill_scores = aggregate_skill_scores(sub_task_results)

    # 5. 結果辞書を構築
    return {
        "performance_id": performance_id,
        "status": "done",
        "skipped_reason": None,
        "detection_rate": data.detection_rate,
        "pitchSkillScore": skill_scores["pitch"],   # float | None
        "rhythmSkillScore": skill_scores["rhythm"], # float | None
        "bowingSkillScore": skill_scores["bowing"], # float | None（v3.2: 弦移動なし曲では None）
        "skillSubScores": _serialize_sub_task_results(sub_task_results),
    }


def _serialize_sub_task_results(
    results: dict[str, SubTaskResult],
) -> dict[str, dict]:
    """SubTaskResult の辞書を JSON シリアライズ可能な形に変換する。"""
    out = {}
    for sub_task_id, r in results.items():
        out[sub_task_id] = {
            "score": r.score,
            "matched": r.matched,
            "sample_size": r.sample_size,
            "target_count": r.target_count,
            "bad_count": r.bad_count,
            "details": r.details,
            "details_with_count": r.details_with_count,
        }
    return out


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------


def main(argv: Optional[list[str]] = None) -> int:
    args = parse_args(argv)

    skill_tags = [t.strip() for t in args.skill_sub_task_tags.split(",") if t.strip()]

    try:
        result = run_pipeline(
            comparison_result_path=args.comparison_result,
            note_results_path=args.note_results,
            musicxml_skill_info_path=args.musicxml_skill_info,
            performance_id=args.performance_id,
            user_id=args.user_id,
            practice_item_id=args.practice_item_id,
            practice_item_difficulty=args.practice_item_difficulty,
            skill_sub_task_tags=skill_tags,
        )
    except Exception as e:
        sys.stderr.write(f"[score_full] ERROR: {e}\n")
        traceback.print_exc(file=sys.stderr)
        return 1

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(
        f"[score_full] OK: status={result['status']} "
        f"performance_id={result['performance_id']}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
