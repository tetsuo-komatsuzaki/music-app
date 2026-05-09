"""
全 PracticeItem の musicxml_skill_info.json を backfill する。

Commit D (2026-05-06) で analyze_musicxml.py に skill_info 出力が追加されたが、
それ以前に作成された PracticeItem は Storage に skill_info ファイルが存在しない。
loop_engine_runner.py が DL 失敗で落ちる原因になるため、既存全 PracticeItem に
対して skill_info を生成 + upload する。

Usage:
    cd music-analyzer
    python scripts/backfill_skill_info_all.py --dry-run         # 集計のみ
    python scripts/backfill_skill_info_all.py --apply           # 不在のみ生成
    python scripts/backfill_skill_info_all.py --apply --force   # 既存も上書き

挙動:
    1. DB から全 PracticeItem (id, originalXmlPath) を取得
    2. 各 item について:
       a. Storage HEAD で musicxml_skill_info.json の存在確認
       b. 存在 + --force なし → skip
       c. 不在 (or --force) → .mxl DL → extract_skill_info → upload
    3. 1 件ごとに進捗 (N/273) を表示
    4. エラーは item id を残して継続 (best-effort)
    5. 最後に summary

ENV (.env から):
    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BUCKET_NAME, DATABASE_URL
"""

from __future__ import annotations

import argparse
import dataclasses
import json
import os
import sys
import tempfile
import time
from typing import Optional

import psycopg2
import requests
from dotenv import load_dotenv

# repo root から1階層上がる
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lib.musicxml_skill_extractor import extract_skill_info  # noqa: E402


def _parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Backfill musicxml_skill_info.json for all PracticeItems")
    p.add_argument("--dry-run", action="store_true", help="集計のみ表示、書き込まない")
    p.add_argument("--apply", action="store_true", help="実書き込み")
    p.add_argument("--force", action="store_true", help="既存ファイルも上書き")
    return p.parse_args()


def _check_existing(supabase_url: str, sr_key: str, bucket: str, path: str) -> bool:
    """Storage に対象ファイルがあるか確認 (HEAD のような GET 軽量化)."""
    url = f"{supabase_url}/storage/v1/object/info/{bucket}/{path}"
    try:
        res = requests.get(
            url, headers={"Authorization": f"Bearer {sr_key}"}, timeout=10
        )
        return res.status_code == 200
    except requests.RequestException:
        return False


def _download_mxl(
    supabase_url: str, sr_key: str, bucket: str, path: str, dst: str
) -> None:
    url = f"{supabase_url}/storage/v1/object/{bucket}/{path}"
    res = requests.get(
        url, headers={"Authorization": f"Bearer {sr_key}"}, timeout=60
    )
    if res.status_code != 200:
        raise RuntimeError(
            f"download failed [{bucket}/{path}]: {res.status_code} {res.text[:200]}"
        )
    with open(dst, "wb") as f:
        f.write(res.content)


def _upload_json(
    supabase_url: str, sr_key: str, bucket: str, path: str, data: bytes
) -> None:
    url = f"{supabase_url}/storage/v1/object/{bucket}/{path}"
    headers = {
        "Authorization": f"Bearer {sr_key}",
        "Content-Type": "application/json",
    }
    res = requests.post(url, headers=headers, data=data, timeout=30)
    if res.status_code not in (200, 201):
        # 既存上書きは PUT
        res = requests.put(url, headers=headers, data=data, timeout=30)
        if res.status_code not in (200, 201):
            raise RuntimeError(
                f"upload failed [{bucket}/{path}]: "
                f"{res.status_code} {res.text[:200]}"
            )


def _process_item(
    *,
    item_id: str,
    mxl_storage_path: str,
    supabase_url: str,
    sr_key: str,
    bucket: str,
    force: bool,
) -> str:
    """1 件分の処理。

    Returns:
        "created" / "overwritten" / "skipped_existing" / "error: ..."
    """
    skill_info_path = f"practice/{item_id}/musicxml_skill_info.json"
    if not force and _check_existing(supabase_url, sr_key, bucket, skill_info_path):
        return "skipped_existing"

    # .mxl DL
    with tempfile.NamedTemporaryFile(suffix=".mxl", delete=False) as tmp:
        tmp_mxl = tmp.name
    try:
        _download_mxl(supabase_url, sr_key, bucket, mxl_storage_path, tmp_mxl)
        # skill_info 抽出
        notes = extract_skill_info(tmp_mxl)
    finally:
        try:
            os.unlink(tmp_mxl)
        except OSError:
            pass

    payload = {
        "version": 1,
        "notes": [dataclasses.asdict(n) for n in notes],
    }
    json_str = json.dumps(payload, ensure_ascii=False)

    # Upload
    _upload_json(supabase_url, sr_key, bucket, skill_info_path, json_str.encode("utf-8"))
    return "overwritten" if force else "created"


