// app/_libs/recommendations.ts
//
// v3.2.2 §11 — 教材レコメンドの共有ロジック。
// Commit 4: GET /api/users/[userId]/recommendations/songs と
//           GET /api/skill-task-cards/[id]/recommendations/etudes が利用する。

import { Prisma, type PrismaClient } from "@/app/generated/prisma"
import {
  GRADE_DIFFICULTY_RANGE,
  SKILL_TASKS,
  SUB_TASK_NAMES,
  TASK_NAMES,
  type GradeLevel,
  type SubTaskId,
  type TaskId,
} from "./skillMaster"

type Tx = Prisma.TransactionClient | PrismaClient

const DEFAULT_LIMIT = 3

// =======================================================================
// 達成済み PracticeItem ID 取得 (UserGrade.progressData から)
// =======================================================================

type ProgressEntry = { completed: number; required: number; practiceItemIds: string[] }

export async function getAchievedPracticeItemIds(
  tx: Tx,
  userId: string,
): Promise<string[]> {
  const grade = await tx.userGrade.findUnique({
    where: { userId },
    select: { progressData: true },
  })
  if (!grade) return []

  const data = (grade.progressData ?? {}) as Record<string, Partial<ProgressEntry>>
  const out: string[] = []
  for (const entry of Object.values(data)) {
    if (Array.isArray(entry.practiceItemIds)) out.push(...entry.practiceItemIds)
  }
  return out
}

// =======================================================================
// グレード取得 (なければ BEGINNER 扱い)
// =======================================================================

export async function getCurrentGrade(tx: Tx, userId: string): Promise<GradeLevel> {
  const grade = await tx.userGrade.findUnique({
    where: { userId },
    select: { currentGrade: true },
  })
  return (grade?.currentGrade as GradeLevel | undefined) ?? "BEGINNER"
}

// =======================================================================
// PracticeItem 候補取得 (skillSubTaskTags の jsonb 配列に subTaskIds が
// いずれか含まれるものを、難易度範囲 + 未達成 + isPublished で絞る)
// =======================================================================

export type RecommendedPracticeItem = {
  id: string
  title: string
  category: string
  difficulty: number | null
  keyTonic: string
  keyMode: string
  composer: string | null
  descriptionShort: string | null
  originalXmlPath: string
}

type FindOpts = {
  userId: string
  subTaskIds: readonly string[] | null // null → タグ条件なし (グレード範囲のみ)
  grade: GradeLevel
  achievedIds: string[]
  limit: number
}

export async function findCandidatePracticeItems(
  tx: Tx,
  opts: FindOpts,
): Promise<RecommendedPracticeItem[]> {
  const [diffMin, diffMax] = GRADE_DIFFICULTY_RANGE[opts.grade]

  const tagFilter: Prisma.PracticeItemWhereInput | undefined =
    opts.subTaskIds && opts.subTaskIds.length > 0
      ? {
          OR: opts.subTaskIds.map(id => ({
            skillSubTaskTags: { array_contains: id },
          })),
        }
      : undefined

  const where: Prisma.PracticeItemWhereInput = {
    isPublished: true,
    difficulty: { gte: diffMin, lte: diffMax },
    ...(opts.achievedIds.length > 0
      ? { id: { notIn: opts.achievedIds } }
      : {}),
    ...(tagFilter ?? {}),
  }

  // §11-3: ORDER BY difficulty ASC, random()
  // Prisma に random() がないため、難易度別に取得→各群でシャッフル→平坦化→limit。
  const candidates = await tx.practiceItem.findMany({
    where,
    orderBy: { difficulty: "asc" },
    select: {
      id: true,
      title: true,
      category: true,
      difficulty: true,
      keyTonic: true,
      keyMode: true,
      composer: true,
      descriptionShort: true,
      originalXmlPath: true,
    },
  })

  // 同 difficulty 内でシャッフル
  const byDifficulty = new Map<number, RecommendedPracticeItem[]>()
  for (const c of candidates) {
    const d = c.difficulty ?? 0
    if (!byDifficulty.has(d)) byDifficulty.set(d, [])
    byDifficulty.get(d)!.push(c as RecommendedPracticeItem)
  }
  const sortedDiffs = [...byDifficulty.keys()].sort((a, b) => a - b)
  const result: RecommendedPracticeItem[] = []
  for (const d of sortedDiffs) {
    const group = byDifficulty.get(d)!
    // Fisher-Yates
    for (let i = group.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[group[i], group[j]] = [group[j], group[i]]
    }
    for (const c of group) {
      result.push(c)
      if (result.length >= opts.limit) return result
    }
  }
  return result
}

// =======================================================================
// レコメンド理由 (§11-4)
// =======================================================================

export function generateRecommendationReason(card: {
  cardType: string
  skillTaskId: string | null
  skillSubTaskId: string | null
} | null): string {
  if (!card) return "今のあなたにおすすめの練習です"
  if (card.cardType === "sub_task" && card.skillSubTaskId) {
    const name = SUB_TASK_NAMES[card.skillSubTaskId as SubTaskId] ?? card.skillSubTaskId
    return `「${name}」の改善におすすめの教材です`
  }
  if (card.cardType === "task" && card.skillTaskId) {
    const name = TASK_NAMES[card.skillTaskId as TaskId] ?? card.skillTaskId
    return `「${name}」全体の改善におすすめの教材です`
  }
  return "今のあなたにおすすめの練習です"
}

// =======================================================================
// カードに紐づく sub_task_id 配列を抽出
// =======================================================================

export function extractSubTaskIdsFromCard(card: {
  cardType: string
  skillTaskId: string | null
  skillSubTaskId: string | null
}): readonly SubTaskId[] | null {
  if (card.cardType === "sub_task" && card.skillSubTaskId) {
    return [card.skillSubTaskId as SubTaskId]
  }
  if (card.cardType === "task" && card.skillTaskId) {
    const taskId = card.skillTaskId as TaskId
    return SKILL_TASKS[taskId]?.subTaskIds ?? null
  }
  return null
}

// =======================================================================
// 制限値の正規化
// =======================================================================

export function parseLimit(raw: string | null): number {
  if (!raw) return DEFAULT_LIMIT
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 1) return DEFAULT_LIMIT
  return Math.min(Math.floor(n), 20)
}
