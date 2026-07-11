# -*- coding: utf-8 -*-
"""
diagnosis_store.py — 診断結果の保存（工程C-3・2026-07-11・案3ハイブリッド）

窓①（演奏ごと）: Performance/PracticePerformance の analysisSummary(Json) に
  {"diagnosis": {...}} を追記マージ。skillSubScores（旧55形式・旧UI参照）には触れない。
窓②（累積）: UserSkillSubScore を217のIDで流用し、増分更新（足し込み）。
  新体系の意味: matchedCount=ミス音数の累計 / totalCount=対象音数の累計 /
  matchRate=ミス率。旧55のIDの行は残置（IDが違うので衝突しない・遡及なし原則）。

呼び手（C-4: loop_engine）が psycopg2 カーソルを渡す。コミットは呼び手の責務。
"""
from __future__ import annotations

import json
import uuid
from typing import Optional


def save_performance_diagnosis(
    cur, performance_id: str, diagnosis: dict, is_practice: bool = False
) -> None:
    """診断JSONを演奏レコードの analysisSummary にマージ保存する。"""
    table = "PracticePerformance" if is_practice else "Performance"
    cur.execute(
        f'UPDATE "{table}" '
        f'SET "analysisSummary" = COALESCE("analysisSummary", \'{{}}\'::jsonb) || %s::jsonb '
        f"WHERE id = %s",
        (json.dumps({"diagnosis": diagnosis}, ensure_ascii=False), performance_id),
    )


def bump_user_subtask_counters(cur, user_id: str, per_subtask: dict) -> int:
    """診断の per_subtask カウントを UserSkillSubScore に足し込む（窓②）。

    Returns: 更新/挿入した行数
    """
    n = 0
    for sid, d in per_subtask.items():
        miss = int(d.get("miss", 0))
        target = int(d.get("target", 0))
        if target <= 0:
            continue
        rate = miss / target
        cur.execute(
            '''
            INSERT INTO "UserSkillSubScore"
              (id, "userId", "skillSubTaskId", "matchedCount", "totalCount",
               "matchRate", "lastMatchedAt", "lastUpdatedAt")
            VALUES (%s, %s, %s, %s, %s, %s,
                    CASE WHEN %s > 0 THEN NOW() ELSE NULL END, NOW())
            ON CONFLICT ("userId", "skillSubTaskId") DO UPDATE SET
              "matchedCount" = "UserSkillSubScore"."matchedCount" + EXCLUDED."matchedCount",
              "totalCount"   = "UserSkillSubScore"."totalCount" + EXCLUDED."totalCount",
              "matchRate"    = CASE
                WHEN ("UserSkillSubScore"."totalCount" + EXCLUDED."totalCount") > 0
                THEN ("UserSkillSubScore"."matchedCount" + EXCLUDED."matchedCount")::float
                     / ("UserSkillSubScore"."totalCount" + EXCLUDED."totalCount")
                ELSE 0 END,
              "lastMatchedAt" = CASE WHEN EXCLUDED."matchedCount" > 0
                                     THEN NOW()
                                     ELSE "UserSkillSubScore"."lastMatchedAt" END,
              "lastUpdatedAt" = NOW()
            ''',
            (str(uuid.uuid4()), user_id, sid, miss, target, rate, miss),
        )
        n += 1
    return n
