// app/api/practice/performances/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { userId, practiceItemId, audioPath } = body

  if (!userId || !practiceItemId || !audioPath) {
    return NextResponse.json(
      { error: "userId, practiceItemId, audioPath are required" },
      { status: 400 }
    )
  }

  // PracticeItem の存在確認
  const item = await prisma.practiceItem.findUnique({
    where: { id: practiceItemId },
  })
  if (!item) {
    return NextResponse.json({ error: "PracticeItem not found" }, { status: 404 })
  }

  const performance = await prisma.practicePerformance.create({
    data: {
      userId,
      practiceItemId,
      audioPath,
    },
  })

  // TODO: 比較処理をキック
  // analyze_performance.py を PracticePerformance 用に呼び出す

  return NextResponse.json(performance, { status: 201 })
}
