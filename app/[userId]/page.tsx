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

// v1.6 Phase 4-2: NEXT_GRADE_BAND は撤去 (旧 UserGrade.progressData per-★ ブレイクダウン用)
// 仕様書 §1-2 R2=A 確定で重複なし split になり per-★ 別計算が不要に。
// UserGradeProgress.currentStar 単一値で管理。

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
    userGrade,              // UI-8: legacy グレード (recommendations 用)
    userGradeProgress,      // v1.6 Phase 4-2: ホーム☆/グレード表示用 (新設計)
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
    // UI-8: グレード表示 (legacy 経路、Phase 4-3 でレコメンド書き換え時に撤去予定。
    //   v1.6 §13-2: Q3=A 確定で旧 UI 撤去だが、recommendations は UserGrade.progressData 経由のため温存)
    prisma.userGrade.findUnique({
      where: { userId: internalUserId },
      select: { currentGrade: true, achievedAt: true, progressData: true },
    }),
    // v1.6 Phase 4-2: ホーム表示専用の UserGradeProgress (新 v1.3 設計、Phase 3c で実装)
    prisma.userGradeProgress.findUnique({
      where: { userId: internalUserId },
      select: {
        currentStar: true,
        currentGrade: true,
        masteredSongCountAtCurrentStar: true,
        masterReachedAt: true,
      },
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

  // --- v1.6 Phase 4-2: グレード/★表示用データ (UserGradeProgress ベース、Q3=A 旧 UI 撤去) ---
  // 仕様書 v1.6 §3-5-2 必須引用:
  //   「必須: ユーザーの現在グレード + ★表示 (UserGradeProgress 準拠、旧 UserGrade.progressData 経路は廃止)」
  //   「必須: 次の★まで完全習得すべき曲数 (10 曲 - masteredSongCountAtCurrentStar)」
  // §2-7 引用: 「★ n の曲を 10 曲習得した瞬間に★(n+1)に昇格」
  const GRADE_UP_SONG_COUNT = 10
  const currentStar = userGradeProgress?.currentStar ?? 1
  const currentGradeFromProgress: GradeLevel = isGradeLevel(userGradeProgress?.currentGrade)
    ? userGradeProgress.currentGrade
    : "BEGINNER"
  const masteredSongCount = userGradeProgress?.masteredSongCountAtCurrentStar ?? 0
  const gradeUpRemaining = Math.max(0, GRADE_UP_SONG_COUNT - masteredSongCount)
  const isMaster = currentGradeFromProgress === "MASTER"

  const gradeData = {
    currentStar,
    currentGrade: currentGradeFromProgress,
    masteredSongCountAtCurrentStar: masteredSongCount,
    gradeUpRequired: GRADE_UP_SONG_COUNT,
    gradeUpRemaining,
    isMaster,
    masterReachedAt: userGradeProgress?.masterReachedAt?.toISOString() ?? null,
  }

  // --- legacy: recommendations のために UserGrade.currentGrade / progressData を構築 ---
  // (Phase 4-3 でレコメンドエンジン書き換え時に UserGradeProgress 経路に統合予定)
  type ProgressEntry = { completed: number; required: number; practiceItemIds: string[] }
  const currentGrade: GradeLevel = isGradeLevel(userGrade?.currentGrade)
    ? userGrade.currentGrade
    : "BEGINNER"
  const progressData = (userGrade?.progressData ?? {}) as Record<string, ProgressEntry>

  // --- UI-9 + Score 統合 (§11-3): active カード優先のレコメンド ---
  // findCandidateRecommendations が PracticeItem + Score を統合した候補を返す。
  // - PracticeItem: star 範囲 + skillSubTaskTags + 未達成 + isPublished
  // - Score: star 範囲 + skillSubTaskTags + isShared + deletedAt=null
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
  let songRecommendations = candidateItems.map(item => {
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
        star: item.star ?? null,
        composer: item.composer ?? null,
      },
      reason: recommendationReason,
      href,
      ...(activeCard ? { triggeredByCardId: activeCard.id } : {}),
    }
  })

  // 演奏履歴ゼロのユーザー (PracticePerformance + Performance ともに 0 件) には
  // 通常レコメンドを上書きして Lv.1 (☆1) の練習教材を 3 つ提示
  const hasNoHistory = practiceUploads.length === 0 && scoreUploads.length === 0
  if (hasNoHistory) {
    const lv1Items = await prisma.practiceItem.findMany({
      where: {
        star: 1,
        isPublished: true,
        OR: [{ ownerUserId: null }, { ownerUserId: internalUserId }],
      },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      take: 3,
      select: {
        id: true,
        title: true,
        category: true,
        star: true,
        composer: true,
      },
    })
    songRecommendations = lv1Items.map(item => ({
      practiceItem: {
        id: item.id,
        title: item.title,
        category: item.category,
        star: item.star ?? null,
        composer: item.composer ?? null,
      },
      reason: "まずは ☆1 の曲から始めましょう",
      href: `/${userId}/practice/${item.category}/${item.id}`,
    }))
  }
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
