// app/_libs/skillProgressUpdater.ts
//
// v3.2.2 §7-4 / §9-2 / §9-3 / §9-5 / §10-2 / §10-4 — 演奏完了時の累積データ更新。
//
// エントリポイント: processPerformanceCompletion(prisma, performanceId)
//   Cloud Run callback / 完了 webhook が score_full の result.json を DB に
//   書き込んだ後 (analysisStatus="done" + scores + skillSubScores) にこの関数を呼ぶ。
//   全体を 1 transaction でラップする。

import { Prisma, type PrismaClient } from "@/app/generated/prisma"
import {
  GRADE_LEVELS,
  SUB_TASK_IDS,
  TASK_IDS,
  type GradeLevel,
  type SubTaskId,
  type TaskId,
} from "./skillMaster"

type Tx = Prisma.TransactionClient

const EMA_ALPHA = 0.3 // §7-4
const SUB_TASK_SCORE_THRESHOLD = 90 // §10-2
const TASK_SCORE_TASK_CARD_THRESHOLD = 60 // §9-2
const RECENT_PERFORMANCES_FOR_IMPROVING = 3 // §9-2

const GRADE_BANDS: Record<GradeLevel, number[]> = {
  BEGINNER: [1, 2, 3], // → INTERMEDIATE
  INTERMEDIATE: [4, 5, 6, 7], // → ADVANCED
  ADVANCED: [8, 9, 10], // → MASTER
  MASTER: [], // 上位なし
}

const TX_TIMEOUT_MS = 30_000

// =======================================================================
// 内部型: skillSubScores の最小エントリ
// =======================================================================

type SubScoreEntry = {
  score?: number
  matched?: boolean
  target_count?: number
}

// =======================================================================
// §7-4: UserSkillScore 増分更新 (EMA)
// =======================================================================

export async function updateUserSkillScore(
  tx: Tx,
  userId: string,
  taskId: TaskId,
  newScore: number,
): Promise<void> {
  const existing = await tx.userSkillScore.findUnique({
    where: { userId_skillTaskId: { userId, skillTaskId: taskId } },
    select: { currentScore: true, sampleCount: true },
  })

  const sampleCount = (existing?.sampleCount ?? 0) + 1
  const currentScore =
    existing == null || existing.sampleCount === 0
      ? newScore
      : existing.currentScore * (1 - EMA_ALPHA) + newScore * EMA_ALPHA

  const rounded = Math.round(currentScore * 10) / 10

  await tx.userSkillScore.upsert({
    where: { userId_skillTaskId: { userId, skillTaskId: taskId } },
    create: { userId, skillTaskId: taskId, currentScore: rounded, sampleCount },
    update: { currentScore: rounded, sampleCount, lastUpdatedAt: new Date() },
  })
}

// =======================================================================
// §9-5: UserSkillSubScore 増分更新 (matched 比率と平均スコア)
// =======================================================================

export async function updateUserSkillSubScore(
  tx: Tx,
  userId: string,
  subTaskId: SubTaskId,
  result: { score: number; matched: boolean; target_count: number },
): Promise<void> {
  // Q5: target_count = 0 の sub_task は集計除外 (§9-5)
  if (result.target_count === 0) return

  const existing = await tx.userSkillSubScore.findUnique({
    where: { userId_skillSubTaskId: { userId, skillSubTaskId: subTaskId } },
    select: { matchedCount: true, totalCount: true, averageScore: true },
  })

  const totalCount = (existing?.totalCount ?? 0) + 1
  const matchedCount = (existing?.matchedCount ?? 0) + (result.matched ? 1 : 0)
  const matchRate = matchedCount > 0 ? matchedCount / totalCount : 0

  let averageScore: number | null = existing?.averageScore ?? null
  if (result.matched) {
    if (averageScore === null) {
      averageScore = result.score
    } else {
      // 単純移動平均 (matched=true の累積)
      averageScore =
        (averageScore * (matchedCount - 1) + result.score) / matchedCount
    }
  }

  const lastMatchedAt = result.matched ? new Date() : undefined

  await tx.userSkillSubScore.upsert({
    where: { userId_skillSubTaskId: { userId, skillSubTaskId: subTaskId } },
    create: {
      userId,
      skillSubTaskId: subTaskId,
      matchedCount,
      totalCount,
      matchRate,
      averageScore,
      lastMatchedAt: lastMatchedAt ?? null,
    },
    update: {
      matchedCount,
      totalCount,
      matchRate,
      averageScore,
      ...(lastMatchedAt ? { lastMatchedAt } : {}),
      lastUpdatedAt: new Date(),
    },
  })
}

// =======================================================================
// §9-2 / §9-3: カードの発生・遷移
// =======================================================================

