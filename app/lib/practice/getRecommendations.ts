import { prisma } from "@/app/_libs/prisma"

export type RecommendReason = "weakness" | "continue" | "untried" | "same_key"

export type ScoredItemDTO = {
  id: string
  title: string
  category: string
  difficulty: number
  keyTonic: string
  keyMode: string
  positions: string[]
  techniqueNames: string[]
  score: number
  reason: RecommendReason
  lastPracticed?: string // ISO string
}

export async function getRecommendations(
  userId: string,
  category: "scale" | "arpeggio" | "etude",
  limit: number = 5
): Promise<ScoredItemDTO[]> {
  const [items, weaknesses, performances, recentScores] = await Promise.all([
    prisma.practiceItem.findMany({
      where: {
        category: category as any,
        isPublished: true,
        OR: [{ ownerUserId: null }, { ownerUserId: userId }],
      },
      include: {
        techniques: {
          where: { isPrimary: true },
          include: { techniqueTag: { select: { name: true } } },
        },
      },
    }),
    prisma.userWeakness.findMany({ where: { userId } }),
    prisma.practicePerformance.findMany({
      where: { userId },
      select: { practiceItemId: true, uploadedAt: true },
      orderBy: { uploadedAt: "desc" },
    }),
    prisma.score.findMany({
      where: { createdById: userId },
      select: { keyTonic: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ])

  if (items.length === 0) return []

  // Build lookup maps
  const perfByItem = new Map<string, Date>()
  const perfCountByItem = new Map<string, number>()
  for (const p of performances) {
    if (!perfByItem.has(p.practiceItemId)) {
      perfByItem.set(p.practiceItemId, p.uploadedAt)
    }
    perfCountByItem.set(p.practiceItemId, (perfCountByItem.get(p.practiceItemId) ?? 0) + 1)
  }

  const recentKeyTonics = new Set(
    recentScores.map((s) => s.keyTonic).filter(Boolean) as string[]
  )

  const now = Date.now()
  const scored: (ScoredItemDTO & { _lastMs: number })[] = []

  for (const item of items) {
    const lastPracticed = perfByItem.get(item.id)
    const hasPracticed = !!lastPracticed

    // weakness_score
    let weakness_score = 0
    for (const w of weaknesses) {
      if (w.weaknessType === "pitch_accuracy" && w.weaknessKey === item.keyTonic) {
        weakness_score = Math.max(weakness_score, 1.0)
      } else if (w.weaknessType === "pitch_range" && item.difficulty >= 3) {
        weakness_score = Math.max(weakness_score, 0.6)
      } else if (w.weaknessType === "timing" && category === "etude") {
        weakness_score = Math.max(weakness_score, 0.8)
      }
    }

    // score_signal (keyTonic match from recent scores)
    const keyMatches = recentKeyTonics.has(item.keyTonic)
    const score_signal = keyMatches ? 0.8 : 0

    // behavior_score
    let behavior_score = 0
    if (!hasPracticed) {
      behavior_score = 0.4
    } else if (lastPracticed) {
      const daysSince = (now - lastPracticed.getTime()) / 86400000
      if (daysSince < 1) behavior_score = 0.0
      else if (daysSince < 3) behavior_score = 0.3
      else if (daysSince <= 7) behavior_score = 0.8
      else behavior_score = 1.0
    }

    const totalScore = weakness_score * 0.5 + score_signal * 0.3 + behavior_score * 0.2

    // reason (priority: weakness > same_key > continue > untried)
    let reason: RecommendReason
    if (weakness_score > 0 && totalScore >= 0.6) {
      reason = "weakness"
    } else if (keyMatches) {
      reason = "same_key"
    } else if (hasPracticed) {
      reason = "continue"
    } else {
      reason = "untried"
    }

    scored.push({
      id: item.id,
      title: item.title,
      category: item.category,
      difficulty: item.difficulty,
      keyTonic: item.keyTonic ?? "",
      keyMode: item.keyMode ?? "",
      positions: item.positions,
      techniqueNames: item.techniques.map((t) => t.techniqueTag.name),
      score: totalScore,
      reason,
      lastPracticed: lastPracticed?.toISOString(),
      _lastMs: lastPracticed?.getTime() ?? 0,
    })
  }

  // Sort: score desc, then oldest lastPracticed first
  scored.sort((a, b) => {
    if (Math.abs(b.score - a.score) > 0.001) return b.score - a.score
    return a._lastMs - b._lastMs
  })

  return scored.slice(0, limit).map(({ _lastMs: _l, ...rest }) => rest)
}
