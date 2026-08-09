"""
musicxml_skill_info.json を 1 件分だけローカルで生成 + Storage upload。

Commit D 以前に作成された PracticeItem は musicxml_skill_info.json が
Storage にないため、loop_engine_runner が動作しない。これは admin 用の
1-shot バックフィル。

Usage:
    cd music-analyzer
    python scripts/_tmp_backfill_skill_info.py <practiceItemId>

ENV (.env から読む):
    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BUCKET_NAME
"""

from __future__ import annotations

import dataclasses
import json
import os
import sys
import tempfile

import requests
from dotenv import load_dotenv

# repo root から1階層上がる
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lib.musicxml_skill_extractor import extract_skill_info


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: python scripts/_tmp_backfill_skill_info.py <practiceItemId>", file=sys.stderr)
        return 1
    practice_item_id = sys.argv[1]

    load_dotenv()
    supabase_url = os.getenv("SUPABASE_URL")
    sr_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    bucket = os.getenv("BUCKET_NAME")
    if not supabase_url or not sr_key or not bucket:
        print("ENV missing: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / BUCKET_NAME", file=sys.stderr)
        return 1

    # 1. .mxl の Storage path は practice-items/by-id/{id}.mxl
    mxl_path = f"practice-items/by-id/{practice_item_id}.mxl"
    print(f"[1/3] Downloading {bucket}/{mxl_path} ...")
    res = requests.get(
        f"{supabase_url}/storage/v1/object/{bucket}/{mxl_path}",
        headers={"Authorization": f"Bearer {sr_key}"},
        timeout=30,
    )
    if res.status_code != 200:
        print(f"FAILED: HTTP {res.status_code}: {res.text[:200]}", file=sys.stderr)
        return 1

    with tempfile.NamedTemporaryFile(suffix=".mxl", delete=False) as tmp:
        tmp.write(res.content)
        tmp_path = tmp.name

    # 2. skill_info を抽出
    print(f"[2/3] extract_skill_info ...")
    try:
        notes = extract_skill_info(tmp_path)
    finally:
        os.unlink(tmp_path)

    payload = {
        "version": 1,
        "notes": [dataclasses.asdict(n) for n in notes],
    }
    json_str = json.dumps(payload, ensure_ascii=False)
    print(f"      generated {len(notes)} notes")

    # 3. Storage upload
    upload_path = f"practice/{practice_item_id}/musicxml_skill_info.json"
    upload_url = f"{supabase_url}/storage/v1/object/{bucket}/{upload_path}"
    headers = {
        "Authorization": f"Bearer {sr_key}",
        "Content-Type": "application/json",
    }
    print(f"[3/3] Uploading {bucket}/{upload_path} ...")
    res = requests.post(upload_url, headers=headers, data=json_str.encode("utf-8"), timeout=30)
    if res.status_code not in (200, 201):
        # 既存上書きは PUT
        res = requests.put(upload_url, headers=headers, data=json_str.encode("utf-8"), timeout=30)
        if res.status_code not in (200, 201):
            print(f"FAILED upload: HTTP {res.status_code}: {res.text[:200]}", file=sys.stderr)
            return 1

    print(f"\nDone: {upload_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
