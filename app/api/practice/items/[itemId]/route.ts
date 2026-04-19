// app/api/practice/items/[itemId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { requireAuthApi } from "@/app/_libs/requireAuth"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params

  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  const dbUserId = auth.user.dbUser.id

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

  // アクセス制御（エンティティ列挙防止のため全て 404 を返す）:
  // - 存在しない
  // - 未公開かつ所有者以外（未公開の運営サンプルを含む）
  // - 他者所有
  const isOwner = item?.ownerUserId === dbUserId
  const isPublicPublished = item?.ownerUserId === null && item.isPublished === true

  if (!item || (!isOwner && !isPublicPublished)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(item)
}
