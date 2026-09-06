import { prisma } from "@/app/_libs/prisma"
import { resolveViewer } from "@/app/_libs/resolveViewer"
import { GUEST_DB_PLACEHOLDER } from "@/app/_libs/viewer"
import { BASIC_PRACTICE_CATEGORIES } from "@/app/_libs/practiceConstants"
import type { PracticeCategory } from "@/app/generated/prisma"
import { getUserLessonState, tagId } from "@/app/_libs/lessonStatus"
import { LESSONS, LESSON_TOTAL } from "@/app/[userId]/lessons/_lib/content"
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
  // ゲスト閲覧 (2026-09-06): 一覧は見せる。本人の進捗は存在しない ID で引いて空にする
  const viewer = await resolveViewer(p)
  const authUserId = viewer.authUserId
  const dbUserId = viewer.dbUserId ?? GUEST_DB_PLACEHOLDER

  // カテゴリごとの件数 (運営サンプル + 自分のアイテムのみ): 基礎練6 + エチュード
  const ownerFilter = { OR: [{ ownerUserId: null }, { ownerUserId: dbUserId }] }
  // 2026-09-01 Tetsuo確定: 数に入れないのは**パート別だけ**。
  // 調ごと・奏法・パターンは1項目として数える (一覧には並べないが教材としては別物)。
  // 以前はパートまで数えていて、エチュードは256件のうち198件がパートだった。
  const counts = await Promise.all(
    ALL_PRACTICE_CATEGORIES.map(cat =>
      prisma.practiceItem.count({
        where: {
          category: cat as PracticeCategory,
          isPublished: true,
          partId: null,
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
    where: { isShared: true, deletedAt: null, partId: null },
  })

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
