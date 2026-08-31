// app/[userId]/progress/cards/page.tsx
//
// カードアルバム (2026-08-31 Tetsuo確定)。クエストカードの置き場は
// ギャラリーではなくここ (成長カルテ配下の図鑑)。カード格クエストを
// カテゴリ別に全掲載し、クリア済み=券面 / 未クリア=シルエット+達成条件。
// 認定証格 (grade:"cert") はギャラリーの賞状棚が持ち場なのでここには出さない。
import { prisma } from "@/app/_libs/prisma"
import CardAlbumClient from "./CardAlbumClient"

export const metadata = { title: "カードアルバム" }

type PageProps = {
  params: Promise<{ userId: string }>
}

export default async function CardAlbumServerPage({ params }: PageProps) {
  const { userId } = await params

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: userId },
    select: { id: true },
  })
  if (!dbUser) return <div>User not found</div>

  const clears = await prisma.userQuestClear.findMany({
    where: { userId: dbUser.id },
    select: { questId: true, clearedAt: true },
  })

  return (
    <CardAlbumClient
      userId={userId}
      cleared={clears.map((c) => ({ questId: c.questId, clearedAt: c.clearedAt.toISOString() }))}
    />
  )
}
