# -*- coding: utf-8 -*-
"""
diagnosis_store.py — 演奏ごとの analysisSummary への保存

- diagnosis: 崩壊小節 (collapse) と総数 (totals)。課題ごとの集計 (per_subtask) と UserSkillSubScore の
  足し込みは段5 (2026-09-05 ノート属性ストア) で廃止。読み手は明細から束ねる
- milestone: 祝い体験 v2.0 のイベント配列

呼び手（loop_engine_runner）が psycopg2 カーソルを渡す。コミットは呼び手の責務。
"""
from __future__ import annotations

import json


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


def save_performance_milestone(
    cur, performance_id: str, events: list, is_practice: bool = False
) -> None:
    """祝い体験 v2.0 (§4.3): milestone イベント配列を analysisSummary にマージ保存する。
    診断と同じ jsonb `||` マージ (トップレベル "milestone" キーのみ差し替え・他キー保持)。
    ID照合方式(§4)により再解析でも同一内容が再生成されるため、上書きガードは不要。
    """
    table = "PracticePerformance" if is_practice else "Performance"
    payload = {"milestone": {"version": 1, "events": events}}
    cur.execute(
        f'UPDATE "{table}" '
        f'SET "analysisSummary" = COALESCE("analysisSummary", \'{{}}\'::jsonb) || %s::jsonb '
        f"WHERE id = %s",
        (json.dumps(payload, ensure_ascii=False), performance_id),
    )
