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
      select: { id: true, title: true, composer: true, star: true, coverImagePath: true },
    }),
    prisma.userScoreAchievement.findMany({
      where: { userId: dbUserId },
      select: { scoreId: true, achievedAt: true, masteredAt: true },
    }),
  ])
  const achievementByScore = new Map(achievements.map((a) => [a.scoreId, a]))

  // ベストスコア: この曲でのユーザー自己ベスト overallScore (存在する時だけ表示)。
  // ⚠️ overallScore は旧式で null の場合あり → 値がある曲だけ載る (graceful)。
  const bestRows = pieces.length
    ? await prisma.performance.groupBy({
        by: ["scoreId"],
        where: { userId: dbUserId, scoreId: { in: pieces.map((p) => p.id) }, overallScore: { not: null } },
        _max: { overallScore: true },
      })
    : []
  const bestByScore = new Map(bestRows.map((r) => [r.scoreId, r._max.overallScore]))

  const piecesWithBadge = pieces.map((pc) => ({
    ...pc,
    badge: badgeKind(achievementByScore.get(pc.id)),
    bestScore: bestByScore.get(pc.id) != null ? Math.round(bestByScore.get(pc.id)!) : null,
  }))

  return <PiecesList userId={authUserId} pieces={piecesWithBadge} />
}
