"""
loop_engine_runner.py — analyze_performance 後段の score_full 実行 + DB 更新 + 累積処理

呼ばれるタイミング:
  entrypoint.py が MODE=analyze_performance + IS_PRACTICE=true で
  analyze_performance.py を完走させた直後に runpy.run_path で起動。

入力 (env vars):
  USER_ID, SCORE_ID (= practice_item_id), PERFORMANCE_ID
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BUCKET_NAME (musicxml), DATABASE_URL
  PERFORMANCE_BUCKET (default: "performances")

処理 (v3.2.2 §14-4 Commit C handoff + v3.2.3 §7-4/§9/§10 累積処理 Python 統合):
  1. Storage から 3 つの JSON をダウンロード:
     - analysis.json (note_results 互換、analyze_musicxml.py が生成済)
     - musicxml_skill_info.json (Commit D で生成済)
     - comparison_result.json (たった今 analyze_performance.py が upload)
  2. DB から PracticeItem.star (v1.3 で difficulty → star rename), skillSubTaskTags を取得
  3. score_full.run_pipeline を import 経由で実行
  4. result.json を Storage にアップロード
     パス: practice/{USER_ID}/{SCORE_ID}/{PERFORMANCE_ID}/result.json
  5. PracticePerformance に v3.2.2 列を更新
  6. 累積処理 (v3.2.3 §7-4 / §9-2 / §9-3 / §9-5 / §10-2 / §10-4):
     - UserSkillScore EMA 増分更新
     - UserSkillSubScore matched 比率増分更新
     - UserSkillTaskCard 発生 / improving 遷移
     - UserGrade.progressData 更新 + grade-up 判定
     ※ 5 と 6 を 1 トランザクションで atomic に commit

Commit 8b (Webhook 案) は採用せず、本 Python 側統合に変更 (v3.2.3 改訂):
  既存パターン (analyze_performance.py が psycopg2 で直接 DB 書き込み) に整合。
  HTTP 経路ゼロで race / idempotency / secret 管理問題を回避。

エラー時:
  conn.rollback() で全ロール バック → 例外を上に投げる。entrypoint.py 側で catch
  してログ出力 (analyze_performance の成果は保持される、step 5+6 は atomic で
  どちらかが失敗したら両方ロールバック)。
"""

from __future__ import annotations

import json
import os
import sys
import uuid
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
# skill_info セーフティネット (将来の修正経路 + 過去の取りこぼし対策)
# ---------------------------------------------------------------------------


def _download_or_generate_skill_info(
    supabase_url: str, sr_key: str, bucket: str,
    practice_item_id: str, dst: str, tmp_dir: str,
) -> str:
    """musicxml_skill_info.json を Storage から DL。404 の場合は .mxl から
    その場で extract_skill_info を実行して生成 + Storage upload + 再使用。

    過去の取りこぼし (Commit D 以前作成 PracticeItem の backfill 漏れ) と、
    将来の修正経路 (mxl 差し替え時に再生成を呼び忘れる) の両方への保険。
    """
    skill_info_storage_path = (
        f"practice/{practice_item_id}/musicxml_skill_info.json"
    )
    try:
        return _download(
            supabase_url, sr_key, bucket, skill_info_storage_path, dst,
        )
    except RuntimeError as e:
        msg = str(e).lower()
        if "404" not in msg and "not_found" not in msg:
            raise

    # 404 → on-demand 生成
    print(
        f"[loop_engine_runner] skill_info NOT FOUND for "
        f"{practice_item_id}, on-demand 生成を試みる"
    )

    # .mxl を DL
    mxl_storage_path = f"practice-items/by-id/{practice_item_id}.mxl"
    tmp_mxl = os.path.join(tmp_dir, f"{practice_item_id}.mxl")
    try:
        _download(supabase_url, sr_key, bucket, mxl_storage_path, tmp_mxl)
    except RuntimeError:
        # 別パスを試す: practice/{id}/original.musicxml (uploadPracticeItem.ts 経由)
        alt_path = f"practice/{practice_item_id}/original.musicxml"
        print(
            f"[loop_engine_runner] mxl not at {mxl_storage_path}, "
            f"trying {alt_path}"
        )
        _download(supabase_url, sr_key, bucket, alt_path, tmp_mxl)

    # extract_skill_info で生成
    import dataclasses
    from lib.musicxml_skill_extractor import extract_skill_info

    notes = extract_skill_info(tmp_mxl)
    payload = {
        "version": 1,
        "notes": [dataclasses.asdict(n) for n in notes],
    }
    json_str = json.dumps(payload, ensure_ascii=False)

    # Storage upload (将来の同 item の解析時は DL で済むよう)
    _upload(
        supabase_url, sr_key, bucket,
        skill_info_storage_path, json_str.encode("utf-8"),
    )

    # ローカル dst に書き出し (今回の解析でそのまま使用)
    with open(dst, "wb") as f:
        f.write(json_str.encode("utf-8"))

    print(
        f"[loop_engine_runner] skill_info on-demand 生成完了 "
        f"(notes={len(notes)}) → uploaded to {bucket}/{skill_info_storage_path}"
    )
    return dst


