import { prisma } from "@/app/_libs/prisma"

export type PracticeStats = {
  totalItems: number
  practicedItems: number
  avgPitchAccuracy: number // 0 if no data
  weakKeyCount: number
}

export async function getPracticeStats(
  userId: string,
  category: "scale" | "arpeggio" | "etude"
): Promise<PracticeStats> {
  const [totalItems, practicedRows, weaknesses] = await Promise.all([
    prisma.practiceItem.count({
      where: {
        category: category as any,
        isPublished: true,
        OR: [{ ownerUserId: null }, { ownerUserId: userId }],
      },
    }),
    prisma.practicePerformance.findMany({
      where: { userId, practiceItem: { category: category as any } },
      select: { practiceItemId: true },
      distinct: ["practiceItemId"],
    }),
    prisma.userWeakness.findMany({
      where: { userId, weaknessType: "pitch_accuracy" },
    }),
  ])

  const practicedItems = practicedRows.length

  // Estimate avgPitchAccuracy from UserWeakness severity
  // severity is normalized error rate → accuracy ≈ (1 - severity) * 100
  const avgPitchAccuracy =
    weaknesses.length > 0
      ? Math.round(
          (1 - weaknesses.reduce((s, w) => s + w.severity, 0) / weaknesses.length) * 100
        )
      : 0

  // weakKeyCount: keys with severity > 0.25 (accuracy < 75%)
  const weakKeyCount = weaknesses.filter((w) => w.severity > 0.25).length

  return { totalItems, practicedItems, avgPitchAccuracy, weakKeyCount }
}
