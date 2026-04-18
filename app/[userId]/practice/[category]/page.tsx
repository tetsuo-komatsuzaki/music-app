import { prisma } from "@/app/_libs/prisma"
import PracticeList from "./practiceLIst"
import { getRecommendations } from "@/app/lib/practice/getRecommendations"
import { getPracticeStats } from "@/app/lib/practice/getPracticeStats"

const categoryTitles: Record<string, string> = {
  scale: "音階", scales: "音階",
  arpeggio: "アルペジオ", arpeggios: "アルペジオ",
  etude: "エチュード", etudes: "エチュード",
}

const normalizeCat = (c: string): "scale" | "arpeggio" | "etude" => {
  if (c === "scales") return "scale"
  if (c === "arpeggios") return "arpeggio"
  if (c === "etudes") return "etude"
  return c as "scale" | "arpeggio" | "etude"
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string; category: string }>
  searchParams: Promise<{ key?: string; position?: string }>
}) {
  const { userId, category } = await params
  const sp = await searchParams
  const dbCategory = normalizeCat(category)

  // フィルター構築
  const where: any = {
    category: dbCategory as any,
    isPublished: true,
    OR: [{ ownerUserId: null }, { ownerUserId: userId }],
  }
  if (sp.key) {
    const [tonic, mode] = sp.key.split("_")
    if (tonic) where.keyTonic = tonic
    if (mode) where.keyMode = mode
  }
  if (sp.position) where.positions = { has: sp.position }

  const perfStart = performance.now()
  const [items, allItemsForFilter, [recommendations, stats]] = await Promise.all([
    prisma.practiceItem.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      include: {
        techniques: {
          where: { isPrimary: true },
          include: { techniqueTag: { select: { name: true } } },
        },
      },
    }),
    prisma.practiceItem.findMany({
      where: {
        category: dbCategory as any,
        isPublished: true,
        OR: [{ ownerUserId: null }, { ownerUserId: userId }],
      },
      select: { keyTonic: true, keyMode: true, positions: true },
    }),
    Promise.all([
      getRecommendations(userId, dbCategory, 5),
      getPracticeStats(userId, dbCategory),
    ]),
  ])
  console.log(`[PERF] practice/category step1_parallel: ${(performance.now() - perfStart).toFixed(0)}ms`)

  const itemIds = items.map((i) => i.id)

  const perfStep2 = performance.now()
  const allPerformances = itemIds.length > 0
    ? await prisma.practicePerformance.findMany({
        where: { userId, practiceItemId: { in: itemIds } },
        select: { practiceItemId: true, uploadedAt: true, comparisonResultPath: true },
        orderBy: { uploadedAt: "desc" },
      })
    : []
  console.log(`[PERF] practice/category step2_performances: ${(performance.now() - perfStep2).toFixed(0)}ms  TOTAL: ${(performance.now() - perfStart).toFixed(0)}ms`)

  // アイテムIDごとに集計
  const perfByItem = new Map<string, { latest: Date | null; total: number }>()
  for (const p of allPerformances) {
    const cur = perfByItem.get(p.practiceItemId)
    if (!cur) {
      perfByItem.set(p.practiceItemId, {
        latest: p.comparisonResultPath ? p.uploadedAt : null,
        total: 1,
      })
    } else {
      if (p.comparisonResultPath && (!cur.latest || p.uploadedAt > cur.latest)) {
        cur.latest = p.uploadedAt
      }
      cur.total += 1
    }
  }

  const itemsWithHistory = items.map((item) => {
    const perf = perfByItem.get(item.id)
    return {
      id: item.id,
      title: item.title,
      composer: item.composer,
      category: item.category,
      keyTonic: item.keyTonic,
      keyMode: item.keyMode,
      positions: item.positions,
      techniques: item.techniques.map((t) => t.techniqueTag.name),
      descriptionShort: item.descriptionShort,
      lastPracticed: perf?.latest?.toISOString() ?? null,
      totalPractices: perf?.total ?? 0,
    }
  })

  const keys = [...new Set(allItemsForFilter.map((i) => `${i.keyTonic}_${i.keyMode}`))]
  const positions = [...new Set(allItemsForFilter.flatMap((i) => i.positions))]

  return (
    <PracticeList
      userId={userId}
      category={category}
      categoryTitle={categoryTitles[category] || category}
      items={itemsWithHistory}
      filterOptions={{ keys, positions }}
      currentFilters={sp}
      recommendations={recommendations}
      stats={stats}
    />
  )
}