# ---------------------------------------------------------------------------
# 累積処理 (v3.2.3 §7-4 / §9-2 / §9-3 / §9-5 / §10-2 / §10-4)
# ---------------------------------------------------------------------------
# 旧 app/_libs/skillProgressUpdater.ts (Commit 7) の Python 翻訳。
# 既存 analyze_performance.py の psycopg2 直書きパターンに統合。
# Webhook を使わず、loop_engine_runner.py 内で同一トランザクションで完結。

EMA_ALPHA = 0.3  # §7-4
SUB_TASK_SCORE_THRESHOLD = 90  # §10-2 達成判定閾値
TASK_SCORE_TASK_CARD_THRESHOLD = 60  # §9-2 task カード化閾値
RECENT_PERFORMANCES_FOR_IMPROVING = 3  # §9-2 直近 N 件

TASK_IDS = ("pitch", "rhythm", "bowing")
SUB_TASK_IDS = (
    "pitch_overall", "pitch_high", "pitch_chromatic",
    "rhythm_overall", "rhythm_fast", "rhythm_after_rest",
    "string_change_volume", "string_change_slur", "string_change_timing",
)
GRADE_LEVELS = ("BEGINNER", "INTERMEDIATE", "ADVANCED", "MASTER")
GRADE_BANDS: dict[str, list[int]] = {
    "BEGINNER": [1, 2, 3],          # → INTERMEDIATE
    "INTERMEDIATE": [4, 5, 6, 7],   # → ADVANCED
    "ADVANCED": [8, 9, 10],         # → MASTER
    "MASTER": [],
}
STRING_CHANGE_SUB_TASKS = (
    "string_change_volume", "string_change_slur", "string_change_timing",
)


def _new_id() -> str:
    """cuid 互換 id (Prisma @default(cuid()) を SQL 直 INSERT で代替)。
    UUIDv4 hex 32 chars を返す。cuid とは形式が違うが文字列 PK として有効。
    """
    return uuid.uuid4().hex


# § 7-4 -----------------------------------------------------------------------


def _update_user_skill_score(
    conn, user_id: str, task_id: str, new_score: float
) -> None:
    """UserSkillScore を EMA で 1 サンプル追加更新。

    丸め: 行わない。skillRecalc.ts (TS 全件再計算) と整合性を保つため
    full precision で保持。表示時に丸める。
    """
    with conn.cursor() as cur:
        cur.execute(
            'SELECT "currentScore", "sampleCount" FROM "UserSkillScore" '
            'WHERE "userId" = %s AND "skillTaskId" = %s',
            (user_id, task_id),
        )
        row = cur.fetchone()
        if row:
            prev_score, prev_count = row
            sample_count = prev_count + 1
            current_score = (
                new_score
                if prev_count == 0
                else prev_score * (1 - EMA_ALPHA) + new_score * EMA_ALPHA
            )
        else:
            sample_count = 1
            current_score = new_score

        cur.execute(
            '''
            INSERT INTO "UserSkillScore"
                ("id", "userId", "skillTaskId", "currentScore",
                 "sampleCount", "lastUpdatedAt")
            VALUES (%s, %s, %s, %s, %s, NOW())
            ON CONFLICT ("userId", "skillTaskId") DO UPDATE SET
                "currentScore" = EXCLUDED."currentScore",
                "sampleCount"  = EXCLUDED."sampleCount",
                "lastUpdatedAt" = NOW()
            ''',
            (_new_id(), user_id, task_id, current_score, sample_count),
        )


# § 9-5 -----------------------------------------------------------------------


