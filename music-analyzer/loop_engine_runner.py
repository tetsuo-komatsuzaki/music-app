"""
loop_engine_runner.py — 演奏完了後の後段処理（弓採点 → 診断 → 判定）

【全体像 — 他の人が読むときはここだけ理解すればOK】
  entrypoint.py が analyze_performance.py（音符照合＝音程/リズムの点）を完走させた
  直後に起動し、1トランザクションで以下を行う:

    3.   弓採点 (bowing_score.run_pipeline)
         → マスター判定(平均90)の弓軸 bowingAccuracy の唯一の製造元
    4.   result.json を Storage にアップロード
    5.   Performance/PracticePerformance に bowing と overallScore を更新
         overallScore = (pitchAccuracy + rhythmAccuracy + bowingAccuracy) / 3
    5.5. 217小課題診断 (lib/diagnosis.py)
         → 窓① analysisSummary.diagnosis（演奏直後の弱点表示）
         → 窓② UserSkillSubScore（累積弱点・推薦の材料）
    5.6. 新判定 (lib/achievement.py)
         → 達成（3回×崩壊ゼロ+レッスン+エチュード）/ マスター / Star / レッスンクリア

  5.5 / 5.6 は SAVEPOINT 隔離: 失敗しても警告のみで採点結果は commit される。

【歴史】旧55課題体系の累積処理（UserSkillScore EMA / 旧UserSkillSubScore /
  SkillTaskCard生成 / 旧SongMastery / 旧UserGrade進行）は C-6b (2026-07-11) で削除。
  課題化=217診断、判定=achievement.py に置換済み。旧実装は git 7520842 以前を参照。

入力 (env vars):
  USER_ID, SCORE_ID (= practice_item_id), PERFORMANCE_ID, IS_PRACTICE
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BUCKET_NAME (musicxml), DATABASE_URL
  PERFORMANCE_BUCKET (default: "performances")

エラー時:
  conn.rollback() で全ロールバック → 例外を上に投げる。entrypoint.py 側で catch
  してログ出力 (analyze_performance の成果は保持される)。
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


def _write_performance_notes(conn, kind: str, performance_id: str, comparison_path: str,
                             target_type: str, target_id: str) -> None:
    """ノート属性ストア: comparison_result.json の全行を PerformanceNote に写し、
    採点したときの並びの版を演奏に書く。独立した小さなトランザクションで確定する。"""
    from lib.note_store import build_performance_notes, save_performance_notes
    with open(comparison_path, encoding="utf-8") as f:
        comp = json.load(f)
    results = comp if isinstance(comp, list) else (comp.get("results") or comp.get("evaluatedNotes") or [])
    rows = build_performance_notes(results)
    with conn.cursor() as cur:
        version = save_performance_notes(cur, kind, performance_id, rows, target_type, target_id)
    conn.commit()
    print(f"[note_store] PerformanceNote {len(rows)}行 ・ 並びの版={version}")


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


def _run_diagnosis_v217(
    conn,
    *,
    performance_id: str,
    user_internal_id: str,
    is_practice: bool,
    comparison_path: str,
    skill_info_path: str,
    analysis_path: str,
) -> None:
    """工程C-4 (2026-07-11): 217小課題診断を実行し保存する（案3ハイブリッド）。

    - 窓①: analysisSummary に診断JSONをマージ保存（旧 skillSubScores 列は不変）
    - 窓②: UserSkillSubScore に per_subtask を足し込み（217 ID・旧55行と共存）
    - skill_info ファイルは A-4 で note_karte と同一 payload の二重書きのため
      expanded_index_map を含む (v3)。旧 v1/v2 ファイルは map 無し →
      diagnose が map_available=False で安全に縮退する。
    - 失敗は警告のみ（SAVEPOINT で隔離し、既存パイプラインの commit を汚さない）。
    """
    try:
        from lib.diagnosis import diagnose
        from lib.diagnosis_store import (
            bump_user_subtask_counters,
            save_performance_diagnosis,
        )

        with open(comparison_path, encoding="utf-8") as f:
            comp = json.load(f)
        # 旧形式は results 配列が直置き、新形式は {"results": [...]}
        if isinstance(comp, list):
            comp_results = comp
        else:
            comp_results = comp.get("results") or comp.get("evaluatedNotes") or []
        with open(skill_info_path, encoding="utf-8") as f:
            karte = json.load(f)
        analysis_notes = None
        try:
            with open(analysis_path, encoding="utf-8") as f:
                analysis_notes = json.load(f).get("notes")
        except Exception:
            pass
        diag = diagnose(comp_results, karte, analysis_notes)
    except Exception as e:  # 計算段階の失敗 → 何も書かない
        print(f"[loop_engine_runner] WARNING: diagnosis_v217 compute failed: {e}")
        return

    try:
        with conn.cursor() as cur:
            cur.execute("SAVEPOINT diag_v217")
            save_performance_diagnosis(
                cur, performance_id, diag, is_practice=is_practice
            )
            bump_user_subtask_counters(
                cur, user_internal_id, diag.get("per_subtask") or {}
            )
            cur.execute("RELEASE SAVEPOINT diag_v217")
        print(
            f"[loop_engine_runner] diagnosis_v217 saved: "
            f"map={diag.get('map_available')} "
            f"pitch={diag['diagnosis']['pitch']} rhythm={diag['diagnosis']['rhythm']}"
        )
    except Exception as e:  # 保存段階の失敗 → SAVEPOINT まで巻き戻して続行
        try:
            with conn.cursor() as cur:
                cur.execute("ROLLBACK TO SAVEPOINT diag_v217")
        except Exception:
            pass
        print(f"[loop_engine_runner] WARNING: diagnosis_v217 store failed: {e}")


def _run_achievement_v2(
    conn,
    *,
    user_id: str,
    performance_id: str,
    is_practice: bool,
    score_id: str = None,
    practice_item_id: str = None,
) -> None:
    """工程D (2026-07-11): 新判定（達成/マスター/Star/レッスン）step 5.6。

    診断 step 5.5 が保存した collapse.is_clean を読むため、必ず診断の後に呼ぶ。
    失敗は SAVEPOINT 隔離＋警告のみ（既存パイプライン無傷）。
    """
    try:
        from lib.achievement import (
            cascade_score_achievements,
            process_practice_achievement,
            process_score_achievement,
        )

        with conn.cursor() as cur:
            cur.execute("SAVEPOINT achievement_v2")
            if is_practice:
                summary = process_practice_achievement(
                    cur, user_id, practice_item_id, performance_id
                )
                # 教材側の完了 (エチュード達成/レッスンクリア) が「最後の✓」だった曲を
                # その場で達成に昇格 (2026-08-30 Tetsuo確定: 達成=ゴール表示行すべて✓)
                if summary.get("practice_achieved") or summary.get("lesson_cleared"):
                    promoted = cascade_score_achievements(cur, user_id)
                    if promoted:
                        summary = {**summary, "cascade_achieved": promoted}
            else:
                summary = process_score_achievement(
                    cur, user_id, score_id, performance_id
                )
            cur.execute("RELEASE SAVEPOINT achievement_v2")
        print(f"[loop_engine_runner] achievement_v2: {summary}")
    except Exception as e:
        try:
            with conn.cursor() as cur:
                cur.execute("ROLLBACK TO SAVEPOINT achievement_v2")
        except Exception:
            pass
        print(f"[loop_engine_runner] WARNING: achievement_v2 failed: {e}")


def _run_celebration_v2(
    conn,
    *,
    user_id: str,
    performance_id: str,
    is_practice: bool,
    score_id: str = None,
    practice_item_id: str = None,
) -> None:
    """祝い体験 v2.0 (§4/§5/§6): milestone導出(ID照合) + 教材クリア再計算。
    通常機能として常時実行(ON/OFFフラグは廃止・2026-07-26)。各書き込みは専用SAVEPOINTで隔離し、
    失敗は既存の達成/診断/解析本体を巻き添えにしない(§6・警告ログのみ)。診断5.5の後に呼ぶ。
    """
    try:
        from lib.achievement import (
            derive_score_milestone_events,
            recompute_practice_mastery,
        )
        from lib.diagnosis_store import save_performance_milestone
    except Exception as e:
        print(f"[loop_engine_runner] WARNING: celebration import failed: {e}")
        return

    events: list = []
    # 教材: 直近5回平均90 の再計算 (SAVEPOINT practice_mastery)。日常は降格しない。
    if is_practice and practice_item_id:
        try:
            with conn.cursor() as cur:
                cur.execute("SAVEPOINT practice_mastery")
                newly = recompute_practice_mastery(
                    cur, user_id, practice_item_id, allow_demotion=False
                )
                cur.execute("RELEASE SAVEPOINT practice_mastery")
            if newly:
                events.append({
                    "type": "material_clear", "tier": "medium",
                    "subject": {"kind": "material", "id": practice_item_id},
                })
        except Exception as e:
            try:
                with conn.cursor() as cur:
                    cur.execute("ROLLBACK TO SAVEPOINT practice_mastery")
            except Exception:
                pass
            print(f"[loop_engine_runner] WARNING: practice_mastery failed: perf={performance_id} {e}")
    # 曲: ID照合で milestone 導出 (再解析でも同一結果)
    elif score_id:
        try:
            with conn.cursor() as cur:
                events = derive_score_milestone_events(cur, user_id, score_id, performance_id)
        except Exception as e:
            print(f"[loop_engine_runner] WARNING: derive milestone failed: perf={performance_id} {e}")
            events = []

    # milestone 保存 (SAVEPOINT milestone_save)。空でも {events:[]} を保存し、done+欠落と区別する(§7)。
    try:
        with conn.cursor() as cur:
            cur.execute("SAVEPOINT milestone_save")
            save_performance_milestone(cur, performance_id, events, is_practice=is_practice)
            cur.execute("RELEASE SAVEPOINT milestone_save")
        print(
            f"[loop_engine_runner] milestone saved: perf={performance_id} "
            f"events={[e['type'] for e in events]}"
        )
    except Exception as e:
        try:
            with conn.cursor() as cur:
                cur.execute("ROLLBACK TO SAVEPOINT milestone_save")
        except Exception:
            pass
        print(f"[loop_engine_runner] WARNING: milestone_save failed: perf={performance_id} {e}")


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

    # analysis.json / musicxml_skill_info.json はスコアアップロード時に
    # analyze_musicxml が「所有者 (Score.createdById)」の USER_ID で書き込むため、
    # 所有者パス {createdById}/{scoreId}/ に存在する。一方 comparison_result.json は
    # 演奏ごとに analyze_performance が「演奏者 (user_id)」のパスへ書き込む。
    # admin 共有スコアを所有者以外が練習すると、analysis を performer パスで探して
    # 404 → loop engine が落ち bowingAccuracy/overallScore が書かれない回帰になる。
    # そのため score-level 入力は所有者の userId を使う。
    owner_conn = psycopg2.connect(database_url)
    try:
        with owner_conn.cursor() as owner_cur:
            owner_cur.execute(
                'SELECT "createdById" FROM "Score" WHERE id = %s', (score_id,)
            )
            owner_row = owner_cur.fetchone()
    finally:
        owner_conn.close()
    if not owner_row:
        raise RuntimeError(
            f"[loop_engine_runner] Score not found: score={score_id}"
        )
    owner_id: str = owner_row[0]

    analysis_path = _download(
        supabase_url, sr_key, musicxml_bucket,
        f"{owner_id}/{score_id}/analysis.json",
        os.path.join(tmp_dir, "analysis.json"),
    )
    skill_info_path = _download(
        supabase_url, sr_key, musicxml_bucket,
        f"{owner_id}/{score_id}/musicxml_skill_info.json",
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
        # ノート属性ストア (2026-09-05): 演奏の1音ごとの結果を PerformanceNote に写す。
        # 旧の集計 (diagnosis/UserSkillSubScore) も今までどおり書く (二重書き期間)。
        # 失敗は握りつぶさず例外で止める (仕様 §11-9)。
        _write_performance_notes(conn, "score", performance_id, comparison_path, "score", score_id)

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

        # 3. 弓採点 (bowing_score.run_pipeline)。マスター判定(平均90)の弓軸の製造元。
        #    旧score_fullの音程/リズムスキルスコア・skillSubScores・気になる箇所は
        #    217診断体系に置換済みのため廃止 (C-6b 2026-07-11)。
        from bowing_score import run_pipeline

        result = run_pipeline(
            comparison_result_path=comparison_path,
            note_results_path=analysis_path,
            musicxml_skill_info_path=skill_info_path,
            performance_id=performance_id,
            user_id=user_id,
            practice_item_id=score_id,  # パイプライン内部では汎用識別子
            practice_item_difficulty=star,
            skill_sub_task_tags=skill_tags,
        )
        print(
            f"[loop_engine_runner] (score) bowing_score done: "
            f"status={result.get('status')} "
            f"bowing={result.get('bowingScore')} "
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

        # 5. Performance を更新 (弓の点のみ。bowingSkillScore は互換ミラー)
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE "Performance"
                SET "bowingSkillScore" = %s,
                    "bowingAccuracy" = %s
                WHERE id = %s
                """,
                (
                    result.get("bowingScore"),
                    result.get("bowingScore"),
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

        # 5.5. 工程C-4 (2026-07-11): 217小課題診断 (窓①保存+窓②カウンタ)。
        #      失敗しても既存パイプラインは汚さない (SAVEPOINT隔離・警告のみ)。
        _run_diagnosis_v217(
            conn,
            performance_id=performance_id,
            user_internal_id=user_internal_id,
            is_practice=False,
            comparison_path=comparison_path,
            skill_info_path=skill_info_path,
            analysis_path=analysis_path,
        )

        # 5.6. 工程D (2026-07-11): 新判定（達成/マスター/Star）。
        #      診断が保存した崩壊判定(is_clean)を読むため 5.5 の後に置く。
        _run_achievement_v2(
            conn,
            user_id=user_internal_id,
            performance_id=performance_id,
            is_practice=False,
            score_id=score_id,
        )

        # 5.7. 祝い体験 v2.0: milestone導出+保存 (通常機能・常時実行・SAVEPOINT隔離)。
        _run_celebration_v2(
            conn,
            user_id=user_internal_id,
            performance_id=performance_id,
            is_practice=False,
            score_id=score_id,
        )

        # (C-6b 2026-07-11) 旧 step 6〜8 (SkillTaskCard生成 / 旧SongMastery+グレード進行 /
        # legacy skill再計算) は削除。判定は step 5.6 の新体系 (achievement_v2) が正。
        # 旧実装は git 履歴 7520842 以前を参照。

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
        _write_performance_notes(conn, "practice", performance_id, comparison_path, "practice", practice_item_id)

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

        # 3. 弓採点 (bowing_score.run_pipeline)。マスター判定(平均90)の弓軸の製造元。
        from bowing_score import run_pipeline

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
            f"[loop_engine_runner] bowing_score done: status={result.get('status')} "
            f"bowing={result.get('bowingScore')} "
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

        # 5. DB 更新 (弓の点のみ。commit はまだ — 5.5/5.6 と atomic にする)
        # v1.5/案 α : overallScore = (pitch + rhythm + bowing) / 3 (UPDATE 2、accuracy 列が揃ったあと)
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE "PracticePerformance"
                SET "bowingSkillScore" = %s,
                    "bowingAccuracy" = %s
                WHERE id = %s
                """,
                (
                    result.get("bowingScore"),
                    result.get("bowingScore"),
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

        # 5.5. 工程C-4 (2026-07-11): 217小課題診断 (窓①保存+窓②カウンタ)。
        #      失敗しても既存パイプラインは汚さない (SAVEPOINT隔離・警告のみ)。
        _run_diagnosis_v217(
            conn,
            performance_id=performance_id,
            user_internal_id=user_id,
            is_practice=True,
            comparison_path=comparison_path,
            skill_info_path=skill_info_path,
            analysis_path=analysis_path,
        )

        # 5.6. 工程D (2026-07-11): 新判定（教材達成+レッスンクリア）。5.5 の後に置く。
        _run_achievement_v2(
            conn,
            user_id=user_id,
            performance_id=performance_id,
            is_practice=True,
            practice_item_id=practice_item_id,
        )

        # 5.7. 祝い体験 v2.0: 教材クリア再計算+milestone保存 (通常機能・常時実行・SAVEPOINT隔離)。
        _run_celebration_v2(
            conn,
            user_id=user_id,
            performance_id=performance_id,
            is_practice=True,
            practice_item_id=practice_item_id,
        )

        # (C-6b 2026-07-11) 旧 step 6/6b (UserSkillScore/旧UserSkillSubScore/カード/
        # 旧グレード進行/旧マスタリー) は削除。判定は step 5.6 (achievement_v2) が正。
        # 旧実装は git 履歴 7520842 以前を参照。

        conn.commit()  # Step 5 + 5.5 + 5.6 を atomic に commit

    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    sys.exit(main() or 0)
