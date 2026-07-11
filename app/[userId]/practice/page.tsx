import { prisma } from "@/app/_libs/prisma"
import { getUserIdsFromParams } from "@/app/_libs/getUserIdsFromParams"
import { BASIC_PRACTICE_CATEGORIES } from "@/app/_libs/practiceConstants"
import type { PracticeCategory } from "@/app/generated/prisma"
import PracticeTop from "./practiceTop"

export const metadata = { title: "練習メニュー" }

// C-6b掃除 (2026-07-11): 旧カード由来のコンテクスト表示(?fromCard)と
// 「この曲を上達させる練習」(旧SkillTaskCard/SubTaskAssignment) は撤去。
// 弱点由来の練習導線はホーム累積弱点(窓②)と演奏直後の推薦(窓①)が担う。

// 練習メニューに並ぶカテゴリ全体 (基礎練6 + エチュード)
const ALL_PRACTICE_CATEGORIES = [
  ...BASIC_PRACTICE_CATEGORIES,
  "etude",
] as const

export default async function PracticePage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const p = await params
  const { authUserId, dbUserId } = await getUserIdsFromParams(p)

  // カテゴリごとの件数 (運営サンプル + 自分のアイテムのみ): 基礎練6 + エチュード
  const ownerFilter = { OR: [{ ownerUserId: null }, { ownerUserId: dbUserId }] }
  const counts = await Promise.all(
    ALL_PRACTICE_CATEGORIES.map(cat =>
      prisma.practiceItem.count({
        where: {
          category: cat as PracticeCategory,
          isPublished: true,
          ...ownerFilter,
        },
      }),
    ),
  )
  const categoryCounts: Record<string, number> = {}
  ALL_PRACTICE_CATEGORIES.forEach((cat, i) => {
    categoryCounts[cat] = counts[i]
  })

  // 練習曲 = 公開教材 (isShared Score) の件数。一覧は /practice/pieces へ。
  const pieceCount = await prisma.score.count({
    where: { isShared: true, deletedAt: null },
  })

  return (
    <PracticeTop
      userId={authUserId}
      categoryCounts={categoryCounts}
      pieceCount={pieceCount}
    />
  )
}
