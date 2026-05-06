// GET /api/skill-task-cards/[id]/recommendations/etudes
//
// v3.2.2 §11-2 — カード起点の教材レコメンド。

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
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: cardId } = await params

  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  const dbUserId = auth.user.dbUser.id

  const card = await prisma.userSkillTaskCard.findUnique({
    where: { id: cardId },
    select: {
      id: true,
      userId: true,
      cardType: true,
      skillTaskId: true,
      skillSubTaskId: true,
    },
  })

  // 存在しない or 他者所有 → 404 (エンティティ列挙防止)
  if (!card || card.userId !== dbUserId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const subTaskIds = extractSubTaskIdsFromCard(card)
  if (!subTaskIds || subTaskIds.length === 0) {
    // 紐付けが取れないカード — 空レコメンド返却
    return NextResponse.json({ cardId: card.id, recommendations: [] })
  }

  const grade = await getCurrentGrade(prisma, dbUserId)
  const achievedIds = await getAchievedPracticeItemIds(prisma, dbUserId)
  const limit = parseLimit(new URL(request.url).searchParams.get("limit"))

  const items = await findCandidatePracticeItems(prisma, {
    userId: dbUserId,
    subTaskIds,
    grade,
    achievedIds,
    limit,
  })

  const reason = generateRecommendationReason(card)

  return NextResponse.json({
    cardId: card.id,
    recommendations: items.map(item => ({
      practiceItem: item,
      reason,
    })),
  })
}
