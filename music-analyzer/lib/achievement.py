# -*- coding: utf-8 -*-
"""
achievement.py — 新判定エンジン（工程D・2026-07-11・spec§1 / kouteiD-design.md）

判定ルール（ロック済・2026-06-08思想 + 2026-07-06改定 + 2026-07-11論点確定）:
  教材の達成   = 崩壊小節ゼロの演奏が累計3回（リセットなし）
  レッスンクリア = category=lesson 教材の有効演奏が累計3回（崩壊条件なし・最も緩い）
                  → 教材自身のタグ（技術/重音習得系/ポジション2以上）を UserLessonClear へ
  曲の達成     = ①レッスン要件（曲のタグのうち lesson在庫のあるタグ全クリア=論点1）
                 ②エチュード要件（技術タグ最多カバー同★1つ達成。候補なし/技術タグなし=免除）
                 ③崩壊ゼロ累計3回
  マスター     = 達成 + 直近5回平均（音程+リズム)/2 ≥ 90（5回以上採点済が前提）。一度刻んだら消さない
                 ※ overallScore は 2026-06-07 廃止。マスター平均は (pitchAccuracy+timingAccuracy)/2
                    で計算（区間録音は rangeFromNote IS NULL で除外）。弓(bowing)は平均に含めない。
  Star昇格     = 同★の達成曲数≥10 で currentStar+1

呼び出し: loop_engine step 5.6（診断5.5の直後・同トランザクション・SAVEPOINT隔離は呼び手）。
崩壊判定は step5.5 が保存した analysisSummary.diagnosis.collapse.is_clean を読む
（= v65以降の演奏のみカウント対象。論点5: 判定は前向きのみ）。

エチュード解決の決定関数は TS 側 achievement-status API と同一ロジック
（app/api/scores/[scoreId]/achievement-status/route.ts）。変更時は両方同期すること。
"""
from __future__ import annotations

import re
import uuid
from typing import List, Optional, Tuple

CLEAN_RUNS_REQUIRED = 3
LESSON_RUNS_REQUIRED = 3
STAR_UP_ACHIEVEMENTS = 10
MASTER_RECENT_COUNT = 5
MASTER_AVG = 90.0


# ─── 共通ヘルパ ──────────────────────────────────────────────────────────

def _parse_positions(raw: Optional[List[str]]) -> List[int]:
    """PracticeItem.positions の "1st"/"3rd" 形式 → 番号。"""
    out = []
    for p in raw or []:
        m = re.match(r"(\d+)", str(p))
        if m:
            out.append(int(m.group(1)))
    return out


def _position_key(n: int) -> str:
    """ポジション番号 → tagKey。6以上は "6"(=6thポジション以上) に正規化。
    学びレッスン確定#8 (2026-07-14): レッスン(2nd〜6th+の5本)・オンボーディング
    自己申告("6"=6th+)・曲ゲートの3箇所で 6th+ の意味を統一する。
    """
    return "6" if int(n) >= 6 else str(n)


def _clean_run_count(cur, table: str, owner_col: str, owner_id: str, user_id: str) -> int:
    """崩壊小節ゼロ(is_clean)の演奏の累計数。診断を持たない旧演奏は自然に対象外。"""
    # 区間録音 (部分練習 Phase 2): 区間演奏は練習補助であり達成/マスター判定に非算入。
    # rangeFromNote カラムは Performance のみ (PracticePerformance には無い) → テーブル別に付与。
    range_filter = ' AND "rangeFromNote" IS NULL' if table == "Performance" else ""
    cur.execute(
        f'SELECT COUNT(*) FROM "{table}" '
        f'WHERE "userId" = %s AND "{owner_col}" = %s '
        f"AND (\"analysisSummary\"->'diagnosis'->'collapse'->>'is_clean')::boolean = true"
        f"{range_filter}",
        (user_id, owner_id),
    )
    return int(cur.fetchone()[0])


