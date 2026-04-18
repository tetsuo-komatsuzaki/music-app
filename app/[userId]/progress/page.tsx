import { prisma } from "@/app/_libs/prisma"
import ProgressPage from "./progressPage"

type PageProps = {
  params:       Promise<{ userId: string }>
  searchParams: Promise<{ tab?: string }>
}

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
  const { userId }   = await params
  const { tab = "streak" } = await searchParams

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

  // ── カレンダー（過去2ヶ月）──
  const todayStr = toJSTDateStr(new Date())
  const practiceDaySet = new Set(allDates.map(toJSTDateStr))

  const calendarMonths: { year: number; month: number; days: Record<string, "done" | "today" | "miss"> }[] = []
  for (let m = 0; m < 2; m++) {
    const target = new Date()
    target.setDate(1)
    target.setMonth(target.getMonth() - m)
    const year  = target.getFullYear()
    const month = target.getMonth() + 1
    const daysInMonth = new Date(year, month, 0).getDate()
    const days: Record<string, "done" | "today" | "miss"> = {}

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`
      if (dateStr > todayStr) continue
      if (dateStr === todayStr) days[dateStr] = "today"
      else if (practiceDaySet.has(dateStr)) days[dateStr] = "done"
      else days[dateStr] = "miss"
    }
    calendarMonths.push({ year, month, days })
  }
  calendarMonths.reverse()

  // ── 過去7日間の3リング（JSグルーピング — クエリ0回）──
  // 既に取得済みの practiceAll / scoreAll から日別に集計
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
  const recentPractice = practiceAll.filter(p => p.uploadedAt >= sevenDaysAgo)
  const recentScore = scoreAll.filter(p => p.uploadedAt >= sevenDaysAgo)

  // 日別にグルーピング
  type PerfEntry = { performanceDuration: number | null; comparisonResultPath: string | null }
  const dayMap = new Map<string, PerfEntry[]>()
  for (const p of [...recentPractice, ...recentScore]) {
    const dStr = toJSTDateStr(p.uploadedAt)
    if (!dayMap.has(dStr)) dayMap.set(dStr, [])
    dayMap.get(dStr)!.push(p)
  }

  type DayRings = { dateStr: string; practice: number; record: number; review: number }
  const weekRings: DayRings[] = []
  for (let i = 6; i >= 0; i--) {
    const dStr = toJSTDateStr(new Date(Date.now() - i * 86400000))
    const entries = dayMap.get(dStr) ?? []
    const totalSec = entries.reduce((a, x) => a + (x.performanceDuration ?? 0), 0)
    const recordCount = entries.length
    const reviewCount = entries.filter(x => x.comparisonResultPath).length

    weekRings.push({
      dateStr:  dStr,
      practice: Math.min(totalSec / (15 * 60), 1),
      record:   Math.min(recordCount / 1, 1),
      review:   Math.min(reviewCount / 2, 1),
    })
  }

  // ── 弱点データ ──
  const weaknessData = weaknesses.map(w => ({
    label:    w.techniqueTag?.name ?? w.weaknessKey,
    severity: w.severity,
  }))

  // ── 過去8週間のサマリー（JSグルーピング — クエリ0回）──
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
      calendarMonths={calendarMonths}
      weekRings={weekRings}
      weaknessData={weaknessData}
      weeklyStats={weeklyStats}
    />
  )
}
