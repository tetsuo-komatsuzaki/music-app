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

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: userId },
    select: { id: true },
  })
  if (!dbUser) return <div>User not found</div>

  const internalUserId = dbUser.id

  // ── 全アップロード日（ストリーク共通）──
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

  const allDates = [
    ...practiceUploads.map(p => p.uploadedAt),
    ...scoreUploads.map(p => p.uploadedAt),
  ].filter(Boolean) as Date[]

  const streak = calculateStreak(allDates)

  // ── 過去12ヶ月のカレンダー（ストリークタブ用）──
  const calendarMonths: { year: number; month: number; days: Record<string, "done" | "today" | "miss"> }[] = []
  const todayStr = toJSTDateStr(new Date())
  const practiceDaySet = new Set(allDates.map(toJSTDateStr))

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

  // ── 過去7日間の3リング（rings タブ用）──
  type DayRings = { dateStr: string; practice: number; record: number; review: number }
  const weekRings: DayRings[] = []

  for (let i = 6; i >= 0; i--) {
    const d      = new Date(Date.now() - i * 86400000)
    const dStr   = toJSTDateStr(d)
    const dStart = new Date(dStr + "T00:00:00+09:00")
    const dEnd   = new Date(dStr + "T23:59:59+09:00")

    const [pp, sp] = await Promise.all([
      prisma.practicePerformance.findMany({
        where: { userId: internalUserId, uploadedAt: { gte: dStart, lte: dEnd } },
        select: { performanceDuration: true, comparisonResultPath: true },
      }),
      prisma.performance.findMany({
        where: { userId: internalUserId, uploadedAt: { gte: dStart, lte: dEnd } },
        select: { performanceDuration: true, comparisonResultPath: true },
      }),
    ])

    const totalSec = [...pp, ...sp]
      .map(x => x.performanceDuration ?? 0)
      .reduce((a, b) => a + b, 0)
    const recordCount  = pp.length + sp.length
    const reviewCount  = [...pp, ...sp].filter(x => x.comparisonResultPath).length

    weekRings.push({
      dateStr:  dStr,
      practice: Math.min(totalSec / (15 * 60), 1),
      record:   Math.min(recordCount / 1, 1),
      review:   Math.min(reviewCount / 2, 1),
    })
  }

  // ── 弱点データ（weakness タブ用）──
  const weaknesses = await prisma.userWeakness.findMany({
    where: { userId: internalUserId },
    orderBy: { severity: "desc" },
    take: 6,
    include: { techniqueTag: true },
  })

  const weaknessData = weaknesses.map(w => ({
    label:    w.techniqueTag?.name ?? w.weaknessKey,
    severity: w.severity,
  }))

  // ── 過去8週間のサマリー（summary タブ用）──
  const weeklyStats: { label: string; sessions: number; pitchAvg: number | null }[] = []

  for (let w = 7; w >= 0; w--) {
    const wStart = new Date(Date.now() - (w + 1) * 7 * 86400000)
    const wEnd   = new Date(Date.now() - w * 7 * 86400000)

    const perfs = await prisma.performance.findMany({
      where: {
        userId:     internalUserId,
        uploadedAt: { gte: wStart, lte: wEnd },
      },
      select: { uploadedAt: true },
    })

    weeklyStats.push({
      label:    `W${8 - w}`,
      sessions: perfs.length,
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