async function createOrReactivateSubTaskCard(
  tx: Tx,
  userId: string,
  subTaskId: SubTaskId,
): Promise<void> {
  const now = new Date()
  // skillTaskId が NULL のため compound unique では引けず、findFirst を使う
  const existing = await tx.userSkillTaskCard.findFirst({
    where: {
      userId,
      cardType: "sub_task",
      skillTaskId: null,
      skillSubTaskId: subTaskId,
    },
    select: { id: true, status: true },
  })

  if (!existing) {
    await tx.userSkillTaskCard.create({
      data: {
        userId,
        cardType: "sub_task",
        skillSubTaskId: subTaskId,
        status: "active",
        lastMatchedAt: now,
      },
    })
    return
  }

  if (existing.status === "improving") {
    await tx.userSkillTaskCard.update({
      where: { id: existing.id },
      data: { status: "active", lastMatchedAt: now, improvedAt: null },
    })
    return
  }

  if (existing.status === "active") {
    await tx.userSkillTaskCard.update({
      where: { id: existing.id },
      data: { lastMatchedAt: now },
    })
    return
  }

  // cleared → 過去の達成は維持 (§9-2)
}

async function createOrReactivateTaskCard(
  tx: Tx,
  userId: string,
  taskId: TaskId,
): Promise<void> {
  const now = new Date()
  const existing = await tx.userSkillTaskCard.findFirst({
    where: {
      userId,
      cardType: "task",
      skillTaskId: taskId,
      skillSubTaskId: null,
    },
    select: { id: true, status: true },
  })

  if (!existing) {
    await tx.userSkillTaskCard.create({
      data: {
        userId,
        cardType: "task",
        skillTaskId: taskId,
        status: "active",
        lastMatchedAt: now,
      },
    })
    return
  }

  if (existing.status === "improving") {
    await tx.userSkillTaskCard.update({
      where: { id: existing.id },
      data: { status: "active", lastMatchedAt: now, improvedAt: null },
    })
    return
  }

  if (existing.status === "active") {
    await tx.userSkillTaskCard.update({
      where: { id: existing.id },
      data: { lastMatchedAt: now },
    })
  }
  // cleared は維持
}

// improving 判定: active sub_task カードを直近 N 演奏の matched 履歴で再評価
async function checkImprovingForUser(tx: Tx, userId: string): Promise<void> {
  const activeCards = await tx.userSkillTaskCard.findMany({
    where: { userId, status: "active", cardType: "sub_task" },
    select: { id: true, skillSubTaskId: true },
  })
  if (activeCards.length === 0) return

  const recentPerformances = await tx.practicePerformance.findMany({
    where: { userId, analysisStatus: "done" },
    orderBy: { uploadedAt: "desc" },
    take: RECENT_PERFORMANCES_FOR_IMPROVING,
    select: { skillSubScores: true },
  })

  for (const card of activeCards) {
    if (!card.skillSubTaskId) continue
    let matched = 0
    for (const p of recentPerformances) {
      const subScores = (p.skillSubScores ?? {}) as Record<string, SubScoreEntry>
      if (subScores[card.skillSubTaskId]?.matched) matched++
    }
    if (matched <= 1) {
      await tx.userSkillTaskCard.update({
        where: { id: card.id },
        data: { status: "improving", improvedAt: new Date() },
      })
    }
  }
}

export async function processCardsOnPerformanceComplete(
  tx: Tx,
  userId: string,
  subTaskResults: Record<SubTaskId, { matched: boolean }>,
  skillScores: Partial<Record<TaskId, number | null>>,
): Promise<void> {
  // sub_task カード (matched=true で active 化 / 復活)
  for (const subTaskId of SUB_TASK_IDS) {
    const r = subTaskResults[subTaskId]
    if (r?.matched) {
      await createOrReactivateSubTaskCard(tx, userId, subTaskId)
    }
  }

  // task カード (中項目スコア < 60 で active 化 / 復活)
  for (const taskId of TASK_IDS) {
    const score = skillScores[taskId]
    if (typeof score === "number" && score < TASK_SCORE_TASK_CARD_THRESHOLD) {
      await createOrReactivateTaskCard(tx, userId, taskId)
    }
  }

  // active sub_task カードの improving 判定
  await checkImprovingForUser(tx, userId)
}

// =======================================================================
// §10-2 / §10-4: グレード進捗更新 + グレードアップ判定
// =======================================================================

function isEligibleForGradeProgress(perf: {
  pitchSkillScore: number | null
  rhythmSkillScore: number | null
  bowingSkillScore: number | null
}): boolean {
  if (perf.pitchSkillScore == null || perf.pitchSkillScore < SUB_TASK_SCORE_THRESHOLD) return false
  if (perf.rhythmSkillScore == null || perf.rhythmSkillScore < SUB_TASK_SCORE_THRESHOLD) return false
  // bowingSkillScore is null → 弦移動なし曲、チェックスキップ (v3.2 簡素化)
  if (perf.bowingSkillScore != null && perf.bowingSkillScore < SUB_TASK_SCORE_THRESHOLD) return false
  return true
}

type ProgressEntry = { completed: number; required: number; practiceItemIds: string[] }

export type GradeChangeResult = {
  changed: boolean
  previousGrade?: GradeLevel
  newGrade?: GradeLevel
}

