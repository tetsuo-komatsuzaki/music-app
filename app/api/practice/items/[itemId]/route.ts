// app/api/practice/items/[itemId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params

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

  return NextResponse.json(item)
}