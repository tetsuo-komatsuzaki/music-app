# -*- coding: utf-8 -*-
"""
rebuild_material_bundle_counts.py — 教材側の束の出現回数 (MaterialBundleCount) を ScoreNote から全件作り直す。

正は ScoreNote。この表は写しなので、束の定義を変えたとき・疑わしいときはこれで作り直す。
再解析は要らない (DB の並びとかたちだけで数える)。
  実行: venv\\Scripts\\python.exe scripts\\rebuild_material_bundle_counts.py [--apply] [--check]
    --apply  書く (無ければ件数だけ)
    --check  いまの表と数え直しを突き合わせ、差があれば失敗 (門番)
"""
from __future__ import annotations
import os, sys, collections
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import psycopg2
from dotenv import load_dotenv
from lib.note_store import bundle_keys, save_material_bundle_counts

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))
APPLY = "--apply" in sys.argv
CHECK = "--check" in sys.argv

PROFILE_COLS = ["id", "noteCount", "pitch1", "pitch2", "pitch3", "pitch4", "finger1", "position", "restBefore",
                "techSlur", "techPortato", "techStaccato", "techBowStaccato", "techSpiccato", "techRicochet", "techPizzicato",
                "techTremolo", "techVibrato", "techTrill", "techMordent", "techGlissando", "techHarmonic"]


def main() -> None:
    conn = psycopg2.connect(os.environ["DATABASE_URL"]); cur = conn.cursor()
    cur.execute('SELECT ' + ", ".join(f'"{c}"' for c in PROFILE_COLS) + ' FROM "NoteProfile"')
    profiles = {row[0]: dict(zip(PROFILE_COLS, row)) for row in cur.fetchall()}
    cur.execute('SELECT id, "scoreNoteVersion" FROM "PracticeItem"')
    versions = dict(cur.fetchall())
    cur.execute('''SELECT "targetId", "noteIndex", "profileId", "prevProfileId", "durationSec"
                   FROM "ScoreNote" WHERE "targetType" = 'practice' ORDER BY "targetId", "noteIndex"''')
    by_item: dict = collections.defaultdict(list)
    for tid, ni, pid, ppid, dsec in cur.fetchall():
        by_item[tid].append((ni, pid, ppid, dsec))
    print(f"教材 {len(by_item)}件 ・ かたち {len(profiles)}種 ({'書く' if APPLY else 'check' if CHECK else 'dry-run'})")
    total_rows = 0; diff_items = 0
    for tid, rows in by_item.items():
        counts: dict = {}
        prev_dur = None
        for ni, pid, ppid, dsec in rows:
            curp = profiles[pid]; prevp = profiles.get(ppid) if ppid is not None else None
            for k in bundle_keys(curp, prevp, prev_dur):
                counts[k] = counts.get(k, 0) + 1
            prev_dur = dsec
        total_rows += len(counts)
        if CHECK:
            cur.execute('SELECT "bundleKey", count FROM "MaterialBundleCount" WHERE "targetId" = %s', (tid,))
            stored = dict(cur.fetchall())
            if stored != counts:
                diff_items += 1
                if diff_items <= 5:
                    ks = set(stored) | set(counts)
                    d = {k: (stored.get(k), counts.get(k)) for k in ks if stored.get(k) != counts.get(k)}
                    print(f"  差 {tid}: {dict(list(d.items())[:3])}")
        if APPLY:
            save_material_bundle_counts(cur, tid, counts, len(rows), versions.get(tid) or "")
    if APPLY:
        conn.commit()
    conn.close()
    print(f"束の行 {total_rows}" + (f" ・ 差のある教材 {diff_items}" if CHECK else ""))
    if CHECK and diff_items:
        print("判定: 失敗 ・ 写しが並びと合っていない。--apply で作り直すこと"); sys.exit(1)
    if CHECK:
        print("判定: 合格 ・ 写しは並びと一致")


if __name__ == "__main__":
    main()
