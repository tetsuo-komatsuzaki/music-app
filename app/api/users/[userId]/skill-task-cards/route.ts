// GET /api/users/[userId]/skill-task-cards
//
// v3.2.2 §15-2 — マイページのカード一覧取得 (status / cardType フィルタ対応)。
// URL の userId は supabaseUserId (page URL 規約に整合)。

import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@/app/generated/prisma"
import { prisma } from "@/app/_libs/prisma"
import { requireAuthApi } from "@/app/_libs/requireAuth"
import {
  SKILL_TASKS,
  SUB_TASK_NAMES,
  TASK_NAMES,
  type SubTaskId,
  type TaskId,
} from "@/app/_libs/skillMaster"
import {
  GRADE_DIFFICULTY_RANGE,
  type GradeLevel,
} from "@/app/_libs/skillMaster"
import {
  getAchievedPracticeItemIds,
  getCurrentGrade,
} from "@/app/_libs/recommendations"

const VALID_STATUSES = ["active", "improving", "cleared"] as const
const VALID_CARD_TYPES = ["task", "sub_task"] as const
const RECENT_PERF_SCAN_LIMIT = 30 // recentPerformanceId 探索用
const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200

type CardStatus = (typeof VALID_STATUSES)[number]
type CardType = (typeof VALID_CARD_TYPES)[number]

function parseStatuses(raw: string | null): CardStatus[] | null {
  if (!raw) return null
  const items = raw.split(",").map(s => s.trim()).filter(Boolean)
  const filtered = items.filter((s): s is CardStatus =>
    (VALID_STATUSES as readonly string[]).includes(s),
  )
  return filtered.length > 0 ? filtered : null
}

function parseCardType(raw: string | null): CardType | null {
  if (!raw) return null
  return (VALID_CARD_TYPES as readonly string[]).includes(raw)
    ? (raw as CardType)
    : null
}

function parseLimit(raw: string | null): number {
  if (!raw) return DEFAULT_LIMIT
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 1) return DEFAULT_LIMIT
  return Math.min(Math.floor(n), MAX_LIMIT)
}

type SubScoreEntry = { matched?: boolean }

function getDisplayNames(
  cardType: CardType,
  skillTaskId: string | null,
  skillSubTaskId: string | null,
): { displayName: string; parentTaskName: string } {
  if (cardType === "sub_task" && skillSubTaskId) {
    const def = (SKILL_TASKS as Record<string, { id: TaskId } | undefined>)[
      String(skillSubTaskId)
    ]
    void def
    const subId = skillSubTaskId as SubTaskId
    const displayName = SUB_TASK_NAMES[subId] ?? skillSubTaskId
    // parentTaskId は SUB_TASK_IDS で逆引きする代わりに SKILL_TASKS から走査
    let parentTaskName = ""
    for (const taskId of Object.keys(SKILL_TASKS) as TaskId[]) {
      if (SKILL_TASKS[taskId].subTaskIds.includes(subId)) {
        parentTaskName = TASK_NAMES[taskId]
        break
      }
    }
    return { displayName, parentTaskName }
  }
  if (cardType === "task" && skillTaskId) {
    const taskId = skillTaskId as TaskId
    const name = TASK_NAMES[taskId] ?? skillTaskId
    return { displayName: name, parentTaskName: name }
  }
  return { displayName: "", parentTaskName: "" }
}

function findRecentPerformanceId(
  card: { cardType: CardType; skillTaskId: string | null; skillSubTaskId: string | null },
  performances: Array<{
    id: string
    pitchSkillScore: number | null
    rhythmSkillScore: number | null
    bowingSkillScore: number | null
    skillSubScores: Prisma.JsonValue
  }>,
): string | null {
  if (card.cardType === "sub_task" && card.skillSubTaskId) {
    const id = card.skillSubTaskId
    for (const p of performances) {
      const subScores = (p.skillSubScores ?? {}) as Record<string, SubScoreEntry>
      if (subScores[id]?.matched) return p.id
    }
    return null
  }
  if (card.cardType === "task" && card.skillTaskId) {
    const taskId = card.skillTaskId as TaskId
    for (const p of performances) {
      const score =
        taskId === "pitch"
          ? p.pitchSkillScore
          : taskId === "rhythm"
            ? p.rhythmSkillScore
            : p.bowingSkillScore
      if (typeof score === "number" && score < 60) return p.id
    }
    return null
  }
  return null
}

