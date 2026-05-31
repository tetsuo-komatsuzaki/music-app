// GET /api/scores/[scoreId]/loop-detail
//
// v1.3 Phase 4-1 (2026-05-16) — 上達ループ UI 用の単一 API。
// scoreId 起点で、認証ユーザーの「最新 Performance + 累積 SongMastery + SkillTaskCard 一式 + MissingFlag」
// を 4 仕切り構成で返す。
//
// 認可 (Q4=A 確定):
//   Performance.userId === dbUser.id の演奏記録が 1 件以上あるユーザーのみ閲覧可。
//   なければ 403 Forbidden。admin Score / user Score 問わず、演奏者本人のみ。

import { NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { requireAuthApi } from "@/app/_libs/requireAuth"
import { ASSIGNED_CATEGORY_ORDER } from "@/app/_libs/practiceConstants"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ scoreId: string }> },
) {
  const { scoreId } = await params

  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  const dbUserId = auth.user.dbUser.id

  // 認可: 自分の演奏記録が 1 件以上ある Score のみ
  const ownPerfCount = await prisma.performance.count({
    where: { userId: dbUserId, scoreId },
  })
  if (ownPerfCount === 0) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // 並列取得: 最新 Performance + SongMastery + SkillTaskCard 一式 + MissingFlag
  const [latestPerformance, songMastery, skillTaskCards, missingFlags] = await Promise.all([
    prisma.performance.findFirst({
      where: { userId: dbUserId, scoreId },
      orderBy: { uploadedAt: "desc" },
      select: {
        id: true,
        scoreId: true,
        uploadedAt: true,
        pitchAccuracy: true,
        rhythmAccuracy: true,
        bowingAccuracy: true,
        overallScore: true,
        pitchSkillScore: true,
        rhythmSkillScore: true,
        bowingSkillScore: true,
        skillSubScores: true,
        problematicPositions: true,
      },
    }),

    prisma.songMastery.findUnique({
      where: { userId_scoreId: { userId: dbUserId, scoreId } },
      select: {
        recentAverageScore: true,
        totalPerformanceCount: true,
        isPerformanceMastered: true,
        isFullyMastered: true,
        performanceMasteredAt: true,
        fullyMasteredAt: true,
      },
    }),

    prisma.skillTaskCard.findMany({
      where: { userId: dbUserId, scoreId },
      orderBy: { generatedAt: "asc" },
      select: {
        id: true,
        taskCategory: true,
        status: true,
        generatedAt: true,
        lastMatchedAt: true,
        clearedAt: true,
        subTasks: {
          orderBy: { subTaskType: "asc" },
          select: {
            id: true,
            subTaskType: true,
            status: true,
            clearedAt: true,
            subTaskAssignments: {
              select: {
                practiceItemId: true,
                assignedCategory: true,
                isMastered: true,
                masteredAt: true,
                practiceItem: {
                  select: {
                    id: true,
                    title: true,
                    category: true,
                    star: true,
                    sortOrder: true,
                  },
                },
              },
            },
          },
        },
      },
    }),

    prisma.missingPracticeItemFlag.findMany({
      where: { scoreId, resolvedAt: null },
      orderBy: { detectedAt: "desc" },
      select: {
        subTaskType: true,
        missingCategory: true,
        detectedAt: true,
      },
    }),
  ])

  // skillTaskCards をフロント向けに整形 (assignments を practiceConstants の順に並べる)
  const ASSIGNMENT_ORDER: readonly string[] = ASSIGNED_CATEGORY_ORDER
  const shapedCards = skillTaskCards.map((c) => ({
    id: c.id,
    taskCategory: c.taskCategory,
    status: c.status,
    generatedAt: c.generatedAt.toISOString(),
    lastMatchedAt: c.lastMatchedAt?.toISOString() ?? null,
    clearedAt: c.clearedAt?.toISOString() ?? null,
    subTasks: c.subTasks.map((st) => ({
      id: st.id,
      subTaskType: st.subTaskType,
      status: st.status,
      clearedAt: st.clearedAt?.toISOString() ?? null,
      assignments: [...st.subTaskAssignments]
        .sort(
          (a, b) =>
            ASSIGNMENT_ORDER.indexOf(a.assignedCategory) -
            ASSIGNMENT_ORDER.indexOf(b.assignedCategory),
        )
        .map((a) => ({
          practiceItemId: a.practiceItemId,
          assignedCategory: a.assignedCategory,
          isMastered: a.isMastered,
          masteredAt: a.masteredAt?.toISOString() ?? null,
          title: a.practiceItem.title,
          category: a.practiceItem.category,
          star: a.practiceItem.star,
          sortOrder: a.practiceItem.sortOrder,
        })),
    })),
  }))

  return NextResponse.json({
    performance: latestPerformance
      ? {
          ...latestPerformance,
          uploadedAt: latestPerformance.uploadedAt.toISOString(),
        }
      : null,
    songMastery: songMastery
      ? {
          ...songMastery,
          performanceMasteredAt: songMastery.performanceMasteredAt?.toISOString() ?? null,
          fullyMasteredAt: songMastery.fullyMasteredAt?.toISOString() ?? null,
        }
      : null,
    skillTaskCards: shapedCards,
    missingFlags: missingFlags.map((f) => ({
      ...f,
      detectedAt: f.detectedAt.toISOString(),
    })),
  })
}