def _update_user_skill_sub_score(
    conn, user_id: str, sub_task_id: str,
    score: Optional[float], matched: bool, target_count: int,
) -> None:
    """UserSkillSubScore の matched 比率と平均スコアを増分更新。

    Q5: target_count == 0 はスキップ (集計対象外)。
    """
    if target_count == 0:
        return

    with conn.cursor() as cur:
        cur.execute(
            'SELECT "matchedCount", "totalCount", "averageScore" '
            'FROM "UserSkillSubScore" '
            'WHERE "userId" = %s AND "skillSubTaskId" = %s',
            (user_id, sub_task_id),
        )
        row = cur.fetchone()
        if row:
            prev_matched, prev_total, prev_avg = row
        else:
            prev_matched, prev_total, prev_avg = 0, 0, None

        total_count = prev_total + 1
        matched_count = prev_matched + (1 if matched else 0)
        match_rate = (matched_count / total_count) if total_count > 0 else 0.0

        average_score: Optional[float] = prev_avg
        if matched and score is not None:
            if average_score is None:
                average_score = float(score)
            else:
                # 単純移動平均 (matched=true の累積平均)
                average_score = (
                    average_score * (matched_count - 1) + float(score)
                ) / matched_count

        last_matched_clause = ", \"lastMatchedAt\" = NOW()" if matched else ""

        cur.execute(
            f'''
            INSERT INTO "UserSkillSubScore"
                ("id", "userId", "skillSubTaskId",
                 "matchedCount", "totalCount", "matchRate", "averageScore",
                 "lastMatchedAt", "lastUpdatedAt")
            VALUES (%s, %s, %s, %s, %s, %s, %s, {("NOW()" if matched else "NULL")}, NOW())
            ON CONFLICT ("userId", "skillSubTaskId") DO UPDATE SET
                "matchedCount" = EXCLUDED."matchedCount",
                "totalCount"   = EXCLUDED."totalCount",
                "matchRate"    = EXCLUDED."matchRate",
                "averageScore" = EXCLUDED."averageScore",
                "lastUpdatedAt" = NOW()
                {last_matched_clause}
            ''',
            (
                _new_id(), user_id, sub_task_id,
                matched_count, total_count, match_rate, average_score,
            ),
        )


# § 9-2 / § 9-3 ---------------------------------------------------------------


def _create_or_reactivate_sub_task_card(
    conn, user_id: str, sub_task_id: str
) -> None:
    """sub_task カード: 新規 active / improving→active 復活 / active→ lastMatched 更新 /
    cleared は維持 (§9-2)。
    """
    with conn.cursor() as cur:
        cur.execute(
            'SELECT id, status FROM "UserSkillTaskCard" '
            'WHERE "userId" = %s AND "cardType" = %s '
            'AND "skillTaskId" IS NULL AND "skillSubTaskId" = %s',
            (user_id, "sub_task", sub_task_id),
        )
        row = cur.fetchone()
        if not row:
            cur.execute(
                '''
                INSERT INTO "UserSkillTaskCard"
                    ("id", "userId", "cardType", "skillSubTaskId",
                     "status", "createdAt", "lastMatchedAt")
                VALUES (%s, %s, 'sub_task'::"CardType", %s,
                        'active'::"CardStatus", NOW(), NOW())
                ''',
                (_new_id(), user_id, sub_task_id),
            )
            return
        card_id, status = row
        if status == "improving":
            cur.execute(
                'UPDATE "UserSkillTaskCard" SET '
                '"status" = \'active\'::"CardStatus", '
                '"lastMatchedAt" = NOW(), "improvedAt" = NULL '
                'WHERE id = %s',
                (card_id,),
            )
        elif status == "active":
            cur.execute(
                'UPDATE "UserSkillTaskCard" SET "lastMatchedAt" = NOW() '
                'WHERE id = %s',
                (card_id,),
            )
        # cleared: そのまま


