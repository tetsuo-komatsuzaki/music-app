// app/api/practice/items/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")
  const keyTonic = searchParams.get("keyTonic")
  const keyMode = searchParams.get("keyMode")
  const difficulty = searchParams.get("difficulty")
  const position = searchParams.get("position")
  const technique = searchParams.get("technique") // TechniqueTag.nameEn
  const userId = searchParams.get("userId")

  const where: any = {
    isPublished: true,
    OR: [{ ownerUserId: null }, ...(userId ? [{ ownerUserId: userId }] : [])],
  }

  if (category) where.category = category
  if (keyTonic) where.keyTonic = keyTonic
  if (keyMode) where.keyMode = keyMode
  if (difficulty) where.difficulty = difficulty
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
