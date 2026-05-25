// app/_libs/skillRecalc.ts
//
// v3.2.2 §12 — 演奏削除後の累積データ再計算 4 関数。
// DELETE /api/practice-performances/[id] / /api/score-performances/[id] が
// transaction でラップして呼び出す。
//
// v1.6 Phase 5 (2026-05-18): skill 指標 (UserSkillScore / UserSkillSubScore /
// UserSkillTaskCard) を PracticePerformance + Performance (Score 演奏) 合算に拡張。
// skill = 練習形態によらない普遍的技術指標なので Practice/Score を 1 本化する
// (Grade = UserGrade.progressData は楽曲完成度 vs 技術習得度で性質が違うため
//  practice 専用据置 = Phase 3c の分離思想を維持)。
// 集計式は「ノート数 (evaluatedNotes) 加重平均」: Σ(score×notes)/Σ(notes)。
// 順序非依存なので Python 側 (loop_engine_runner.py) の演奏完了時更新と
// 同一結果に収束する (旧 EMA は順序依存で二重ライター不整合の温床だった)。

import { Prisma } from "@/app/generated/prisma"
import { TASK_IDS, SUB_TASK_IDS, type SubTaskId } from "./skillMaster"

type Tx = Prisma.TransactionClient

const GRADE_THRESHOLD = 90 // §12-7 / §10
const RECENT_PERFORMANCES_FOR_CARD = 3 // §12-6

// evaluatedNotes が null / 0 の演奏はノート数不明 → 重み 1 (1 サンプル相当) で扱う
function noteWeight(evaluatedNotes: number | null): number {
  return evaluatedNotes != null && evaluatedNotes > 0 ? evaluatedNotes : 1
}

// =======================================================================
// §12-4: UserSkillScore 再計算 (EMA で時系列再構築)
// =======================================================================

type SkillRow = {
  pitchSkillScore: number | null
  rhythmSkillScore: number | null
  bowingSkillScore: number | null
  evaluatedNotes: number | null
}

