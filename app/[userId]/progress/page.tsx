import { prisma } from "@/app/_libs/prisma"
import ProgressPage from "./progressPage"

type PageProps = {
  params:       Promise<{ userId: string }>
  searchParams: Promise<{ tab?: string }>
}

const VALID_TABS = ["calendar", "weakness", "summary"] as const

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
  const { tab: rawTab = "calendar" } = await searchParams
  const tab = (VALID_TABS as readonly string[]).includes(rawTab) ? rawTab : "calendar"

  const perfStart = performance.now()

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: userId },
    select: { id: true },
  })
  if (!dbUser) return <div>User not found</div>
  console.log(`[PERF] progress step1_dbUser: ${(performance.now() - perfStart).toFixed(0)}ms`)

  const internalUserId = dbUser.id

  const perfStep2 = performance.now()
  // ── 全データを一括取得（N+1解消）──
  const [practiceAll, scoreAll, weaknesses] = await Promise.all([
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
    prisma.userWeakness.findMany({
      where: { userId: internalUserId },
      orderBy: { severity: "desc" },
      take: 6,
      include: { techniqueTag: true },
    }),
  ])
  console.log(`[PERF] progress step2_parallel: ${(performance.now() - perfStep2).toFixed(0)}ms  TOTAL: ${(performance.now() - perfStart).toFixed(0)}ms`)

  // ── ストリーク計算 ──
  const allDates = [
    ...practiceAll.map(p => p.uploadedAt),
    ...scoreAll.map(p => p.uploadedAt),
  ].filter(Boolean) as Date[]

  const streak = calculateStreak(allDates)

  // ── 全期間の日別達成カウント (0..3) ──
  // 旧3リング (practice/record/review) を達成数 0..3 に集約。
  // - practice: 当日の総練習秒数 ≥ 15分
  // - record:   当日の録音回数 ≥ 1
  // - review:   当日の comparisonResult 件数 ≥ 2
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

  // ── 弱点データ ──
  const weaknessData = weaknesses.map(w => ({
    label:    w.techniqueTag?.name ?? w.weaknessKey,
    severity: w.severity,
  }))

  // ── 過去8週間のサマリー ──
  const weeklyStats: { label: string; sessions: number; pitchAvg: number | null }[] = []
  for (let w = 7; w >= 0; w--) {
    const wStart = new Date(Date.now() - (w + 1) * 7 * 86400000)
    const wEnd   = new Date(Date.now() - w * 7 * 86400000)
    const sessions = scoreAll.filter(p => p.uploadedAt >= wStart && p.uploadedAt < wEnd).length

    weeklyStats.push({
      label:    `W${8 - w}`,
      sessions,
      pitchAvg: null,
    })
  }

  return (
    <ProgressPage
      tab={tab}
      streak={streak}
      dayAchievements={dayAchievements}
      weaknessData={weaknessData}
      weeklyStats={weeklyStats}
    />
  )
}
