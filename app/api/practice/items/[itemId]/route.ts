// app/api/practice/items/[itemId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  const item = await prisma.practiceItem.findUnique({
    where: { id: itemId },
    include: {
      techniques: {
        include: {
          techniqueTag: {
            select: { id: true, name: true, nameEn: true, category: true, description: true },
          },
        },
      },
    },
  })

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // アクセス制御: ownerUserIdがある場合、本人のみ閲覧可
  if (item.ownerUserId && item.ownerUserId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json(item)
}