def _create_or_reactivate_task_card(
    conn, user_id: str, task_id: str
) -> None:
    with conn.cursor() as cur:
        cur.execute(
            'SELECT id, status FROM "UserSkillTaskCard" '
            'WHERE "userId" = %s AND "cardType" = %s '
            'AND "skillTaskId" = %s AND "skillSubTaskId" IS NULL',
            (user_id, "task", task_id),
        )
        row = cur.fetchone()
        if not row:
            cur.execute(
                '''
                INSERT INTO "UserSkillTaskCard"
                    ("id", "userId", "cardType", "skillTaskId",
                     "status", "createdAt", "lastMatchedAt")
                VALUES (%s, %s, 'task'::"CardType", %s,
                        'active'::"CardStatus", NOW(), NOW())
                ''',
                (_new_id(), user_id, task_id),
            )
            return
        card_id, status = row
        if status == "improving":
            cur.execute(
                'UPDATE "UserSkillTaskCard" SET '
                '"status" = \'active\'::"CardStatus", '
                '"lastMatchedAt" = NOW(), "improvedAt" = NULL '
                'WHERE id = %s',
                (card_id,),
            )
        elif status == "active":
            cur.execute(
                'UPDATE "UserSkillTaskCard" SET "lastMatchedAt" = NOW() '
                'WHERE id = %s',
                (card_id,),
            )


def _check_improving_for_user(conn, user_id: str) -> None:
    """active 状態の sub_task カードを直近 N 件の matched 履歴で improving 評価。

    3 件未満では判定保留 (Commit 7 fix と整合)。
    """
    with conn.cursor() as cur:
        cur.execute(
            'SELECT id, "skillSubTaskId" FROM "UserSkillTaskCard" '
            'WHERE "userId" = %s AND "status" = \'active\'::"CardStatus" '
            'AND "cardType" = \'sub_task\'::"CardType"',
            (user_id,),
        )
        active_cards = cur.fetchall()
    if not active_cards:
        return

    with conn.cursor() as cur:
        cur.execute(
            'SELECT "skillSubScores" FROM "PracticePerformance" '
            'WHERE "userId" = %s AND "analysisStatus" = \'done\'::"JobStatus" '
            'ORDER BY "uploadedAt" DESC LIMIT %s',
            (user_id, RECENT_PERFORMANCES_FOR_IMPROVING),
        )
        recent_perfs = cur.fetchall()

    if len(recent_perfs) < RECENT_PERFORMANCES_FOR_IMPROVING:
        return

    for card_id, sub_task_id in active_cards:
        if not sub_task_id:
            continue
        matched_count = 0
        for (sub_scores_raw,) in recent_perfs:
            sub_scores = sub_scores_raw if isinstance(sub_scores_raw, dict) else {}
            entry = sub_scores.get(sub_task_id) or {}
            if entry.get("matched"):
                matched_count += 1
        if matched_count <= 1:
            with conn.cursor() as cur2:
                cur2.execute(
                    'UPDATE "UserSkillTaskCard" SET '
                    '"status" = \'improving\'::"CardStatus", "improvedAt" = NOW() '
                    'WHERE id = %s',
                    (card_id,),
                )


def _process_cards_on_performance_complete(
    conn, user_id: str,
    sub_task_results: dict[str, dict],
    skill_scores: dict[str, Optional[float]],
) -> None:
    for sub_task_id in SUB_TASK_IDS:
        r = sub_task_results.get(sub_task_id) or {}
        if r.get("matched"):
            _create_or_reactivate_sub_task_card(conn, user_id, sub_task_id)
    for task_id in TASK_IDS:
        s = skill_scores.get(task_id)
        if isinstance(s, (int, float)) and s < TASK_SCORE_TASK_CARD_THRESHOLD:
            _create_or_reactivate_task_card(conn, user_id, task_id)
    _check_improving_for_user(conn, user_id)


# § 10-2 / § 10-4 -------------------------------------------------------------


def _is_eligible_for_grade_progress(
    pitch: Optional[float], rhythm: Optional[float], bowing: Optional[float]
) -> bool:
    """v3.2 簡素化: bowing=None は弦移動なし曲扱いで bowing チェックスキップ."""
    if pitch is None or pitch < SUB_TASK_SCORE_THRESHOLD:
        return False
    if rhythm is None or rhythm < SUB_TASK_SCORE_THRESHOLD:
        return False
    if bowing is not None and bowing < SUB_TASK_SCORE_THRESHOLD:
        return False
    return True


def _check_grade_up(progress: dict, current: str) -> str:
    """progressData から達成可能な最上位グレードを返す (永久保持原則で下げない)."""
    achieved = current
    try:
        idx = GRADE_LEVELS.index(current)
    except ValueError:
        return current
    for i in range(idx, len(GRADE_LEVELS) - 1):
        band = GRADE_BANDS[GRADE_LEVELS[i]]
        if not band:
            break
        all_done = all(
            (progress.get(str(d)) or {}).get("completed", 0) >= 10 for d in band
        )
        if not all_done:
            break
        achieved = GRADE_LEVELS[i + 1]
    return achieved