def _lesson_stock(cur) -> dict:
    """公開中 lesson 教材の在庫タグ集合（論点1フォールバックの判定材料）。
    Returns: {"technique": set[名前], "double_stop": set[名前], "position": set[番号str]}
    """
    stock = {"technique": set(), "double_stop": set(), "position": set()}
    cur.execute(
        '''
        SELECT pi.id, pi.positions,
               array_remove(array_agg(DISTINCT tt.name), NULL) AS techs,
               array_remove(array_agg(DISTINCT CASE WHEN ft."isAcquisition"
                                                    THEN ft.name END), NULL) AS ds
        FROM "PracticeItem" pi
        LEFT JOIN "PracticeItemTechnique" pit ON pit."practiceItemId" = pi.id
        LEFT JOIN "TechniqueTag" tt ON tt.id = pit."techniqueTagId"
        LEFT JOIN "PracticeItemFeatureTag" pift ON pift."practiceItemId" = pi.id
        LEFT JOIN "FeatureTag" ft ON ft.id = pift."featureTagId"
                                  AND ft.category = 'double_stop'
        WHERE pi.category::text = 'lesson' AND pi."isPublished" = true
        GROUP BY pi.id
        ''',
    )
    for _item_id, positions, techs, ds in cur.fetchall():
        stock["technique"].update(techs or [])
        stock["double_stop"].update(ds or [])
        for n in _parse_positions(positions):
            if n >= 2:
                stock["position"].add(_position_key(n))
    return stock


# ─── 教材モード（practice: 教材達成 + レッスンクリア） ────────────────────

def process_practice_achievement(
    cur, user_id: str, practice_item_id: str, performance_id: str
) -> dict:
    """教材演奏完了後の判定。Returns 概要dict（ログ用）。"""
    result = {"practice_achieved": False, "lesson_cleared": []}

    # 1. 教材の達成（3回×崩壊ゼロ・累計）
    clean = _clean_run_count(
        cur, "PracticePerformance", "practiceItemId", practice_item_id, user_id
    )
    if clean >= CLEAN_RUNS_REQUIRED:
        cur.execute(
            'INSERT INTO "UserPracticeAchievement" (id, "userId", "practiceItemId") '
            "VALUES (%s, %s, %s) "
            'ON CONFLICT ("userId", "practiceItemId") DO NOTHING',
            (str(uuid.uuid4()), user_id, practice_item_id),
        )
        result["practice_achieved"] = cur.rowcount > 0

    # 2. レッスンクリア（category=lesson・有効演奏3回・崩壊条件なし）
    cur.execute(
        'SELECT category, positions FROM "PracticeItem" WHERE id = %s',
        (practice_item_id,),
    )
    row = cur.fetchone()
    if not row or row[0] != "lesson":
        return result
    positions = row[1]

    cur.execute(
        'SELECT COUNT(*) FROM "PracticePerformance" '
        'WHERE "userId" = %s AND "practiceItemId" = %s '
        "AND (\"analysisStatus\" = 'done' OR id = %s)",
        (user_id, practice_item_id, performance_id),
    )
    if int(cur.fetchone()[0]) < LESSON_RUNS_REQUIRED:
        return result

    # 教えるタグ = 教材自身のタグ（設計論点2）
    tags: List[Tuple[str, str]] = []
    cur.execute(
        'SELECT tt.name FROM "PracticeItemTechnique" pit '
        'JOIN "TechniqueTag" tt ON tt.id = pit."techniqueTagId" '
        'WHERE pit."practiceItemId" = %s',
        (practice_item_id,),
    )
    tags += [("technique", r[0]) for r in cur.fetchall()]
    cur.execute(
        'SELECT ft.name FROM "PracticeItemFeatureTag" pift '
        'JOIN "FeatureTag" ft ON ft.id = pift."featureTagId" '
        "WHERE pift.\"practiceItemId\" = %s AND ft.category = 'double_stop' "
        'AND ft."isAcquisition" = true',
        (practice_item_id,),
    )
    tags += [("double_stop", r[0]) for r in cur.fetchall()]
    tags += sorted(
        {("position", _position_key(n)) for n in _parse_positions(positions) if n >= 2}
    )

    for tag_type, tag_key in tags:
        cur.execute(
            'INSERT INTO "UserLessonClear" '
            '(id, "userId", "tagType", "tagKey", "lessonItemId") '
            "VALUES (%s, %s, %s, %s, %s) "
            'ON CONFLICT ("userId", "tagType", "tagKey") DO NOTHING',
            (str(uuid.uuid4()), user_id, tag_type, tag_key, practice_item_id),
        )
        if cur.rowcount > 0:
            result["lesson_cleared"].append(f"{tag_type}:{tag_key}")
    return result


