// 曲カタログの読込 (2026-08-21 Tetsuo指示: 曲をさがすをライブラリ曲タブへ統合)。
// 旧 practice/pieces/page.tsx の読込ロジックを共通化したもの。
// 1グループ=1曲、配下に難易度変種。代表値: ☆=最小 ・ ベスト=最大 ・ バッジ=最上位。
import { prisma } from "@/app/_libs/prisma"
import { parseParts } from "@/app/_libs/materialParts"
import { badgeKind } from "@/app/_libs/starProgress"
import type { SheetSection, SheetVariant } from "../practice/pieces/PrePracticeSheet"

export type CatalogVariant = SheetVariant & { badge: "mastered" | "achieved" | null }

export type CatalogPiece = {
  groupId: string
  title: string
  composer: string | null
  star: number | null
  badge?: "mastered" | "achieved" | null
  bestScore?: number | null
  coverImagePath?: string | null
  genre?: string | null
  variants: CatalogVariant[]
}

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

export async function loadPieceCatalog(dbUserId: string): Promise<CatalogPiece[]> {
  const groups = await prisma.materialGroup.findMany({
    where: { kind: "SONG", scores: { some: { isShared: true, deletedAt: null } } },
    orderBy: [{ title: "asc" }],
    select: {
      id: true, title: true, composer: true, genre: true, coverImagePath: true,
      parts: true,   // パート定義はグループ単位 (2026-08-25)
      scores: {
        where: { isShared: true, deletedAt: null },
        orderBy: [{ star: "asc" }],
        select: { id: true, star: true, difficulty: true, sections: true, rhythmRecipe: true },
      },
    },
  })

  const allVariantIds = groups.flatMap((g) => g.scores.map((s) => s.id))

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
  const bestByScore = new Map<string, number>()
  for (const r of bestRows) {
    const s = Math.round((r.pitchAccuracy! + r.timingAccuracy!) / 2)
    const cur = bestByScore.get(r.scoreId)
    if (cur == null || s > cur) bestByScore.set(r.scoreId, s)
  }

  return groups.map((g) => {
    // パートはグループ単位。個々の変種の sections より優先する (2026-08-25 確定)
    const groupParts = parseParts(g.parts ?? [])
    const variants = g.scores.map((s) => ({
      id: s.id,
      star: s.star,
      difficulty: s.difficulty,
      // 個別パターン名 (リズムパターンで付けた名前)。null=標準
      patternName: ((s.rhythmRecipe as { name?: string } | null)?.name) ?? null,
      sections: groupParts.length > 0
        ? groupParts.map((p) => ({ id: p.id, name: p.name, startMeasure: p.startMeasure, endMeasure: p.endMeasure }))
        : parseSections(s.sections),
      bestScore: bestByScore.get(s.id) != null ? Math.round(bestByScore.get(s.id)!) : null,
      badge: badgeKind(achByScore.get(s.id)),
    }))
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
}
