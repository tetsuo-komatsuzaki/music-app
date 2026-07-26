// POST /api/celebrate — 祝いカード閲覧で既読(celebratedAt)を記録する (祝い体験 v2.0 §2.1/§3)。
// バナー消滅・端末をまたぐ一回性の根拠。既に非nullなら据え置き(上書きしない=歴史は守る §0原則2)。
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { requireAuthApi } from "@/app/_libs/requireAuth"

export async function POST(request: NextRequest) {
  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  const userId = auth.user.dbUser.id

  let body: { scoreId?: string; practiceItemId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 })
  }

  try {
    if (body.scoreId) {
      await prisma.userScoreAchievement.updateMany({
        where: { userId, scoreId: body.scoreId, celebratedAt: null },
        data: { celebratedAt: new Date() },
      })
    }
    if (body.practiceItemId) {
      await prisma.userPracticeMastery.updateMany({
        where: { userId, practiceItemId: body.practiceItemId, celebratedAt: null },
        data: { celebratedAt: new Date() },
      })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("[celebrate] failed:", e instanceof Error ? e.message : e)
    return NextResponse.json({ error: "failed" }, { status: 500 })
  }
}
