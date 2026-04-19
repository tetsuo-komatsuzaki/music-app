// app/api/practice/items/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { requireAuthApi } from "@/app/_libs/requireAuth"
import type { Prisma } from "@/app/generated/prisma"

export async function GET(request: NextRequest) {
  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  const dbUserId = auth.user.dbUser.id

  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")
  const keyTonic = searchParams.get("keyTonic")
  const keyMode = searchParams.get("keyMode")
  const position = searchParams.get("position")
  const technique = searchParams.get("technique")

  const where: Prisma.PracticeItemWhereInput = {
    isPublished: true,
    OR: [{ ownerUserId: null }, { ownerUserId: dbUserId }],
  }

  if (category) where.category = category as Prisma.PracticeItemWhereInput["category"]
  if (keyTonic) where.keyTonic = keyTonic
  if (keyMode) where.keyMode = keyMode
  if (position) where.positions = { has: position }
  if (technique) {
    where.techniques = {
      some: { techniqueTag: { nameEn: technique } },
    }
  }

  const items = await prisma.practiceItem.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    include: {
      techniques: {
        include: { techniqueTag: { select: { id: true, name: true, nameEn: true, category: true } } },
      },
    },
  })

  return NextResponse.json(items)
}