export async function recalculateUserSkillScore(
  tx: Tx,
  userId: string,
): Promise<void> {
  // Phase 5: Practice + Score 両方を合算 (skill は普遍指標)
  const [practice, score] = await Promise.all([
    tx.practicePerformance.findMany({
      where: { userId, analysisStatus: "done" },
      select: {
        pitchSkillScore: true,
        rhythmSkillScore: true,
        bowingSkillScore: true,
        evaluatedNotes: true,
      },
    }),
    tx.performance.findMany({
      where: { userId, analysisStatus: "done" },
      select: {
        pitchSkillScore: true,
        rhythmSkillScore: true,
        bowingSkillScore: true,
        evaluatedNotes: true,
      },
    }),
  ])
  const performances: SkillRow[] = [...practice, ...score]

  for (const taskId of TASK_IDS) {
    // ノート数加重平均: Σ(score×notes)/Σ(notes)。順序非依存。
    let weightedSum = 0
    let weightTotal = 0
    let sampleCount = 0
    for (const p of performances) {
      const s =
        taskId === "pitch"
          ? p.pitchSkillScore
          : taskId === "rhythm"
            ? p.rhythmSkillScore
            : p.bowingSkillScore
      if (s == null) continue
      const w = noteWeight(p.evaluatedNotes)
      weightedSum += s * w
      weightTotal += w
      sampleCount += 1
    }

    const currentScore =
      weightTotal > 0 ? Math.round((weightedSum / weightTotal) * 10) / 10 : 0

    await tx.userSkillScore.upsert({
      where: { userId_skillTaskId: { userId, skillTaskId: taskId } },
      create: {
        userId,
        skillTaskId: taskId,
        currentScore,
        sampleCount,
      },
      update: {
        currentScore,
        sampleCount,
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
  // Phase 5: Practice + Score 合算。lastMatchedAt のため uploadedAt 昇順整列。
  const [practice, score] = await Promise.all([
    tx.practicePerformance.findMany({
      where: {
        userId,
        analysisStatus: "done",
        skillSubScores: { not: Prisma.DbNull },
      },
      select: { uploadedAt: true, skillSubScores: true },
    }),
    tx.performance.findMany({
      where: {
        userId,
        analysisStatus: "done",
        skillSubScores: { not: Prisma.DbNull },
      },
      select: { uploadedAt: true, skillSubScores: true },
    }),
  ])
  const performances = [...practice, ...score].sort(
    (a, b) => a.uploadedAt.getTime() - b.uploadedAt.getTime(),
  )

  for (const subTaskId of SUB_TASK_IDS) {
    let matchedCount = 0
    let totalCount = 0
    // averageScore は target_count (当該 sub-task の対象ノート数) 加重平均
    let weightedScoreSum = 0
    let weightTotal = 0
    let lastMatchedAt: Date | null = null

    for (const p of performances) {
      const subScores = (p.skillSubScores ?? {}) as Record<string, SubScoreEntry>
      const sub = subScores[subTaskId] ?? {}
      const targetCount = typeof sub.target_count === "number" ? sub.target_count : 0
      if (targetCount === 0) continue // Q5: target=0 は除外

      totalCount++
      if (sub.matched) {
        matchedCount++
        const sc = typeof sub.score === "number" ? sub.score : 0
        weightedScoreSum += sc * targetCount
        weightTotal += targetCount
        lastMatchedAt = p.uploadedAt
      }
    }

    const matchRate = totalCount > 0 ? matchedCount / totalCount : 0
    const averageScore = weightTotal > 0 ? weightedScoreSum / weightTotal : null

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

  // Phase 5: Practice + Score 合算の直近 N 件 (uploadedAt 降順マージ)
  const [recentPractice, recentScore] = await Promise.all([
    tx.practicePerformance.findMany({
      where: { userId, analysisStatus: "done" },
      orderBy: { uploadedAt: "desc" },
      take: RECENT_PERFORMANCES_FOR_CARD,
      select: { uploadedAt: true, skillSubScores: true },
    }),
    tx.performance.findMany({
      where: { userId, analysisStatus: "done" },
      orderBy: { uploadedAt: "desc" },
      take: RECENT_PERFORMANCES_FOR_CARD,
      select: { uploadedAt: true, skillSubScores: true },
    }),
  ])
  const recentPerformances = [...recentPractice, ...recentScore]
    .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
    .slice(0, RECENT_PERFORMANCES_FOR_CARD)

  if (recentPerformances.length < RECENT_PERFORMANCES_FOR_CARD) {
    // 3 件未満 → §12-6 の「直近 3 回」前提が成立しないため判定保留
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
//
// Phase 5 注記: ここは Score を UNION しない (practice 専用据置)。
// 理由: (1) Score に practiceItem.star がない (2) Score のグレード進捗は
// Phase 3c UserGradeProgress が別系統で担う (Q1=B 分離思想) (3) Phase 4-2 で
// home/Progress は UserGradeProgress に切替済、legacy UserGrade は旧 API のみ。
// skill (普遍指標) は合算、Grade (楽曲完成度系) は分離 — が Phase 5 の設計境界。
// =======================================================================

// 個別課題 v1 (2026-05-25): 旧 string_change_{volume,slur,timing} を新スキームの
// 移弦 6 ペア (bowing_string_change_*) に置換。意味は同じ「演奏に弦移動が含まれるか」。
const STRING_CHANGE_SUB_TASKS: SubTaskId[] = [
  "bowing_string_change_g_to_d",
  "bowing_string_change_d_to_g",
  "bowing_string_change_d_to_a",
  "bowing_string_change_a_to_d",
  "bowing_string_change_a_to_e",
  "bowing_string_change_e_to_a",
]

export async function recalculateUserGradeProgress(
  tx: Tx,
  userId: string,
): Promise<void> {
  const performances = await tx.practicePerformance.findMany({
    where: {
      userId,
      analysisStatus: "done",
      practiceItem: { star: { not: null } }, // 致命1: ★ NULL は除外 (旧名 difficulty、v1.3 で rename)
    },
    orderBy: { uploadedAt: "asc" },
    select: {
      practiceItemId: true,
      pitchSkillScore: true,
      rhythmSkillScore: true,
      bowingSkillScore: true,
      skillSubScores: true,
      practiceItem: { select: { star: true } },
    },
  })

  type ProgressEntry = {
    completed: number
    required: number
    practiceItemIds: string[]
  }
  const newProgress: Record<string, ProgressEntry> = {}
  const seenItemsByStar: Record<string, Set<string>> = {}

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

    const star = p.practiceItem.star
    if (star == null) continue
    const dKey = String(star)

    if (!newProgress[dKey]) {
      newProgress[dKey] = { completed: 0, required: 10, practiceItemIds: [] }
      seenItemsByStar[dKey] = new Set()
    }
    if (!seenItemsByStar[dKey].has(p.practiceItemId)) {
      seenItemsByStar[dKey].add(p.practiceItemId)
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