async function countRecommendations(
  card: { cardType: CardType; skillTaskId: string | null; skillSubTaskId: string | null },
  ctx: { grade: GradeLevel; achievedIds: string[] },
): Promise<number> {
  // skillSubTaskTags ?| array[...] 相当を Prisma で OR + array_contains
  let subTaskIds: string[] = []
  if (card.cardType === "sub_task" && card.skillSubTaskId) {
    subTaskIds = [card.skillSubTaskId]
  } else if (card.cardType === "task" && card.skillTaskId) {
    subTaskIds = [...SKILL_TASKS[card.skillTaskId as TaskId].subTaskIds]
  }
  if (subTaskIds.length === 0) return 0

  const [diffMin, diffMax] = GRADE_DIFFICULTY_RANGE[ctx.grade]
  return prisma.practiceItem.count({
    where: {
      isPublished: true,
      difficulty: { gte: diffMin, lte: diffMax },
      ...(ctx.achievedIds.length > 0 ? { id: { notIn: ctx.achievedIds } } : {}),
      OR: subTaskIds.map(id => ({ skillSubTaskTags: { array_contains: id } })),
    },
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId: urlUserId } = await params

  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  if (urlUserId !== auth.user.supabaseUser.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const dbUserId = auth.user.dbUser.id

  const sp = new URL(request.url).searchParams
  const statuses = parseStatuses(sp.get("status"))
  const cardType = parseCardType(sp.get("cardType"))
  const limit = parseLimit(sp.get("limit"))

  // F6: status 別に並び順を変える (UI 設計書 v3.1 §7-7 / §15-3)
  // - active     → createdAt 降順 (severity 列が UserSkillTaskCard に未保持のため代替、§15-3 で β以降 latestSeverity 検討)
  // - improving  → lastMatchedAt 降順 (近時に matched=true になったものを上位へ)
  // - cleared    → clearedAt 降順 (最近達成したものを上位へ)
  // 単一 status 指定でないクエリは status asc → createdAt desc にフォールバック。
  const isSingleStatus = statuses && statuses.length === 1
  const orderBy: Prisma.UserSkillTaskCardOrderByWithRelationInput[] = (() => {
    if (!isSingleStatus) {
      return [{ status: "asc" }, { createdAt: "desc" }]
    }
    switch (statuses[0]) {
      case "improving":
        return [{ lastMatchedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }]
      case "cleared":
        return [{ clearedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }]
      case "active":
      default:
        return [{ createdAt: "desc" }]
    }
  })()
  const cards = await prisma.userSkillTaskCard.findMany({
    where: {
      userId: dbUserId,
      ...(statuses ? { status: { in: statuses } } : {}),
      ...(cardType ? { cardType } : {}),
    },
    orderBy,
    take: limit,
    select: {
      id: true,
      cardType: true,
      skillTaskId: true,
      skillSubTaskId: true,
      status: true,
      createdAt: true,
      improvedAt: true,
      clearedAt: true,
      lastMatchedAt: true,
    },
  })

  if (cards.length === 0) {
    return NextResponse.json({ cards: [] })
  }

  // recentPerformanceId 用に直近 N 演奏を 1 度取得して使い回す
  const recentPerformances = await prisma.practicePerformance.findMany({
    where: { userId: dbUserId, analysisStatus: "done" },
    orderBy: { uploadedAt: "desc" },
    take: RECENT_PERF_SCAN_LIMIT,
    select: {
      id: true,
      pitchSkillScore: true,
      rhythmSkillScore: true,
      bowingSkillScore: true,
      skillSubScores: true,
    },
  })

  // recommendationCount 用に achievedIds + grade を 1 度取得
  const grade = await getCurrentGrade(prisma, dbUserId)
  const achievedIds = await getAchievedPracticeItemIds(prisma, dbUserId)

  const enriched = await Promise.all(
    cards.map(async card => {
      const cardTypeNarrowed = card.cardType as CardType
      const { displayName, parentTaskName } = getDisplayNames(
        cardTypeNarrowed,
        card.skillTaskId,
        card.skillSubTaskId,
      )
      const recentPerformanceId = findRecentPerformanceId(
        {
          cardType: cardTypeNarrowed,
          skillTaskId: card.skillTaskId,
          skillSubTaskId: card.skillSubTaskId,
        },
        recentPerformances,
      )
      const recommendationCount = await countRecommendations(
        {
          cardType: cardTypeNarrowed,
          skillTaskId: card.skillTaskId,
          skillSubTaskId: card.skillSubTaskId,
        },
        { grade, achievedIds },
      )

      return {
        id: card.id,
        cardType: card.cardType,
        skillTaskId: card.skillTaskId,
        skillSubTaskId: card.skillSubTaskId,
        status: card.status,
        createdAt: card.createdAt.toISOString(),
        improvedAt: card.improvedAt?.toISOString() ?? null,
        clearedAt: card.clearedAt?.toISOString() ?? null,
        lastMatchedAt: card.lastMatchedAt?.toISOString() ?? null,
        displayName,
        parentTaskName,
        recentPerformanceId,
        recommendationCount,
      }
    }),
  )

  return NextResponse.json({ cards: enriched })
}