export async function updateUserGradeProgress(
  tx: Tx,
  userId: string,
  performance: {
    practiceItemId: string
    pitchSkillScore: number | null
    rhythmSkillScore: number | null
    bowingSkillScore: number | null
    practiceItem: { difficulty: number | null }
  },
): Promise<GradeChangeResult> {
  if (!isEligibleForGradeProgress(performance)) return { changed: false }
  const difficulty = performance.practiceItem.difficulty
  if (difficulty == null) return { changed: false } // 致命1

  // upsert で UserGrade 取得 (なければ BEGINNER で作成)
  const userGrade = await tx.userGrade.upsert({
    where: { userId },
    create: { userId, progressData: {} },
    update: {},
    select: { id: true, currentGrade: true, progressData: true, achievedAt: true },
  })

  const progress = (userGrade.progressData ?? {}) as Record<string, ProgressEntry>
  const dKey = String(difficulty)
  if (!progress[dKey]) {
    progress[dKey] = { completed: 0, required: 10, practiceItemIds: [] }
  }
  if (progress[dKey].practiceItemIds.includes(performance.practiceItemId)) {
    // 既達成 — progressData 自体は不変、grade-up 判定不要
    return { changed: false }
  }
  progress[dKey].practiceItemIds.push(performance.practiceItemId)
  progress[dKey].completed = progress[dKey].practiceItemIds.length

  // グレードアップ判定
  const currentGrade = userGrade.currentGrade as GradeLevel
  const newGrade = checkGradeUp(progress, currentGrade)
  const gradeChanged = newGrade !== currentGrade

  await tx.userGrade.update({
    where: { id: userGrade.id },
    data: {
      progressData: progress as Prisma.InputJsonValue,
      lastUpdatedAt: new Date(),
      ...(gradeChanged ? { currentGrade: newGrade, achievedAt: new Date() } : {}),
    },
  })

  return gradeChanged
    ? { changed: true, previousGrade: currentGrade, newGrade }
    : { changed: false }
}

function checkGradeUp(
  progress: Record<string, ProgressEntry>,
  current: GradeLevel,
): GradeLevel {
  const order = GRADE_LEVELS as readonly GradeLevel[]
  let achieved: GradeLevel = current
  for (let i = order.indexOf(current); i < order.length - 1; i++) {
    const band = GRADE_BANDS[order[i]]
    if (band.length === 0) break
    const allDone = band.every(
      d => (progress[String(d)]?.completed ?? 0) >= 10,
    )
    if (!allDone) break
    achieved = order[i + 1]
  }
  return achieved
}

// =======================================================================
// エントリポイント: processPerformanceCompletion
// =======================================================================

export async function processPerformanceCompletion(
  prisma: PrismaClient,
  performanceId: string,
): Promise<{
  performanceId: string
  userId: string
  gradeUpdate: GradeChangeResult
}> {
  const perf = await prisma.practicePerformance.findUnique({
    where: { id: performanceId },
    select: {
      id: true,
      userId: true,
      practiceItemId: true,
      analysisStatus: true,
      pitchSkillScore: true,
      rhythmSkillScore: true,
      bowingSkillScore: true,
      skillSubScores: true,
      practiceItem: { select: { difficulty: true } },
    },
  })
  if (!perf) {
    throw new Error(`PracticePerformance not found: ${performanceId}`)
  }
  if (perf.analysisStatus !== "done") {
    throw new Error(
      `PracticePerformance ${performanceId} is not in 'done' state (got '${perf.analysisStatus}')`,
    )
  }

  const subScores = (perf.skillSubScores ?? {}) as Record<string, SubScoreEntry>

  // sub_task 結果を構築 (target_count > 0 のみ updateUserSkillSubScore に渡す)
  const subTaskResults: Record<SubTaskId, { matched: boolean }> = {} as never
  for (const id of SUB_TASK_IDS) {
    subTaskResults[id] = { matched: !!subScores[id]?.matched }
  }

  const skillScores: Partial<Record<TaskId, number | null>> = {
    pitch: perf.pitchSkillScore,
    rhythm: perf.rhythmSkillScore,
    bowing: perf.bowingSkillScore,
  }

  const gradeUpdate = await prisma.$transaction(
    async tx => {
      // 1. UserSkillScore (3 task)
      for (const taskId of TASK_IDS) {
        const s = skillScores[taskId]
        if (typeof s === "number") {
          await updateUserSkillScore(tx, perf.userId, taskId, s)
        }
      }
      // 2. UserSkillSubScore (9 sub_task、target=0 はスキップ)
      for (const subTaskId of SUB_TASK_IDS) {
        const sub = subScores[subTaskId]
        if (!sub) continue
        await updateUserSkillSubScore(tx, perf.userId, subTaskId, {
          score: typeof sub.score === "number" ? sub.score : 0,
          matched: !!sub.matched,
          target_count: typeof sub.target_count === "number" ? sub.target_count : 0,
        })
      }
      // 3. カード発生 / improving 遷移
      await processCardsOnPerformanceComplete(
        tx,
        perf.userId,
        subTaskResults,
        skillScores,
      )
      // 4. グレード進捗更新 + grade-up
      return updateUserGradeProgress(tx, perf.userId, perf)
    },
    { timeout: TX_TIMEOUT_MS },
  )

  return { performanceId: perf.id, userId: perf.userId, gradeUpdate }
}
