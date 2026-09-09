"""
fetch_case_inputs.py — ケースに本番と同じ入力を揃える

ベンチマークが comparison_result.json から音符を復元すると、テンポも録音条件も
わからず、本番と違う条件で解析してしまう (2026-09-06 に判明: 位置合わせが 11.14s
→ 0.62s にずれ、sample1 は 15 音中 1 音しか検出できなかった)。

このスクリプトは本番 DB と Storage から、解析器が実際に受け取ったものを取ってくる:
  - analysis.json   楽譜側の音符リスト (analyze_musicxml の出力)
  - params.json     recordingBpm / guideOffsetSec / rangeFromNote / rangeToNote / scoreId

読み取りのみ。書き込みは一切しない。

Usage:
  python tests/audit/fetch_case_inputs.py [case_id ...]   # 省略で tests/cases/* 全部
"""

import json
import os
import pathlib
import sys

import psycopg2
import requests
from dotenv import load_dotenv

HERE = pathlib.Path(__file__).resolve().parent
ANALYZER_DIR = HERE.parents[1]
CASES_DIR = HERE.parent / "cases"

load_dotenv(ANALYZER_DIR / ".env")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
BUCKET = os.getenv("BUCKET_NAME")
DATABASE_URL = os.getenv("DATABASE_URL")


def download(bucket: str, path: str) -> bytes:
    url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{path}"
    r = requests.get(url, headers={"Authorization": f"Bearer {SERVICE_KEY}"}, timeout=60)
    r.raise_for_status()
    return r.content


def fetch_one(cur, case_dir: pathlib.Path) -> str:
    pid = case_dir.name
    cur.execute('''SELECT "scoreId", "userId", "recordingBpm", "guideOffsetSec",
                          "rangeFromNote", "rangeToNote", "audioPath"
                   FROM "Performance" WHERE id = %s''', (pid,))
    row = cur.fetchone()
    kind = "score"
    if row is None:
        cur.execute('''SELECT "practiceItemId", "userId", "recordingBpm", "guideOffsetSec",
                              NULL, NULL, "audioPath"
                       FROM "PracticePerformance" WHERE id = %s''', (pid,))
        row = cur.fetchone()
        kind = "practice"
    if row is None:
        return "DB に見つからない"
    score_id, user_id, rbpm, goff, rfrom, rto, audio_path = row

    if kind == "score":
        cur.execute('SELECT "createdById" FROM "Score" WHERE id = %s', (score_id,))
        s = cur.fetchone()
        if s is None:
            return f"Score {score_id} がない"
        analysis_path = f"{s[0]}/{score_id}/analysis.json"
    else:
        cur.execute('SELECT "analysisPath" FROM "PracticeItem" WHERE id = %s', (score_id,))
        s = cur.fetchone()
        if s is None or not s[0]:
            return f"PracticeItem {score_id} に analysisPath がない"
        analysis_path = s[0]

    data = download(BUCKET, analysis_path)
    (case_dir / "analysis.json").write_bytes(data)
    params = {
        "kind": kind, "score_id": score_id,
        "recording_bpm": rbpm, "guide_offset_sec": goff,
        "range_from_note": rfrom, "range_to_note": rto,
        "audio_path": audio_path, "analysis_path": analysis_path,
    }
    (case_dir / "params.json").write_text(json.dumps(params, ensure_ascii=False, indent=2), encoding="utf-8")
    n = len(json.loads(data).get("notes", []))
    return f"ok  analysis.json {n} entries  bpm={rbpm} guide={goff} range={rfrom}..{rto}"


def main():
    if not all([SUPABASE_URL, SERVICE_KEY, BUCKET, DATABASE_URL]):
        raise SystemExit("music-analyzer/.env に SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / BUCKET_NAME / DATABASE_URL が要る")
    ids = sys.argv[1:] or sorted(d.name for d in CASES_DIR.iterdir() if d.is_dir())
    conn = psycopg2.connect(DATABASE_URL)
    conn.set_session(readonly=True, autocommit=True)
    cur = conn.cursor()
    try:
        for cid in ids:
            d = CASES_DIR / cid
            if not d.is_dir():
                print(f"{cid}: ディレクトリがない")
                continue
            try:
                print(f"{cid}: {fetch_one(cur, d)}", flush=True)
            except Exception as e:
                print(f"{cid}: 失敗 {type(e).__name__}: {str(e)[:120]}", flush=True)
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()
