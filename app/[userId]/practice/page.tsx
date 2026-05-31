import { prisma } from "@/app/_libs/prisma"
import { getUserIdsFromParams } from "@/app/_libs/getUserIdsFromParams"
import {
  extractSubTaskIdsFromCard,
  findCandidatePracticeItems,
  generateRecommendationReason,
  getAchievedPracticeItemIds,
  getCurrentGrade,
} from "@/app/_libs/recommendations"
import {
  SUB_TASK_NAMES,
  TASK_NAMES,
  type SubTaskId,
  type TaskId,
} from "@/app/_libs/skillMaster"
import {
  BASIC_PRACTICE_CATEGORIES,
  categoryLabel,
} from "@/app/_libs/practiceConstants"
import type { PracticeCategory } from "@/app/generated/prisma"
import PracticeTop, {
  type CardContext,
  type SongPracticeGroup,
} from "./practiceTop"

export const metadata = { title: "練習メニュー" }

const isSubTaskId = (v: unknown): v is SubTaskId =>
  typeof v === "string" && Object.prototype.hasOwnProperty.call(SUB_TASK_NAMES, v)

const isTaskId = (v: unknown): v is TaskId =>
  typeof v === "string" && Object.prototype.hasOwnProperty.call(TASK_NAMES, v)

// UI-12 (D3): カード由来の遷移時に画面上部に表示するコンテクスト名を計算。
function buildCardContextLabel(card: {
  cardType: string
  skillTaskId: string | null
  skillSubTaskId: string | null
}): string {
  if (card.cardType === "sub_task" && isSubTaskId(card.skillSubTaskId)) {
    return SUB_TASK_NAMES[card.skillSubTaskId]
  }
  if (card.cardType === "task" && isTaskId(card.skillTaskId)) {
    return `${TASK_NAMES[card.skillTaskId]}全体`
  }
  return ""
}

// 練習メニューに並ぶカテゴリ全体 (基礎練6 + エチュード)
const ALL_PRACTICE_CATEGORIES = [
  ...BASIC_PRACTICE_CATEGORIES,
  "etude",
] as const

export default async function PracticePage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>
  searchParams: Promise<{ fromCard?: string; context?: string }>
}) {
  const p = await params
  const sp = await searchParams
  const { authUserId, dbUserId } = await getUserIdsFromParams(p)

  // UI-12: マイページ / 演奏完了画面のカード由来遷移を検出
  let cardContext: CardContext | null = null
  if (sp.fromCard && sp.context === "etude") {
    const card = await prisma.userSkillTaskCard.findUnique({
      where: { id: sp.fromCard },
      select: {
        id: true,
        userId: true,
        cardType: true,
        skillTaskId: true,
        skillSubTaskId: true,
      },
    })
    // 自分のカードのみ受け付け (他者カード ID 推測対策)
    if (card && card.userId === dbUserId) {
      const grade = await getCurrentGrade(prisma, dbUserId)
      const achievedIds = await getAchievedPracticeItemIds(prisma, dbUserId)
      const subTaskIds = extractSubTaskIdsFromCard(card)
      const items = await findCandidatePracticeItems(prisma, {
        userId: dbUserId,
        subTaskIds,
        grade,
        achievedIds,
        limit: 6,
      })
      const reason = generateRecommendationReason(card)
      cardContext = {
        cardId: card.id,
        contextLabel: buildCardContextLabel(card),
        recommendations: items.map(item => ({
          id: item.id,
          title: item.title,
          category: item.category,
          star: item.star ?? null,
          composer: item.composer ?? null,
          reason,
          href: `/${authUserId}/practice/${item.category}/${item.id}`,
        })),
      }
    }
  }

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

  // §9「この曲を上達させる練習」: 未クリア課題に紐づく基礎練/エチュードを曲ごとに集約
  const cards = await prisma.skillTaskCard.findMany({
    where: { userId: dbUserId, status: { not: "cleared" } },
    select: {
      score: { select: { id: true, title: true } },
      subTasks: {
        where: { status: { not: "cleared" } },
        select: {
          subTaskAssignments: {
            select: {
              isMastered: true,
              practiceItem: {
                select: { id: true, title: true, category: true },
              },
            },
          },
        },
      },
    },
  })
  const songMap = new Map<string, SongPracticeGroup>()
  for (const card of cards) {
    if (!card.score) continue
    let group = songMap.get(card.score.id)
    if (!group) {
      group = { scoreId: card.score.id, scoreTitle: card.score.title, items: [] }
      songMap.set(card.score.id, group)
    }
    for (const st of card.subTasks) {
      for (const a of st.subTaskAssignments) {
        if (a.isMastered || !a.practiceItem) continue
        if (group.items.some(it => it.itemId === a.practiceItem.id)) continue
        group.items.push({
          itemId: a.practiceItem.id,
          title: a.practiceItem.title,
          category: a.practiceItem.category,
          categoryLabel: categoryLabel(a.practiceItem.category),
        })
      }
    }
  }
  const songPracticeGroups = [...songMap.values()].filter(g => g.items.length > 0)

  return (
    <PracticeTop
      userId={authUserId}
      categoryCounts={categoryCounts}
      pieceCount={pieceCount}
      songPracticeGroups={songPracticeGroups}
      cardContext={cardContext}
    />
  )
}
