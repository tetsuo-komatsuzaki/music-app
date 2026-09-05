# -*- coding: utf-8 -*-
"""
backfill_performance_notes.py — 既存演奏の comparison_result.json から PerformanceNote を埋め戻す (段3)。

演奏の再解析はしない (音源から採点し直す必要は無い)。ファイルにある1音ごとの結果をそのまま表に写す。
採点したときの並びの版は、いまの Score/PracticeItem.scoreNoteVersion を入れる。
  実行: venv\\Scripts\\python.exe scripts\\backfill_performance_notes.py            (dry-run・件数だけ)
        venv\\Scripts\\python.exe scripts\\backfill_performance_notes.py --apply    (書く)
        --only <performanceId>  1件だけ
"""
from __future__ import annotations
import os, sys, json, io
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import requests, psycopg2
from dotenv import load_dotenv
from lib.note_store import build_performance_notes, save_performance_notes

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))
U = os.environ["SUPABASE_URL"]; K = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
PERF_BUCKET = os.environ.get("PERFORMANCE_BUCKET", "performances")
APPLY = "--apply" in sys.argv
ONLY = sys.argv[sys.argv.index("--only") + 1] if "--only" in sys.argv else None


def fetch(path: str):
    r = requests.get(f"{U}/storage/v1/object/{PERF_BUCKET}/{path}", headers={"Authorization": f"Bearer {K}"}, timeout=60)
    if r.status_code != 200:
        return None
    c = r.json()
    return c if isinstance(c, list) else (c.get("results") or c.get("evaluatedNotes") or [])


def main() -> None:
    conn = psycopg2.connect(os.environ["DATABASE_URL"]); cur = conn.cursor()
    cur.execute('''SELECT id, "userId", "scoreId", "comparisonResultPath" FROM "Performance" WHERE "comparisonResultPath" IS NOT NULL''')
    perfs = [("score", *r) for r in cur.fetchall()]
    cur.execute('''SELECT id, "userId", "practiceItemId", "comparisonResultPath" FROM "PracticePerformance" WHERE "comparisonResultPath" IS NOT NULL''')
    perfs += [("practice", *r) for r in cur.fetchall()]
    if ONLY:
        perfs = [p for p in perfs if p[1] == ONLY]
    print(f"対象 {len(perfs)}件 ({'書く' if APPLY else 'dry-run'})")
    ok = missing = failed = 0; rows_total = 0; no_version = 0
    for kind, pid, uid, tid, path in perfs:
        # 保存されている path は "{user}/{score}/{perf}/comparison_result.json" のこともあるので、そのまま試してから規約の形も試す
        candidates = [path] if path else []
        candidates.append(f"{uid}/{tid}/{pid}/comparison_result.json" if kind == "score" else f"practice/{uid}/{tid}/{pid}/comparison_result.json")
        comp = None
        for cpath in candidates:
            comp = fetch(cpath)
            if comp is not None:
                break
        if comp is None:
            missing += 1; print(f"  ファイル無し {kind} {pid}"); continue
        rows = build_performance_notes(comp)
        rows_total += len(rows)
        if not APPLY:
            ok += 1; continue
        try:
            version = save_performance_notes(cur, kind, pid, rows, kind, tid)
            conn.commit(); ok += 1
            if version is None:
                no_version += 1
        except Exception as e:
            conn.rollback(); failed += 1; print(f"  失敗 {kind} {pid}: {e}")
    print(f"書けた {ok} ・ ファイル無し {missing} ・ 失敗 {failed} ・ 明細 {rows_total}行 ・ 並びの版なし(曲側が未解析) {no_version}")
    conn.close()


if __name__ == "__main__":
    main()
