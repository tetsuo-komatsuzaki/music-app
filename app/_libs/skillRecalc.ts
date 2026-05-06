// app/_libs/skillRecalc.ts
//
// v3.2.2 §12 — 演奏削除後の累積データ再計算 4 関数。
// DELETE /api/practice-performances/[id] が transaction でラップして呼び出す。

import { Prisma } from "@/app/generated/prisma"
import { TASK_IDS, SUB_TASK_IDS, type SubTaskId } from "./skillMaster"

type Tx = Prisma.TransactionClient

const EMA_ALPHA = 0.3 // §12-4
const GRADE_THRESHOLD = 90 // §12-7 / §10
const RECENT_PERFORMANCES_FOR_CARD = 3 // §12-6

// =======================================================================
// §12-4: UserSkillScore 再計算 (EMA で時系列再構築)
// =======================================================================

export async function recalculateUserSkillScore(
  tx: Tx,
  userId: string,
): Promise<void> {
  // 3 中項目分のスコアを 1 度の SELECT で取得 (順序保持)
  const performances = await tx.practicePerformance.findMany({
    where: { userId, analysisStatus: "done" },
    orderBy: { uploadedAt: "asc" },
    select: {
      pitchSkillScore: true,
      rhythmSkillScore: true,
      bowingSkillScore: true,
    },
  })

  for (const taskId of TASK_IDS) {
    const scores = performances
      .map(p =>
        taskId === "pitch"
          ? p.pitchSkillScore
          : taskId === "rhythm"
            ? p.rhythmSkillScore
            : p.bowingSkillScore,
      )
      .filter((s): s is number => s != null)

    let currentScore = 0
    if (scores.length > 0) {
      currentScore = scores[0]
      for (let i = 1; i < scores.length; i++) {
        currentScore = currentScore * (1 - EMA_ALPHA) + scores[i] * EMA_ALPHA
      }
      currentScore = Math.round(currentScore * 10) / 10
    }

    await tx.userSkillScore.upsert({
      where: { userId_skillTaskId: { userId, skillTaskId: taskId } },
      create: {
        userId,
        skillTaskId: taskId,
        currentScore,
        sampleCount: scores.length,
      },
      update: {
        currentScore,
        sampleCount: scores.length,
        lastUpdatedAt: new Date(),
      },
    })
  }
}

// =======================================================================
// §12-5: UserSkillSubScore 再計算 (matched 比率)
// =======================================================================

type SubScoreEntry = {
  score?: number
  matched?: boolean
  target_count?: number
}

export async function recalculateUserSkillSubScore(
  tx: Tx,
  userId: string,
): Promise<void> {
  const performances = await tx.practicePerformance.findMany({
    where: {
      userId,
      analysisStatus: "done",
      skillSubScores: { not: Prisma.DbNull },
    },
    orderBy: { uploadedAt: "asc" },
    select: { uploadedAt: true, skillSubScores: true },
  })

  for (const subTaskId of SUB_TASK_IDS) {
    let matchedCount = 0
    let totalCount = 0
    let scoreSum = 0
    let lastMatchedAt: Date | null = null

    for (const p of performances) {
      const subScores = (p.skillSubScores ?? {}) as Record<string, SubScoreEntry>
      const sub = subScores[subTaskId] ?? {}
      const targetCount = typeof sub.target_count === "number" ? sub.target_count : 0
      if (targetCount === 0) continue // Q5: target=0 は除外

      totalCount++
      if (sub.matched) {
        matchedCount++
        scoreSum += typeof sub.score === "number" ? sub.score : 0
        lastMatchedAt = p.uploadedAt
      }
    }

    const matchRate = totalCount > 0 ? matchedCount / totalCount : 0
    const averageScore = matchedCount > 0 ? scoreSum / matchedCount : null

    await tx.userSkillSubScore.upsert({
      where: { userId_skillSubTaskId: { userId, skillSubTaskId: subTaskId } },
      create: {
        userId,
        skillSubTaskId: subTaskId,
        matchedCount,
        totalCount,
        matchRate,
        averageScore,
        lastMatchedAt,
      },
      update: {
        matchedCount,
        totalCount,
        matchRate,
        averageScore,
        lastMatchedAt,
        lastUpdatedAt: new Date(),
      },
    })
  }
}

// =======================================================================
// §12-6: UserSkillTaskCard 再評価 (active / improving 遷移)
// =======================================================================

