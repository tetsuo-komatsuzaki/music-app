import { NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { requireAuthApi } from "@/app/_libs/requireAuth"

/** 現在ユーザーのお気に入り id 一覧 */
export async function GET() {
  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  const favs = await prisma.favorite.findMany({
    where: { userId: auth.user.dbUser.id },
    select: { scoreId: true, practiceItemId: true },
  })
  return NextResponse.json({
    scoreIds: favs.map((f) => f.scoreId).filter(Boolean),
    practiceItemIds: favs.map((f) => f.practiceItemId).filter(Boolean),
  })
}

/** お気に入りのトグル。body: { scoreId? | practiceItemId?, on: boolean } */
export async function POST(req: Request) {
  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response

  const body = (await req.json().catch(() => null)) as
    | { scoreId?: string; practiceItemId?: string; on?: boolean }
    | null
  const scoreId = typeof body?.scoreId === "string" ? body.scoreId : null
  const practiceItemId = typeof body?.practiceItemId === "string" ? body.practiceItemId : null
  const on = !!body?.on

  // どちらか一方のみ必須
  if ((scoreId && practiceItemId) || (!scoreId && !practiceItemId)) {
    return NextResponse.json(
      { error: "scoreId か practiceItemId のどちらか一方を指定してください" },
      { status: 400 },
    )
  }

  const userId = auth.user.dbUser.id
  try {
    if (on) {
      if (scoreId) {
        await prisma.favorite.upsert({
          where: { userId_scoreId: { userId, scoreId } },
          create: { userId, scoreId },
          update: {},
        })
      } else {
        await prisma.favorite.upsert({
          where: { userId_practiceItemId: { userId, practiceItemId: practiceItemId! } },
          create: { userId, practiceItemId },
          update: {},
        })
      }
      // 報酬体系: お気に入りクエスト (No.019・追加時のみ)
      try {
        const { questEventHook } = await import("@/app/_libs/treasureEngine")
        await questEventHook(userId, "favorite")
      } catch { /* noop */ }
    } else if (scoreId) {
      await prisma.favorite.deleteMany({ where: { userId, scoreId } })
    } else {
      await prisma.favorite.deleteMany({ where: { userId, practiceItemId } })
    }
  } catch {
    // 不正な id (FK 違反) 等
    return NextResponse.json({ error: "対象が見つかりません" }, { status: 400 })
  }

  return NextResponse.json({ ok: true, on })
}
