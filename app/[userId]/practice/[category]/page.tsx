import { prisma } from "@/app/_libs/prisma"
import { getUserIdsFromParams } from "@/app/_libs/getUserIdsFromParams"
import PracticeList from "./practiceLIst"
import type { ScoredItemDTO } from "@/app/lib/practice/getRecommendations"
import { getPracticeStats } from "@/app/lib/practice/getPracticeStats"
import {
  extractSubTaskIdsFromCard,
  getAchievedPracticeItemIds,
  getCurrentGrade,
} from "@/app/_libs/recommendations"
import {
  GRADE_DIFFICULTY_RANGE,
  SUB_TASK_NAMES,
  TASK_NAMES,
  type SubTaskId,
  type TaskId,
} from "@/app/_libs/skillMaster"

// アクティブカード由来「今日の課題」のラベル生成
function buildTodayTaskLabel(card: {
  cardType: string
  skillTaskId: string | null
  skillSubTaskId: string | null
}): string | null {
  if (card.cardType === "sub_task" && card.skillSubTaskId) {
    return SUB_TASK_NAMES[card.skillSubTaskId as SubTaskId] ?? card.skillSubTaskId
  }
  if (card.cardType === "task" && card.skillTaskId) {
    const name = TASK_NAMES[card.skillTaskId as TaskId] ?? card.skillTaskId
    return `${name}全体`
  }
  return null
}

const categoryTitles: Record<string, string> = {
  scale: "音階", scales: "音階",
  arpeggio: "アルペジオ", arpeggios: "アルペジオ",
  etude: "エチュード", etudes: "エチュード",
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params
  return { title: categoryTitles[category] ?? "練習" }
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
  const [items, allItemsForFilter, stats, activeCard, grade, achievedIds] =
    await Promise.all([
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
          OR: [{ ownerUserId: null }, { ownerUserId: dbUserId }],
        },
        select: { keyTonic: true, keyMode: true, positions: true },
      }),
      getPracticeStats(dbUserId, dbCategory),
      // 「今日の課題」用のアクティブカード (一番古い active を 1 件)
      prisma.userSkillTaskCard.findFirst({
        where: { userId: dbUserId, status: "active" },
        orderBy: { createdAt: "asc" },
        select: { id: true, cardType: true, skillTaskId: true, skillSubTaskId: true },
      }),
      getCurrentGrade(prisma, dbUserId),
      getAchievedPracticeItemIds(prisma, dbUserId),
    ])
  console.log(`[PERF] practice/category step1_parallel: ${(performance.now() - perfStart).toFixed(0)}ms`)

  // 「今日の課題」: アクティブカードに紐づく practiceItem を category 内で検索
  let todayTaskItems: ScoredItemDTO[] = []
  let todayTaskLabel: string | null = null
  if (activeCard) {
    const subTaskIds = extractSubTaskIdsFromCard(activeCard)
    if (subTaskIds && subTaskIds.length > 0) {
      const [diffMin, diffMax] = GRADE_DIFFICULTY_RANGE[grade]
      const tagOR = subTaskIds.map(id => ({
        skillSubTaskTags: { array_contains: id },
      }))
      const candidates = await prisma.practiceItem.findMany({
        where: {
          category: dbCategory as any,
          isPublished: true,
          star: { gte: diffMin, lte: diffMax },
          OR: [{ ownerUserId: null }, { ownerUserId: dbUserId }],
          AND: [{ OR: tagOR }],
          ...(achievedIds.length > 0 ? { id: { notIn: achievedIds } } : {}),
        },
        orderBy: { star: "asc" },
        take: 6,
        include: {
          techniques: {
            where: { isPrimary: true },
            include: { techniqueTag: { select: { name: true } } },
          },
        },
      })
      todayTaskItems = candidates.map(c => ({
        id: c.id,
        title: c.title,
        category: c.category,
        keyTonic: c.keyTonic ?? "",
        keyMode: c.keyMode ?? "",
        positions: c.positions,
        techniqueNames: c.techniques.map(t => t.techniqueTag.name),
        score: 1,
        reason: "continue",
        totalPractices: 0,
      }))
      todayTaskLabel = buildTodayTaskLabel(activeCard)
    }
  }

  const itemIds = items.map((i) => i.id)

  const perfStep2 = performance.now()
  const allPerformances = itemIds.length > 0
    ? await prisma.practicePerformance.findMany({
        where: { userId: dbUserId, practiceItemId: { in: itemIds } },
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
      keyTonic: item.keyTonic,
      keyMode: item.keyMode,
      modeVariant,
      chordType,
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
      userId={authUserId}
      category={category}
      categoryTitle={categoryTitles[category] || category}
      items={itemsWithHistory}
      filterOptions={{ keys, positions }}
      currentFilters={sp}
      recommendations={todayTaskItems}
      todayTaskLabel={todayTaskLabel}
      stats={stats}
    />
  )
}
