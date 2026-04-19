import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { requireAuthApi } from "@/app/_libs/requireAuth"

export async function GET(request: NextRequest) {
  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  const dbUserId = auth.user.dbUser.id

  const { searchParams } = new URL(request.url)
  const practiceItemId = searchParams.get("practiceItemId")

  const where: { userId: string; practiceItemId?: string } = { userId: dbUserId }
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
