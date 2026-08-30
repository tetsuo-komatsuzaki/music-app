// GET /api/scores/[scoreId]/achievement-status
//
// 工程D (2026-07-11) — 曲の達成/マスター進捗（新判定体系 spec§1）。
// 曲詳細「🏆 曲マスターまで」トラッカーの表示用。判定の正本は loop_engine
// (music-analyzer/lib/achievement.py) で、条件計算は app/_libs/scoreAchievement.ts に
// 一本化した (2026-08-30)。達成 = ゴールカードに表示されている行がすべて✓ (Tetsuo確定)。
// エチュード解決の決定関数は achievement.py と同一ロジック。変更時は両方同期すること。

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { requireAuthApi } from "@/app/_libs/requireAuth"
import { selectDailyLessons } from "@/app/_libs/dailyLessons"
import { computeScoreAchievementState, CLEAN_RUNS_REQUIRED } from "@/app/_libs/scoreAchievement"
import { LESSON_BY_TAG } from "@/app/[userId]/lessons/_lib/content"

const MASTER_RECENT_COUNT = 5
const MASTER_AVG = 90

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ scoreId: string }> },
) {
  const { scoreId } = await params

  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  const dbUserId = auth.user.dbUser.id

  const state = await computeScoreAchievementState(dbUserId, scoreId)
  if (!state) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  const { score, lessons, etude, cleanRuns } = state

  // ── 達成/マスターの記録と直近5回平均 ──
  const achievement = await prisma.userScoreAchievement.findUnique({
    where: { userId_scoreId: { userId: dbUserId, scoreId } },
    select: { masteredAt: true },
  })
  const [recent, latestPerf, totalPerformances] = await Promise.all([
    // overallScore は bowing 依存で欠損しやすいため廃止 → 音程+リズム平均で算出 (アプリ全体と統一)。
    // Python の achievement.py マスター判定も同式に揃えてある。区間録音は非算入。
    prisma.performance.findMany({
      where: {
        userId: dbUserId, scoreId, rangeFromNote: null,
        pitchAccuracy: { not: null }, timingAccuracy: { not: null },
      },
      orderBy: { uploadedAt: "desc" },
      take: MASTER_RECENT_COUNT,
      select: { pitchAccuracy: true, timingAccuracy: true },
    }),
    // C-6b: 上達ループタブの弱点表示用 (旧loop-detail API の後継)。区間録音は非算入。
    prisma.performance.findFirst({
      where: { userId: dbUserId, scoreId, rangeFromNote: null },
      orderBy: { uploadedAt: "desc" },
      select: { id: true },
    }),
    prisma.performance.count({ where: { userId: dbUserId, scoreId, rangeFromNote: null } }),
  ])
  const recentAvg =
    recent.length > 0
      ? recent.reduce((s, p) => s + ((p.pitchAccuracy ?? 0) + (p.timingAccuracy ?? 0)) / 2, 0) / recent.length
      : null

  // ── 毎日の基礎練 (4教材: 音階/フィンガリング/推薦上位2) ──
  // ユーザーの★ (UserStarProgress 優先 → 演奏実績の最高star → 曲の★ → 1)
  const starProgress = await prisma.userStarProgress.findUnique({
    where: { userId: dbUserId },
    select: { currentStar: true },
  })
  const userStar = starProgress?.currentStar ?? score.star ?? 1
  const dailyLessons = await selectDailyLessons({
    userId: dbUserId,
    userStar,
    scoreId,
    songMastered: achievement?.masteredAt != null && achievement?.masteredAt !== undefined,
    score: {
      star: score.star,
      keyTonic: score.keyTonic,
      keyMode: score.keyMode,
      defaultTempo: score.defaultTempo,
      positions: score.positions.filter((n) => n >= 2),
      primaryBowing: score.primaryBowing,
      primaryPosition: score.primaryPosition,
      techNames: score.scoreTechniqueTags.map((t) => t.techniqueTag.name),
      acqFeatureKeys: score.featureTags
        .filter((f) => f.featureTag.isAcquisition)
        .map((f) => `${f.featureTag.category}:${f.featureTag.name}`),
    },
  })

  return NextResponse.json({
    dailyLessons,
    lessons: {
      total: lessons.length,
      cleared: lessons.filter((l) => l.cleared).length,
      // 課題チップから直接レッスンへ飛べるように (2026-08-02 断絶修理)。
      // 未クリアの先頭1件 (=次にやるべきレッスン) の遷移先を返す
      nextLessonId: (() => {
        const next = lessons.find((l) => !l.cleared)
        if (!next) return null
        return LESSON_BY_TAG.get(`${next.tagType}:${next.tagKey}`)?.id ?? null
      })(),
    },
    etude,
    cleanRuns: { count: Math.min(cleanRuns, CLEAN_RUNS_REQUIRED), required: CLEAN_RUNS_REQUIRED },
    achieved: achievement !== null,
    mastered: achievement?.masteredAt !== null && achievement?.masteredAt !== undefined,
    master: {
      recentAvg: recentAvg !== null ? Math.round(recentAvg * 10) / 10 : null,
      scoredCount: recent.length,
      requiredCount: MASTER_RECENT_COUNT,
      threshold: MASTER_AVG,
    },
    latestPerformanceId: latestPerf?.id ?? null,
    totalPerformanceCount: totalPerformances,
  })
}