# ─── エチュード要件の解決（決定関数・TS側と同期） ──────────────────────────

def resolve_required_etude(cur, score_id: str) -> Optional[dict]:
    """曲→対象エチュード。①技術タグ最多カバー→②調号一致→③テンポ近い。
    Returns {"id", "title"} / None=免除（技術タグなし or 同★エチュード候補なし）。
    """
    cur.execute(
        'SELECT star, "keyTonic", "keyMode", "defaultTempo" FROM "Score" WHERE id = %s',
        (score_id,),
    )
    srow = cur.fetchone()
    if not srow or srow[0] is None:
        return None
    star, key_tonic, key_mode, tempo = srow

    cur.execute(
        'SELECT tt.name FROM "ScoreTechniqueTag" stt '
        'JOIN "TechniqueTag" tt ON tt.id = stt."techniqueTagId" '
        'WHERE stt."scoreId" = %s',
        (score_id,),
    )
    tech_names = [r[0] for r in cur.fetchall()]
    if not tech_names:
        return None  # 技術タグなし → エチュード要件なし

    cur.execute(
        '''
        SELECT pi.id, pi.title, COUNT(DISTINCT tt.name) AS overlap,
               pi."keyTonic", pi."keyMode", pi."tempoMin", pi."tempoMax"
        FROM "PracticeItem" pi
        JOIN "PracticeItemTechnique" pit ON pit."practiceItemId" = pi.id
        JOIN "TechniqueTag" tt ON tt.id = pit."techniqueTagId"
        WHERE pi.category = 'etude' AND pi."isPublished" = true
          AND pi.star = %s AND tt.name = ANY(%s)
        GROUP BY pi.id
        ''',
        (star, tech_names),
    )
    rows = cur.fetchall()
    if not rows:
        return None  # 同★で技術タグを共有するエチュードなし → 免除

    def sort_key(r):
        _id, _title, overlap, e_tonic, e_mode, t_min, t_max = r
        key_match = 0 if (e_tonic == key_tonic and e_mode == key_mode) else 1
        tempo_dist = 999.0
        if tempo is not None and (t_min is not None or t_max is not None):
            lo = t_min if t_min is not None else t_max
            hi = t_max if t_max is not None else t_min
            tempo_dist = 0.0 if lo <= tempo <= hi else min(abs(tempo - lo), abs(tempo - hi))
        return (-overlap, key_match, tempo_dist, _id)

    best = sorted(rows, key=sort_key)[0]
    return {"id": best[0], "title": best[1]}


# ─── 曲モード（score: 達成 + Star + マスター） ─────────────────────────────