def main() -> int:
    args = _parse_args()
    if not args.dry_run and not args.apply:
        print("ERROR: --dry-run か --apply のいずれかを指定してください", file=sys.stderr)
        return 1

    load_dotenv()
    supabase_url = os.getenv("SUPABASE_URL")
    sr_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    bucket = os.getenv("BUCKET_NAME")
    database_url = os.getenv("DATABASE_URL")
    if not all([supabase_url, sr_key, bucket, database_url]):
        print("ERROR: ENV 不足 (SUPABASE_URL/SERVICE_ROLE_KEY/BUCKET_NAME/DATABASE_URL)", file=sys.stderr)
        return 1

    # 1. DB から全 PracticeItem 取得
    conn = psycopg2.connect(database_url)
    try:
        with conn.cursor() as cur:
            cur.execute(
                'SELECT id, "originalXmlPath" FROM "PracticeItem" '
                'WHERE "isPublished" = true '
                'ORDER BY "category" ASC, "sortOrder" ASC'
            )
            items = cur.fetchall()
    finally:
        conn.close()

    total = len(items)
    print(f"Loaded {total} PracticeItem rows")

    if args.dry_run:
        # 既存 / 不在の集計
        present = 0
        absent = 0
        for i, (item_id, _) in enumerate(items, 1):
            skill_info_path = f"practice/{item_id}/musicxml_skill_info.json"
            if _check_existing(supabase_url, sr_key, bucket, skill_info_path):
                present += 1
            else:
                absent += 1
            if i % 50 == 0:
                print(f"  checked {i}/{total} (present={present} absent={absent})")
        print(f"\n=== Dry-run summary ===")
        print(f"  total:   {total}")
        print(f"  present: {present} (skip 対象)")
        print(f"  absent:  {absent} (生成対象)")
        print(f"  ※ --apply で {absent} 件生成 (--force で全 {total} 件上書き)")
        return 0

    # 2. apply
    print(f"\n=== Apply (force={args.force}) ===")
    counts = {"created": 0, "overwritten": 0, "skipped_existing": 0, "error": 0}
    errors: list[tuple[str, str]] = []  # (item_id, error_message)

    for i, (item_id, mxl_path) in enumerate(items, 1):
        if not mxl_path:
            counts["error"] += 1
            errors.append((item_id, "originalXmlPath is null"))
            print(f"  [{i}/{total}] {item_id}: ❌ originalXmlPath is null")
            continue
        try:
            result = _process_item(
                item_id=item_id,
                mxl_storage_path=mxl_path,
                supabase_url=supabase_url,
                sr_key=sr_key,
                bucket=bucket,
                force=args.force,
            )
            counts[result] += 1
            mark = {"created": "✅", "overwritten": "🔁", "skipped_existing": "⏭"}[result]
            if result != "skipped_existing" or i % 50 == 0:
                print(f"  [{i}/{total}] {item_id}: {mark} {result}")
        except Exception as e:
            counts["error"] += 1
            err_msg = str(e)[:200]
            errors.append((item_id, err_msg))
            print(f"  [{i}/{total}] {item_id}: ❌ {err_msg}")
        # 軽い rate limit (Storage API)
        time.sleep(0.05)

    print(f"\n=== Apply summary ===")
    print(f"  created:          {counts['created']}")
    print(f"  overwritten:      {counts['overwritten']}")
    print(f"  skipped (already):{counts['skipped_existing']}")
    print(f"  errors:           {counts['error']}")
    if errors:
        print(f"\n=== Errors (re-run can retry) ===")
        for item_id, msg in errors[:20]:
            print(f"  {item_id}: {msg}")
        if len(errors) > 20:
            print(f"  ... ({len(errors) - 20} more)")
    return 0 if counts["error"] == 0 else 2


if __name__ == "__main__":
    sys.exit(main())
