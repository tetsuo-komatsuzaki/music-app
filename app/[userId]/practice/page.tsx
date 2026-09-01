import { prisma } from "@/app/_libs/prisma"
import { getUserIdsFromParams } from "@/app/_libs/getUserIdsFromParams"
import { BASIC_PRACTICE_CATEGORIES } from "@/app/_libs/practiceConstants"
import type { PracticeCategory } from "@/app/generated/prisma"
import { getUserLessonState, tagId } from "@/app/_libs/lessonStatus"
import { LESSONS, LESSON_TOTAL } from "@/app/[userId]/lessons/_lib/content"
import PracticeTop from "./practiceTop"
import { pickRepresentatives, toRepresentativeInput } from "@/app/_libs/materialRepresentative"

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
  // 2026-09-01 Tetsuo確定: 奏法別・リズム別・パート別は数に入れない。
  // 教材1つがパートや奏法の数だけ増えて見えていた (エチュードは256件のうち198件がパート)。
  const counts = await Promise.all(
    ALL_PRACTICE_CATEGORIES.map(async (cat) => {
      const rows = await prisma.practiceItem.findMany({
        where: { category: cat as PracticeCategory, isPublished: true, ...ownerFilter },
        select: {
          id: true, title: true, groupId: true, keyTonic: true, keyMode: true, difficulty: true,
          positions: true, metadata: true, partId: true, articulation: true,
          rhythmRecipe: true, articulationRecipe: true,
        },
      })
      return pickRepresentatives(rows.map(toRepresentativeInput)).size
    }),
  )
  const categoryCounts: Record<string, number> = {}
  ALL_PRACTICE_CATEGORIES.forEach((cat, i) => {
    categoryCounts[cat] = counts[i]
  })

  // 練習曲 = 公開教材 (isShared Score) の件数。一覧は /practice/pieces へ。
  const pieceRows = await prisma.score.findMany({
    where: { isShared: true, deletedAt: null },
    select: {
      id: true, title: true, groupId: true, keyTonic: true, keyMode: true,
      difficulty: true, partId: true, rhythmRecipe: true,
    },
  })
  const pieceCount = pickRepresentatives(pieceRows.map(toRepresentativeInput)).size

  // 学びのレッスン進捗 (クリア数 = 正式クリアのみ・確定#5)
  const lessonState = await getUserLessonState(dbUserId)
  const lessonCleared = LESSONS.filter((l) => lessonState.cleared.has(tagId(l.tag))).length

  return (
    <PracticeTop
      userId={authUserId}
      categoryCounts={categoryCounts}
      pieceCount={pieceCount}
      lessonProgress={{ cleared: lessonCleared, total: LESSON_TOTAL }}
    />
  )
}
