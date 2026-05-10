import { prisma } from "@/app/_libs/prisma"
import { generateArcoMessage } from "@/app/_libs/arcoChan"
import { formatKey } from "@/app/_libs/musicNotation"
import {
  extractSubTaskIdsFromCard,
  findCandidateRecommendations,
  generateRecommendationReason,
} from "@/app/_libs/recommendations"
import {
  GRADE_LEVELS,
  type GradeLevel,
} from "@/app/_libs/skillMaster"
import HomeClient from "./home"

// UI-8: ホーム画面のグレード表示用に、grade API と同じ形でサーバ側で構築。
// (Server Components で取得 → props 渡し)
const NEXT_GRADE_BAND: Record<GradeLevel, { next: GradeLevel | null; difficulties: number[] }> = {
  BEGINNER: { next: "INTERMEDIATE", difficulties: [1, 2, 3] },
  INTERMEDIATE: { next: "ADVANCED", difficulties: [4, 5, 6, 7] },
  ADVANCED: { next: "MASTER", difficulties: [8, 9, 10] },
  MASTER: { next: null, difficulties: [] },
}

const isGradeLevel = (v: unknown): v is GradeLevel =>
  typeof v === "string" && (GRADE_LEVELS as readonly string[]).includes(v)

export const metadata = { title: "ホーム" }

type PageProps = {
  params: Promise<{ userId: string }>
}

// JST での "YYYY-MM-DD" 文字列を返す
function toJSTDateStr(date: Date): string {
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  return jst.toISOString().split("T")[0]
}

// 連続練習日数（JST）を計算する
function calculateStreak(dates: Date[]): number {
  const uniqueDays = [...new Set(dates.map(toJSTDateStr))].sort().reverse()
  if (uniqueDays.length === 0) return 0

  const todayStr = toJSTDateStr(new Date())
  const yesterdayStr = toJSTDateStr(new Date(Date.now() - 86400000))

  let start: string
  if (uniqueDays[0] === todayStr) {
    start = todayStr
  } else if (uniqueDays[0] === yesterdayStr) {
    start = yesterdayStr
  } else {
    return 0
  }

  let streak = 0
  for (let i = 0; i < uniqueDays.length; i++) {
    const expected = toJSTDateStr(
      new Date(new Date(start + "T00:00:00+09:00").getTime() - i * 86400000)
    )
    if (uniqueDays[i] === expected) {
      streak++
    } else {
      break
    }
  }
  return streak
}

