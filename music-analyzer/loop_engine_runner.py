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
# 個別課題 v1 (2026-05-25): 旧 9 sub_task を完全廃止し、新 59 項目 (うち 2 将来検討) に置換。
# TS app/_libs/skillMaster.ts SUB_TASK_IDS と一対一対応。
SUB_TASK_IDS = (
    # 音程 (18)
    "pitch_position_2", "pitch_position_3", "pitch_position_4", "pitch_position_5plus",
    "pitch_shift_up", "pitch_shift_down",
    "pitch_double_stop_2", "pitch_double_stop_3plus", "pitch_double_stop_continuous",
    "pitch_harmonic",
    "pitch_interval_up_2nd_plus", "pitch_interval_up_3rd_plus",
    "pitch_interval_down_2nd_plus", "pitch_interval_down_3rd_plus",
    "pitch_finger_1", "pitch_finger_2", "pitch_finger_3", "pitch_finger_4",
    # リズム (17)
    "rhythm_value_whole", "rhythm_value_half", "rhythm_value_16th",
    "rhythm_value_32nd_plus", "rhythm_value_dotted",
    "rhythm_pattern_triplet", "rhythm_pattern_2plet_plus",
    "rhythm_entry_after_rest",
    "rhythm_technique_martele", "rhythm_technique_staccato", "rhythm_technique_spiccato",
    "rhythm_technique_ricochet",
    "rhythm_technique_tremolo", "rhythm_technique_portato", "rhythm_technique_trill",
    "rhythm_technique_arpeggio", "rhythm_technique_glissando",
    # 弦移動 (24)
    "bowing_technique_staccato", "bowing_technique_hooked_staccato",
    "bowing_technique_spiccato", "bowing_technique_ricochet",
    "bowing_technique_pizzicato", "bowing_technique_tremolo",
    "bowing_technique_portato", "bowing_technique_trill",
    "bowing_technique_arpeggio", "bowing_technique_glissando",
    "bowing_technique_harmonic",
    "bowing_string_g", "bowing_string_d", "bowing_string_a", "bowing_string_e",
    "bowing_string_change_g_to_d", "bowing_string_change_d_to_g",
    "bowing_string_change_d_to_a", "bowing_string_change_a_to_d",
    "bowing_string_change_a_to_e", "bowing_string_change_e_to_a",
    "bowing_double_stop_2", "bowing_double_stop_3plus", "bowing_double_stop_continuous",
)
GRADE_LEVELS = ("BEGINNER", "INTERMEDIATE", "ADVANCED", "MASTER")
GRADE_BANDS: dict[str, list[int]] = {
    "BEGINNER": [1, 2, 3],          # → INTERMEDIATE
    "INTERMEDIATE": [4, 5, 6, 7],   # → ADVANCED
    "ADVANCED": [8, 9, 10],         # → MASTER
    "MASTER": [],
}
# 個別課題 v1: 移弦は 6 方向ペアに細分化。旧 string_change_{volume,slur,timing} と
# 同じ「演奏に弦移動が含まれるか」の意味で 6 ペアを並べる。
STRING_CHANGE_SUB_TASKS = (
    "bowing_string_change_g_to_d", "bowing_string_change_d_to_g",
    "bowing_string_change_d_to_a", "bowing_string_change_a_to_d",
    "bowing_string_change_a_to_e", "bowing_string_change_e_to_a",
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
    """[DEPRECATED v1.6 Phase 5] 旧 incremental EMA 更新。
    _recompute_legacy_skill_for_user (ノート数加重・全件・Practice+Score 合算) に
    置換済で本関数は未使用。順序依存で TS skillRecalc と不整合だったため廃止。

    UserSkillScore を EMA で 1 サンプル追加更新。

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
    """[DEPRECATED v1.6 Phase 5] 旧 incremental 更新。
    _recompute_legacy_skill_for_user に置換済で本関数は未使用。

    UserSkillSubScore の matched 比率と平均スコアを増分更新。

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


def _recompute_legacy_skill_for_user(conn, user_id: str) -> None:
    """v1.6 Phase 5 (2026-05-18): UserSkillScore / UserSkillSubScore を
    PracticePerformance + Performance 合算の「ノート数(evaluatedNotes)加重平均」で
    全件再計算する。

    skill は練習形態によらない普遍指標なので Practice/Score を 1 本化。
    式 Σ(score×notes)/Σ(notes) は順序非依存なので、TS 側
    app/_libs/skillRecalc.ts (削除経路の全件再計算) と同一結果に収束する
    (旧 EMA は順序依存で二重ライター不整合の温床だった)。

    evaluatedNotes が NULL/0 の演奏は重み 1 (1 サンプル相当) で扱う
    (skillRecalc.ts noteWeight() と一致)。
    UserGrade.progressData / カード生成は本関数の対象外 (別系統・practice 専用)。
    """
    SKILL_COLS = (
        ("pitch", "pitchSkillScore"),
        ("rhythm", "rhythmSkillScore"),
        ("bowing", "bowingSkillScore"),
    )
    with conn.cursor() as cur:
        # --- UserSkillScore: Σ(score×w)/Σ(w) over PracticePerformance ∪ Performance ---
        for task_id, col in SKILL_COLS:
            cur.execute(
                f'''
                WITH rows AS (
                  SELECT "{col}"::float AS s,
                         COALESCE(NULLIF("evaluatedNotes", 0), 1)::float AS w
                  FROM "PracticePerformance"
                  WHERE "userId" = %s AND "analysisStatus" = 'done'
                    AND "{col}" IS NOT NULL
                  UNION ALL
                  SELECT "{col}"::float AS s,
                         COALESCE(NULLIF("evaluatedNotes", 0), 1)::float AS w
                  FROM "Performance"
                  WHERE "userId" = %s AND "analysisStatus" = 'done'
                    AND "{col}" IS NOT NULL
                )
                SELECT
                  COALESCE(SUM(s * w) / NULLIF(SUM(w), 0), 0)::float,
                  COUNT(*)::int
                FROM rows
                ''',
                (user_id, user_id),
            )
            raw_score, sample_count = cur.fetchone()
            # TS skillRecalc.ts と同じく小数 1 桁丸め
            current_score = round(float(raw_score), 1) if sample_count > 0 else 0.0
            cur.execute(
                '''
                INSERT INTO "UserSkillScore"
                    ("id", "userId", "skillTaskId", "currentScore",
                     "sampleCount", "lastUpdatedAt")
                VALUES (%s, %s, %s, %s, %s, NOW())
                ON CONFLICT ("userId", "skillTaskId") DO UPDATE SET
                    "currentScore"  = EXCLUDED."currentScore",
                    "sampleCount"   = EXCLUDED."sampleCount",
                    "lastUpdatedAt" = NOW()
                ''',
                (_new_id(), user_id, task_id, current_score, sample_count),
            )

        # --- UserSkillSubScore: matched 比率 + target_count 加重平均 ---
        for sub_task_id in SUB_TASK_IDS:
            cur.execute(
                '''
                WITH rows AS (
                  SELECT "uploadedAt" AS up, ("skillSubScores" -> %s) AS j
                  FROM "PracticePerformance"
                  WHERE "userId" = %s AND "analysisStatus" = 'done'
                    AND "skillSubScores" IS NOT NULL
                  UNION ALL
                  SELECT "uploadedAt" AS up, ("skillSubScores" -> %s) AS j
                  FROM "Performance"
                  WHERE "userId" = %s AND "analysisStatus" = 'done'
                    AND "skillSubScores" IS NOT NULL
                ), f AS (
                  SELECT
                    up,
                    COALESCE((j ->> 'matched')::boolean, false) AS matched,
                    COALESCE((j ->> 'score')::float, 0) AS score,
                    COALESCE((j ->> 'target_count')::int, 0) AS tc
                  FROM rows WHERE j IS NOT NULL
                ), g AS (
                  SELECT * FROM f WHERE tc > 0  -- Q5: target=0 は除外
                )
                SELECT
                  COUNT(*) FILTER (WHERE matched)::int,
                  COUNT(*)::int,
                  CASE WHEN COALESCE(SUM(tc) FILTER (WHERE matched), 0) > 0
                       THEN (SUM(score * tc) FILTER (WHERE matched)
                             / SUM(tc) FILTER (WHERE matched))::float
                       ELSE NULL END,
                  MAX(up) FILTER (WHERE matched)
                FROM g
                ''',
                (sub_task_id, user_id, sub_task_id, user_id),
            )
            matched_count, total_count, average_score, last_matched_at = (
                cur.fetchone()
            )
            matched_count = matched_count or 0
            total_count = total_count or 0
            match_rate = (
                (matched_count / total_count) if total_count > 0 else 0.0
            )
            cur.execute(
                '''
                INSERT INTO "UserSkillSubScore"
                    ("id", "userId", "skillSubTaskId",
                     "matchedCount", "totalCount", "matchRate", "averageScore",
                     "lastMatchedAt", "lastUpdatedAt")
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT ("userId", "skillSubTaskId") DO UPDATE SET
                    "matchedCount"  = EXCLUDED."matchedCount",
                    "totalCount"    = EXCLUDED."totalCount",
                    "matchRate"     = EXCLUDED."matchRate",
                    "averageScore"  = EXCLUDED."averageScore",
                    "lastMatchedAt" = EXCLUDED."lastMatchedAt",
                    "lastUpdatedAt" = NOW()
                ''',
                (
                    _new_id(), user_id, sub_task_id,
                    matched_count, total_count, match_rate, average_score,
                    last_matched_at,
                ),
            )
    print(
        f"[loop_engine_runner] (Phase5) legacy skill 再計算 (Practice+Score "
        f"ノート数加重): user={user_id}"
    )


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
    # 1+2. v1.6 Phase 5: UserSkillScore / UserSkillSubScore は
    #   PracticePerformance + Performance 合算のノート数加重平均で全件再計算。
    #   (この時点で当該 PracticePerformance 行は同 conn 内 UPDATE 済 = 反映される)
    #   旧 incremental EMA (_update_user_skill_score/_sub_score) は Phase 5 で廃止。
    _recompute_legacy_skill_for_user(conn, user_id)

    # カード判定用に matched フラグだけ抽出 (集計は上の再計算が担う)
    sub_task_results: dict[str, dict] = {}
    for sub_task_id in SUB_TASK_IDS:
        sub = sub_scores.get(sub_task_id) or {}
        sub_task_results[sub_task_id] = {"matched": bool(sub.get("matched"))}

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
# v1.5 Phase 3b (2026-05-13): Score 演奏完了時のカード生成
# ---------------------------------------------------------------------------
# 仕様 (v1.3 §7-1 + §2-4 + R5=A の 9 新規テーブル):
#   閾値: 中課題/小課題 共に < 70 (Tetsuo 確定)
#   生成対象:
#     - SkillTaskCard (userId × scoreId × taskCategory)
#     - SubTask (中課題に紐づく失敗 sub_task)
#     - SubTaskAssignment (3 カテゴリ × 1、簡易版アルゴリズム)
#     - MissingPracticeItemFlag (該当教材ゼロ件時、I1=A)
#   SubTaskAssignment 簡易版: 未演奏優先 + sortOrder
#   (フル版 = ユーザー実績 + sortOrder は Phase 3c で UserPracticeMastery 集計後に組込)
# ---------------------------------------------------------------------------

THRESHOLD_MID_TASK = 70  # 中課題判定 (skill score < 70 で課題化、Tetsuo 確定)
THRESHOLD_SUB_TASK = 70  # 小課題判定 (skillSubScores の matched score < 70)

# sub_task ID → 親 TaskCategory enum 値
# 個別課題 v1 (2026-05-25): 新 59 項目 (うち 2 将来検討) を prefix で振り分け。
_SUB_TO_PARENT: dict[str, str] = {
    sub_id: (
        "PITCH" if sub_id.startswith("pitch_")
        else "RHYTHM" if sub_id.startswith("rhythm_")
        else "BOWING"
    )
    for sub_id in SUB_TASK_IDS
}


def _pick_practice_item_phase3b(
    cur,
    user_internal_id: str,
    key_tonic: str,
    key_mode: str,
    star: int,
    sub_type: str,
    category: str,
) -> Optional[str]:
    """1 sub_task × 1 category で教材を 1 件選ぶ (簡易版)。

    優先順位 (簡易版、Phase 3c で実績ソート追加予定):
      1. ユーザー未演奏 (PracticePerformance 未登録) を優先
      2. PracticeItem.sortOrder 昇順 + title 昇順 (tie-breaker)
    """
    cur.execute(
        """
        SELECT pi.id
        FROM "PracticeItem" pi
        WHERE pi."category" = %s::"PracticeCategory"
          AND pi."keyTonic" = %s
          AND pi."keyMode" = %s
          AND pi."star" = %s
          AND pi."isPublished" = true
          AND pi."skillSubTaskTags" @> jsonb_build_array(%s::text)
        ORDER BY
          (NOT EXISTS (
            SELECT 1 FROM "PracticePerformance" pp
            WHERE pp."userId" = %s AND pp."practiceItemId" = pi.id
          )) DESC,
          pi."sortOrder" ASC,
          pi."title" ASC
        LIMIT 1
        """,
        (category, key_tonic, key_mode, star, sub_type, user_internal_id),
    )
    row = cur.fetchone()
    return row[0] if row else None


def _generate_subtask_phase3b(
    cur,
    card_id: str,
    sub_type: str,
    user_internal_id: str,
    score_id: str,
    key_tonic: Optional[str],
    key_mode: Optional[str],
    star: Optional[int],
) -> None:
    """1 つの失敗 sub_task に対し SubTask + SubTaskAssignment を生成。

    3 カテゴリで該当教材が揃わない場合は MissingPracticeItemFlag を作成し、
    SubTask 自体は生成しない (I1=A / M6=B 確定)。
    """
    if not key_tonic or not key_mode or star is None:
        print(
            f"[loop_engine_runner] (3b) SubTask {sub_type}: Score key/star 不足で skip "
            f"(keyTonic={key_tonic}, keyMode={key_mode}, star={star})"
        )
        return

    # 3 カテゴリで候補検索
    candidates_by_cat: dict[str, str] = {}
    missing_categories: list[str] = []
    for cat in ("scale", "arpeggio", "etude"):
        item_id = _pick_practice_item_phase3b(
            cur, user_internal_id, key_tonic, key_mode, star, sub_type, cat
        )
        if item_id:
            candidates_by_cat[cat] = item_id
        else:
            missing_categories.append(cat)

    # 1 カテゴリでも欠ければ SubTask 生成 skip + Flag 作成 (I1=A / M6=B)
    if missing_categories:
        for missing_cat in missing_categories:
            # 未解決の同じ Flag があれば重複しないように
            cur.execute(
                """
                SELECT 1 FROM "MissingPracticeItemFlag"
                WHERE "scoreId" = %s AND "subTaskType" = %s
                  AND "missingCategory" = %s AND "resolvedAt" IS NULL
                LIMIT 1
                """,
                (score_id, sub_type, missing_cat),
            )
            if cur.fetchone() is None:
                cur.execute(
                    """
                    INSERT INTO "MissingPracticeItemFlag"
                    ("id", "scoreId", "subTaskType", "missingCategory",
                     "keyTonic", "keyMode", "star", "detectedAt")
                    VALUES (gen_random_uuid()::text, %s, %s, %s, %s, %s, %s, NOW())
                    """,
                    (score_id, sub_type, missing_cat, key_tonic, key_mode, star),
                )
        print(
            f"[loop_engine_runner] (3b) SubTask {sub_type} skip: "
            f"missing categories={missing_categories} → MissingPracticeItemFlag 作成"
        )
        return

    # SubTask upsert (既存なら updatedAt 更新)
    cur.execute(
        """
        INSERT INTO "SubTask"
        ("id", "skillTaskCardId", "subTaskType", "status",
         "generatedAt", "updatedAt")
        VALUES (gen_random_uuid()::text, %s, %s, 'active', NOW(), NOW())
        ON CONFLICT ("skillTaskCardId", "subTaskType") DO UPDATE
          SET "updatedAt" = NOW()
        RETURNING id
        """,
        (card_id, sub_type),
    )
    sub_task_id = cur.fetchone()[0]
    print(f"[loop_engine_runner] (3b) SubTask {sub_type}: id={sub_task_id}")

    # 3 カテゴリそれぞれ SubTaskAssignment 確認 + insert (既存ならスキップ、§3-4 / S2=A)
    for cat in ("scale", "arpeggio", "etude"):
        cur.execute(
            'SELECT 1 FROM "SubTaskAssignment" '
            'WHERE "subTaskId" = %s AND "assignedCategory" = %s::"AssignedCategory"',
            (sub_task_id, cat.upper()),
        )
        if cur.fetchone() is not None:
            continue  # 既存温存 (ユーザー選定変更不可、§3-4)
        cur.execute(
            """
            INSERT INTO "SubTaskAssignment"
            ("id", "subTaskId", "practiceItemId", "assignedCategory",
             "isMastered", "assignedAt")
            VALUES (gen_random_uuid()::text, %s, %s, %s::"AssignedCategory",
                    false, NOW())
            ON CONFLICT ("subTaskId", "practiceItemId") DO NOTHING
            """,
            (sub_task_id, candidates_by_cat[cat], cat.upper()),
        )
    print(
        f"[loop_engine_runner] (3b) SubTaskAssignment for {sub_type}: "
        f"scale={candidates_by_cat.get('scale')} "
        f"arpeggio={candidates_by_cat.get('arpeggio')} "
        f"etude={candidates_by_cat.get('etude')}"
    )


def generate_score_cards_phase3b(
    cur,
    user_internal_id: str,
    score_id: str,
    score_key_tonic: Optional[str],
    score_key_mode: Optional[str],
    score_star: Optional[int],
    pitch_skill_score: Optional[float],
    rhythm_skill_score: Optional[float],
    bowing_skill_score: Optional[float],
    skill_sub_scores: dict,
) -> None:
    """Phase 3b 本体: Score 演奏完了時にカード一式を生成。

    呼び出し元: run_score_mode (Performance UPDATE 直後、同 transaction 内)
    """
    # 1. 中課題判定: skill score 系で < 70 のものを抽出
    mid_categories: list[str] = []
    if pitch_skill_score is not None and pitch_skill_score < THRESHOLD_MID_TASK:
        mid_categories.append("PITCH")
    if rhythm_skill_score is not None and rhythm_skill_score < THRESHOLD_MID_TASK:
        mid_categories.append("RHYTHM")
    if bowing_skill_score is not None and bowing_skill_score < THRESHOLD_MID_TASK:
        mid_categories.append("BOWING")

    if not mid_categories:
        print(
            f"[loop_engine_runner] (3b) 中課題なし (pitch={pitch_skill_score} "
            f"rhythm={rhythm_skill_score} bowing={bowing_skill_score}, "
            f"全て ≥ {THRESHOLD_MID_TASK}) — カード生成スキップ"
        )
        return

    # 2. 小課題候補抽出 (matched=true かつ score < 70)
    failed_sub_by_parent: dict[str, list[str]] = {}
    for sub_type, v in (skill_sub_scores or {}).items():
        if not isinstance(v, dict):
            continue
        if v.get("matched") and v.get("score") is not None and v["score"] < THRESHOLD_SUB_TASK:
            parent = _SUB_TO_PARENT.get(sub_type)
            if parent and parent in mid_categories:
                failed_sub_by_parent.setdefault(parent, []).append(sub_type)

    print(
        f"[loop_engine_runner] (3b) 中課題: {mid_categories}, "
        f"小課題候補: {failed_sub_by_parent}"
    )

    # 3. SkillTaskCard upsert + SubTask 展開
    for parent_cat in mid_categories:
        cur.execute(
            'SELECT id, status FROM "SkillTaskCard" '
            'WHERE "userId" = %s AND "scoreId" = %s '
            '  AND "taskCategory" = %s::"TaskCategory"',
            (user_internal_id, score_id, parent_cat),
        )
        row = cur.fetchone()
        if row and row[1] == "cleared":
            # 永久クリア (S3=A、MVP 範囲では再アクティブ化しない)
            print(
                f"[loop_engine_runner] (3b) SkillTaskCard {parent_cat}: "
                f"cleared 状態のため skip"
            )
            continue

        if row:
            card_id = row[0]
            cur.execute(
                'UPDATE "SkillTaskCard" '
                'SET "lastMatchedAt" = NOW(), "updatedAt" = NOW() '
                'WHERE id = %s',
                (card_id,),
            )
            print(
                f"[loop_engine_runner] (3b) SkillTaskCard {parent_cat}: "
                f"existing updated (id={card_id})"
            )
        else:
            cur.execute(
                """
                INSERT INTO "SkillTaskCard"
                ("id", "userId", "scoreId", "taskCategory", "status",
                 "generatedAt", "lastMatchedAt", "updatedAt")
                VALUES (gen_random_uuid()::text, %s, %s, %s::"TaskCategory",
                        'active', NOW(), NOW(), NOW())
                RETURNING id
                """,
                (user_internal_id, score_id, parent_cat),
            )
            card_id = cur.fetchone()[0]
            print(
                f"[loop_engine_runner] (3b) SkillTaskCard {parent_cat}: "
                f"new (id={card_id})"
            )

        # この親に紐づく失敗 sub_task を SubTask + Assignment で展開
        for sub_type in failed_sub_by_parent.get(parent_cat, []):
            _generate_subtask_phase3b(
                cur, card_id, sub_type, user_internal_id, score_id,
                score_key_tonic, score_key_mode, score_star,
            )


# ---------------------------------------------------------------------------
# v1.5 Phase 3c (2026-05-16): 累積処理 (SongMastery / UserPracticeMastery /
#   UserTechniqueMastery / UserGradeProgress + cleared 遷移)
# ---------------------------------------------------------------------------
# 仕様 (v1.3 §2-2 〜 §2-7、Tetsuo 確定 2026-05-16):
#   - Q1=B: UserPracticeMastery は永続 (mastered になったら false に戻さない)
#   - Q2=A: UserTechniqueMastery は演奏した PracticeItem の技法のみ再計算
#   - Q3=A: SongMastery は gate 通過 (admin × non-pro) のみ
#   - Q4=B: ScoreTechniqueTag を参照して「全演奏技法習得」を判定
#   - Q5=A: SkillTaskCard cleared = 全 SubTask cleared ∧ 当該カテゴリ skill ≥ 70
#   - Q6=A: PracticeItem 演奏マスター達成時に関連 SubTaskAssignment.isMastered=true
#   - Q7=A: SongMastery.isFullyMastered=true で UserGradeProgress カウント
#   - 演奏マスター必要回数は 5 回統一 (Phase 3c 追加仕様、PracticeItem も 5 回)
# ---------------------------------------------------------------------------

MASTERY_RECENT_COUNT = 5          # 直近 N 回 (SongMastery / UserPracticeMastery 両方)
MASTERY_AVERAGE_THRESHOLD = 90.0  # 平均 overallScore ≥ 90
MASTERY_MIN_TOTAL = 5             # 累計 ≥ 5
CLEARED_SKILL_THRESHOLD = 70.0    # SkillTaskCard cleared 判定 (§2-5)
GRADE_UP_SONG_COUNT = 10          # 完全習得 10 曲で☆昇格 (§2-7)


def _update_user_practice_mastery(
    cur, user_internal_id: str, practice_item_id: str
) -> bool:
    """UserPracticeMastery を upsert。

    Returns:
        bool: 「今回新たに isPerformanceMastered=true に遷移したか」
              (Q1=B 永続のため、既に true のものは false 返す)
    """
    # 直近 5 回 (PracticePerformance.overallScore IS NOT NULL でフィルタ) + 累計
    cur.execute(
        """
        WITH recent AS (
          SELECT "overallScore"
          FROM "PracticePerformance"
          WHERE "userId" = %s AND "practiceItemId" = %s
            AND "overallScore" IS NOT NULL
          ORDER BY "uploadedAt" DESC
          LIMIT %s
        )
        SELECT
          (SELECT AVG("overallScore") FROM recent)::float AS recent_avg,
          (SELECT COUNT(*) FROM "PracticePerformance"
            WHERE "userId" = %s AND "practiceItemId" = %s
              AND "overallScore" IS NOT NULL)::int AS total_count
        """,
        (user_internal_id, practice_item_id, MASTERY_RECENT_COUNT,
         user_internal_id, practice_item_id),
    )
    recent_avg, total_count = cur.fetchone()

    cur.execute(
        'SELECT "isPerformanceMastered" FROM "UserPracticeMastery" '
        'WHERE "userId" = %s AND "practiceItemId" = %s',
        (user_internal_id, practice_item_id),
    )
    existing = cur.fetchone()
    was_mastered = bool(existing[0]) if existing else False

    becomes_mastered = (
        recent_avg is not None
        and recent_avg >= MASTERY_AVERAGE_THRESHOLD
        and total_count >= MASTERY_MIN_TOTAL
    )
    # Q1=B 永続: 既に true なら false に戻さない
    final_mastered = was_mastered or becomes_mastered

    if existing:
        cur.execute(
            """
            UPDATE "UserPracticeMastery"
            SET "recentAverageScore" = %s,
                "totalPerformanceCount" = %s,
                "isPerformanceMastered" = %s,
                "masteredAt" = CASE
                  WHEN "isPerformanceMastered" = false AND %s = true
                  THEN NOW() ELSE "masteredAt"
                END,
                "updatedAt" = NOW()
            WHERE "userId" = %s AND "practiceItemId" = %s
            """,
            (recent_avg, total_count, final_mastered,
             final_mastered, user_internal_id, practice_item_id),
        )
    else:
        cur.execute(
            """
            INSERT INTO "UserPracticeMastery"
            ("id", "userId", "practiceItemId", "recentAverageScore",
             "totalPerformanceCount", "isPerformanceMastered",
             "masteredAt", "updatedAt")
            VALUES (gen_random_uuid()::text, %s, %s, %s, %s, %s,
                    CASE WHEN %s = true THEN NOW() ELSE NULL END, NOW())
            """,
            (user_internal_id, practice_item_id, recent_avg, total_count,
             final_mastered, final_mastered),
        )

    just_mastered = (not was_mastered) and becomes_mastered
    print(
        f"[loop_engine_runner] (3c) UserPracticeMastery: item={practice_item_id} "
        f"recent_avg={recent_avg} total={total_count} mastered={final_mastered} "
        f"(just_mastered={just_mastered})"
    )
    return just_mastered


def _mark_assignments_mastered(
    cur, user_internal_id: str, practice_item_id: str
) -> list[str]:
    """PracticeItem 演奏マスター達成時、関連 SubTaskAssignment を全て isMastered=true に。

    Returns:
        list[str]: 影響を受けた SubTask の id 一覧 (cleared 再判定対象)
    """
    cur.execute(
        """
        UPDATE "SubTaskAssignment" sta
        SET "isMastered" = true, "masteredAt" = NOW()
        FROM "SubTask" st
        INNER JOIN "SkillTaskCard" stc ON st."skillTaskCardId" = stc.id
        WHERE sta."subTaskId" = st.id
          AND sta."practiceItemId" = %s
          AND stc."userId" = %s
          AND sta."isMastered" = false
        RETURNING sta."subTaskId"
        """,
        (practice_item_id, user_internal_id),
    )
    affected = [r[0] for r in cur.fetchall()]
    if affected:
        print(
            f"[loop_engine_runner] (3c) SubTaskAssignment.isMastered=true: "
            f"item={practice_item_id} affected_subtasks={len(affected)}"
        )
    return affected


def _reclear_subtasks(cur, sub_task_ids: list[str]) -> list[str]:
    """指定 SubTask 群について、全 SubTaskAssignment.isMastered=true ならば
    status='cleared' + clearedAt=NOW() に遷移。

    Returns:
        list[str]: cleared 状態になった SkillTaskCard id (重複排除済)。
    """
    if not sub_task_ids:
        return []

    cur.execute(
        """
        UPDATE "SubTask" st
        SET "status" = 'cleared', "clearedAt" = NOW(), "updatedAt" = NOW()
        WHERE st.id = ANY(%s)
          AND st."status" != 'cleared'
          AND NOT EXISTS (
            SELECT 1 FROM "SubTaskAssignment" sta
            WHERE sta."subTaskId" = st.id AND sta."isMastered" = false
          )
        RETURNING st."skillTaskCardId"
        """,
        (sub_task_ids,),
    )
    affected_card_ids = list({r[0] for r in cur.fetchall()})
    if affected_card_ids:
        print(
            f"[loop_engine_runner] (3c) SubTask.cleared 遷移: "
            f"cards_affected={len(affected_card_ids)}"
        )
    return affected_card_ids


def _maybe_clear_skill_cards(
    cur,
    card_ids: list[str],
    latest_skill_scores: Optional[dict[str, Optional[float]]] = None,
) -> list[str]:
    """SkillTaskCard cleared 判定 (§2-5 厳密版):
       全 SubTask cleared ∧ 当該カテゴリ skill score ≥ CLEARED_SKILL_THRESHOLD

    Args:
        card_ids: 再判定対象のカード id
        latest_skill_scores: {"PITCH": float, "RHYTHM": float, "BOWING": float}
            Score 演奏完了直後に渡す。Practice 経路では None (skill 条件未充足扱い)

    Returns:
        list[str]: cleared に遷移した card id
    """
    if not card_ids:
        return []

    cur.execute(
        """
        SELECT id, "userId", "scoreId", "taskCategory"::text
        FROM "SkillTaskCard"
        WHERE id = ANY(%s) AND "status" != 'cleared'
        """,
        (card_ids,),
    )
    rows = cur.fetchall()
    newly_cleared: list[str] = []
    for card_id, user_id, score_id, task_category in rows:
        # 全 SubTask cleared 確認
        cur.execute(
            'SELECT COUNT(*) FROM "SubTask" '
            'WHERE "skillTaskCardId" = %s AND "status" != \'cleared\'',
            (card_id,),
        )
        remaining = cur.fetchone()[0]
        if remaining > 0:
            continue

        # 当該カテゴリ skill score ≥ 70 確認
        skill_score: Optional[float] = None
        if latest_skill_scores:
            skill_score = latest_skill_scores.get(task_category)
        if skill_score is None or skill_score < CLEARED_SKILL_THRESHOLD:
            # Practice 経路 (skill_score=None) or skill 不足 → cleared 保留
            print(
                f"[loop_engine_runner] (3c) SkillTaskCard {task_category} "
                f"card={card_id}: 全 SubTask cleared だが skill={skill_score} "
                f"< {CLEARED_SKILL_THRESHOLD} で cleared 保留"
            )
            continue

        cur.execute(
            'UPDATE "SkillTaskCard" SET "status" = \'cleared\', '
            '  "clearedAt" = NOW(), "updatedAt" = NOW() '
            'WHERE id = %s',
            (card_id,),
        )
        newly_cleared.append(card_id)
        print(
            f"[loop_engine_runner] (3c) SkillTaskCard {task_category} "
            f"card={card_id}: cleared (skill={skill_score})"
        )
    return newly_cleared


def _update_user_technique_mastery(
    cur, user_internal_id: str, practice_item_id: str
) -> None:
    """演奏した PracticeItem に紐づく TechniqueTag のみ UserTechniqueMastery 再計算。

    判定 (§2-3): 同調・同★・同 T を持つ scale + arpeggio + etude のうち、
    実在する全カテゴリで 1 つ以上演奏マスター (UserPracticeMastery.isPerformanceMastered=true)
    """
    cur.execute(
        """
        SELECT pit."techniqueTagId", pi."keyTonic", pi."keyMode", pi."star"
        FROM "PracticeItemTechnique" pit
        INNER JOIN "PracticeItem" pi ON pi.id = pit."practiceItemId"
        WHERE pit."practiceItemId" = %s
        """,
        (practice_item_id,),
    )
    triples = cur.fetchall()
    if not triples:
        return

    for tag_id, key_tonic, key_mode, star in triples:
        if star is None or not key_tonic or not key_mode:
            continue
        # 同調・同★・同 T で実在カテゴリを取得
        cur.execute(
            """
            SELECT DISTINCT pi."category"::text
            FROM "PracticeItem" pi
            INNER JOIN "PracticeItemTechnique" pit2 ON pit2."practiceItemId" = pi.id
            WHERE pit2."techniqueTagId" = %s
              AND pi."keyTonic" = %s AND pi."keyMode" = %s AND pi."star" = %s
              AND pi."isPublished" = true
            """,
            (tag_id, key_tonic, key_mode, star),
        )
        existing_cats = [r[0] for r in cur.fetchall()]
        if not existing_cats:
            continue

        # 実在カテゴリ全てに 1+ mastered があるか
        cur.execute(
            """
            SELECT DISTINCT pi."category"::text
            FROM "PracticeItem" pi
            INNER JOIN "PracticeItemTechnique" pit2 ON pit2."practiceItemId" = pi.id
            INNER JOIN "UserPracticeMastery" upm ON upm."practiceItemId" = pi.id
            WHERE pit2."techniqueTagId" = %s
              AND pi."keyTonic" = %s AND pi."keyMode" = %s AND pi."star" = %s
              AND pi."isPublished" = true
              AND upm."userId" = %s AND upm."isPerformanceMastered" = true
            """,
            (tag_id, key_tonic, key_mode, star, user_internal_id),
        )
        mastered_cats = {r[0] for r in cur.fetchall()}
        is_mastered = all(c in mastered_cats for c in existing_cats)

        cur.execute(
            'SELECT "isMastered" FROM "UserTechniqueMastery" '
            'WHERE "userId" = %s AND "techniqueTagId" = %s',
            (user_internal_id, tag_id),
        )
        existing = cur.fetchone()
        was_mastered = bool(existing[0]) if existing else False
        # Q1=B と同じ永続ポリシー (技法も剥奪しない)
        final = was_mastered or is_mastered

        if existing:
            cur.execute(
                """
                UPDATE "UserTechniqueMastery"
                SET "isMastered" = %s,
                    "masteredAt" = CASE
                      WHEN "isMastered" = false AND %s = true THEN NOW()
                      ELSE "masteredAt"
                    END,
                    "updatedAt" = NOW()
                WHERE "userId" = %s AND "techniqueTagId" = %s
                """,
                (final, final, user_internal_id, tag_id),
            )
        else:
            cur.execute(
                """
                INSERT INTO "UserTechniqueMastery"
                ("id", "userId", "techniqueTagId", "isMastered",
                 "masteredAt", "updatedAt")
                VALUES (gen_random_uuid()::text, %s, %s, %s,
                        CASE WHEN %s = true THEN NOW() ELSE NULL END, NOW())
                """,
                (user_internal_id, tag_id, final, final),
            )
    print(
        f"[loop_engine_runner] (3c) UserTechniqueMastery 再計算: "
        f"item={practice_item_id} tags={len(triples)}"
    )


def _update_song_mastery_and_grade(
    cur,
    user_internal_id: str,
    score_id: str,
    latest_skill_scores: dict[str, Optional[float]],
) -> None:
    """Score 演奏完了時の SongMastery / UserGradeProgress 更新。

    1. SongMastery: 直近 5 回平均 (gate 通過のみ) + 累計、isPerformanceMastered 判定
    2. SkillTaskCard cleared 再判定 (§2-5 厳密版)
    3. 完全習得判定: 演奏マスター ∧ ScoreTechniqueTag 全習得 ∧ 全 SkillTaskCard cleared
    4. UserGradeProgress: 完全習得遷移時に masteredSongCountAtCurrentStar++
    """
    # Q3=A gate filter: ownerScope=admin × performanceType != 'pro'
    cur.execute(
        """
        WITH eligible AS (
          SELECT p."overallScore"
          FROM "Performance" p
          INNER JOIN "Score" s ON s.id = p."scoreId"
          WHERE p."userId" = %s AND p."scoreId" = %s
            AND p."overallScore" IS NOT NULL
            AND s."ownerScope" = 'admin'
            AND p."performanceType" != 'pro'
          ORDER BY p."uploadedAt" DESC
        ), recent AS (
          SELECT "overallScore" FROM eligible LIMIT %s
        )
        SELECT
          (SELECT AVG("overallScore") FROM recent)::float,
          (SELECT COUNT(*) FROM eligible)::int
        """,
        (user_internal_id, score_id, MASTERY_RECENT_COUNT),
    )
    recent_avg, total_count = cur.fetchone()

    cur.execute(
        'SELECT "isPerformanceMastered", "isFullyMastered" FROM "SongMastery" '
        'WHERE "userId" = %s AND "scoreId" = %s',
        (user_internal_id, score_id),
    )
    row = cur.fetchone()
    was_perf = bool(row[0]) if row else False
    was_full = bool(row[1]) if row else False

    is_perf_now = (
        recent_avg is not None
        and recent_avg >= MASTERY_AVERAGE_THRESHOLD
        and total_count >= MASTERY_MIN_TOTAL
    )
    final_perf = was_perf or is_perf_now  # 永続

    # 2. SkillTaskCard cleared 再判定 — このユーザー × Score の全 active カード
    cur.execute(
        'SELECT id FROM "SkillTaskCard" '
        'WHERE "userId" = %s AND "scoreId" = %s AND "status" != \'cleared\'',
        (user_internal_id, score_id),
    )
    active_card_ids = [r[0] for r in cur.fetchall()]
    _maybe_clear_skill_cards(cur, active_card_ids, latest_skill_scores)

    # 3. 完全習得判定
    full_mastery = False
    if final_perf:
        # (b) ScoreTechniqueTag 全て UserTechniqueMastery.isMastered=true ?
        cur.execute(
            """
            SELECT
              COUNT(*) AS total,
              SUM(CASE WHEN utm."isMastered" = true THEN 1 ELSE 0 END) AS mastered
            FROM "ScoreTechniqueTag" stt
            LEFT JOIN "UserTechniqueMastery" utm
              ON utm."techniqueTagId" = stt."techniqueTagId"
              AND utm."userId" = %s
            WHERE stt."scoreId" = %s
            """,
            (user_internal_id, score_id),
        )
        tt_total, tt_mastered = cur.fetchone()
        tt_mastered = tt_mastered or 0
        techniques_ok = (tt_total or 0) == tt_mastered  # 0/0 も OK (技法未登録 Score も完全習得可能)

        # (c) 全 SkillTaskCard cleared (= active カード 0 件)
        cur.execute(
            'SELECT COUNT(*) FROM "SkillTaskCard" '
            'WHERE "userId" = %s AND "scoreId" = %s AND "status" != \'cleared\'',
            (user_internal_id, score_id),
        )
        active_remaining = cur.fetchone()[0]
        cards_ok = active_remaining == 0

        full_mastery = techniques_ok and cards_ok
        print(
            f"[loop_engine_runner] (3c) 完全習得判定: perf={final_perf} "
            f"techniques={tt_mastered}/{tt_total or 0} ok={techniques_ok} "
            f"active_cards_left={active_remaining} ok={cards_ok} → full={full_mastery}"
        )

    final_full = was_full or full_mastery  # 永続

    # SongMastery upsert
    if row:
        cur.execute(
            """
            UPDATE "SongMastery"
            SET "recentAverageScore" = %s,
                "totalPerformanceCount" = %s,
                "isPerformanceMastered" = %s,
                "isFullyMastered" = %s,
                "performanceMasteredAt" = CASE
                  WHEN "isPerformanceMastered" = false AND %s = true THEN NOW()
                  ELSE "performanceMasteredAt"
                END,
                "fullyMasteredAt" = CASE
                  WHEN "isFullyMastered" = false AND %s = true THEN NOW()
                  ELSE "fullyMasteredAt"
                END,
                "updatedAt" = NOW()
            WHERE "userId" = %s AND "scoreId" = %s
            """,
            (recent_avg, total_count, final_perf, final_full,
             final_perf, final_full, user_internal_id, score_id),
        )
    else:
        cur.execute(
            """
            INSERT INTO "SongMastery"
            ("id", "userId", "scoreId", "recentAverageScore",
             "totalPerformanceCount", "isPerformanceMastered", "isFullyMastered",
             "performanceMasteredAt", "fullyMasteredAt", "createdAt", "updatedAt")
            VALUES (gen_random_uuid()::text, %s, %s, %s, %s, %s, %s,
                    CASE WHEN %s = true THEN NOW() ELSE NULL END,
                    CASE WHEN %s = true THEN NOW() ELSE NULL END,
                    NOW(), NOW())
            """,
            (user_internal_id, score_id, recent_avg, total_count,
             final_perf, final_full, final_perf, final_full),
        )

    print(
        f"[loop_engine_runner] (3c) SongMastery: score={score_id} "
        f"recent_avg={recent_avg} total={total_count} "
        f"perf_mastered={final_perf} full_mastered={final_full}"
    )

    # 4. UserGradeProgress 更新 — full_mastery 新規遷移時のみカウント
    just_fully_mastered = (not was_full) and full_mastery
    if just_fully_mastered:
        _bump_user_grade_progress(cur, user_internal_id)


def _bump_user_grade_progress(cur, user_internal_id: str) -> None:
    """完全習得 +1 のグレード進捗更新 (§2-7 維持)。10 曲で☆昇格、☆10 で master。"""
    cur.execute(
        'SELECT "currentStar", "masteredSongCountAtCurrentStar" '
        'FROM "UserGradeProgress" WHERE "userId" = %s',
        (user_internal_id,),
    )
    row = cur.fetchone()
    if row:
        current_star = row[0]
        count = row[1] + 1
    else:
        current_star = 1
        count = 1

    new_star = current_star
    new_count = count
    master_reached = False
    if count >= GRADE_UP_SONG_COUNT and current_star < 10:
        new_star = current_star + 1
        new_count = 0
        print(
            f"[loop_engine_runner] (3c) 🎉 ☆昇格: {current_star} → {new_star}"
        )
    if new_star == 10:
        master_reached = True

    # GradeLevel enum 派生 (B-1: 1-3 BEGINNER / 4-6 INTERMEDIATE / 7-9 ADVANCED / 10 MASTER)
    if new_star <= 3:
        grade = "BEGINNER"
    elif new_star <= 6:
        grade = "INTERMEDIATE"
    elif new_star <= 9:
        grade = "ADVANCED"
    else:
        grade = "MASTER"

    if row:
        cur.execute(
            """
            UPDATE "UserGradeProgress"
            SET "currentStar" = %s,
                "currentGrade" = %s::"GradeLevel",
                "masteredSongCountAtCurrentStar" = %s,
                "masterReachedAt" = CASE
                  WHEN "masterReachedAt" IS NULL AND %s = true THEN NOW()
                  ELSE "masterReachedAt"
                END,
                "updatedAt" = NOW()
            WHERE "userId" = %s
            """,
            (new_star, grade, new_count, master_reached, user_internal_id),
        )
    else:
        cur.execute(
            """
            INSERT INTO "UserGradeProgress"
            ("id", "userId", "currentStar", "currentGrade",
             "masteredSongCountAtCurrentStar", "masterReachedAt", "updatedAt")
            VALUES (gen_random_uuid()::text, %s, %s, %s::"GradeLevel", %s,
                    CASE WHEN %s = true THEN NOW() ELSE NULL END, NOW())
            """,
            (user_internal_id, new_star, grade, new_count, master_reached),
        )
    print(
        f"[loop_engine_runner] (3c) UserGradeProgress: star={new_star} "
        f"grade={grade} count={new_count}/{GRADE_UP_SONG_COUNT}"
    )


def process_cumulative_phase3c_practice(
    cur, user_internal_id: str, practice_item_id: str
) -> None:
    """Practice 演奏完了時の累積処理。

    1. UserPracticeMastery 更新
    2. (just_mastered なら) 関連 SubTaskAssignment.isMastered=true → SubTask cleared
       → SkillTaskCard cleared 判定 (skill 条件不足のため Score 経路で再判定)
    3. UserTechniqueMastery 再計算 (演奏した item の技法のみ)
    """
    just_mastered = _update_user_practice_mastery(
        cur, user_internal_id, practice_item_id
    )
    if just_mastered:
        affected_subtasks = _mark_assignments_mastered(
            cur, user_internal_id, practice_item_id
        )
        affected_cards = _reclear_subtasks(cur, affected_subtasks)
        # Practice 経路では skill score 取れないので latest=None → cleared 保留
        _maybe_clear_skill_cards(cur, affected_cards, latest_skill_scores=None)
    _update_user_technique_mastery(cur, user_internal_id, practice_item_id)


def process_cumulative_phase3c_score(
    cur,
    user_internal_id: str,
    score_id: str,
    pitch_skill: Optional[float],
    rhythm_skill: Optional[float],
    bowing_skill: Optional[float],
) -> None:
    """Score 演奏完了時の累積処理。

    - SongMastery 更新 (直近 5 回平均、gate 通過のみ)
    - SkillTaskCard cleared 再判定 (§2-5 厳密版、当該カテゴリ skill 渡す)
    - 完全習得判定 → UserGradeProgress 更新
    """
    latest = {
        "PITCH": pitch_skill,
        "RHYTHM": rhythm_skill,
        "BOWING": bowing_skill,
    }
    _update_song_mastery_and_grade(cur, user_internal_id, score_id, latest)


# ---------------------------------------------------------------------------
# v1.5 Phase 3a (2026-05-11): Score 演奏モード
# ---------------------------------------------------------------------------
# practice mode と異なる点:
#   - DB クエリ先: Score テーブル (vs PracticeItem)
#   - Storage path: {user_id}/{score_id}/... (vs practice/{practice_item_id}/...)
#   - DB 更新先: Performance (vs PracticePerformance)
#   - ownerScope == "admin" gate (M5=B 確定): 非 admin Score は対象外
#   - performanceType == "user" gate (I4=A 確定): pro 演奏は対象外
#   - Phase 3b (2026-05-13): generate_score_cards_phase3b() でカード一式を生成
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
                '       p."performanceType", '
                '       s."keyTonic", s."keyMode", p."userId" '
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
        score_key_tonic: Optional[str] = row[4]
        score_key_mode: Optional[str] = row[5]
        user_internal_id: str = row[6]

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

        # 6. Phase 3b: SkillTaskCard / SubTask / SubTaskAssignment /
        #    MissingPracticeItemFlag を生成 (同 transaction 内、commit 前)
        with conn.cursor() as cur:
            generate_score_cards_phase3b(
                cur,
                user_internal_id,
                score_id,
                score_key_tonic,
                score_key_mode,
                star,
                result.get("pitchSkillScore"),
                result.get("rhythmSkillScore"),
                result.get("bowingSkillScore"),
                result.get("skillSubScores") or {},
            )

        # 7. Phase 3c 累積処理: SongMastery / SkillTaskCard cleared 判定 /
        #    完全習得判定 / UserGradeProgress 更新 (同 transaction 内、commit 前)
        with conn.cursor() as cur:
            process_cumulative_phase3c_score(
                cur,
                user_internal_id,
                score_id,
                result.get("pitchSkillScore"),
                result.get("rhythmSkillScore"),
                result.get("bowingSkillScore"),
            )

        # 8. v1.6 Phase 5: legacy skill 指標 (UserSkillScore / UserSkillSubScore)
        #    を Practice+Score 合算で再計算。Score 演奏完了でも skill が普遍指標
        #    として加算されるようにする (旧来 run_score_mode は skip していた)。
        #    当該 Performance 行は上の step 5 で同 conn 内 UPDATE 済 → 反映される。
        _recompute_legacy_skill_for_user(conn, user_internal_id)

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
        # Q8=A: 既存処理 (UserSkillScore / UserSkillSubScore / UserSkillTaskCard /
        #              UserGrade.progressData) は温存
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

        # 6b. Phase 3c 累積処理: UserPracticeMastery / SubTaskAssignment.isMastered /
        #     SubTask cleared / UserTechniqueMastery (新規 4 テーブル経路)
        with conn.cursor() as cur:
            process_cumulative_phase3c_practice(
                cur, user_id, practice_item_id
            )

        conn.commit()  # Step 5 + 6 + 6b を atomic に commit
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
