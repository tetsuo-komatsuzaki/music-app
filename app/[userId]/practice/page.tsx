import { prisma } from "@/app/_libs/prisma"
import { getUserIdsFromParams } from "@/app/_libs/getUserIdsFromParams"
import { formatKey } from "@/app/_libs/musicNotation"
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
  SKILL_TASKS,
  type SubTaskId,
  type TaskId,
} from "@/app/_libs/skillMaster"
import PracticeTop, { type CardContext } from "./practiceTop"

export const metadata = { title: "練習メニュー" }

const isSubTaskId = (v: unknown): v is SubTaskId =>
  typeof v === "string" && Object.prototype.hasOwnProperty.call(SUB_TASK_NAMES, v)

const isTaskId = (v: unknown): v is TaskId =>
  typeof v === "string" && Object.prototype.hasOwnProperty.call(TASK_NAMES, v)

// UI-12 (D3): カード由来の遷移時に画面上部に表示するコンテクスト名を計算。
// sub_task カード:「{subTaskName}」の教材
// task カード:「{taskName}」全体の教材
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
  // SKILL_TASKS の参照を保ち TS の tree-shake を回避 (将来 task 拡張用)
  void SKILL_TASKS

  // カテゴリごとの件数（運営サンプル + 自分のアイテムのみ）
  const ownerFilter = { OR: [{ ownerUserId: null }, { ownerUserId: dbUserId }] }
  const [scaleCount, arpeggioCount, etudeCount] = await Promise.all([
    prisma.practiceItem.count({ where: { category: "scale", isPublished: true, ...ownerFilter } }),
    prisma.practiceItem.count({ where: { category: "arpeggio", isPublished: true, ...ownerFilter } }),
    prisma.practiceItem.count({ where: { category: "etude", isPublished: true, ...ownerFilter } }),
  ])

  // ユーザーの楽曲（レコメンド用）
  const scores = await prisma.score.findMany({
    where: { createdById: dbUserId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, title: true, keyTonic: true, keyMode: true, defaultTempo: true },
  })

  // 楽譜ベースレコメンド
  const scoreRecommendations = []
  for (const score of scores) {
    if (!score.keyTonic) continue
    const items = await prisma.practiceItem.findMany({
      where: {
        keyTonic: score.keyTonic,
        keyMode: score.keyMode ?? "major",
        category: { in: ["scale", "arpeggio"] },
        isPublished: true,
        OR: [{ ownerUserId: null }, { ownerUserId: dbUserId }],
      },
      take: 3,
      orderBy: { title: "asc" },
      select: { id: true, title: true, category: true },
    })
    if (items.length > 0) {
      scoreRecommendations.push({
        scoreTitle: score.title,
        reason: `「${score.title}」は${formatKey(score.keyTonic, score.keyMode)}`,
        items,
      })
    }
  }

  // 弱点ベースレコメンド
  const weaknesses = await prisma.userWeakness.findMany({
    where: { userId: dbUserId },
    orderBy: { severity: "desc" },
    take: 3,
    include: { techniqueTag: true },
  })

  type WeaknessRecItem = { id: string; title: string; category: string }
  const weaknessRecommendations = []
  for (const w of weaknesses) {
    let items: WeaknessRecItem[] = []
    let reason = ""

    if (w.weaknessType === "key_area") {
      const [tonic, mode] = w.weaknessKey.split("_")
      items = await prisma.practiceItem.findMany({
        where: { keyTonic: tonic, keyMode: mode, category: { in: ["scale", "arpeggio"] }, isPublished: true, OR: [{ ownerUserId: null }, { ownerUserId: dbUserId }] },
        take: 3, select: { id: true, title: true, category: true },
      })
      reason = `${formatKey(tonic, mode)}でピッチが不安定です（エラー率${Math.round(w.severity * 100)}%）`
    } else if (w.weaknessType === "timing") {
      items = await prisma.practiceItem.findMany({
        where: {
          category: "etude", isPublished: true,
          OR: [{ ownerUserId: null }, { ownerUserId: dbUserId }],
          techniques: { some: { techniqueTag: { name: { in: ["デタシェ", "マルテレ", "スタッカート"] } } } },
        },
        take: 3, select: { id: true, title: true, category: true },
      })
      reason = `タイミングの精度に課題があります（エラー率${Math.round(w.severity * 100)}%）`
    } else if (w.weaknessType === "pitch_range") {
      const rangeLabel: Record<string, string> = { low: "低音域", mid: "中音域", high: "高音域", very_high: "超高音域" }
      items = await prisma.practiceItem.findMany({
        where: {
          category: { in: ["scale", "etude"] }, isPublished: true,
          OR: [{ ownerUserId: null }, { ownerUserId: dbUserId }],
          positions: { hasSome: ["3rd", "5th", "7th"] },
        },
        take: 3, select: { id: true, title: true, category: true },
      })
      reason = `${rangeLabel[w.weaknessKey] || w.weaknessKey}でピッチが不安定です`
    } else if (w.weaknessType === "technique" && w.techniqueTag) {
      items = await prisma.practiceItem.findMany({
        where: {
          isPublished: true,
          OR: [{ ownerUserId: null }, { ownerUserId: dbUserId }],
          techniques: { some: { techniqueTagId: w.techniqueTagId! } },
        },
        take: 3, select: { id: true, title: true, category: true },
      })
      reason = `${w.techniqueTag.name}が苦手です（エラー率${Math.round(w.severity * 100)}%）`
    }

    if (items.length > 0) {
      weaknessRecommendations.push({ reason, items })
    }
  }

  return (
    <PracticeTop
      userId={authUserId}
      categoryCounts={{ scale: scaleCount, arpeggio: arpeggioCount, etude: etudeCount }}
      scoreRecommendations={scoreRecommendations}
      weaknessRecommendations={weaknessRecommendations}
      cardContext={cardContext}
    />
  )
}
