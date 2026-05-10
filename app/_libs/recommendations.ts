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
// いずれか含まれるものを、難易度(★)範囲 + 未達成 + isPublished で絞る)
// v1.3: DB カラム difficulty → star にリネーム済み
// =======================================================================

export type RecommendedPracticeItem = {
  id: string
  title: string
  category: string
  star: number | null
  keyTonic: string
  keyMode: string
  composer: string | null
  descriptionShort: string | null
  originalXmlPath: string
}

// 「次のチャレンジ」レコメンド用 (PracticeItem + Score を統合)。
// Score は keyTonic/keyMode が nullable なので、unified type で nullable に。
// category は scale/arpeggio/etude/score の 4 値を取りうる。
export type RecommendedRecommendation = {
  id: string
  title: string
  category: string // scale | arpeggio | etude | score
  star: number | null
  keyTonic: string | null
  keyMode: string | null
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
  const [starMin, starMax] = GRADE_DIFFICULTY_RANGE[opts.grade]

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
    star: { gte: starMin, lte: starMax },
    ...(opts.achievedIds.length > 0
      ? { id: { notIn: opts.achievedIds } }
      : {}),
    ...(tagFilter ?? {}),
  }

  // §11-3: ORDER BY star ASC, random()
  // Prisma に random() がないため、★別に取得→各群でシャッフル→平坦化→limit。
  const candidates = await tx.practiceItem.findMany({
    where,
    orderBy: { star: "asc" },
    select: {
      id: true,
      title: true,
      category: true,
      star: true,
      keyTonic: true,
      keyMode: true,
      composer: true,
      descriptionShort: true,
      originalXmlPath: true,
    },
  })

  // 同 ★ 内でシャッフル
  const byStar = new Map<number, RecommendedPracticeItem[]>()
  for (const c of candidates) {
    const d = c.star ?? 0
    if (!byStar.has(d)) byStar.set(d, [])
    byStar.get(d)!.push(c as RecommendedPracticeItem)
  }
  const sortedStars = [...byStar.keys()].sort((a, b) => a - b)
  const result: RecommendedPracticeItem[] = []
  for (const d of sortedStars) {
    const group = byStar.get(d)!
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
// 「次のチャレンジ」レコメンド (PracticeItem + Score 統合)
// =======================================================================
//
// 用途: ホーム画面の「次のチャレンジ」セクション (ユーザーが次に取り組む曲を選ぶ)。
// findCandidatePracticeItems と異なり、Score (曲) も対象に含める。
//
// Score 側のフィルタ条件:
//   - deletedAt IS NULL (論理削除されていない)
//   - isShared = true (admin 共有サンプルのみ。ユーザーの自由曲は除外)
//   - star 範囲 + skillSubTaskTags の重なり
//
// achievedIds は PracticeItem 由来の進捗 (UserGrade.progressData) なので、
// Score には適用しない。

export async function findCandidateRecommendations(
  tx: Tx,
  opts: FindOpts,
): Promise<RecommendedRecommendation[]> {
  const [starMin, starMax] = GRADE_DIFFICULTY_RANGE[opts.grade]

  const tagOR =
    opts.subTaskIds && opts.subTaskIds.length > 0
      ? opts.subTaskIds.map(id => ({
          skillSubTaskTags: { array_contains: id },
        }))
      : null

  const practiceWhere: Prisma.PracticeItemWhereInput = {
    isPublished: true,
    star: { gte: starMin, lte: starMax },
    ...(opts.achievedIds.length > 0
      ? { id: { notIn: opts.achievedIds } }
      : {}),
    ...(tagOR ? { OR: tagOR } : {}),
  }

  const scoreWhere: Prisma.ScoreWhereInput = {
    deletedAt: null,
    isShared: true,
    star: { gte: starMin, lte: starMax },
    ...(tagOR ? { OR: tagOR } : {}),
  }

  const [practiceCandidates, scoreCandidates] = await Promise.all([
    tx.practiceItem.findMany({
      where: practiceWhere,
      orderBy: { star: "asc" },
      select: {
        id: true,
        title: true,
        category: true,
        star: true,
        keyTonic: true,
        keyMode: true,
        composer: true,
        descriptionShort: true,
        originalXmlPath: true,
      },
    }),
    tx.score.findMany({
      where: scoreWhere,
      orderBy: { star: "asc" },
      select: {
        id: true,
        title: true,
        composer: true,
        keyTonic: true,
        keyMode: true,
        originalXmlPath: true,
        star: true,
      },
    }),
  ])

  const all: RecommendedRecommendation[] = [
    ...practiceCandidates.map(p => ({
      id: p.id,
      title: p.title,
      category: p.category as string,
      star: p.star,
      keyTonic: p.keyTonic as string | null,
      keyMode: p.keyMode as string | null,
      composer: p.composer,
      descriptionShort: p.descriptionShort,
      originalXmlPath: p.originalXmlPath,
    })),
    ...scoreCandidates.map(s => ({
      id: s.id,
      title: s.title,
      category: "score",
      star: s.star,
      keyTonic: s.keyTonic,
      keyMode: s.keyMode,
      composer: s.composer,
      descriptionShort: null,
      originalXmlPath: s.originalXmlPath,
    })),
  ]

  // 同 ★ 内でシャッフル + limit (findCandidatePracticeItems と同じパターン)
  const byStar = new Map<number, RecommendedRecommendation[]>()
  for (const c of all) {
    const d = c.star ?? 0
    if (!byStar.has(d)) byStar.set(d, [])
    byStar.get(d)!.push(c)
  }
  const sortedStars = [...byStar.keys()].sort((a, b) => a - b)
  const result: RecommendedRecommendation[] = []
  for (const d of sortedStars) {
    const group = byStar.get(d)!
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
