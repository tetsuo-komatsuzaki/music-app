// POST /api/skill-task-cards/[id]/clear
//
// v3.2.2 §9-3 / §15-2 — ユーザー手動カードクリア。

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { requireAuthApi } from "@/app/_libs/requireAuth"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: cardId } = await params

  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  const dbUserId = auth.user.dbUser.id

  const card = await prisma.userSkillTaskCard.findUnique({
    where: { id: cardId },
    select: { id: true, userId: true, status: true },
  })

  // 存在しない or 他者所有 → 404 (エンティティ列挙防止、spec の 403 より厳密)
  if (!card || card.userId !== dbUserId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // 既に cleared → 409 (§15-2)
  if (card.status === "cleared") {
    return NextResponse.json(
      { error: "Card is already cleared" },
      { status: 409 },
    )
  }

  const updated = await prisma.userSkillTaskCard.update({
    where: { id: cardId },
    data: { status: "cleared", clearedAt: new Date() },
    select: { id: true, clearedAt: true },
  })

  return NextResponse.json({
    cardId: updated.id,
    status: "cleared",
    clearedAt: updated.clearedAt!.toISOString(),
  })
}
