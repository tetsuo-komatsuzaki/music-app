// app/[userId]/progress/page.tsx
//
// v1.6 Phase 4-2 (2026-05-16) — 成長記録 (Server Component)。
//
// 仕様書 v1.6 §3-5-3 引用:
//   「Phase 4-2 着手時に詳細仕様化、本書 §1-2 グレード ↔ ★マッピングと §2 マスター条件に整合させる」
//
// タブ構成 (Q3=A 確定: 完全に剥がして書き直し):
//   - 「習得状況」(mastery, デフォルト): UserGradeProgress / SongMastery / UserPracticeMastery 集計
//   - 「練習カレンダー」(calendar): 既存ロジック温存
//
// 旧「あなたの課題」タブは Score 詳細「上達ループ」タブに統合済 (Phase 4-1)。

import { prisma } from "@/app/_libs/prisma"
import {
  GRADE_LEVELS,
  type GradeLevel,
} from "@/app/_libs/skillMaster"
import ProgressPage from "./progressPage"

export const metadata = { title: "成長記録" }

const isGradeLevel = (v: unknown): v is GradeLevel =>
  typeof v === "string" && (GRADE_LEVELS as readonly string[]).includes(v)

const GRADE_UP_SONG_COUNT = 10

type PageProps = {
  params:       Promise<{ userId: string }>
  searchParams: Promise<{ tab?: string }>
}

const VALID_TABS = ["calendar", "mastery"] as const

function toJSTDateStr(date: Date): string {
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  return jst.toISOString().split("T")[0]
}

function calculateStreak(dates: Date[]): number {
  const uniqueDays = [...new Set(dates.map(toJSTDateStr))].sort().reverse()
  if (uniqueDays.length === 0) return 0

  const todayStr     = toJSTDateStr(new Date())
  const yesterdayStr = toJSTDateStr(new Date(Date.now() - 86400000))

  let start: string
  if      (uniqueDays[0] === todayStr)     start = todayStr
  else if (uniqueDays[0] === yesterdayStr) start = yesterdayStr
  else                                      return 0

  let streak = 0
  for (let i = 0; i < uniqueDays.length; i++) {
    const expected = toJSTDateStr(
      new Date(new Date(start + "T00:00:00+09:00").getTime() - i * 86400000)
    )
    if (uniqueDays[i] === expected) streak++
    else break
  }
  return streak
}

