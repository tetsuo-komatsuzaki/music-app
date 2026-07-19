import { prisma } from "@/app/_libs/prisma"
import { generateArcoMessage } from "@/app/_libs/arcoChan"
import {
  badgeKind,
  gradeFromStar,
  STAR_UP_ACHIEVEMENTS,
} from "@/app/_libs/starProgress"
import { estimatePeriod } from "@/app/onboarding/_lib/logic"
import HomeClient from "./home"

// C-6b (2026-07-11): 旧レコメンド(UserSkillTaskCard/UserGrade.progressData)経路は撤去。
// ★/グレード/バッジは新判定体系 (UserStarProgress/UserScoreAchievement) から。

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
  // オンボーディング未完了ガードは [userId]/layout.tsx (全入口共通) に移設 (C6)

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
    userStarProgress,       // C-6b: ★の現在地 (新判定体系・工程D)
    scoreAchievements,      // C-6b: 曲の達成/マスター記録 (バッジ + ★進捗 + 次曲除外)
    onboardingProfile,      // 旅の地図カード: 目標曲/Epic Win (オンボーディング回答)
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
    // アルコちゃんの改善検出用 (直近 2 件、score 演奏のみ)。
    // overallScore 廃止に伴い演奏スコア(音程+リズム平均)で改善判定する。
    prisma.performance.findMany({
      where: {
        userId: internalUserId,
        pitchAccuracy: { not: null },
        timingAccuracy: { not: null },
      },
      orderBy: { uploadedAt: "desc" },
      take: 2,
      select: { pitchAccuracy: true, timingAccuracy: true },
    }),
    // C-6b (2026-07-11): ★とバッジは新判定体系 (UserStarProgress/UserScoreAchievement) から。
    // 旧 UserGrade / UserGradeProgress / UserSkillTaskCard / SongMastery は退役。
    prisma.userStarProgress.findUnique({
      where: { userId: internalUserId },
      select: { currentStar: true },
    }),
    prisma.userScoreAchievement.findMany({
      where: { userId: internalUserId },
      select: { scoreId: true, starAtAchievement: true, achievedAt: true, masteredAt: true },
    }),
    prisma.onboardingProfile.findUnique({
      where: { userId: internalUserId },
      select: { answers: true, completedAt: true },
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
    lastOverallScore:
      latestTwoScores[0]?.pitchAccuracy != null && latestTwoScores[0]?.timingAccuracy != null
        ? Math.round((latestTwoScores[0].pitchAccuracy + latestTwoScores[0].timingAccuracy) / 2)
        : null,
    previousOverallScore:
      latestTwoScores[1]?.pitchAccuracy != null && latestTwoScores[1]?.timingAccuracy != null
        ? Math.round((latestTwoScores[1].pitchAccuracy + latestTwoScores[1].timingAccuracy) / 2)
        : null,
  })

  // --- C-6b (2026-07-11): グレード/★表示 = 新判定体系ベース ---
  // ★ = UserStarProgress、進捗 = 同★の達成曲数（10曲で次の★へ = spec§1-6）。
  // グレードは★から導出 (starProgress.ts)。
  const currentStar = userStarProgress?.currentStar ?? 1
  const achievedCountAtCurrentStar = scoreAchievements.filter(
    (a) => a.starAtAchievement === currentStar,
  ).length
  const currentGradeFromStar = gradeFromStar(currentStar)
  const gradeData = {
    currentStar,
    currentGrade: currentGradeFromStar,
    masteredSongCountAtCurrentStar: achievedCountAtCurrentStar, // 新体系では「達成」数
    gradeUpRequired: STAR_UP_ACHIEVEMENTS,
    gradeUpRemaining: Math.max(0, STAR_UP_ACHIEVEMENTS - achievedCountAtCurrentStar),
    isMaster: currentGradeFromStar === "MASTER",
    masterReachedAt: null,
  }
  console.log(`[PERF] home step3: TOTAL ${(performance.now() - perfStart).toFixed(0)}ms`)

  // --- マイランクカード: 現在★の達成曲をスタンプ化 (曲名 + ベスト演奏スコア + 達成日) ---
  const currentStarAchievements = scoreAchievements
    .filter((a) => a.starAtAchievement === currentStar)
    .sort((a, b) => (a.achievedAt?.getTime() ?? 0) - (b.achievedAt?.getTime() ?? 0))
  const rankStampIds = currentStarAchievements.map((a) => a.scoreId)
  let rankStamps: {
    scoreId: string; title: string; best: number | null; achievedAt: string | null; href: string
  }[] = []
  if (rankStampIds.length > 0) {
    const rows = await prisma.performance.findMany({
      where: {
        userId: internalUserId,
        scoreId: { in: rankStampIds },
        rangeFromNote: null,
        pitchAccuracy: { not: null },
        timingAccuracy: { not: null },
      },
      select: { scoreId: true, pitchAccuracy: true, timingAccuracy: true, score: { select: { title: true } } },
    })
    const bestByScore = new Map<string, { title: string; best: number }>()
    for (const r of rows) {
      if (r.pitchAccuracy == null || r.timingAccuracy == null || !r.score) continue
      const s = Math.round((r.pitchAccuracy + r.timingAccuracy) / 2)
      const cur = bestByScore.get(r.scoreId)
      if (!cur || s > cur.best) bestByScore.set(r.scoreId, { title: r.score.title, best: s })
    }
    rankStamps = currentStarAchievements.map((a) => {
      const b = bestByScore.get(a.scoreId)
      return {
        scoreId: a.scoreId,
        title: b?.title ?? "この曲",
        best: b?.best ?? null,
        achievedAt: a.achievedAt ? a.achievedAt.toISOString() : null,
        href: `/${userId}/scores/${a.scoreId}`,
      }
    })
  }
  const rankCard = {
    currentStar,
    required: STAR_UP_ACHIEVEMENTS,
    achievedCount: achievedCountAtCurrentStar,
    stamps: rankStamps,
  }

  // --- 基礎練習の練習状況: 直近に練習した、かつまだクリア(マスター)していない
  //     基礎練 (PracticeItem) を横並びで提示。各カードに直近の練習日時 + 直近スコア。 ---
  const [practicePerfsForBasics, clearedMasteryRows] = await Promise.all([
    prisma.practicePerformance.findMany({
      where: { userId: internalUserId },
      orderBy: { uploadedAt: "desc" },
      take: 50,
      select: {
        practiceItemId: true,
        uploadedAt: true,
        pitchAccuracy: true,
        timingAccuracy: true,
        practiceItem: { select: { id: true, title: true, category: true } },
      },
    }),
    // C-6b: クリア判定は新体系の教材達成 (3回×崩壊ゼロ) に置換
    prisma.userPracticeAchievement.findMany({
      where: { userId: internalUserId },
      select: { practiceItemId: true },
    }),
  ])
  const clearedItemSet = new Set(clearedMasteryRows.map((m) => m.practiceItemId))
  const seenItemIds = new Set<string>()
  type BasicPracticeCard = {
    id: string
    title: string
    category: string
    href: string
    lastPracticedAt: string
    recentScore: number | null
  }
  const basicPracticeCards: BasicPracticeCard[] = []
  for (const p of practicePerfsForBasics) {
    if (!p.practiceItemId || !p.practiceItem) continue
    if (clearedItemSet.has(p.practiceItemId) || seenItemIds.has(p.practiceItemId)) continue
    seenItemIds.add(p.practiceItemId)
    const recentScore =
      p.pitchAccuracy != null && p.timingAccuracy != null
        ? Math.round((p.pitchAccuracy + p.timingAccuracy) / 2)
        : null
    basicPracticeCards.push({
      id: p.practiceItem.id,
      title: p.practiceItem.title,
      category: p.practiceItem.category,
      href: `/${userId}/practice/${p.practiceItem.category}/${p.practiceItem.id}`,
      lastPracticedAt: p.uploadedAt.toISOString(),
      recentScore,
    })
    if (basicPracticeCards.length >= 24) break
  }

  // --- 直近の練習曲 (Score) + 曲別 直近平均スコア (pitch+timing の 2 軸平均) ---
  // overallScore は skill 依存で欠損しやすいため、確実に入る pitch/timing で算出。
  const recentPiecePerfs = await prisma.performance.findMany({
    where: {
      userId: internalUserId,
      score: { deletedAt: null },
      pitchAccuracy: { not: null },
      timingAccuracy: { not: null },
    },
    orderBy: { uploadedAt: "desc" },
    take: 50,
    select: {
      scoreId: true,
      pitchAccuracy: true,
      timingAccuracy: true,
      score: { select: { id: true, title: true, star: true, coverImagePath: true } },
    },
  })
  const pieceOrder: string[] = []
  const pieceData = new Map<string, { id: string; title: string; star: number | null; cover: string | null; latest: number; vals: number[] }>()
  for (const p of recentPiecePerfs) {
    if (!p.scoreId || !p.score || p.pitchAccuracy == null || p.timingAccuracy == null) continue
    const avg2 = (p.pitchAccuracy + p.timingAccuracy) / 2
    if (!pieceData.has(p.scoreId)) {
      // 最初の1件 = 最新(desc順) → 直近点
      pieceData.set(p.scoreId, { id: p.score.id, title: p.score.title, star: p.score.star, cover: p.score.coverImagePath, latest: Math.round(avg2), vals: [] })
      pieceOrder.push(p.scoreId)
    }
    const d = pieceData.get(p.scoreId)!
    if (d.vals.length < 5) d.vals.push(avg2)
  }
  // C-6b: バッジは新達成記録から (マスター ≻ 達成 ≻ なし・上位1つ = Tetsuo確定)
  const achievementByScore = new Map(scoreAchievements.map((a) => [a.scoreId, a]))
  const recentPieces = pieceOrder.slice(0, 5).map((sid) => {
    const d = pieceData.get(sid)!
    const recentAvg = d.vals.length
      ? Math.round(d.vals.reduce((s, v) => s + v, 0) / d.vals.length)
      : null
    return {
      id: d.id,
      title: d.title,
      star: d.star,
      cover: d.cover,
      latest: d.latest,
      recentAvg,
      badge: badgeKind(achievementByScore.get(d.id)),
      href: `/${userId}/scores/${d.id}`,
    }
  })

  // --- 「次の曲にチャレンジ」: ユーザーと同じ★で、まだ達成していない共有曲 (Score)。
  //     現在練習中の曲・達成済みの曲は除外。 ---
  const excludePieceIds = [
    ...new Set([
      ...recentPieces.map((p) => p.id),
      ...scoreAchievements.map((a) => a.scoreId),
    ]),
  ]
  const nextPieceScores = await prisma.score.findMany({
    where: {
      star: currentStar,
      ownerScope: "admin",
      isShared: true,
      deletedAt: null,
      ...(excludePieceIds.length ? { id: { notIn: excludePieceIds } } : {}),
    },
    orderBy: [{ createdAt: "asc" }],
    take: 4,
    select: { id: true, title: true, composer: true, star: true, coverImagePath: true },
  })
  const nextPieceRecommendations = nextPieceScores.map((s) => ({
    practiceItem: {
      id: s.id,
      title: s.title,
      category: "score",
      star: s.star ?? null,
      composer: s.composer ?? null,
      cover: s.coverImagePath ?? null,
    },
    reason: `あなたのレベル（☆${currentStar}）の曲です`,
    href: `/${userId}/scores/${s.id}`,
  }))

  // --- 旅の地図: オンボーディングの目標曲/Epic Win を常設表示 ---
  // 到達予測はオンボーディング時の値ではなく「現在の★ × 現在のQ6回答」で再計算する
  // (★が上がるほど期間が縮む=上達の実感につなげる)
  type OnbAnswers = {
    q4cat?: string
    q4song?: string
    q4star?: number
    q6?: string
    q8?: string
    goalSong?: string | null
    goalDate?: string | null
  }
  let journeyMap = null as
    | null
    | {
        songName: string
        songStar: number
        songHref: string | null
        achieved: boolean
        periodLabel: string | null
        daily: string | null
        epicWin: string | null
        goalDate: string | null
      }
  const onbAnswers = (onboardingProfile?.answers ?? null) as OnbAnswers | null
  if (onboardingProfile?.completedAt && onbAnswers?.q4song && onbAnswers.q4star) {
    const onbSong = onbAnswers.q4cat
      ? await prisma.onboardingSong.findUnique({
          where: {
            category_name: { category: onbAnswers.q4cat, name: onbAnswers.q4song },
          },
          select: { scoreId: true },
        })
      : null
    const achieved =
      !!onbSong?.scoreId && scoreAchievements.some((a) => a.scoreId === onbSong.scoreId)
    const pred = onbAnswers.q6
      ? estimatePeriod(currentStar, onbAnswers.q4star, onbAnswers.q6)
      : null
    journeyMap = {
      songName: onbAnswers.q4song,
      songStar: onbAnswers.q4star,
      songHref: onbSong?.scoreId ? `/${userId}/scores/${onbSong.scoreId}` : null,
      achieved,
      periodLabel: achieved ? null : (pred?.label ?? null),
      daily: onbAnswers.q6 ?? null,
      epicWin: onbAnswers.goalSong || onbAnswers.q8 || null,
      goalDate: onbAnswers.goalDate ?? null,
    }
  }

  return (
    <HomeClient
      userName={dbUser.name ?? ""}
      streak={streak}
      weeklyDays={weeklyDays}
      arcoMessage={arcoMessage}
      gradeData={gradeData}
      journeyMap={journeyMap}
      basicPracticeCards={basicPracticeCards}
      recentPieces={recentPieces}
      nextPieceRecommendations={nextPieceRecommendations}
      rankCard={rankCard}
    />
  )
}