def process_score_achievement(
    cur, user_id: str, score_id: str, performance_id: Optional[str]
) -> dict:
    """曲の達成/マスター判定。Returns 概要dict（ログ用）。

    達成 = ゴールカードに表示されている行がすべて✓ (2026-08-30 Tetsuo確定)。
    行の内訳は曲ごとに変わる (レッスン=在庫のあるタグのみ / エチュード=候補なし免除 /
    通し3回=常時)。曲演奏の解析後のほか、レッスン/エチュード側が最後の✓になった時は
    cascade_score_achievements 経由で performance_id=None で呼ばれる
    (achievedPerformanceId が null = コイン演出のトリガー推定の根拠)。
    """
    result = {"achieved": False, "mastered": False, "star_up": None,
              "clean_runs": 0, "blocked_by": None}

    cur.execute('SELECT star FROM "Score" WHERE id = %s', (score_id,))
    srow = cur.fetchone()
    star: Optional[int] = srow[0] if srow else None

    cur.execute(
        'SELECT id, "masteredAt" FROM "UserScoreAchievement" '
        'WHERE "userId" = %s AND "scoreId" = %s',
        (user_id, score_id),
    )
    existing = cur.fetchone()

    if existing is None:
        # ── 達成判定（永続・遡及なし: 未達成の場合のみ） ──
        clean = _clean_run_count(cur, "Performance", "scoreId", score_id, user_id)
        result["clean_runs"] = clean
        if clean < CLEAN_RUNS_REQUIRED:
            result["blocked_by"] = "clean_runs"
        elif star is None:
            result["blocked_by"] = "star_null"
        else:
            blocked = None
            # 要件①: 学びレッスン（lesson在庫のあるタグのみ=論点1フォールバック）
            required: List[Tuple[str, str]] = []
            stock = _lesson_stock(cur)
            cur.execute(
                'SELECT tt.name FROM "ScoreTechniqueTag" stt '
                'JOIN "TechniqueTag" tt ON tt.id = stt."techniqueTagId" '
                'WHERE stt."scoreId" = %s',
                (score_id,),
            )
            for (name,) in cur.fetchall():
                if name in stock["technique"]:
                    required.append(("technique", name))
            cur.execute(
                'SELECT ft.name FROM "ScoreFeatureTag" sft '
                'JOIN "FeatureTag" ft ON ft.id = sft."featureTagId" '
                "WHERE sft.\"scoreId\" = %s AND ft.category = 'double_stop' "
                'AND ft."isAcquisition" = true',
                (score_id,),
            )
            for (name,) in cur.fetchall():
                if name in stock["double_stop"]:
                    required.append(("double_stop", name))
            cur.execute('SELECT positions FROM "Score" WHERE id = %s', (score_id,))
            score_pos_keys = {
                _position_key(n)
                for n in (cur.fetchone() or [[]])[0] or []
                if int(n) >= 2
            }
            for key in sorted(score_pos_keys):
                if key in stock["position"]:
                    required.append(("position", key))

            if required:
                cur.execute(
                    'SELECT "tagType", "tagKey" FROM "UserLessonClear" WHERE "userId" = %s',
                    (user_id,),
                )
                cleared = {(r[0], r[1]) for r in cur.fetchall()}
                # オンボーディング自己申告の習得タグも要件を満たす
                # (UserLessonClear ∪ UserTagAcquisition(state≠REVOKED))。
                # tagKey体系は両テーブルで同一(position="2".."6"の裸数字)
                cur.execute(
                    'SELECT "tagType", "tagKey" FROM "UserTagAcquisition" '
                    "WHERE \"userId\" = %s AND state != 'REVOKED'",
                    (user_id,),
                )
                cleared |= {(r[0], r[1]) for r in cur.fetchall()}
                missing = [t for t in required if t not in cleared]
                if missing:
                    blocked = f"lessons:{missing}"

            # 要件②: エチュード要件（候補なし=免除）
            if blocked is None:
                etude = resolve_required_etude(cur, score_id)
                if etude is not None:
                    cur.execute(
                        'SELECT 1 FROM "UserPracticeAchievement" '
                        'WHERE "userId" = %s AND "practiceItemId" = %s',
                        (user_id, etude["id"]),
                    )
                    if cur.fetchone() is None:
                        blocked = f"etude:{etude['title']}"

            if blocked is not None:
                result["blocked_by"] = blocked
            else:
                # ── 達成成立 ──
                cur.execute(
                    'INSERT INTO "UserScoreAchievement" '
                    '(id, "userId", "scoreId", "starAtAchievement", "achievedPerformanceId") '
                    "VALUES (%s, %s, %s, %s, %s) "
                    'ON CONFLICT ("userId", "scoreId") DO NOTHING',
                    (str(uuid.uuid4()), user_id, score_id, star, performance_id),
                )
                result["achieved"] = cur.rowcount > 0
                if result["achieved"]:
                    result["star_up"] = _check_star_up(cur, user_id)
                existing = ("new", None)

    # ── マスター判定（達成済みの曲のみ・一度刻んだら消さない） ──
    if existing is not None and existing[1] is None:
        # overallScore は bowing 依存で欠損しやすいため廃止 → 音程+リズム平均で判定
        # (2026-06-07 スコア設計方針転換 / フロント achievement-status と統一)。区間録音は非算入。
        cur.execute(
            '''
            SELECT COUNT(*), AVG(s.avg2) FROM (
              SELECT (("pitchAccuracy" + "timingAccuracy") / 2.0) AS avg2 FROM "Performance"
              WHERE "userId" = %s AND "scoreId" = %s
                AND "pitchAccuracy" IS NOT NULL AND "timingAccuracy" IS NOT NULL
                AND "rangeFromNote" IS NULL
              ORDER BY "uploadedAt" DESC LIMIT %s
            ) s
            ''',
            (user_id, score_id, MASTER_RECENT_COUNT),
        )
        cnt, avg = cur.fetchone()
        if int(cnt) >= MASTER_RECENT_COUNT and avg is not None and float(avg) >= MASTER_AVG:
            # 祝い体験 v2.0: マスター遷移と同時に masteredPerformanceId を記録 (ID照合の再解析耐性)。
            cur.execute(
                'UPDATE "UserScoreAchievement" '
                'SET "masteredAt" = NOW(), "masteredPerformanceId" = %s '
                'WHERE "userId" = %s AND "scoreId" = %s AND "masteredAt" IS NULL',
                (performance_id, user_id, score_id),
            )
            result["mastered"] = cur.rowcount > 0

    return result


