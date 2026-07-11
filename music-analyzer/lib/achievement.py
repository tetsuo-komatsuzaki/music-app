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
  マスター     = 達成 + 直近5回平均 overallScore≥90（5回以上採点済が前提）。一度刻んだら消さない
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


def _clean_run_count(cur, table: str, owner_col: str, owner_id: str, user_id: str) -> int:
    """崩壊小節ゼロ(is_clean)の演奏の累計数。診断を持たない旧演奏は自然に対象外。"""
    cur.execute(
        f'SELECT COUNT(*) FROM "{table}" '
        f'WHERE "userId" = %s AND "{owner_col}" = %s '
        f"AND (\"analysisSummary\"->'diagnosis'->'collapse'->>'is_clean')::boolean = true",
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
                stock["position"].add(str(n))
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
    tags += [("position", str(n)) for n in _parse_positions(positions) if n >= 2]

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
    cur, user_id: str, score_id: str, performance_id: str
) -> dict:
    """曲演奏完了後の判定。Returns 概要dict（ログ用）。"""
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
            for n in (cur.fetchone() or [[]])[0] or []:
                if int(n) >= 2 and str(n) in stock["position"]:
                    required.append(("position", str(n)))

            if required:
                cur.execute(
                    'SELECT "tagType", "tagKey" FROM "UserLessonClear" WHERE "userId" = %s',
                    (user_id,),
                )
                cleared = {(r[0], r[1]) for r in cur.fetchall()}
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
        cur.execute(
            '''
            SELECT COUNT(*), AVG(s."overallScore") FROM (
              SELECT "overallScore" FROM "Performance"
              WHERE "userId" = %s AND "scoreId" = %s AND "overallScore" IS NOT NULL
              ORDER BY "uploadedAt" DESC LIMIT %s
            ) s
            ''',
            (user_id, score_id, MASTER_RECENT_COUNT),
        )
        cnt, avg = cur.fetchone()
        if int(cnt) >= MASTER_RECENT_COUNT and avg is not None and float(avg) >= MASTER_AVG:
            cur.execute(
                'UPDATE "UserScoreAchievement" SET "masteredAt" = NOW() '
                'WHERE "userId" = %s AND "scoreId" = %s AND "masteredAt" IS NULL',
                (user_id, score_id),
            )
            result["mastered"] = cur.rowcount > 0

    return result


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
