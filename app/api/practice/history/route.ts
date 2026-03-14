// app/api/practice/history/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  const practiceItemId = searchParams.get("practiceItemId")

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  const where: any = { userId }
  if (practiceItemId) where.practiceItemId = practiceItemId

  const performances = await prisma.practicePerformance.findMany({
    where,
    orderBy: { uploadedAt: "desc" },
    take: 50,
    include: {
      practiceItem: {
        select: { id: true, title: true, category: true },
      },
    },
  })

  return NextResponse.json(performances)
}