def cascade_score_achievements(cur, user_id: str) -> List[str]:
    """教材側の完了 (エチュード達成 / レッスンクリア) が「最後の✓」だった曲を、
    次の曲演奏を待たずその場で達成に昇格させる (2026-08-30 Tetsuo確定:
    達成 = ゴールカード表示行すべて✓)。

    対象 = ユーザーが通しで弾いたことのある未達成曲 (star必須・削除曲除外)。
    process_score_achievement を performance_id=None で呼ぶだけなので判定式は単一。
    Returns 昇格した scoreId のリスト。
    """
    cur.execute(
        'SELECT DISTINCT p."scoreId" FROM "Performance" p '
        'JOIN "Score" s ON s.id = p."scoreId" '
        'WHERE p."userId" = %s AND p."rangeFromNote" IS NULL '
        "AND s.star IS NOT NULL AND s.\"deletedAt\" IS NULL "
        'AND NOT EXISTS (SELECT 1 FROM "UserScoreAchievement" a '
        '  WHERE a."userId" = p."userId" AND a."scoreId" = p."scoreId")',
        (user_id,),
    )
    promoted: List[str] = []
    for (score_id,) in cur.fetchall():
        res = process_score_achievement(cur, user_id, score_id, None)
        if res.get("achieved"):
            promoted.append(score_id)
    return promoted


def _check_star_up(cur, user_id: str) -> Optional[int]:
    """同★の達成曲数≥10 で昇格。Returns 新しい★ / None=昇格なし。"""
    cur.execute(
        'INSERT INTO "UserStarProgress" ("userId", "currentStar", "updatedAt") '
        "VALUES (%s, 1, NOW()) "
        'ON CONFLICT ("userId") DO NOTHING',
        (user_id,),
    )
    cur.execute(
        'SELECT "currentStar" FROM "UserStarProgress" WHERE "userId" = %s',
        (user_id,),
    )
    current = int(cur.fetchone()[0])
    cur.execute(
        'SELECT COUNT(*) FROM "UserScoreAchievement" '
        'WHERE "userId" = %s AND "starAtAchievement" = %s',
        (user_id, current),
    )
    if int(cur.fetchone()[0]) >= STAR_UP_ACHIEVEMENTS and current < 10:
        cur.execute(
            'UPDATE "UserStarProgress" SET "currentStar" = %s, "updatedAt" = NOW() '
            'WHERE "userId" = %s',
            (current + 1, user_id),
        )
        return current + 1
    return None


# ─── 祝い体験 v2.0 (2026-07-26・celebrationdesign_v2_0.md) ──────────────────


def derive_score_milestone_events(cur, user_id: str, score_id: str, performance_id: str) -> list:
    """永続化状態から曲の milestone イベントを導出する (§4 ID照合方式)。
    遷移の観測ではなく状態導出なので、何度再解析しても同じ結果になる。
    Returns: [{"type","tier","subject","payload"}] 形式のイベント配列。
    """
    events: list = []
    cur.execute(
        'SELECT "achievedPerformanceId", "masteredPerformanceId", "starAtAchievement", "achievedAt" '
        'FROM "UserScoreAchievement" WHERE "userId" = %s AND "scoreId" = %s',
        (user_id, score_id),
    )
    row = cur.fetchone()
    if not row:
        return events
    achieved_perf_id, mastered_perf_id, star_at, achieved_at = row
    subject = {"kind": "score", "id": score_id}

    if achieved_perf_id == performance_id:
        events.append({"type": "achieve", "tier": "major", "subject": subject})
        # rank_up: この達成が同★の10曲目(=昇格トリガ)で、実際に昇格した場合のみ。ID照合で再解析耐性。
        if star_at is not None:
            cur.execute(
                'SELECT COUNT(*) FROM "UserScoreAchievement" '
                'WHERE "userId" = %s AND "starAtAchievement" = %s AND "achievedAt" <= %s',
                (user_id, star_at, achieved_at),
            )
            rank = int(cur.fetchone()[0])
            cur.execute('SELECT "currentStar" FROM "UserStarProgress" WHERE "userId" = %s', (user_id,))
            cs_row = cur.fetchone()
            current_star = int(cs_row[0]) if cs_row else 1
            if rank == STAR_UP_ACHIEVEMENTS and current_star > int(star_at):
                events.append({"type": "rank_up", "tier": "epic", "payload": {"newStar": int(star_at) + 1}})

    if mastered_perf_id == performance_id:
        events.append({"type": "master", "tier": "major", "subject": subject})

    return events