export default async function HomePage({ params }: PageProps) {
  const { userId } = await params

  const perfStart = performance.now()

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: userId },
    select: { id: true, name: true },
  })
  if (!dbUser) return <div>User not found</div>
  console.log(`[PERF] home step1_dbUser: ${(performance.now() - perfStart).toFixed(0)}ms`)

  const internalUserId = dbUser.id

  // 今週の月曜日
  const now = new Date()
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay()
  const weekStart = new Date(now.getTime() - (dayOfWeek - 1) * 86400000)
  weekStart.setHours(0, 0, 0, 0)

  // ストリーク用（直近90日のみ取得）
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400_000)

  const perfStep2 = performance.now()
  // ── 全データを並列一括取得 ──
  const [
    practiceUploads,
    scoreUploads,
    latestPracticePerf,
    latestScorePerf,
    latestTwoScores,        // アルコちゃん改善検出用 (直近2件の overallScore)
    recentPracticeHistory,
    recentScoreHistory,
    userGrade,              // UI-8: グレード表示用
    activeCard,             // UI-9: レコメンド用 active カード (§11-3)
  ] = await Promise.all([
    // ストリーク用（90日以内のみ）
    prisma.practicePerformance.findMany({
      where: { userId: internalUserId, uploadedAt: { gte: ninetyDaysAgo } },
      select: { uploadedAt: true },
      orderBy: { uploadedAt: "desc" },
    }),
    prisma.performance.findMany({
      where: { userId: internalUserId, uploadedAt: { gte: ninetyDaysAgo } },
      select: { uploadedAt: true },
      orderBy: { uploadedAt: "desc" },
    }),
    // Continue バー用 (最新練習記録)
    prisma.practicePerformance.findFirst({
      where: { userId: internalUserId },
      orderBy: { uploadedAt: "desc" },
      select: {
        uploadedAt: true,
        practiceItemId: true,
        practiceItem: { select: { id: true, title: true, category: true } },
      },
    }),
    prisma.performance.findFirst({
      where: { userId: internalUserId, score: { deletedAt: null } },
      orderBy: { uploadedAt: "desc" },
      select: {
        uploadedAt: true,
        scoreId: true,
        score: { select: { id: true, title: true, keyTonic: true, keyMode: true } },
      },
    }),
    // アルコちゃんの改善検出用 (直近 2 件、score 演奏のみ)
    prisma.performance.findMany({
      where: { userId: internalUserId, overallScore: { not: null } },
      orderBy: { uploadedAt: "desc" },
      take: 2,
      select: { overallScore: true },
    }),
    // 直近の練習履歴
    prisma.practicePerformance.findMany({
      where: { userId: internalUserId },
      orderBy: { uploadedAt: "desc" },
      take: 3,
      select: {
        uploadedAt: true,
        practiceItem: { select: { title: true, category: true, id: true } },
      },
    }),
    prisma.performance.findMany({
      where: { userId: internalUserId, score: { deletedAt: null } },
      orderBy: { uploadedAt: "desc" },
      take: 3,
      select: {
        uploadedAt: true,
        score: { select: { title: true, id: true, keyTonic: true, keyMode: true } },
      },
    }),
    // UI-8: グレード表示
    prisma.userGrade.findUnique({
      where: { userId: internalUserId },
      select: { currentGrade: true, achievedAt: true, progressData: true },
    }),
    // UI-9 (§11-3): 最も古い active カード (レコメンド主軸)
    prisma.userSkillTaskCard.findFirst({
      where: { userId: internalUserId, status: "active" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        cardType: true,
        skillTaskId: true,
        skillSubTaskId: true,
      },
    }),
  ])
  console.log(`[PERF] home step2_parallel: ${(performance.now() - perfStep2).toFixed(0)}ms`)

  // --- ストリーク ---
  const allUploadDates = [
    ...practiceUploads.map(p => p.uploadedAt),
    ...scoreUploads.map(p => p.uploadedAt),
  ].filter(Boolean) as Date[]

  const streak = calculateStreak(allUploadDates)

  // --- 今週の練習日数 ---
  const weeklyDays = new Set([
    ...practiceUploads
      .filter(p => p.uploadedAt >= weekStart)
      .map(p => toJSTDateStr(p.uploadedAt)),
    ...scoreUploads
      .filter(p => p.uploadedAt >= weekStart)
      .map(p => toJSTDateStr(p.uploadedAt)),
  ]).size

  // --- 最終練習日 (アルコちゃん挨拶生成用) ---
  const lastPracticeDate: Date | null = (() => {
    const candidates: Date[] = []
    if (latestPracticePerf?.uploadedAt) candidates.push(latestPracticePerf.uploadedAt)
    if (latestScorePerf?.uploadedAt) candidates.push(latestScorePerf.uploadedAt)
    if (candidates.length === 0) return null
    return new Date(Math.max(...candidates.map(d => d.getTime())))
  })()

  // --- アルコちゃん挨拶生成 ---
  const arcoMessage = generateArcoMessage({
    userName: dbUser.name ?? "",
    streak,
    weeklyDays,
    lastPracticeDate,
    lastOverallScore: latestTwoScores[0]?.overallScore ?? null,
    previousOverallScore: latestTwoScores[1]?.overallScore ?? null,
  })

  // --- UI-8: グレード表示用データ (grade API と同じ形でサーバ側で構築) ---
  type ProgressEntry = { completed: number; required: number; practiceItemIds: string[] }
  const currentGrade: GradeLevel = isGradeLevel(userGrade?.currentGrade)
    ? userGrade.currentGrade
    : "BEGINNER"
  const progressData = (userGrade?.progressData ?? {}) as Record<string, ProgressEntry>
  const band = NEXT_GRADE_BAND[currentGrade]
  let remainingCount = 0
  const nextGradeDetails: Record<string, { completed: number; required: number; remaining: number }> = {}
  for (const d of band.difficulties) {
    const dKey = String(d)
    const entry = progressData[dKey] ?? { completed: 0, required: 10, practiceItemIds: [] }
    const completed = typeof entry.completed === "number" ? entry.completed : 0
    const required = typeof entry.required === "number" ? entry.required : 10
    const remaining = Math.max(0, required - completed)
    nextGradeDetails[dKey] = { completed, required, remaining }
    remainingCount += remaining
  }
  const totalCompleted = Object.values(nextGradeDetails).reduce(
    (sum, d) => sum + d.completed,
    0,
  )
  const totalRequired = Object.values(nextGradeDetails).reduce(
    (sum, d) => sum + d.required,
    0,
  )
  // ───── ☆ 進捗計算 (次の☆まで N 曲) ─────
  // ルール (2026-05-10):
  //   1 曲クリア = 該当 practiceItem で総演奏回数 ≥ 5 AND 直近 5 回の overallScore 平均 ≥ 85
  //   1 ☆ 獲得 = 同じ難易度の曲を 10 曲クリア
  //   現在の☆ Lv = NEXT_GRADE_BAND[currentGrade].difficulties のうちマスターしていない最低 Lv
  const STAR_CLEAR_THRESHOLD_PER_ITEM = 85
  const STAR_CLEAR_MIN_PERFORMANCES = 5
  const STAR_ITEMS_PER_STAR = 10
  const targetDifficulties = band.difficulties

  let starsFilled = 0
  let currentStarLv: number | null = null
  let clearedAtCurrentStar = 0

  if (targetDifficulties.length > 0) {
    const itemsAtTargetDiffs = await prisma.practiceItem.findMany({
      where: {
        difficulty: { in: targetDifficulties },
        isPublished: true,
      },
      select: { id: true, difficulty: true },
    })
    const itemIdsByDiff = new Map<number, string[]>()
    for (const it of itemsAtTargetDiffs) {
      if (it.difficulty == null) continue
      if (!itemIdsByDiff.has(it.difficulty)) itemIdsByDiff.set(it.difficulty, [])
      itemIdsByDiff.get(it.difficulty)!.push(it.id)
    }

    const allItemIds = itemsAtTargetDiffs.map(i => i.id)
    const perfsAtTarget = allItemIds.length > 0
      ? await prisma.practicePerformance.findMany({
          where: {
            userId: internalUserId,
            analysisStatus: "done",
            practiceItemId: { in: allItemIds },
            overallScore: { not: null },
          },
          orderBy: { uploadedAt: "desc" },
          select: { practiceItemId: true, overallScore: true },
        })
      : []

    const perfsByItem = new Map<string, number[]>()
    for (const p of perfsAtTarget) {
      if (p.overallScore == null) continue
      if (!perfsByItem.has(p.practiceItemId)) perfsByItem.set(p.practiceItemId, [])
      perfsByItem.get(p.practiceItemId)!.push(p.overallScore)
    }

    for (const d of targetDifficulties) {
      const itemIds = itemIdsByDiff.get(d) ?? []
      let clearedAtD = 0
      for (const itemId of itemIds) {
        const scores = perfsByItem.get(itemId) ?? []
        if (scores.length < STAR_CLEAR_MIN_PERFORMANCES) continue
        const recent5 = scores.slice(0, 5)
        const avg = recent5.reduce((a, b) => a + b, 0) / recent5.length
        if (avg >= STAR_CLEAR_THRESHOLD_PER_ITEM) clearedAtD++
      }
      if (clearedAtD >= STAR_ITEMS_PER_STAR) {
        starsFilled++
      } else if (currentStarLv == null) {
        currentStarLv = d
        clearedAtCurrentStar = clearedAtD
      }
    }
  }
  const itemsToNextStar = Math.max(0, STAR_ITEMS_PER_STAR - clearedAtCurrentStar)

  const gradeData = {
    currentGrade,
    achievedAt: userGrade?.achievedAt?.toISOString() ?? null,
    nextGrade: band.next,
    remainingCount,
    nextGradeDetails,
    totalCompleted,
    totalRequired,
    // ☆ 進捗 (グレードの下に表示)
    starsFilled,
    starsTotal: targetDifficulties.length,
    currentStarLv,
    itemsToNextStar,
  }

  // --- UI-9 + Score 統合 (§11-3): active カード優先のレコメンド ---
  // findCandidateRecommendations が PracticeItem + Score を統合した候補を返す。
  // - PracticeItem: difficulty 範囲 + skillSubTaskTags + 未達成 + isPublished
  // - Score: difficulty 範囲 + skillSubTaskTags + isShared + deletedAt=null
  //   (Score は achievedIds 適用なし — 進捗管理は PracticeItem のみ)
  const perfStep3 = performance.now()
  const achievedIds = Object.values(progressData).flatMap(
    entry => Array.isArray(entry.practiceItemIds) ? entry.practiceItemIds : [],
  )
  const subTaskIds = activeCard ? extractSubTaskIdsFromCard(activeCard) : null
  const candidateItems = await findCandidateRecommendations(prisma, {
    userId: internalUserId,
    subTaskIds,
    grade: currentGrade,
    achievedIds,
    limit: 5,
  })
  const recommendationReason = generateRecommendationReason(activeCard)
  const songRecommendations = candidateItems.map(item => {
    // category="score" は Score ルート、それ以外は PracticeItem ルート
    const href =
      item.category === "score"
        ? `/${userId}/scores/${item.id}`
        : `/${userId}/practice/${item.category}/${item.id}`
    return {
      practiceItem: {
        id: item.id,
        title: item.title,
        category: item.category,
        difficulty: item.difficulty ?? null,
        composer: item.composer ?? null,
      },
      reason: recommendationReason,
      href,
      ...(activeCard ? { triggeredByCardId: activeCard.id } : {}),
    }
  })
  console.log(`[PERF] home step3_recommendations: ${(performance.now() - perfStep3).toFixed(0)}ms  TOTAL: ${(performance.now() - perfStart).toFixed(0)}ms`)

  // --- 直近の練習履歴（3件、Continue バー風レイアウトで表示）---
  type HistoryItem = {
    title: string
    subtitle: string
    href: string
    uploadedAt: string
  }
  const recentHistory: HistoryItem[] = [
    ...recentPracticeHistory
      .filter(p => p.practiceItem)
      .map(p => ({
        title:      p.practiceItem!.title,
        subtitle:   p.practiceItem!.category,
        href:       `/${userId}/practice/${p.practiceItem!.category}/${p.practiceItem!.id}`,
        uploadedAt: p.uploadedAt.toISOString(),
      })),
    ...recentScoreHistory
      .filter(p => p.score)
      .map(p => ({
        title:      p.score!.title,
        subtitle:   formatKey(p.score!.keyTonic, p.score!.keyMode),
        href:       `/${userId}/scores/${p.score!.id}`,
        uploadedAt: p.uploadedAt.toISOString(),
      })),
  ]
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
    .slice(0, 3)

  return (
    <HomeClient
      userName={dbUser.name ?? ""}
      streak={streak}
      weeklyDays={weeklyDays}
      arcoMessage={arcoMessage}
      gradeData={gradeData}
      songRecommendations={songRecommendations}
      recentHistory={recentHistory}
    />
  )
}