export default async function ProgressServerPage({ params, searchParams }: PageProps) {
  const { userId } = await params
  const { tab: rawTab = "mastery" } = await searchParams
  // 旧 tab=tasks (Phase 4-1 で削除) は mastery にフォールバック
  const normalizedTab = rawTab === "tasks" ? "mastery" : rawTab
  const tab = (VALID_TABS as readonly string[]).includes(normalizedTab)
    ? normalizedTab
    : "mastery"

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: userId },
    select: { id: true },
  })
  if (!dbUser) return <div>User not found</div>

  const internalUserId = dbUser.id

  // ── 並列取得 (calendar 用 + mastery タブ用) ──
  const [
    practiceAll,
    scoreAll,
    userGradeProgress,
    masteredSongs,
    practiceMasteryByCategory,
  ] = await Promise.all([
    // calendar 用: ストリーク + 日別達成カウント
    prisma.practicePerformance.findMany({
      where: { userId: internalUserId },
      select: { uploadedAt: true, performanceDuration: true, comparisonResultPath: true },
      orderBy: { uploadedAt: "desc" },
    }),
    prisma.performance.findMany({
      where: { userId: internalUserId },
      select: { uploadedAt: true, performanceDuration: true, comparisonResultPath: true },
      orderBy: { uploadedAt: "desc" },
    }),
    // v1.6 Phase 4-2 (mastery タブ用): UserGradeProgress
    prisma.userGradeProgress.findUnique({
      where: { userId: internalUserId },
      select: {
        currentStar: true,
        currentGrade: true,
        masteredSongCountAtCurrentStar: true,
        masterReachedAt: true,
      },
    }),
    // 完全習得曲リスト (仕様書 §2-6)
    prisma.songMastery.findMany({
      where: { userId: internalUserId, isFullyMastered: true },
      orderBy: { fullyMasteredAt: "desc" },
      take: 50,
      select: {
        scoreId: true,
        recentAverageScore: true,
        totalPerformanceCount: true,
        fullyMasteredAt: true,
        score: {
          select: {
            title: true,
            composer: true,
            star: true,
            keyTonic: true,
            keyMode: true,
          },
        },
      },
    }),
    // 練習教材マスター状況 (UserPracticeMastery を category 別に集計)
    prisma.userPracticeMastery.findMany({
      where: { userId: internalUserId, isPerformanceMastered: true },
      select: {
        practiceItem: { select: { category: true } },
      },
    }),
  ])

  // ── ストリーク計算 ──
  const allDates = [
    ...practiceAll.map(p => p.uploadedAt),
    ...scoreAll.map(p => p.uploadedAt),
  ].filter(Boolean) as Date[]
  const streak = calculateStreak(allDates)

  // ── 全期間の日別達成カウント (0..3) ──
  type PerfEntry = { performanceDuration: number | null; comparisonResultPath: string | null }
  const dayMap = new Map<string, PerfEntry[]>()
  for (const p of [...practiceAll, ...scoreAll]) {
    const dStr = toJSTDateStr(p.uploadedAt)
    if (!dayMap.has(dStr)) dayMap.set(dStr, [])
    dayMap.get(dStr)!.push(p)
  }

  const dayAchievements: Record<string, number> = {}
  for (const [dStr, entries] of dayMap.entries()) {
    const totalSec = entries.reduce((a, x) => a + (x.performanceDuration ?? 0), 0)
    const recordCount = entries.length
    const reviewCount = entries.filter(x => x.comparisonResultPath).length

    let n = 0
    if (totalSec >= 15 * 60) n++
    if (recordCount >= 1) n++
    if (reviewCount >= 2) n++

    if (n > 0) dayAchievements[dStr] = n
  }

  // ── v1.6 Phase 4-2: グレード/★データ ──
  const currentGrade: GradeLevel = isGradeLevel(userGradeProgress?.currentGrade)
    ? userGradeProgress.currentGrade
    : "BEGINNER"
  const gradeData = {
    currentStar: userGradeProgress?.currentStar ?? 1,
    currentGrade,
    masteredSongCountAtCurrentStar:
      userGradeProgress?.masteredSongCountAtCurrentStar ?? 0,
    gradeUpRequired: GRADE_UP_SONG_COUNT,
    masterReachedAt: userGradeProgress?.masterReachedAt?.toISOString() ?? null,
    isMaster: currentGrade === "MASTER",
  }

  // ── 完全習得曲リスト ──
  const masteredSongsData = masteredSongs.map(m => ({
    scoreId: m.scoreId,
    title: m.score.title,
    composer: m.score.composer,
    star: m.score.star,
    keyTonic: m.score.keyTonic,
    keyMode: m.score.keyMode,
    recentAverageScore: m.recentAverageScore,
    totalPerformanceCount: m.totalPerformanceCount,
    fullyMasteredAt: m.fullyMasteredAt?.toISOString() ?? null,
  }))

  // ── 練習教材マスターサマリ (category 別カウント) ──
  const practiceMasterySummary = { scale: 0, arpeggio: 0, etude: 0, song: 0 }
  for (const m of practiceMasteryByCategory) {
    const cat = m.practiceItem.category as keyof typeof practiceMasterySummary
    if (cat in practiceMasterySummary) practiceMasterySummary[cat] += 1
  }

  return (
    <ProgressPage
      tab={tab}
      userId={userId}
      streak={streak}
      dayAchievements={dayAchievements}
      gradeData={gradeData}
      masteredSongs={masteredSongsData}
      practiceMasterySummary={practiceMasterySummary}
    />
  )
}