def _update_user_grade_progress(
    conn, user_id: str, practice_item_id: str, difficulty: int,
    pitch: Optional[float], rhythm: Optional[float], bowing: Optional[float],
) -> dict:
    """progressData に PracticeItem を追加 + grade-up 判定。

    Returns: {"changed": bool, "previousGrade"?: str, "newGrade"?: str}
    """
    if not _is_eligible_for_grade_progress(pitch, rhythm, bowing):
        return {"changed": False}
    if difficulty is None:  # 致命1
        return {"changed": False}

    # UserGrade 取得 or 作成
    with conn.cursor() as cur:
        cur.execute(
            'SELECT id, "currentGrade", "progressData" '
            'FROM "UserGrade" WHERE "userId" = %s',
            (user_id,),
        )
        row = cur.fetchone()
        if not row:
            cur.execute(
                '''
                INSERT INTO "UserGrade"
                    ("id", "userId", "currentGrade", "progressData", "lastUpdatedAt")
                VALUES (%s, %s, 'BEGINNER'::"GradeLevel", '{}'::jsonb, NOW())
                RETURNING id, "currentGrade", "progressData"
                ''',
                (_new_id(), user_id),
            )
            row = cur.fetchone()
        grade_id, current_grade, progress_raw = row

    progress: dict = progress_raw if isinstance(progress_raw, dict) else {}
    d_key = str(difficulty)
    entry = progress.get(d_key) or {
        "completed": 0, "required": 10, "practiceItemIds": [],
    }
    item_ids: list[str] = list(entry.get("practiceItemIds") or [])
    if practice_item_id in item_ids:
        # 既達成 — progressData 不変、grade-up 判定不要
        return {"changed": False}
    item_ids.append(practice_item_id)
    entry["practiceItemIds"] = item_ids
    entry["completed"] = len(item_ids)
    entry.setdefault("required", 10)
    progress[d_key] = entry

    new_grade = _check_grade_up(progress, current_grade)
    grade_changed = new_grade != current_grade

    with conn.cursor() as cur:
        if grade_changed:
            cur.execute(
                'UPDATE "UserGrade" SET '
                '"progressData" = %s::jsonb, '
                '"currentGrade" = %s::"GradeLevel", '
                '"achievedAt" = NOW(), "lastUpdatedAt" = NOW() '
                'WHERE id = %s',
                (json.dumps(progress), new_grade, grade_id),
            )
        else:
            cur.execute(
                'UPDATE "UserGrade" SET '
                '"progressData" = %s::jsonb, "lastUpdatedAt" = NOW() '
                'WHERE id = %s',
                (json.dumps(progress), grade_id),
            )

    if grade_changed:
        return {
            "changed": True,
            "previousGrade": current_grade,
            "newGrade": new_grade,
        }
    return {"changed": False}


# エントリポイント -------------------------------------------------------------


def process_performance_completion_py(
    conn,
    *,
    user_id: str,
    performance_id: str,
    practice_item_id: str,
    practice_item_difficulty: int,
    skill_scores: dict[str, Optional[float]],
    sub_scores: dict[str, dict],
) -> dict:
    """演奏完了時の累積データ更新エントリポイント.

    Args:
        conn: psycopg2 connection (commit/rollback は呼出側で実施、本関数は
              cursor を発行するのみ)
        skill_scores: {"pitch": ..., "rhythm": ..., "bowing": ...} (None 可)
        sub_scores: 9 sub_task の result (skillSubScores と同形式)

    Returns:
        {
          "performanceId": ...,
          "userId": ...,
          "gradeUpdate": {"changed": bool, ...}
        }
    """
    # 1. UserSkillScore (3 中項目)
    for task_id in TASK_IDS:
        s = skill_scores.get(task_id)
        if isinstance(s, (int, float)):
            _update_user_skill_score(conn, user_id, task_id, float(s))

    # 2. UserSkillSubScore (9 sub_task、target=0 はスキップ)
    sub_task_results: dict[str, dict] = {}
    for sub_task_id in SUB_TASK_IDS:
        sub = sub_scores.get(sub_task_id) or {}
        sub_task_results[sub_task_id] = {"matched": bool(sub.get("matched"))}
        score = sub.get("score")
        target_count = int(sub.get("target_count") or 0)
        if isinstance(score, (int, float)):
            _update_user_skill_sub_score(
                conn, user_id, sub_task_id,
                float(score), bool(sub.get("matched")), target_count,
            )

    # 3. カード発生 / improving 遷移
    _process_cards_on_performance_complete(
        conn, user_id, sub_task_results, skill_scores,
    )

    # 4. グレード進捗 + grade-up
    grade_update = _update_user_grade_progress(
        conn, user_id, practice_item_id,
        practice_item_difficulty,
        skill_scores.get("pitch"),
        skill_scores.get("rhythm"),
        skill_scores.get("bowing"),
    )

    return {
        "performanceId": performance_id,
        "userId": user_id,
        "gradeUpdate": grade_update,
    }