def recompute_practice_mastery(
    cur, user_id: str, practice_item_id: str, allow_demotion: bool = False
) -> bool:
    """教材クリア(直近5回平均90)を現存録音からゼロ導出し UserPracticeMastery を upsert する
    (§5・原則1「再計算がベース」)。dailyLessons.ts:isMaterialCleared と定義一致。
      母集合: pitch/timing 両方非null (解析失敗/未評価除外)
      並び : uploadedAt 降順で5件 / 5件未満は未クリア
      式   : (pitchAccuracy + timingAccuracy)/2 の平均 ≥ 90
    allow_demotion=False(日常): 既 mastered は false に戻さない(進行を守る=原則2)。
    allow_demotion=True(一斉/削除): 現状に合わせて false へも戻す。
    Returns: 今回「新規到達」したか (material_clear 発火の根拠)。
    """
    cur.execute(
        '''
        SELECT COUNT(*), AVG(avg2) FROM (
          SELECT (("pitchAccuracy" + "timingAccuracy") / 2.0) AS avg2 FROM "PracticePerformance"
          WHERE "userId" = %s AND "practiceItemId" = %s
            AND "pitchAccuracy" IS NOT NULL AND "timingAccuracy" IS NOT NULL
          ORDER BY "uploadedAt" DESC LIMIT %s
        ) s
        ''',
        (user_id, practice_item_id, MASTER_RECENT_COUNT),
    )
    cnt, avg = cur.fetchone()
    cnt = int(cnt)
    avg_f = float(avg) if avg is not None else None
    is_mastered = cnt >= MASTER_RECENT_COUNT and avg_f is not None and avg_f >= MASTER_AVG

    cur.execute(
        'SELECT COUNT(*) FROM "PracticePerformance" '
        'WHERE "userId" = %s AND "practiceItemId" = %s '
        'AND "pitchAccuracy" IS NOT NULL AND "timingAccuracy" IS NOT NULL',
        (user_id, practice_item_id),
    )
    total_count = int(cur.fetchone()[0])

    cur.execute(
        'SELECT "isPerformanceMastered" FROM "UserPracticeMastery" '
        'WHERE "userId" = %s AND "practiceItemId" = %s',
        (user_id, practice_item_id),
    )
    ex = cur.fetchone()
    was_mastered = bool(ex[0]) if ex else False

    next_mastered = is_mastered if allow_demotion else (was_mastered or is_mastered)
    newly = is_mastered and not was_mastered

    cur.execute(
        '''
        INSERT INTO "UserPracticeMastery"
          (id, "userId", "practiceItemId", "recentAverageScore", "totalPerformanceCount",
           "isPerformanceMastered", "masteredAt", "updatedAt")
        VALUES (%s, %s, %s, %s, %s, %s, CASE WHEN %s THEN NOW() ELSE NULL END, NOW())
        ON CONFLICT ("userId", "practiceItemId") DO UPDATE SET
          "recentAverageScore" = EXCLUDED."recentAverageScore",
          "totalPerformanceCount" = EXCLUDED."totalPerformanceCount",
          "isPerformanceMastered" = %s,
          "masteredAt" = CASE WHEN %s THEN COALESCE("UserPracticeMastery"."masteredAt", NOW()) ELSE NULL END,
          "updatedAt" = NOW()
        ''',
        (
            str(uuid.uuid4()), user_id, practice_item_id, avg_f, total_count,
            next_mastered, next_mastered,   # INSERT: isPerformanceMastered / masteredAt CASE
            next_mastered, next_mastered,   # UPDATE: isPerformanceMastered / masteredAt CASE
        ),
    )
    return newly
