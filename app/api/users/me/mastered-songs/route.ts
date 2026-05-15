// GET /api/users/me/mastered-songs
//
// v1.6 Phase 4-2 (2026-05-16) — Progress ページの完全習得曲リスト用 (1b)。
// 仕様書 v1.6 §2-6 「曲の習得 = 演奏マスター ∧ 全演奏技法習得 ∧ 全中課題クリア」
//
// クエリパラメータ:
//   - fullyMastered=true (default false): isFullyMastered=true のみ
//   - perfMasteredOnly=true (default false): isPerformanceMastered=true ∧ isFullyMastered=false のみ
//     (Phase 4-2 では Q6=「入れない」確定で UI 未使用、API のみ提供)
//   - limit=N (default 50, max 100)
//
// 認可: 自分の SongMastery のみ (requireAuthApi() で dbUser.id にスコープ固定)

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { requireAuthApi } from "@/app/_libs/requireAuth"

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100

export async function GET(request: NextRequest) {
  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  const dbUserId = auth.user.dbUser.id

  const { searchParams } = new URL(request.url)
  const fullyMastered = searchParams.get("fullyMastered") === "true"
  const perfMasteredOnly = searchParams.get("perfMasteredOnly") === "true"
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(searchParams.get("limit") ?? DEFAULT_LIMIT)),
  )

  // 排他: 両 true は不正
  if (fullyMastered && perfMasteredOnly) {
    return NextResponse.json(
      { error: "fullyMastered and perfMasteredOnly are mutually exclusive" },
      { status: 400 },
    )
  }

  const where: {
    userId: string
    isFullyMastered?: boolean
    isPerformanceMastered?: boolean
  } = { userId: dbUserId }

  if (fullyMastered) {
    where.isFullyMastered = true
  } else if (perfMasteredOnly) {
    where.isPerformanceMastered = true
    where.isFullyMastered = false
  }

  const records = await prisma.songMastery.findMany({
    where,
    orderBy: fullyMastered
      ? { fullyMasteredAt: "desc" }
      : perfMasteredOnly
        ? { performanceMasteredAt: "desc" }
        : { updatedAt: "desc" },
    take: limit,
    select: {
      scoreId: true,
      recentAverageScore: true,
      totalPerformanceCount: true,
      isPerformanceMastered: true,
      isFullyMastered: true,
      performanceMasteredAt: true,
      fullyMasteredAt: true,
      score: {
        select: {
          title: true,
          composer: true,
          star: true,
          keyTonic: true,
          keyMode: true,
        },
      },
    },
  })

  return NextResponse.json({
    songs: records.map((r) => ({
      scoreId: r.scoreId,
      title: r.score.title,
      composer: r.score.composer,
      star: r.score.star,
      keyTonic: r.score.keyTonic,
      keyMode: r.score.keyMode,
      recentAverageScore: r.recentAverageScore,
      totalPerformanceCount: r.totalPerformanceCount,
      isPerformanceMastered: r.isPerformanceMastered,
      isFullyMastered: r.isFullyMastered,
      performanceMasteredAt: r.performanceMasteredAt?.toISOString() ?? null,
      fullyMasteredAt: r.fullyMasteredAt?.toISOString() ?? null,
    })),
  })
}