export async function recalculateUserSkillTaskCards(
  tx: Tx,
  userId: string,
): Promise<void> {
  const cards = await tx.userSkillTaskCard.findMany({
    where: {
      userId,
      status: { in: ["active", "improving"] },
      cardType: "sub_task", // task カードは別ロジック (§9 / Commit 7)
    },
    select: { id: true, status: true, skillSubTaskId: true },
  })

  if (cards.length === 0) return

  // 直近 N 件の演奏を 1 度だけ取得して再利用
  const recentPerformances = await tx.practicePerformance.findMany({
    where: { userId, analysisStatus: "done" },
    orderBy: { uploadedAt: "desc" },
    take: RECENT_PERFORMANCES_FOR_CARD,
    select: { skillSubScores: true },
  })

  if (recentPerformances.length === 0) {
    // 演奏 0 件 → カード履歴ベース判定なし、現状維持
    return
  }

  for (const card of cards) {
    if (!card.skillSubTaskId) continue
    const subTaskId = card.skillSubTaskId as SubTaskId

    let recentMatched = 0
    for (const p of recentPerformances) {
      const subScores = (p.skillSubScores ?? {}) as Record<string, SubScoreEntry>
      const sub = subScores[subTaskId]
      if (sub?.matched) recentMatched++
    }

    if (recentMatched <= 1 && card.status !== "improving") {
      await tx.userSkillTaskCard.update({
        where: { id: card.id },
        data: { status: "improving", improvedAt: new Date() },
      })
    } else if (recentMatched >= 2 && card.status !== "active") {
      await tx.userSkillTaskCard.update({
        where: { id: card.id },
        data: { status: "active", improvedAt: null },
      })
    }
  }
}

// =======================================================================
// §12-7: UserGrade.progressData 再計算
// (永久保持原則 — currentGrade はダウングレードしない、§12-7 末尾)
// =======================================================================

const STRING_CHANGE_SUB_TASKS: SubTaskId[] = [
  "string_change_volume",
  "string_change_slur",
  "string_change_timing",
]

export async function recalculateUserGradeProgress(
  tx: Tx,
  userId: string,
): Promise<void> {
  const performances = await tx.practicePerformance.findMany({
    where: {
      userId,
      analysisStatus: "done",
      practiceItem: { difficulty: { not: null } }, // 致命1: difficulty NULL は除外
    },
    orderBy: { uploadedAt: "asc" },
    select: {
      practiceItemId: true,
      pitchSkillScore: true,
      rhythmSkillScore: true,
      bowingSkillScore: true,
      skillSubScores: true,
      practiceItem: { select: { difficulty: true } },
    },
  })

  type ProgressEntry = {
    completed: number
    required: number
    practiceItemIds: string[]
  }
  const newProgress: Record<string, ProgressEntry> = {}
  const seenItemsByDifficulty: Record<string, Set<string>> = {}

  for (const p of performances) {
    if (p.pitchSkillScore == null || p.pitchSkillScore < GRADE_THRESHOLD) continue
    if (p.rhythmSkillScore == null || p.rhythmSkillScore < GRADE_THRESHOLD) continue

    const subScores = (p.skillSubScores ?? {}) as Record<string, SubScoreEntry>
    const hasStringChange = STRING_CHANGE_SUB_TASKS.some(id => {
      const sub = subScores[id]
      return typeof sub?.target_count === "number" && sub.target_count > 0
    })

    if (hasStringChange) {
      // 高9: 弦移動を含む曲のみ bowing チェック
      if (p.bowingSkillScore == null || p.bowingSkillScore < GRADE_THRESHOLD) continue
    }

    const difficulty = p.practiceItem.difficulty
    if (difficulty == null) continue
    const dKey = String(difficulty)

    if (!newProgress[dKey]) {
      newProgress[dKey] = { completed: 0, required: 10, practiceItemIds: [] }
      seenItemsByDifficulty[dKey] = new Set()
    }
    if (!seenItemsByDifficulty[dKey].has(p.practiceItemId)) {
      seenItemsByDifficulty[dKey].add(p.practiceItemId)
      newProgress[dKey].practiceItemIds.push(p.practiceItemId)
      newProgress[dKey].completed = newProgress[dKey].practiceItemIds.length
    }
  }

  // upsert UserGrade.progressData (currentGrade はダウングレードしない、§12-7 末尾)
  await tx.userGrade.upsert({
    where: { userId },
    create: {
      userId,
      progressData: newProgress as Prisma.InputJsonValue,
    },
    update: {
      progressData: newProgress as Prisma.InputJsonValue,
      lastUpdatedAt: new Date(),
    },
  })
}

// =======================================================================
// オーケストレーション: 演奏削除後に呼ぶ 1 関数
// =======================================================================

export async function recalculateAllForUser(
  tx: Tx,
  userId: string,
): Promise<void> {
  await recalculateUserSkillScore(tx, userId)
  await recalculateUserSkillSubScore(tx, userId)
  await recalculateUserSkillTaskCards(tx, userId)
  await recalculateUserGradeProgress(tx, userId)
}
