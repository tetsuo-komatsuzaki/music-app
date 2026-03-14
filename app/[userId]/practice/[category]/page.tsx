import { prisma } from "@/app/_libs/prisma"
import PracticeList from "./practiceLIst"

const categoryTitles: Record<string, string> = {
  scale: "音階", scales: "音階",
  arpeggio: "アルペジオ", arpeggios: "アルペジオ",
  etude: "エチュード", etudes: "エチュード",
}

// URL上は scales/arpeggios/etudes でも、DB上は scale/arpeggio/etude
const normalizeCat = (c: string): string => {
  if (c === "scales") return "scale"
  if (c === "arpeggios") return "arpeggio"
  if (c === "etudes") return "etude"
  return c
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string; category: string }>
  searchParams: Promise<{ key?: string; difficulty?: string; position?: string }>
}) {
  const { userId, category } = await params
  const sp = await searchParams
  const dbCategory = normalizeCat(category)

  // フィルター構築
  const where: any = {
    category: dbCategory as any,
    isPublished: true,
  }
  if (sp.key) {
    const [tonic, mode] = sp.key.split("_")
    if (tonic) where.keyTonic = tonic
    if (mode) where.keyMode = mode
  }
  if (sp.difficulty) where.difficulty = parseInt(sp.difficulty)
  if (sp.position) where.positions = { has: sp.position }

  const items = await prisma.practiceItem.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    include: {
      techniques: {
        where: { isPrimary: true },
        include: { techniqueTag: { select: { name: true } } },
      },
    },
  })

  // 各アイテムのユーザー練習履歴（最新 + ベストスコア）
  const itemsWithHistory = await Promise.all(
    items.map(async (item) => {
      const latest = await prisma.practicePerformance.findFirst({
        where: { userId, practiceItemId: item.id, comparisonResultPath: { not: null } },
        orderBy: { uploadedAt: "desc" },
        select: { uploadedAt: true },
      })

      const totalPractices = await prisma.practicePerformance.count({
        where: { userId, practiceItemId: item.id },
      })

      return {
        id: item.id,
        title: item.title,
        composer: item.composer,
        category: item.category,
        difficulty: item.difficulty,
        keyTonic: item.keyTonic,
        keyMode: item.keyMode,
        positions: item.positions,
        techniques: item.techniques.map((t) => t.techniqueTag.name),
        descriptionShort: item.descriptionShort,
        lastPracticed: latest?.uploadedAt?.toISOString() ?? null,
        totalPractices,
      }
    })
  )

  // フィルター用の選択肢を収集
  const allItems = await prisma.practiceItem.findMany({
    where: { category: dbCategory as any, isPublished: true },
    select: { keyTonic: true, keyMode: true, difficulty: true, positions: true },
  })
  const keys = [...new Set(allItems.map((i) => `${i.keyTonic}_${i.keyMode}`))]
  const difficulties = [...new Set(allItems.map((i) => i.difficulty))]
  const positions = [...new Set(allItems.flatMap((i) => i.positions))]

  return (
    <PracticeList
      userId={userId}
      category={category}
      categoryTitle={categoryTitles[category] || category}
      items={itemsWithHistory}
      filterOptions={{ keys, difficulties, positions }}
      currentFilters={sp}
    />
  )
}
