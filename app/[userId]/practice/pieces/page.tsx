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

  // C-6b: バッジ (UserScoreAchievement)。
  // 自己ベスト = 演奏スコア(音程+リズム平均)の最大。overallScore(旧式)廃止に伴い新指標へ移行。
  // 区間録音(部分練習)は公式指標に非算入 → rangeFromNote: null で除外 (マスター判定と同思想)。
  const [achievements, bestRows] = await Promise.all([
    prisma.userScoreAchievement.findMany({
      where: { userId: dbUserId, scoreId: { in: allVariantIds } },
      select: { scoreId: true, achievedAt: true, masteredAt: true },
    }),
    allVariantIds.length
      ? prisma.performance.findMany({
          where: {
            userId: dbUserId, scoreId: { in: allVariantIds },
            rangeFromNote: null,
            pitchAccuracy: { not: null }, timingAccuracy: { not: null },
          },
          select: { scoreId: true, pitchAccuracy: true, timingAccuracy: true },
        })
      : Promise.resolve([]),
  ])
  const achByScore = new Map(achievements.map((a) => [a.scoreId, a]))
  // scoreId ごとに (音程+リズム)/2 の最大値 (performanceScore と同一式)
  const bestByScore = new Map<string, number>()
  for (const r of bestRows) {
    const s = Math.round((r.pitchAccuracy! + r.timingAccuracy!) / 2)
    const cur = bestByScore.get(r.scoreId)
    if (cur == null || s > cur) bestByScore.set(r.scoreId, s)
  }

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
