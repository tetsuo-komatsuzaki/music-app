import { prisma } from "@/app/_libs/prisma"
import { getUserIdsFromParams } from "@/app/_libs/getUserIdsFromParams"
import PracticeList from "./practiceLIst"
import { getPracticeStats } from "@/app/lib/practice/getPracticeStats"
import {
  CATEGORY_LABELS,
  type PracticeCategoryId,
} from "@/app/_libs/practiceConstants"

// C-6b掃除 (2026-07-11): 旧カード由来「今日の課題」(UserSkillTaskCard) は撤去。
// 弱点由来の練習導線はホーム累積弱点(窓②)と演奏直後の推薦(窓①)が担う。

const categoryTitles: Record<string, string> = {
  ...CATEGORY_LABELS,
  // 旧 URL の複数形エイリアスも許容
  scales: "音階",
  arpeggios: "アルペジオ",
  etudes: "エチュード",
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params
  return { title: categoryTitles[category] ?? "練習" }
}

const normalizeCat = (c: string): PracticeCategoryId => {
  if (c === "scales") return "scale"
  if (c === "arpeggios") return "arpeggio"
  if (c === "etudes") return "etude"
  return c as PracticeCategoryId
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string; category: string }>
  searchParams: Promise<{ key?: string; position?: string }>
}) {
  const p = await params
  const { authUserId, dbUserId } = await getUserIdsFromParams(p)
  const { category } = p
  const sp = await searchParams
  const dbCategory = normalizeCat(category)

  // フィルター構築
  const where: any = {
    category: dbCategory as any,
    isPublished: true,
    OR: [{ ownerUserId: null }, { ownerUserId: dbUserId }],
  }
  if (sp.key) {
    const [tonic, mode] = sp.key.split("_")
    if (tonic) where.keyTonic = tonic
    if (mode) where.keyMode = mode
  }
  if (sp.position) where.positions = { has: sp.position }

  const perfStart = performance.now()
  const [items, allItemsForFilter, stats] =
    await Promise.all([
      prisma.practiceItem.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
        include: {
          techniques: {
            where: { isPrimary: true },
            include: { techniqueTag: { select: { name: true } } },
          },
          // 重音の度数区分用 (double_stop カテゴリの特徴タグ名)
          featureTags: {
            include: { featureTag: { select: { name: true, category: true } } },
          },
          // 族(グループ) 情報 = 音階/アルペジオの調シート用 (Phase C-basics)
          group: { select: { id: true, title: true } },
        },
      }),
      prisma.practiceItem.findMany({
        where: {
          category: dbCategory as any,
          isPublished: true,
          OR: [{ ownerUserId: null }, { ownerUserId: dbUserId }],
        },
        select: { keyTonic: true, keyMode: true, positions: true },
      }),
      getPracticeStats(dbUserId, dbCategory),
    ])
  console.log(`[PERF] practice/category step1_parallel: ${(performance.now() - perfStart).toFixed(0)}ms`)

  const itemIds = items.map((i) => i.id)

  const perfStep2 = performance.now()
  const allPerformances = itemIds.length > 0
    ? await prisma.practicePerformance.findMany({
        where: { userId: dbUserId, practiceItemId: { in: itemIds } },
        select: { practiceItemId: true, uploadedAt: true, comparisonResultPath: true, pitchAccuracy: true, timingAccuracy: true },
        orderBy: { uploadedAt: "desc" },
      })
    : []
  console.log(`[PERF] practice/category step2_performances: ${(performance.now() - perfStep2).toFixed(0)}ms  TOTAL: ${(performance.now() - perfStart).toFixed(0)}ms`)

  // アイテムIDごとに集計 (best = 自己ベスト = 音程+リズム平均の最大。overallScore廃止に伴い新指標へ)
  const perfByItem = new Map<string, { latest: Date | null; total: number; best: number | null }>()
  for (const p of allPerformances) {
    const score = p.pitchAccuracy != null && p.timingAccuracy != null
      ? Math.round((p.pitchAccuracy + p.timingAccuracy) / 2)
      : null
    const cur = perfByItem.get(p.practiceItemId)
    if (!cur) {
      perfByItem.set(p.practiceItemId, {
        latest: p.comparisonResultPath ? p.uploadedAt : null,
        total: 1,
        best: score,
      })
    } else {
      if (p.comparisonResultPath && (!cur.latest || p.uploadedAt > cur.latest)) {
        cur.latest = p.uploadedAt
      }
      cur.total += 1
      if (score != null && (cur.best == null || score > cur.best)) {
        cur.best = score
      }
    }
  }

  const itemsWithHistory = items.map((item) => {
    const perf = perfByItem.get(item.id)
    const meta =
      typeof item.metadata === "object" && item.metadata !== null && !Array.isArray(item.metadata)
        ? (item.metadata as Record<string, unknown>)
        : {}
    const modeVariant =
      typeof meta.modeVariant === "string" ? (meta.modeVariant as string) : null
    const chordType =
      typeof meta.chordType === "string" ? (meta.chordType as string) : null
    return {
      id: item.id,
      title: item.title,
      composer: item.composer,
      category: item.category,
      star: item.star,
      keyTonic: item.keyTonic,
      keyMode: item.keyMode,
      modeVariant,
      chordType,
      positions: item.positions,
      techniques: item.techniques.map((t) => t.techniqueTag.name),
      intervals: item.featureTags
        .filter((f) => f.featureTag?.category === "double_stop")
        .map((f) => f.featureTag!.name),
      // 族(グループ) = 音階/アルペジオの調シート用
      groupId: item.groupId,
      groupTitle: item.group?.title ?? null,
      articulation: item.articulation,
      difficulty: item.difficulty,
      descriptionShort: item.descriptionShort,
      lastPracticed: perf?.latest?.toISOString() ?? null,
      totalPractices: perf?.total ?? 0,
      bestScore: perf?.best != null ? Math.round(perf.best) : null,
      coverImagePath: item.coverImagePath,
    }
  })

  const keys = [...new Set(allItemsForFilter.map((i) => `${i.keyTonic}_${i.keyMode}`))]
  const positions = [...new Set(allItemsForFilter.flatMap((i) => i.positions))]

  return (
    <PracticeList
      userId={authUserId}
      category={category}
      categoryTitle={categoryTitles[category] || category}
      items={itemsWithHistory}
      filterOptions={{ keys, positions }}
      currentFilters={sp}
      stats={stats}
    />
  )
}
