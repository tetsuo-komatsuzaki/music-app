import { prisma } from "@/app/_libs/prisma"
import { getUserIdsFromParams } from "@/app/_libs/getUserIdsFromParams"
import PiecesList from "./piecesList"

export const metadata = { title: "練習曲" }

// 練習曲一覧 = 公開教材 (isShared Score)。☆順ソートはクライアント側 (PiecesList)。
export default async function PracticePiecesPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const p = await params
  const { authUserId } = await getUserIdsFromParams(p)

  const pieces = await prisma.score.findMany({
    where: { isShared: true, deletedAt: null },
    orderBy: [{ star: "asc" }, { title: "asc" }],
    select: { id: true, title: true, composer: true, star: true },
  })

  return <PiecesList userId={authUserId} pieces={pieces} />
}
