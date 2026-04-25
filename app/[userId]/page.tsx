import { prisma } from "@/app/_libs/prisma"
import { generateArcoMessage } from "@/app/_libs/arcoChan"
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
    totalItems,
    recentScores,
    recentPracticeHistory,
    recentScoreHistory,
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
    // デイリーチャレンジ用 (アルコちゃんの「今日のおすすめ」候補)
    prisma.practiceItem.count({ where: { isPublished: true } }),
    // レコメンド用
    prisma.score.findMany({
      where: { createdById: internalUserId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { keyTonic: true, keyMode: true, title: true },
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
        score: { select: { title: true, id: true } },
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

  // --- Continue バー ---
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

  // --- デイリーチャレンジ (アルコちゃんおすすめの候補1) ---
  const perfStep3 = performance.now()
  const todayJSTStr = toJSTDateStr(new Date())
  const seed = Array.from(todayJSTStr).reduce((a, c) => a + c.charCodeAt(0), 0)
  const dailyChallenge = totalItems > 0
    ? await prisma.practiceItem.findFirst({
        where: { isPublished: true },
        skip:  seed % totalItems,
        take:  1,
        select: { id: true, title: true, category: true, description: true },
      })
    : null
  console.log(`[PERF] home step3_dailyChallenge: ${(performance.now() - perfStep3).toFixed(0)}ms`)

  // --- レコメンド (個別性高: 楽譜の調性 + 弱点ベース) ---
  type RecommendItem = {
    id: string
    title: string
    category: string
    href: string
    reason: string
  }

  const personalRecommendations: RecommendItem[] = []

  // 楽譜ベースのレコメンド候補を並列取得
  const scoreRecPromises = recentScores
    .filter(s => s.keyTonic)
    .map(score =>
      prisma.practiceItem.findFirst({
        where: {
          keyTonic: score.keyTonic!,
          keyMode: score.keyMode ?? "major",
          category: { in: ["scale", "arpeggio"] },
          isPublished: true,
          OR: [{ ownerUserId: null }, { ownerUserId: internalUserId }],
        },
        orderBy: { title: "asc" },
        select: { id: true, title: true, category: true },
      }).then(item => item ? { item, scoreTitle: score.title } : null)
    )

  const scoreRecResults = await Promise.all(scoreRecPromises)
  for (const r of scoreRecResults) {
    if (personalRecommendations.length >= 2) break
    if (!r) continue
    personalRecommendations.push({
      ...r.item,
      href:   `/${userId}/practice/${r.item.category}/${r.item.id}`,
      reason: `「${r.scoreTitle}」の調性に合わせて`,
    })
  }

  const perfStep4 = performance.now()
  if (personalRecommendations.length < 2) {
    const weaknesses = await prisma.userWeakness.findMany({
      where: { userId: internalUserId },
      orderBy: { severity: "desc" },
      take: 2,
    })

    const weakRecPromises = weaknesses
      .filter(w => w.weaknessType === "key_area")
      .map(w => {
        const [tonic, mode] = w.weaknessKey.split("_")
        return prisma.practiceItem.findFirst({
          where: {
            keyTonic: tonic, keyMode: mode,
            category: { in: ["scale", "arpeggio"] }, isPublished: true,
            OR: [{ ownerUserId: null }, { ownerUserId: internalUserId }],
          },
          select: { id: true, title: true, category: true },
        }).then(item => item ? { item, tonic, mode } : null)
      })

    const weakRecResults = await Promise.all(weakRecPromises)
    for (const r of weakRecResults) {
      if (personalRecommendations.length >= 2) break
      if (!r) continue
      personalRecommendations.push({
        ...r.item,
        href:   `/${userId}/practice/${r.item.category}/${r.item.id}`,
        reason: `${r.tonic}${r.mode === "minor" ? "短調" : "長調"}の強化に`,
      })
    }
  }
  console.log(`[PERF] home step4_recommendations: ${(performance.now() - perfStep4).toFixed(0)}ms  TOTAL: ${(performance.now() - perfStart).toFixed(0)}ms`)

  // --- アルコちゃんに出すおすすめ + 独立カードのおすすめ を振分け ---
  // 重複しないように、合算リストから上から1件ずつ取る。
  // 優先順: dailyChallenge → personalRecommendations[0] → [1]
  const allItems: RecommendItem[] = []
  if (dailyChallenge) {
    allItems.push({
      id:       dailyChallenge.id,
      title:    dailyChallenge.title,
      category: dailyChallenge.category,
      href:     `/${userId}/practice/${dailyChallenge.category}/${dailyChallenge.id}`,
      reason:   "今日のチャレンジ",
    })
  }
  for (const r of personalRecommendations) {
    // dailyChallenge と重複しないように id チェック
    if (allItems.some(x => x.id === r.id)) continue
    allItems.push(r)
  }

  const arcoRecommendation = allItems[0] ?? null
  const independentRecommendations = allItems.slice(1, 2)  // 最大1件

  // --- 直近の練習履歴（3件）---
  type HistoryItem = {
    title: string
    href: string
    uploadedAt: string
  }
  const recentHistory: HistoryItem[] = [
    ...recentPracticeHistory
      .filter(p => p.practiceItem)
      .map(p => ({
        title:      p.practiceItem!.title,
        href:       `/${userId}/practice/${p.practiceItem!.category}/${p.practiceItem!.id}`,
        uploadedAt: p.uploadedAt.toISOString(),
      })),
    ...recentScoreHistory
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
      arcoMessage={arcoMessage}
      arcoRecommendation={arcoRecommendation}
      continueItem={
        continueItem
          ? { ...continueItem, uploadedAt: continueItem.uploadedAt.toISOString() }
          : null
      }
      recommendations={independentRecommendations}
      recentHistory={recentHistory}
    />
  )
}
