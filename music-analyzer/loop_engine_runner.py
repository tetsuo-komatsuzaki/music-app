"""
loop_engine_runner.py — analyze_performance 後段の score_full 実行 + DB 更新

呼ばれるタイミング:
  entrypoint.py が MODE=analyze_performance + IS_PRACTICE=true で
  analyze_performance.py を完走させた直後に runpy.run_path で起動。

入力 (env vars):
  USER_ID, SCORE_ID (= practice_item_id), PERFORMANCE_ID
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BUCKET_NAME (musicxml), DATABASE_URL
  PERFORMANCE_BUCKET (default: "performances")

処理 (v3.2.2 §14-4 Commit C handoff Step 4):
  1. Storage から 3 つの JSON をダウンロード:
     - analysis.json (note_results 互換、analyze_musicxml.py が生成済)
     - musicxml_skill_info.json (Commit D で生成済)
     - comparison_result.json (たった今 analyze_performance.py が upload)
  2. DB から PracticeItem.difficulty, skillSubTaskTags を取得
  3. score_full.run_pipeline を import 経由で実行
  4. result.json を Storage にアップロード
     パス: practice/{USER_ID}/{SCORE_ID}/{PERFORMANCE_ID}/result.json
  5. PracticePerformance に v3.2.2 列を更新:
     pitchSkillScore / rhythmSkillScore / bowingSkillScore / skillSubScores /
     problematicPositions

Commit 7 hook (processPerformanceCompletion 呼び出し) は Commit 8b で配線。
本 commit では DB v3.2.2 列の埋め込みまで。

エラー時:
  例外を上に投げる。entrypoint.py 側で catch してログ出力 (analyze_performance の
  成果は保持)。
"""

from __future__ import annotations

import json
import os
import sys
from typing import Optional

import psycopg2
import requests


# ---------------------------------------------------------------------------
# env vars
# ---------------------------------------------------------------------------


def _require(name: str) -> str:
    v = os.environ.get(name)
    if not v:
        raise RuntimeError(f"[loop_engine_runner] Required env var missing: {name}")
    return v


# ---------------------------------------------------------------------------
# Storage helpers (analyze_performance.py のパターンを踏襲)
# ---------------------------------------------------------------------------


def _download(
    supabase_url: str, sr_key: str, bucket: str, path: str, dst: str
) -> str:
    url = f"{supabase_url}/storage/v1/object/{bucket}/{path}"
    res = requests.get(
        url, headers={"Authorization": f"Bearer {sr_key}"}, timeout=30
    )
    if res.status_code != 200:
        raise RuntimeError(
            f"[loop_engine_runner] download failed [{bucket}/{path}]: "
            f"{res.status_code} {res.text[:200]}"
        )
    with open(dst, "wb") as f:
        f.write(res.content)
    return dst


def _upload(
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
                f"[loop_engine_runner] upload failed [{bucket}/{path}]: "
                f"{res.status_code} {res.text[:200]}"
            )


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------


def main() -> None:
    user_id = _require("USER_ID")
    practice_item_id = _require("SCORE_ID")  # practice mode では practiceItemId
    performance_id = _require("PERFORMANCE_ID")
    supabase_url = _require("SUPABASE_URL")
    sr_key = _require("SUPABASE_SERVICE_ROLE_KEY")
    musicxml_bucket = _require("BUCKET_NAME")
    performance_bucket = os.environ.get("PERFORMANCE_BUCKET", "performances")
    database_url = _require("DATABASE_URL")

    print(
        f"[loop_engine_runner] start: user={user_id} item={practice_item_id} "
        f"perf={performance_id}"
    )

    # 1. 入力 3 件を /tmp にダウンロード
    tmp_dir = "/tmp/loop_engine"
    os.makedirs(tmp_dir, exist_ok=True)

    analysis_path = _download(
        supabase_url, sr_key, musicxml_bucket,
        f"practice/{practice_item_id}/analysis.json",
        os.path.join(tmp_dir, "analysis.json"),
    )
    skill_info_path = _download(
        supabase_url, sr_key, musicxml_bucket,
        f"practice/{practice_item_id}/musicxml_skill_info.json",
        os.path.join(tmp_dir, "musicxml_skill_info.json"),
    )
    comparison_path = _download(
        supabase_url, sr_key, performance_bucket,
        f"practice/{user_id}/{practice_item_id}/{performance_id}/comparison_result.json",
        os.path.join(tmp_dir, "comparison_result.json"),
    )
    print(f"[loop_engine_runner] inputs downloaded to {tmp_dir}")

    # 2. PracticeItem.difficulty + skillSubTaskTags を取得
    conn = psycopg2.connect(database_url)
    try:
        with conn.cursor() as cur:
            cur.execute(
                'SELECT difficulty, "skillSubTaskTags" '
                'FROM "PracticeItem" WHERE id = %s',
                (practice_item_id,),
            )
            row = cur.fetchone()
        if not row:
            raise RuntimeError(
                f"[loop_engine_runner] PracticeItem not found: {practice_item_id}"
            )
        difficulty: Optional[int] = row[0]
        sub_task_tags_raw = row[1]

        if difficulty is None:
            # 致命1: difficulty backfill 未完の行はスキップ (Commit 1.5 で全件埋まっている想定)
            print(
                f"[loop_engine_runner] SKIP: PracticeItem.difficulty is NULL "
                f"(item={practice_item_id})"
            )
            return

        skill_tags: list[str] = (
            sub_task_tags_raw if isinstance(sub_task_tags_raw, list) else []
        )
        print(
            f"[loop_engine_runner] difficulty={difficulty} "
            f"tags={skill_tags}"
        )

        # 3. score_full.run_pipeline を import 経由で実行
        # score_full.py は同ディレクトリに居る (cwd = music-analyzer/)
        from score_full import run_pipeline

        result = run_pipeline(
            comparison_result_path=comparison_path,
            note_results_path=analysis_path,  # analysis.json = note_results format
            musicxml_skill_info_path=skill_info_path,
            performance_id=performance_id,
            user_id=user_id,
            practice_item_id=practice_item_id,
            practice_item_difficulty=difficulty,
            skill_sub_task_tags=skill_tags,
        )
        print(
            f"[loop_engine_runner] score_full done: status={result.get('status')} "
            f"detection_rate={result.get('detection_rate')}"
        )

        # 4. result.json を Storage にアップロード
        result_json = json.dumps(result, ensure_ascii=False, indent=2)
        result_path = (
            f"practice/{user_id}/{practice_item_id}/{performance_id}/result.json"
        )
        _upload(
            supabase_url, sr_key, performance_bucket,
            result_path, result_json.encode("utf-8"),
        )
        print(f"[loop_engine_runner] uploaded: {result_path}")

        # 5. DB に v3.2.2 列を更新
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE "PracticePerformance"
                SET "pitchSkillScore" = %s,
                    "rhythmSkillScore" = %s,
                    "bowingSkillScore" = %s,
                    "skillSubScores" = %s::jsonb,
                    "problematicPositions" = %s::jsonb
                WHERE id = %s
                """,
                (
                    result.get("pitchSkillScore"),
                    result.get("rhythmSkillScore"),
                    result.get("bowingSkillScore"),
                    json.dumps(result.get("skillSubScores") or {}),
                    json.dumps(result.get("problematicPositions") or []),
                    performance_id,
                ),
            )
        conn.commit()
        print(f"[loop_engine_runner] DB v3.2.2 列更新済: perf={performance_id}")

    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    sys.exit(main() or 0)
