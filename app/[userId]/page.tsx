import { prisma } from "@/app/_libs/prisma"
import HomeClient from "./home"

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

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: userId },
    select: { id: true, name: true },
  })
  if (!dbUser) return <div>User not found</div>

  const internalUserId = dbUser.id

  // 今日の JST 範囲
  const todayJSTStr = toJSTDateStr(new Date())
  const todayStart = new Date(todayJSTStr + "T00:00:00+09:00")
  const todayEnd   = new Date(todayJSTStr + "T23:59:59+09:00")

  // 今週の月曜日
  const now = new Date()
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay()
  const weekStart = new Date(now.getTime() - (dayOfWeek - 1) * 86400000)
  weekStart.setHours(0, 0, 0, 0)

  // --- ストリーク計算 ---
  const [practiceUploads, scoreUploads] = await Promise.all([
    prisma.practicePerformance.findMany({
      where: { userId: internalUserId },
      select: { uploadedAt: true },
      orderBy: { uploadedAt: "desc" },
    }),
    prisma.performance.findMany({
      where: { userId: internalUserId },
      select: { uploadedAt: true },
      orderBy: { uploadedAt: "desc" },
    }),
  ])

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

  // --- 3リング（今日の進捗）---
  const [todayPractice, todayScore] = await Promise.all([
    prisma.practicePerformance.findMany({
      where: {
        userId: internalUserId,
        uploadedAt: { gte: todayStart, lte: todayEnd },
      },
      select: { performanceDuration: true, comparisonResultPath: true },
    }),
    prisma.performance.findMany({
      where: {
        userId: internalUserId,
        uploadedAt: { gte: todayStart, lte: todayEnd },
      },
      select: { performanceDuration: true, comparisonResultPath: true },
    }),
  ])

  const PRACTICE_GOAL_SEC = 15 * 60  // 15分
  const RECORD_GOAL       = 1
  const REVIEW_GOAL       = 2

  const totalDurationSec = [
    ...todayPractice.map(p => p.performanceDuration ?? 0),
    ...todayScore.map(p => p.performanceDuration ?? 0),
  ].reduce((a, b) => a + b, 0)

  const todayRecordCount = todayPractice.length + todayScore.length

  const todayReviewCount = [
    ...todayPractice.filter(p => p.comparisonResultPath),
    ...todayScore.filter(p => p.comparisonResultPath),
  ].length

  const rings = {
    practice: Math.min(totalDurationSec / PRACTICE_GOAL_SEC, 1),
    record:   Math.min(todayRecordCount  / RECORD_GOAL, 1),
    review:   Math.min(todayReviewCount  / REVIEW_GOAL, 1),
  }

  // --- 直前の曲（Continue バー）---
  const [latestPracticePerf, latestScorePerf] = await Promise.all([
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
      where: { userId: internalUserId },
      orderBy: { uploadedAt: "desc" },
      select: {
        uploadedAt: true,
        scoreId: true,
        score: { select: { id: true, title: true, keyTonic: true, keyMode: true } },
      },
    }),
  ])

  type ContinueItem = {
    href: string
    title: string
    subtitle: string
    uploadedAt: Date
  }
  let continueItem: ContinueItem | null = null

  const latestDate = (
    latestPracticePerf?.uploadedAt && latestScorePerf?.uploadedAt
      ? latestPracticePerf.uploadedAt > latestScorePerf.uploadedAt
        ? latestPracticePerf
        : latestScorePerf
      : latestPracticePerf ?? latestScorePerf
  )

  if (latestDate === latestPracticePerf && latestPracticePerf?.practiceItem) {
    continueItem = {
      href:       `/${userId}/practice/${latestPracticePerf.practiceItem.category}/${latestPracticePerf.practiceItem.id}`,
      title:      latestPracticePerf.practiceItem.title,
      subtitle:   latestPracticePerf.practiceItem.category,
      uploadedAt: latestPracticePerf.uploadedAt,
    }
  } else if (latestDate === latestScorePerf && latestScorePerf?.score) {
    const key = `${latestScorePerf.score.keyTonic ?? ""} ${latestScorePerf.score.keyMode ?? ""}`.trim()
    continueItem = {
      href:       `/${userId}/scores/${latestScorePerf.score.id}`,
      title:      latestScorePerf.score.title,
      subtitle:   key,
      uploadedAt: latestScorePerf.uploadedAt,
    }
  }

  // --- デイリーチャレンジ（日付シードで固定）---
  const totalItems = await prisma.practiceItem.count({ where: { isPublished: true } })
  const seed = Array.from(todayJSTStr).reduce((a, c) => a + c.charCodeAt(0), 0)
  const dailyChallenge = totalItems > 0
    ? await prisma.practiceItem.findFirst({
        where: { isPublished: true },
        skip:  seed % totalItems,
        take:  1,
        select: { id: true, title: true, category: true, difficulty: true, description: true },
      })
    : null

  // --- おすすめ練習（最大2件・楽譜ベース + 弱点ベース）---
  const recentScores = await prisma.score.findMany({
    where: { createdById: internalUserId },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: { keyTonic: true, keyMode: true, title: true },
  })

  type RecommendItem = {
    id: string
    title: string
    category: string
    difficulty: number
    href: string
    reason: string
  }

  const recommendations: RecommendItem[] = []

  for (const score of recentScores) {
    if (recommendations.length >= 2) break
    if (!score.keyTonic) continue
    const item = await prisma.practiceItem.findFirst({
      where: {
        keyTonic:     score.keyTonic,
        keyMode:      score.keyMode ?? "major",
        category:     { in: ["scale", "arpeggio"] },
        isPublished:  true,
        OR: [{ ownerUserId: null }, { ownerUserId: internalUserId }],
      },
      orderBy: { difficulty: "asc" },
      select: { id: true, title: true, category: true, difficulty: true },
    })
    if (item) {
      recommendations.push({
        ...item,
        href:   `/${userId}/practice/${item.category}/${item.id}`,
        reason: `「${score.title}」の調性に合わせて`,
      })
    }
  }

  if (recommendations.length < 2) {
    const weaknesses = await prisma.userWeakness.findMany({
      where: { userId: internalUserId },
      orderBy: { severity: "desc" },
      take: 2,
    })
    for (const w of weaknesses) {
      if (recommendations.length >= 2) break
      if (w.weaknessType !== "key_area") continue
      const [tonic, mode] = w.weaknessKey.split("_")
      const item = await prisma.practiceItem.findFirst({
        where: {
          keyTonic: tonic, keyMode: mode,
          category: { in: ["scale", "arpeggio"] }, isPublished: true,
          OR: [{ ownerUserId: null }, { ownerUserId: internalUserId }],
        },
        select: { id: true, title: true, category: true, difficulty: true },
      })
      if (item) {
        recommendations.push({
          ...item,
          href:   `/${userId}/practice/${item.category}/${item.id}`,
          reason: `${tonic}${mode === "minor" ? "短調" : "長調"}の強化に`,
        })
      }
    }
  }

  // --- 直近の練習履歴（3件）---
  const [recentPractice, recentScore] = await Promise.all([
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
      where: { userId: internalUserId },
      orderBy: { uploadedAt: "desc" },
      take: 3,
      select: {
        uploadedAt: true,
        score: { select: { title: true, id: true } },
      },
    }),
  ])

  type HistoryItem = {
    title: string
    href: string
    uploadedAt: string
  }
  const recentHistory: HistoryItem[] = [
    ...recentPractice
      .filter(p => p.practiceItem)
      .map(p => ({
        title:      p.practiceItem!.title,
        href:       `/${userId}/practice/${p.practiceItem!.category}/${p.practiceItem!.id}`,
        uploadedAt: p.uploadedAt.toISOString(),
      })),
    ...recentScore
      .filter(p => p.score)
      .map(p => ({
        title:      p.score!.title,
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
      rings={rings}
      continueItem={
        continueItem
          ? { ...continueItem, uploadedAt: continueItem.uploadedAt.toISOString() }
          : null
      }
      dailyChallenge={
        dailyChallenge
          ? {
              ...dailyChallenge,
              href: `/${userId}/practice/${dailyChallenge.category}/${dailyChallenge.id}`,
            }
          : null
      }
      recommendations={recommendations}
      recentHistory={recentHistory}
    />
  )
}
