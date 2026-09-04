# -*- coding: utf-8 -*-
"""
build_material_subtask_counts.py — 教材ごとの課題出現回数を数えて保存する (2026-09-04)

おすすめの規則 (2026-09-04 Tetsuo確定):
  ユーザーの★以下の教材に絞り、その課題がいちばん多く出てくる1件を出す。

回数は musicxml_skill_info.json を読まないと出せない。表示のたびに1000件読むのは
不可能なので、一度数えて PracticeItemSubtaskCount に保存する。

文脈の導出は lib/diagnosis.py の _context_suffixes をそのまま使う。ユーザーの演奏を
判定するときと同じ関数なので、教材側と診断側で数え方がずれない (C-1 単一ソース原則)。

tuplet_actual は analysis.json 側の情報で、教材のカルテには無い。None を渡すと
diagnosis と同じく三連符に既定される。連符の課題の回数はその前提で読むこと。

既定は dry-run (JSON 出力のみ)。--apply で DB へ upsert。
実行: venv\\Scripts\\python.exe scripts\\build_material_subtask_counts.py [--apply]
"""
from __future__ import annotations

import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import psycopg2  # noqa: E402
import requests  # noqa: E402

from lib.material_counts import compute_counts  # noqa: E402

APPLY = "--apply" in sys.argv
OUT_JSON = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "_material_counts.json")


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
XML_BUCKET = ENV.get("BUCKET_NAME") or "musicxml"
HEADERS = {"Authorization": f"Bearer {SERVICE_KEY}"}


def storage_get(path: str):
    url = f"{SUPABASE_URL}/storage/v1/object/{XML_BUCKET}/{path}"
    try:
        res = requests.get(url, headers=HEADERS, timeout=90)
    except requests.RequestException:
        return None
    return res.content if res.status_code == 200 else None


def count_item(item_id: str):
    """1教材の課題出現回数。戻り値 (音符数, {subtaskId: 回数}) / 読めなければ None"""
    raw = storage_get(f"practice/{item_id}/musicxml_skill_info.json")
    if raw is None:
        return None
    try:
        karte = json.loads(raw.decode("utf-8"))
    except ValueError:
        return None
    notes = karte.get("notes") or []

    # スラーの復元 (暫定)。教材の楽譜ファイルが v121 より前に作られたものは
    # 音符ごとの technique_tags を持たない。ファイルに元からある is_in_slur から
    # スラーだけ復元する。教材を作り直せばこの分岐は空振りになる。
    for n in notes:
        if not n.get("technique_tags") and n.get("is_in_slur"):
            n["technique_tags"] = ["スラー"]

    n_notes, counts = compute_counts(notes)
    if n_notes == 0:
        return None
    return n_notes, counts


def main() -> None:
    mode = "APPLY" if APPLY else "DRY-RUN"
    print(f"=== 教材ごとの課題出現回数 [{mode}] ===\n")
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = False
    cur = conn.cursor()
    cur.execute(
        '''
        SELECT id, title, category, star FROM "PracticeItem"
        WHERE "isPublished" = true AND category NOT IN ('lesson')
        ORDER BY category, title
        '''
    )
    items = cur.fetchall()
    print(f"対象の教材 {len(items)}件\n")

    results: dict = {}
    missing: list = []
    with ThreadPoolExecutor(max_workers=10) as ex:
        for (iid, title, cat, star), got in zip(
            items, ex.map(lambda r: count_item(r[0]), items)
        ):
            if got is None:
                missing.append(title)
                continue
            n_notes, counts = got
            results[iid] = {"title": title, "cat": cat, "star": star,
                            "notes": n_notes, "counts": counts}

    rows = sum(len(v["counts"]) for v in results.values())
    print(f"読めた {len(results)}件 / 読めない {len(missing)}件")
    print(f"書き込む行数 {rows}行 ・ 教材あたり平均 {rows / max(1, len(results)):.1f}項目\n")
    if missing:
        print("  読めなかった教材:", " / ".join(missing[:10]),
              f"ほか{max(0, len(missing) - 10)}件" if len(missing) > 10 else "")

    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False)
    print(f"  明細を {os.path.relpath(OUT_JSON)} に出力\n")

    if APPLY:
        cur.execute('DELETE FROM "PracticeItemSubtaskCount"')
        payload = [
            (iid, sid, n, v["notes"])
            for iid, v in results.items()
            for sid, n in v["counts"].items()
        ]
        cur.executemany(
            '''
            INSERT INTO "PracticeItemSubtaskCount"
              (id, "practiceItemId", "subtaskId", count, "noteTotal", "updatedAt")
            VALUES (gen_random_uuid()::text, %s, %s, %s, %s, NOW())
            ON CONFLICT ("practiceItemId", "subtaskId") DO UPDATE SET
              count = EXCLUDED.count,
              "noteTotal" = EXCLUDED."noteTotal",
              "updatedAt" = NOW()
            ''',
            payload,
        )
        conn.commit()
        print(f"commit しました ({len(payload)}行)")
    else:
        conn.rollback()
        print("dry-run のため書き込みなし。--apply で本実行")
    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
