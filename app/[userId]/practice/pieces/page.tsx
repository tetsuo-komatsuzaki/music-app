import { prisma } from "@/app/_libs/prisma"
import { getUserIdsFromParams } from "@/app/_libs/getUserIdsFromParams"
import { badgeKind } from "@/app/_libs/starProgress"
import PiecesList, { type Piece } from "./piecesList"
import type { SheetSection } from "./PrePracticeSheet"

export const metadata = { title: "練習曲" }

// Json → SheetSection[] (安全にパース)
function parseSections(v: unknown): SheetSection[] {
  if (!Array.isArray(v)) return []
  const out: SheetSection[] = []
  for (const s of v) {
    if (s && typeof s === "object") {
      const o = s as Record<string, unknown>
      if (typeof o.startMeasure === "number" && typeof o.endMeasure === "number") {
        out.push({
          name: typeof o.name === "string" ? o.name : `${o.startMeasure}〜${o.endMeasure}小節`,
          startMeasure: o.startMeasure,
          endMeasure: o.endMeasure,
        })
      }
    }
  }
  return out
}

// 練習曲一覧 = 公開教材(isShared Score)を持つ SONG グループ。1グループ=1曲、配下に難易度変種。
export default async function PracticePiecesPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const p = await params
  const { authUserId, dbUserId } = await getUserIdsFromParams(p)

  // SONG グループ + 共有変種 (Score) を取得
  const groups = await prisma.materialGroup.findMany({
    where: { kind: "SONG", scores: { some: { isShared: true, deletedAt: null } } },
    orderBy: [{ title: "asc" }],
    select: {
      id: true, title: true, composer: true, genre: true, coverImagePath: true,
      scores: {
        where: { isShared: true, deletedAt: null },
        orderBy: [{ star: "asc" }],
        select: { id: true, star: true, difficulty: true, sections: true },
      },
    },
  })

  const allVariantIds = groups.flatMap((g) => g.scores.map((s) => s.id))

  // C-6b: バッジ (UserScoreAchievement)。ベスト: Performance の自己ベスト overallScore。
  const [achievements, bestRows] = await Promise.all([
    prisma.userScoreAchievement.findMany({
      where: { userId: dbUserId, scoreId: { in: allVariantIds } },
      select: { scoreId: true, achievedAt: true, masteredAt: true },
    }),
    allVariantIds.length
      ? prisma.performance.groupBy({
          by: ["scoreId"],
          where: { userId: dbUserId, scoreId: { in: allVariantIds }, overallScore: { not: null } },
          _max: { overallScore: true },
        })
      : Promise.resolve([]),
  ])
  const achByScore = new Map(achievements.map((a) => [a.scoreId, a]))
  const bestByScore = new Map(bestRows.map((r) => [r.scoreId, r._max.overallScore]))

  const pieces: Piece[] = groups.map((g) => {
    const variants = g.scores.map((s) => ({
      id: s.id,
      star: s.star,
      difficulty: s.difficulty,
      sections: parseSections(s.sections),
      bestScore: bestByScore.get(s.id) != null ? Math.round(bestByScore.get(s.id)!) : null,
      badge: badgeKind(achByScore.get(s.id)),
    }))
    // グループ代表値: ☆=最小(入門しやすさ), ベスト=最大, バッジ=最上位
    const stars = variants.map((v) => v.star).filter((x): x is number => x != null)
    const bests = variants.map((v) => v.bestScore).filter((x): x is number => x != null)
    const badge = variants.some((v) => v.badge === "mastered")
      ? ("mastered" as const)
      : variants.some((v) => v.badge === "achieved")
        ? ("achieved" as const)
        : null
    return {
      groupId: g.id,
      title: g.title,
      composer: g.composer,
      genre: g.genre,
      coverImagePath: g.coverImagePath,
      star: stars.length ? Math.min(...stars) : null,
      bestScore: bests.length ? Math.max(...bests) : null,
      badge,
      variants,
    }
  })

  return <PiecesList userId={authUserId} pieces={pieces} />
}
