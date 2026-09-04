# -*- coding: utf-8 -*-
"""
reanalyze_all_practice_items.py — 公開教材を全件再解析する (2026-09-04)

目的: 教材の musicxml_skill_info.json を作り直す。v121 より前のファイルは
音符ごとの technique_tags を持たず (2026-09-04 に修正したフィールド欠落)、
スラー以外の奏法が診断にもおすすめにも一切届いていなかった。

やっていることは analyze_musicxml.py --practice-item <id> を1件ずつ回すだけ。
本番の解析経路をそのまま使うので、変種の適用順 (移調→奏法→リズム→範囲切り出し)
もそのまま。独自に再実装しない。

副作用 (2026-09-04 Tetsuo了承): pitchMin/Max ・ primaryBowing/primaryPosition の
上書き、ポジションの特徴タグの貼り替え、奏法タグと課題タグの自動付与。
positions は既存があれば温存。他カテゴリの手動タグは追加のみで温存。

実行: venv/Scripts/python.exe scripts/reanalyze_all_practice_items.py [--apply] [--jobs N]
"""
from __future__ import annotations

import os
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import psycopg2  # noqa: E402

APPLY = "--apply" in sys.argv
JOBS = 4
if "--jobs" in sys.argv:
    JOBS = int(sys.argv[sys.argv.index("--jobs") + 1])

HERE = os.path.dirname(os.path.abspath(__file__))
ANALYZER = os.path.dirname(HERE)
PY = os.path.join(ANALYZER, "venv", "Scripts", "python.exe")
SCRIPT = os.path.join(ANALYZER, "analyze_musicxml.py")


def load_env() -> dict:
    env: dict = {}
    with open(os.path.join(ANALYZER, "..", ".env"), encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env


ENV = load_env()
DB_URL = (ENV.get("DIRECT_URL") or ENV["DATABASE_URL"]).split("?")[0]

done = 0
failed: list[tuple[str, str]] = []
t0 = time.time()
total = 0


def run_one(row) -> None:
    global done
    iid, title = row
    try:
        res = subprocess.run(
            [PY, SCRIPT, "--practice-item", iid],
            cwd=ANALYZER, capture_output=True, timeout=600,
        )
        if res.returncode != 0:
            tail = (res.stderr or b"").decode("utf-8", "replace")[-200:]
            failed.append((title, tail.replace("\n", " ")))
    except Exception as e:
        failed.append((title, f"{type(e).__name__}: {e}"))
    done += 1
    if done % 25 == 0 or done == total:
        el = time.time() - t0
        rate = el / max(1, done)
        print(f"  {done}/{total}  経過{el / 60:.1f}分  残り約{rate * (total - done) / 60:.0f}分  失敗{len(failed)}件", flush=True)


def main() -> None:
    global total
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    cur.execute(
        '''
        SELECT id, title FROM "PracticeItem"
        WHERE "isPublished" = true AND category <> 'lesson'
        ORDER BY category, title
        '''
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    total = len(rows)
    print(f"=== 公開教材の全件再解析 [{'APPLY' if APPLY else 'DRY-RUN'}] ===")
    print(f"対象 {total}件 ・ 並列 {JOBS}\n")
    if not APPLY:
        print("dry-run。--apply で実行する")
        return
    with ThreadPoolExecutor(max_workers=JOBS) as ex:
        list(ex.map(run_one, rows))
    print(f"\n完了 {done}件 / 失敗 {len(failed)}件 ・ {(time.time() - t0) / 60:.1f}分")
    for t, why in failed[:20]:
        print(f"   失敗: {t} … {why}")
    if len(failed) > 20:
        print(f"   ほか{len(failed) - 20}件")


if __name__ == "__main__":
    main()
