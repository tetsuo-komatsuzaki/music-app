# -*- coding: utf-8 -*-
"""
backfill_score_note_slur.py — 既存の並び (ScoreNote) に スラーの長さ・何番目か (slurLen / slurPos) を埋め戻す (2026-09-06)。

再解析はしない。analysis.json の spanners.slurs (演奏順の番号 ・ ScoreNote.noteIndex と同じ空間) を読み、
その区間に入る音 (= ScoreNote の行) を数える。休符は行にならないので、行の無い番号は休符として数えない。
重なるスラーは短い方 (lib/note_store.slur_positions と同じ規則)。
  実行: venv\\Scripts\\python.exe scripts\\backfill_score_note_slur.py            (dry-run・件数だけ)
        venv\\Scripts\\python.exe scripts\\backfill_score_note_slur.py --apply    (書く)
        --only <targetId>  1件だけ
そのあと 教材側の束は scripts\\rebuild_material_bundle_counts.py --apply で作り直す (BUNDLE_VERSION 4)。
"""
from __future__ import annotations
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import requests, psycopg2
from dotenv import load_dotenv
from lib.note_store import slur_positions

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))
U = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
K = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
BUCKET = "musicxml"
APPLY = "--apply" in sys.argv
ONLY = sys.argv[sys.argv.index("--only") + 1] if "--only" in sys.argv else None


def fetch_json(path: str):
    r = requests.get(f"{U}/storage/v1/object/{BUCKET}/{path}", headers={"Authorization": f"Bearer {K}"}, timeout=60)
    if r.status_code != 200:
        return None
    try:
        return r.json()
    except ValueError:
        return None


def main() -> None:
    conn = psycopg2.connect(os.environ["DATABASE_URL"]); cur = conn.cursor()
    cur.execute('SELECT id FROM "PracticeItem" WHERE "scoreNoteVersion" IS NOT NULL')
    targets = [("practice", r[0], f"practice/{r[0]}/analysis.json") for r in cur.fetchall()]
    cur.execute('SELECT id, "createdById" FROM "Score" WHERE "scoreNoteVersion" IS NOT NULL AND "deletedAt" IS NULL')
    targets += [("score", r[0], f"{r[1]}/{r[0]}/analysis.json") for r in cur.fetchall()]
    if ONLY:
        targets = [t for t in targets if t[1] == ONLY]
    print(f"対象 {len(targets)}件 ({'書く' if APPLY else 'dry-run'})")
    ok = missing = noslur = failed = 0; rows_in_slur = 0
    for kind, tid, path in targets:
        a = fetch_json(path)
        if a is None:
            missing += 1; continue
        slurs = ((a.get("spanners") or {}).get("slurs")) or []
        cur.execute('SELECT "noteIndex" FROM "ScoreNote" WHERE "targetType" = %s::"ScoreNoteTarget" AND "targetId" = %s', (kind, tid))
        idxs = [r[0] for r in cur.fetchall()]
        if not idxs:
            continue
        n = max(idxs) + 1
        present = set(idxs)
        expanded = [{"is_rest": i not in present} for i in range(n)]
        pos = slur_positions(expanded, slurs) if slurs else {}
        if not pos:
            noslur += 1
        if not APPLY:
            ok += 1; rows_in_slur += len(pos); continue
        try:
            cur.execute('UPDATE "ScoreNote" SET "slurLen" = NULL, "slurPos" = NULL WHERE "targetType" = %s::"ScoreNoteTarget" AND "targetId" = %s', (kind, tid))
            for i, (ln, p) in pos.items():
                cur.execute('UPDATE "ScoreNote" SET "slurLen" = %s, "slurPos" = %s WHERE "targetType" = %s::"ScoreNoteTarget" AND "targetId" = %s AND "noteIndex" = %s',
                            (ln, p, kind, tid, i))
            conn.commit(); ok += 1; rows_in_slur += len(pos)
        except Exception as e:
            conn.rollback(); failed += 1; print(f"  失敗 {kind} {tid}: {e}")
    print(f"処理 {ok} ・ analysis.json 無し {missing} ・ スラー無し {noslur} ・ 失敗 {failed} ・ スラー内の音 {rows_in_slur}行")
    conn.close()


if __name__ == "__main__":
    main()
