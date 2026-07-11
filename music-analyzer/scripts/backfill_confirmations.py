# -*- coding: utf-8 -*-
"""
backfill_confirmations.py — 工程G (2026-07-11): 既存カルテから確認キューをDBへ

A-5 で全教材/曲のカルテ(note_karte v3)に needs_confirmation は記録済みだが、
DB化(工程G)以前のためキューテーブルが空。既存カルテを読んで一括投入する。
確定済み(confirmed)行は pending に戻さない(analyze_musicxml と同じ upsert 規約)。

既定 dry-run / --apply で本実行。
実行: venv\\Scripts\\python.exe scripts\\backfill_confirmations.py [--apply]
"""
from __future__ import annotations

import json
import os
import sys
import uuid

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import psycopg2  # noqa: E402
import requests  # noqa: E402

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


def karte_piece(path: str):
    url = f"{SUPABASE_URL}/storage/v1/object/musicxml/{path}"
    res = requests.get(url, headers=HEADERS, timeout=60)
    if res.status_code != 200:
        return None
    try:
        data = json.loads(res.content)
    except Exception:
        return None
    if data.get("version") != 3:
        return None
    return data.get("piece") or {}


def upsert(cur, target_type: str, target_id: str, nc: dict) -> None:
    cur.execute(
        '''
        INSERT INTO "TechniqueConfirmation"
          (id, "targetType", "targetId", pattern, "noteCount", measures, status, "updatedAt")
        VALUES (%s, %s, %s, %s, %s, %s, 'pending', NOW())
        ON CONFLICT ("targetType", "targetId", pattern) DO UPDATE SET
          "noteCount" = EXCLUDED."noteCount",
          measures = EXCLUDED.measures,
          "updatedAt" = NOW()
        ''',
        (str(uuid.uuid4()), target_type, target_id,
         nc.get("pattern"), len(nc.get("note_indexes") or []),
         [int(m) + 1 for m in (nc.get("measure_indexes") or [])]),
    )


def main() -> None:
    print(f"=== backfill_confirmations {'APPLY' if APPLY else 'DRY-RUN'} ===")
    conn = psycopg2.connect(DB_URL)
    found = 0
    try:
        with conn.cursor() as cur:
            cur.execute(
                'SELECT id, title, "createdById" FROM "Score" WHERE "deletedAt" IS NULL'
            )
            scores = cur.fetchall()
            cur.execute('SELECT id, title FROM "PracticeItem" WHERE "isPublished" = true')
            items = cur.fetchall()

        with conn.cursor() as cur:
            for sid, title, owner in scores:
                piece = karte_piece(f"{owner}/{sid}/musicxml_skill_info.json")
                for nc in (piece or {}).get("needs_confirmation") or []:
                    found += 1
                    print(f"  [score] {title}: {nc.get('pattern')} "
                          f"{len(nc.get('note_indexes') or [])}音")
                    if APPLY:
                        upsert(cur, "score", sid, nc)
            for iid, title in items:
                piece = karte_piece(f"practice/{iid}/musicxml_skill_info.json")
                for nc in (piece or {}).get("needs_confirmation") or []:
                    found += 1
                    print(f"  [practice] {title}: {nc.get('pattern')} "
                          f"{len(nc.get('note_indexes') or [])}音")
                    if APPLY:
                        upsert(cur, "practice", iid, nc)
        if APPLY:
            conn.commit()
        print(f"=== 検出 {found} 行 / {'適用済' if APPLY else 'dry-run(書き込みゼロ)'} ===")
    finally:
        if not APPLY:
            conn.rollback()
        conn.close()


if __name__ == "__main__":
    main()