# ---------------------------------------------------------------------------
# v1.5 Phase 3a (2026-05-11): Score 演奏モード
# ---------------------------------------------------------------------------
# practice mode と異なる点:
#   - DB クエリ先: Score テーブル (vs PracticeItem)
#   - Storage path: {user_id}/{score_id}/... (vs practice/{practice_item_id}/...)
#   - DB 更新先: Performance (vs PracticePerformance)
#   - ownerScope == "admin" gate (M5=B 確定): 非 admin Score は対象外
#   - performanceType == "user" gate (I4=A 確定): pro 演奏は対象外
#   - 累積処理 (process_performance_completion_py) は Phase 3c 対応につき skip
# ---------------------------------------------------------------------------


def run_score_mode() -> None:
    """Score 演奏 (IS_PRACTICE=false) のループエンジン実行。"""
    user_id = _require("USER_ID")
    score_id = _require("SCORE_ID")
    performance_id = _require("PERFORMANCE_ID")
    supabase_url = _require("SUPABASE_URL")
    sr_key = _require("SUPABASE_SERVICE_ROLE_KEY")
    musicxml_bucket = _require("BUCKET_NAME")
    performance_bucket = os.environ.get("PERFORMANCE_BUCKET", "performances")
    database_url = _require("DATABASE_URL")

    print(
        f"[loop_engine_runner] start (score mode): user={user_id} "
        f"score={score_id} perf={performance_id}"
    )

    # 1. 入力 3 件を /tmp にダウンロード (Score 用 path: practice/ プレフィックスなし)
    tmp_dir = "/tmp/loop_engine"
    os.makedirs(tmp_dir, exist_ok=True)

    analysis_path = _download(
        supabase_url, sr_key, musicxml_bucket,
        f"{user_id}/{score_id}/analysis.json",
        os.path.join(tmp_dir, "analysis.json"),
    )
    skill_info_path = _download(
        supabase_url, sr_key, musicxml_bucket,
        f"{user_id}/{score_id}/musicxml_skill_info.json",
        os.path.join(tmp_dir, "musicxml_skill_info.json"),
    )
    comparison_path = _download(
        supabase_url, sr_key, performance_bucket,
        f"{user_id}/{score_id}/{performance_id}/comparison_result.json",
        os.path.join(tmp_dir, "comparison_result.json"),
    )
    print(f"[loop_engine_runner] (score) inputs downloaded to {tmp_dir}")

    # 2. Score + Performance メタ取得 + ゲート判定
    conn = psycopg2.connect(database_url)
    try:
        with conn.cursor() as cur:
            cur.execute(
                'SELECT s.star, s."skillSubTaskTags", s."ownerScope", '
                '       p."performanceType" '
                'FROM "Score" s '
                'INNER JOIN "Performance" p ON p."scoreId" = s.id '
                'WHERE s.id = %s AND p.id = %s',
                (score_id, performance_id),
            )
            row = cur.fetchone()
        if not row:
            raise RuntimeError(
                f"[loop_engine_runner] Score or Performance not found: "
                f"score={score_id} perf={performance_id}"
            )
        star: Optional[int] = row[0]
        sub_task_tags_raw = row[1]
        owner_scope: str = row[2]
        performance_type: str = row[3]

        # M5 = B 確定: ownerScope != "admin" の Score 演奏はループエンジン対象外
        if owner_scope != "admin":
            print(
                f"[loop_engine_runner] SKIP (score mode): "
                f"ownerScope={owner_scope} (admin-only path)"
            )
            return

        # I4 = A 確定: pro 演奏は完全スキップ (二重防御; analyze_performance も skip するはず)
        if performance_type == "pro":
            print(
                f"[loop_engine_runner] SKIP (score mode): "
                f"performanceType=pro"
            )
            return

        if star is None:
            print(
                f"[loop_engine_runner] SKIP (score mode): Score.star is NULL "
                f"(score={score_id})"
            )
            return

        skill_tags: list[str] = (
            sub_task_tags_raw if isinstance(sub_task_tags_raw, list) else []
        )
        print(f"[loop_engine_runner] (score) star={star} tags={skill_tags}")

        # 3. score_full.run_pipeline 実行 (practice_item_id 引数に score_id を渡す)
        from score_full import run_pipeline

        result = run_pipeline(
            comparison_result_path=comparison_path,
            note_results_path=analysis_path,
            musicxml_skill_info_path=skill_info_path,
            performance_id=performance_id,
            user_id=user_id,
            practice_item_id=score_id,  # score_full 内部では汎用識別子として使われる
            practice_item_difficulty=star,
            skill_sub_task_tags=skill_tags,
        )
        print(
            f"[loop_engine_runner] (score) score_full done: "
            f"status={result.get('status')} "
            f"detection_rate={result.get('detection_rate')}"
        )

        # 4. result.json を Storage にアップロード (Score 用 path)
        result_json = json.dumps(result, ensure_ascii=False, indent=2)
        result_path = f"{user_id}/{score_id}/{performance_id}/result.json"
        _upload(
            supabase_url, sr_key, performance_bucket,
            result_path, result_json.encode("utf-8"),
        )
        print(f"[loop_engine_runner] (score) uploaded: {result_path}")

        # 5. Performance を更新 (PracticePerformance UPDATE と同等のロジック)
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE "Performance"
                SET "pitchSkillScore" = %s,
                    "rhythmSkillScore" = %s,
                    "bowingSkillScore" = %s,
                    "bowingAccuracy" = %s,
                    "skillSubScores" = %s::jsonb,
                    "problematicPositions" = %s::jsonb
                WHERE id = %s
                """,
                (
                    result.get("pitchSkillScore"),
                    result.get("rhythmSkillScore"),
                    result.get("bowingSkillScore"),
                    result.get("bowingSkillScore"),  # bowingAccuracy = bowingSkillScore
                    json.dumps(result.get("skillSubScores") or {}),
                    json.dumps(result.get("problematicPositions") or []),
                    performance_id,
                ),
            )
            # v1.5/案 α: overallScore = (pitch + rhythm + bowing) / 3 を再計算
            cur.execute(
                """
                UPDATE "Performance"
                SET "overallScore" = ROUND(
                    (("pitchAccuracy" + "rhythmAccuracy" + "bowingAccuracy") / 3.0)::numeric, 1
                )::float
                WHERE id = %s
                  AND "pitchAccuracy" IS NOT NULL
                  AND "rhythmAccuracy" IS NOT NULL
                  AND "bowingAccuracy" IS NOT NULL
                """,
                (performance_id,),
            )
        print(
            f"[loop_engine_runner] (score) DB v1.5 列更新 (uncommitted): "
            f"perf={performance_id}"
        )

        # 6. 累積処理 (UserGrade / SongMastery 等) は Phase 3c で対応 — 本 commit では skip
        # process_performance_completion_py は PracticePerformance + UserGrade.progressData
        # 専用のため、Score 演奏には現状適用できない。
        # Phase 3c で SongMastery / UserGradeProgress / SkillTaskCard 生成を追加予定。
        print(
            f"[loop_engine_runner] (score) 累積処理は Phase 3c で対応 — 本 commit では skip"
        )
        conn.commit()

    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------


def main() -> None:
    # v1.5 Phase 3a: IS_PRACTICE=false (Score 演奏) は run_score_mode() に分岐
    if os.environ.get("IS_PRACTICE") != "true":
        return run_score_mode()

    # 以下、既存の practice mode ロジック (PracticePerformance 経路)
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
    # skill_info はセーフティネット付き (過去の取りこぼし or 将来の追加修正経路で
    # 万一 skill_info が無い場合、その場で extract_skill_info を実行して補完する)
    skill_info_path = _download_or_generate_skill_info(
        supabase_url, sr_key, musicxml_bucket,
        practice_item_id,
        os.path.join(tmp_dir, "musicxml_skill_info.json"),
        tmp_dir,
    )
    comparison_path = _download(
        supabase_url, sr_key, performance_bucket,
        f"practice/{user_id}/{practice_item_id}/{performance_id}/comparison_result.json",
        os.path.join(tmp_dir, "comparison_result.json"),
    )
    print(f"[loop_engine_runner] inputs downloaded to {tmp_dir}")

    # 2. PracticeItem.star + skillSubTaskTags を取得 (v1.3: 旧 difficulty → star に rename)
    conn = psycopg2.connect(database_url)
    try:
        with conn.cursor() as cur:
            cur.execute(
                'SELECT star, "skillSubTaskTags" '
                'FROM "PracticeItem" WHERE id = %s',
                (practice_item_id,),
            )
            row = cur.fetchone()
        if not row:
            raise RuntimeError(
                f"[loop_engine_runner] PracticeItem not found: {practice_item_id}"
            )
        difficulty: Optional[int] = row[0]  # local 変数は domain 概念で維持 (旧名互換)
        sub_task_tags_raw = row[1]

        if difficulty is None:
            # 致命1: star backfill 未完の行はスキップ (Commit 1.5 で全件埋まっている想定)
            print(
                f"[loop_engine_runner] SKIP: PracticeItem.star is NULL "
                f"(item={practice_item_id})"
            )
            return

        skill_tags: list[str] = (
            sub_task_tags_raw if isinstance(sub_task_tags_raw, list) else []
        )
        print(
            f"[loop_engine_runner] star={difficulty} "
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

        # 5. DB に v3.2.2 列を更新 (commit はまだ — 6 と atomic にする)
        # v1.5/K2=(a): bowingAccuracy = bowingSkillScore のコピー (UPDATE 1)
        # v1.5/案 α : overallScore = (pitch + rhythm + bowing) / 3 (UPDATE 2、accuracy 列が揃ったあと)
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE "PracticePerformance"
                SET "pitchSkillScore" = %s,
                    "rhythmSkillScore" = %s,
                    "bowingSkillScore" = %s,
                    "bowingAccuracy" = %s,
                    "skillSubScores" = %s::jsonb,
                    "problematicPositions" = %s::jsonb
                WHERE id = %s
                """,
                (
                    result.get("pitchSkillScore"),
                    result.get("rhythmSkillScore"),
                    result.get("bowingSkillScore"),
                    result.get("bowingSkillScore"),  # v1.5/K2=(a): bowingAccuracy = bowingSkillScore
                    json.dumps(result.get("skillSubScores") or {}),
                    json.dumps(result.get("problematicPositions") or []),
                    performance_id,
                ),
            )
            # v1.5/案 α: overallScore は 3 軸 (pitch/rhythm/bowing accuracy) が揃ったあとに合成
            # analyze_performance.py が pitchAccuracy / rhythmAccuracy をセット済、
            # 上の UPDATE で bowingAccuracy が設定されたので、ここで overallScore を再計算する。
            cur.execute(
                """
                UPDATE "PracticePerformance"
                SET "overallScore" = ROUND(
                    (("pitchAccuracy" + "rhythmAccuracy" + "bowingAccuracy") / 3.0)::numeric, 1
                )::float
                WHERE id = %s
                  AND "pitchAccuracy" IS NOT NULL
                  AND "rhythmAccuracy" IS NOT NULL
                  AND "bowingAccuracy" IS NOT NULL
                """,
                (performance_id,),
            )
        print(f"[loop_engine_runner] DB v3.2.2 + v1.5 列更新 (uncommitted): perf={performance_id}")

        # 6. 累積処理 (v3.2.3 §7-4 / §9 / §10) — Step 5 と同 transaction で atomic
        sub_scores_for_progress = result.get("skillSubScores") or {}
        completion_summary = process_performance_completion_py(
            conn,
            user_id=user_id,
            performance_id=performance_id,
            practice_item_id=practice_item_id,
            practice_item_difficulty=difficulty,
            skill_scores={
                "pitch": result.get("pitchSkillScore"),
                "rhythm": result.get("rhythmSkillScore"),
                "bowing": result.get("bowingSkillScore"),
            },
            sub_scores=sub_scores_for_progress,
        )
        conn.commit()  # Step 5 + 6 を atomic に commit
        print(
            f"[loop_engine_runner] 累積処理 done: "
            f"gradeUpdate={completion_summary['gradeUpdate']}"
        )

    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    sys.exit(main() or 0)
