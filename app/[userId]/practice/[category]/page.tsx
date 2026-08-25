import { prisma } from "@/app/_libs/prisma"
import { parseParts } from "@/app/_libs/materialParts"
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
          // 編み込み案2 (2026-08-03): わざラベル用。isPrimary は全件false運用のため全タグ取得し、
          // 表示側で「1〜2個の教材のみ」チップ化 (スケール系の奏法バリエーション6個はノイズなので出さない)
          techniques: {
            include: { techniqueTag: { select: { name: true } } },
          },
          // 重音の度数区分用 (double_stop カテゴリの特徴タグ名)
          featureTags: {
            include: { featureTag: { select: { name: true, category: true } } },
          },
          // 族(グループ) 情報 = 音階/アルペジオの調シート用 (Phase C-basics)
          group: { select: { id: true, title: true, parts: true } },
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
      // 案5 以降は件数で間引かない。表示側が「学びポイントに一致するもの」だけを選ぶため、
      // ここで2個超を捨てると一致する技法まで落ちてしまう (2026-08-25)。
      techniques: item.techniques.map((t) => t.techniqueTag.name),
      intervals: item.featureTags
        .filter((f) => f.featureTag?.category === "double_stop")
        .map((f) => f.featureTag!.name),
      // 族(グループ) = 音階/アルペジオの調シート用
      groupId: item.groupId,
      groupTitle: item.group?.title ?? null,
      // パートはグループ単位 / パターン名はリズム・奏法レシピから (2026-08-25)
      groupParts: parseParts(item.group?.parts ?? []),
      patternName: ((item.rhythmRecipe as { name?: string } | null)?.name)
        ?? ((item.articulationRecipe as { name?: string } | null)?.name)
        ?? null,
      partId: item.partId ?? null,
      partName: item.partId
        ? (parseParts(item.group?.parts ?? []).find((p) => p.id === item.partId)?.name ?? "パート")
        : null,
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

  // 奏法/調の選択可否は「開いたタブ」ではなくユーザーの現在★で判定する (2026-08-09)
  const starRow = await prisma.userStarProgress.findUnique({
    where: { userId: dbUserId },
    select: { currentStar: true },
  })
  const userStar = starRow?.currentStar ?? null

  // 学びポイント (2026-08-25 Tetsuo確定「案5」): 一覧のタグは「いま効くもの」だけ出す。
  // 全教材に一律のタグ (1st〜8th や技法名) は情報量が無く、多いと逆に読めなくなるため、
  // カルテ側で「取り組んだが未習得」と判定された技法に一致するものだけを1つ表示する。
  // 行が存在する = ループエンジンが評価済み、なので未着手の技法は混ざらない。
  const weakRows = await prisma.userTechniqueMastery.findMany({
    where: { userId: dbUserId, isMastered: false },
    select: { techniqueTag: { select: { name: true } } },
  })
  const weakTechniques = weakRows.map((r) => r.techniqueTag.name)

  return (
    <PracticeList
      userId={authUserId}
      category={category}
      categoryTitle={categoryTitles[category] || category}
      items={itemsWithHistory}
      filterOptions={{ keys, positions }}
      currentFilters={sp}
      stats={stats}
      userStar={userStar}
      weakTechniques={weakTechniques}
    />
  )
}
