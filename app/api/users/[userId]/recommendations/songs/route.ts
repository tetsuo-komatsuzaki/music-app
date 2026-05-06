// GET /api/users/[userId]/recommendations/songs
//
// v3.2.2 §11-3 — ホーム画面の練習レコメンド (active カード優先 / なければグレード範囲)。
// URL の userId は supabaseUserId (page URL 規約に整合)。

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { requireAuthApi } from "@/app/_libs/requireAuth"
import {
  extractSubTaskIdsFromCard,
  findCandidatePracticeItems,
  generateRecommendationReason,
  getAchievedPracticeItemIds,
  getCurrentGrade,
  parseLimit,
} from "@/app/_libs/recommendations"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId: urlUserId } = await params

  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response

  // URL の userId は supabaseUserId 想定 — 自分のものでなければ 403
  if (urlUserId !== auth.user.supabaseUser.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const dbUserId = auth.user.dbUser.id
  const limit = parseLimit(new URL(request.url).searchParams.get("limit"))

  // 1. 最も古い active カードを取得 (§11-3)
  const activeCard = await prisma.userSkillTaskCard.findFirst({
    where: { userId: dbUserId, status: "active" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      cardType: true,
      skillTaskId: true,
      skillSubTaskId: true,
    },
  })

  const grade = await getCurrentGrade(prisma, dbUserId)
  const achievedIds = await getAchievedPracticeItemIds(prisma, dbUserId)

  let subTaskIds: readonly string[] | null = null
  if (activeCard) {
    subTaskIds = extractSubTaskIdsFromCard(activeCard)
  }

  const items = await findCandidatePracticeItems(prisma, {
    userId: dbUserId,
    subTaskIds,
    grade,
    achievedIds,
    limit,
  })

  const reason = generateRecommendationReason(activeCard)

  return NextResponse.json({
    recommendations: items.map(item => ({
      practiceItem: item,
      reason,
      ...(activeCard ? { triggeredByCardId: activeCard.id } : {}),
    })),
  })
}
