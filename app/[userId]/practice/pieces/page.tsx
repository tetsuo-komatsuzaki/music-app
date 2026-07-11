import { prisma } from "@/app/_libs/prisma"
import { getUserIdsFromParams } from "@/app/_libs/getUserIdsFromParams"
import { badgeKind } from "@/app/_libs/starProgress"
import PiecesList from "./piecesList"

export const metadata = { title: "練習曲" }

// 練習曲一覧 = 公開教材 (isShared Score)。☆順ソートはクライアント側 (PiecesList)。
export default async function PracticePiecesPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const p = await params
  const { authUserId, dbUserId } = await getUserIdsFromParams(p)

  // C-6b (2026-07-11): バッジは新達成記録 (UserScoreAchievement) から。マスター≻達成。
  const [pieces, achievements] = await Promise.all([
    prisma.score.findMany({
      where: { isShared: true, deletedAt: null },
      orderBy: [{ star: "asc" }, { title: "asc" }],
      select: { id: true, title: true, composer: true, star: true },
    }),
    prisma.userScoreAchievement.findMany({
      where: { userId: dbUserId },
      select: { scoreId: true, achievedAt: true, masteredAt: true },
    }),
  ])
  const achievementByScore = new Map(achievements.map((a) => [a.scoreId, a]))
  const piecesWithBadge = pieces.map((pc) => ({
    ...pc,
    badge: badgeKind(achievementByScore.get(pc.id)),
  }))

  return <PiecesList userId={authUserId} pieces={piecesWithBadge} />
}
