# -*- coding: utf-8 -*-
"""
backfill_diagnosis.py — 工程D-5 (2026-07-11): 過去演奏への診断バックフィル

v65以前の演奏には analysisSummary.diagnosis が無く、ホームの累積弱点(窓②)が
新しい演奏を待つ状態になる。過去演奏に診断を一括適用して初日から実データ化する。

ルール（設計論点5・Tetsuo確定）:
  - 窓①(analysisSummary.diagnosis) + 窓②(UserSkillSubScore) のみ適用
  - **達成記録(UserScoreAchievement等)は絶対に作らない**（判定は前向きのみ）
  - 既に diagnosis を持つ演奏はスキップ（v65以降の二重加算防止）

既定は dry-run（書き込みゼロ）。--apply で本実行（要 Tetsuo 承認）。
実行: venv\\Scripts\\python.exe scripts\\backfill_diagnosis.py [--apply]
"""
from __future__ import annotations

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import psycopg2  # noqa: E402
import requests  # noqa: E402

from lib.diagnosis import diagnose  # noqa: E402
from lib.diagnosis_store import (  # noqa: E402
    bump_user_subtask_counters,
    save_performance_diagnosis,
)

APPLY = "--apply" in sys.argv


def load_env() -> dict:
    env: dict = {}
    env_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", ".env"
    )
    with open(env_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env


ENV = load_env()
SUPABASE_URL = ENV.get("NEXT_PUBLIC_SUPABASE_URL") or ENV.get("SUPABASE_URL")
SERVICE_KEY = ENV["SUPABASE_SERVICE_ROLE_KEY"]
DB_URL = (ENV.get("DIRECT_URL") or ENV["DATABASE_URL"]).split("?")[0]
HEADERS = {"Authorization": f"Bearer {SERVICE_KEY}"}


def storage_get_json(bucket: str, path: str):
    url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{path}"
    res = requests.get(url, headers=HEADERS, timeout=60)
    if res.status_code != 200:
        return None
    try:
        return json.loads(res.content)
    except Exception:
        return None


def run_one(conn, *, performance_id, user_id, is_practice,
            comparison_path, skill_info_path, analysis_path, label) -> str:
    comp = storage_get_json("performances", comparison_path)
    if comp is None:
        return "no_comparison"
    karte = storage_get_json("musicxml", skill_info_path)
    if karte is None:
        return "no_karte"
    if karte.get("version") != 3:
        return "karte_v1"  # 旧skill_info: 対応表なし→map_available=Falseでも保存はする
    analysis = storage_get_json("musicxml", analysis_path)
    analysis_notes = (analysis or {}).get("notes")

    # 旧形式は results 配列が直置き、新形式は {"results": [...]}
    if isinstance(comp, list):
        results = comp
    else:
        results = comp.get("results") or comp.get("evaluatedNotes") or []
    diag = diagnose(results, karte, analysis_notes)

    if not APPLY:
        d = diag["diagnosis"]
        return f"DRY ok map={diag['map_available']} pitch={d['pitch']} rhythm={d['rhythm']}"

    with conn.cursor() as cur:
        save_performance_diagnosis(cur, performance_id, diag, is_practice=is_practice)
        bump_user_subtask_counters(cur, user_id, diag.get("per_subtask") or {})
    conn.commit()  # 演奏単位で確定（途中失敗しても適用済み分は有効・再実行はスキップされる）
    d = diag["diagnosis"]
    return f"APPLIED map={diag['map_available']} pitch={d['pitch']} rhythm={d['rhythm']}"


def main() -> None:
    print(f"=== backfill_diagnosis {'APPLY' if APPLY else 'DRY-RUN'} ===")
    conn = psycopg2.connect(DB_URL)
    stats: dict = {}

    def tally(key: str) -> None:
        stats[key] = stats.get(key, 0) + 1

    try:
        # ── Score 演奏 ──
        with conn.cursor() as cur:
            cur.execute(
                '''
                SELECT p.id, p."userId", p."scoreId", s."createdById", s.title
                FROM "Performance" p JOIN "Score" s ON s.id = p."scoreId"
                WHERE p."analysisSummary"->'diagnosis' IS NULL
                ORDER BY p."uploadedAt"
                '''
            )
            rows = cur.fetchall()
        print(f"Performance 対象: {len(rows)}件 (diagnosis未保持)")
        for perf_id, user_id, score_id, owner_id, title in rows:
            r = run_one(
                conn,
                performance_id=perf_id, user_id=user_id, is_practice=False,
                comparison_path=f"{user_id}/{score_id}/{perf_id}/comparison_result.json",
                skill_info_path=f"{owner_id}/{score_id}/musicxml_skill_info.json",
                analysis_path=f"{owner_id}/{score_id}/analysis.json",
                label=title,
            )
            tally(r.split(" ")[0])
            print(f"  {title} perf={perf_id[:8]}: {r}")

        # ── 基礎練演奏 ──
        with conn.cursor() as cur:
            cur.execute(
                '''
                SELECT pp.id, pp."userId", pp."practiceItemId", pi.title
                FROM "PracticePerformance" pp
                JOIN "PracticeItem" pi ON pi.id = pp."practiceItemId"
                WHERE pp."analysisSummary"->'diagnosis' IS NULL
                ORDER BY pp."uploadedAt"
                '''
            )
            rows = cur.fetchall()
        print(f"PracticePerformance 対象: {len(rows)}件")
        for perf_id, user_id, item_id, title in rows:
            r = run_one(
                conn,
                performance_id=perf_id, user_id=user_id, is_practice=True,
                comparison_path=f"practice/{user_id}/{item_id}/{perf_id}/comparison_result.json",
                skill_info_path=f"practice/{item_id}/musicxml_skill_info.json",
                analysis_path=f"practice/{item_id}/analysis.json",
                label=title,
            )
            tally(r.split(" ")[0])
            print(f"  {title} perf={perf_id[:8]}: {r}")

        print(f"\n=== 集計: {stats} ===")
        if not APPLY:
            print("dry-run 完了（書き込みゼロ）。適用は --apply。")
    finally:
        if not APPLY:
            conn.rollback()
        conn.close()


if __name__ == "__main__":
    main()
