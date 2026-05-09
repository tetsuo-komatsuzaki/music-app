import { prisma } from "@/app/_libs/prisma"
import {
  SKILL_TASKS,
  SUB_TASK_NAMES,
  TASK_NAMES,
  type SubTaskId,
  type TaskId,
} from "@/app/_libs/skillMaster"
import type { SkillTaskCardData } from "@/app/components/SkillTaskCardItem"
import ProgressPage from "./progressPage"

export const metadata = { title: "成長記録" }

type PageProps = {
  params:       Promise<{ userId: string }>
  searchParams: Promise<{ tab?: string }>
}

const VALID_TABS = ["calendar", "tasks"] as const

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

function getDisplayNames(
  cardType: "task" | "sub_task",
  skillTaskId: string | null,
  skillSubTaskId: string | null,
): { displayName: string; parentTaskName: string } {
  if (cardType === "sub_task" && skillSubTaskId) {
    const subId = skillSubTaskId as SubTaskId
    const displayName = SUB_TASK_NAMES[subId] ?? skillSubTaskId
    let parentTaskName = ""
    for (const taskId of Object.keys(SKILL_TASKS) as TaskId[]) {
      if (SKILL_TASKS[taskId].subTaskIds.includes(subId)) {
        parentTaskName = TASK_NAMES[taskId]
        break
      }
    }
    return { displayName, parentTaskName }
  }
  if (cardType === "task" && skillTaskId) {
    const taskId = skillTaskId as TaskId
    const name = TASK_NAMES[taskId] ?? skillTaskId
    return { displayName: name, parentTaskName: name }
  }
  return { displayName: "", parentTaskName: "" }
}

export default async function ProgressServerPage({ params, searchParams }: PageProps) {
  const { userId } = await params
  const { tab: rawTab = "calendar" } = await searchParams
  const tab = (VALID_TABS as readonly string[]).includes(rawTab) ? rawTab : "calendar"

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: userId },
    select: { id: true },
  })
  if (!dbUser) return <div>User not found</div>

  const internalUserId = dbUser.id

  // ── 全データを並列取得 ──
  // calendar タブ: practiceAll / scoreAll
  // tasks タブ: cards / subScores / skillScores (マイページから移設)
  const [practiceAll, scoreAll, rawCards, subScores, skillScores] = await Promise.all([
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
    prisma.userSkillTaskCard.findMany({
      where: { userId: internalUserId },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 100,
      select: {
        id: true,
        cardType: true,
        skillTaskId: true,
        skillSubTaskId: true,
        status: true,
        createdAt: true,
        improvedAt: true,
        clearedAt: true,
        lastMatchedAt: true,
      },
    }),
    prisma.userSkillSubScore.findMany({
      where: { userId: internalUserId },
      select: { skillSubTaskId: true, averageScore: true },
    }),
    prisma.userSkillScore.findMany({
      where: { userId: internalUserId },
      select: { skillTaskId: true, currentScore: true },
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

  // ── スコアマップ (sub_task / task カード共通参照用) ──
  const subScoresMap: Record<string, number | null> = {}
  for (const s of subScores) {
    if (s.skillSubTaskId) subScoresMap[s.skillSubTaskId] = s.averageScore
  }
  const skillScoresMap: Record<string, number | null> = {}
  for (const s of skillScores) {
    if (s.skillTaskId) skillScoresMap[s.skillTaskId] = s.currentScore
  }

  // ── カードデータをクライアント用に整形 ──
  const cards: SkillTaskCardData[] = rawCards.map(c => {
    const cardType = c.cardType as "task" | "sub_task"
    const { displayName, parentTaskName } = getDisplayNames(
      cardType,
      c.skillTaskId,
      c.skillSubTaskId,
    )
    return {
      id: c.id,
      cardType,
      skillTaskId: c.skillTaskId,
      skillSubTaskId: c.skillSubTaskId,
      status: c.status as "active" | "improving" | "cleared",
      createdAt: c.createdAt.toISOString(),
      improvedAt: c.improvedAt?.toISOString() ?? null,
      clearedAt: c.clearedAt?.toISOString() ?? null,
      lastMatchedAt: c.lastMatchedAt?.toISOString() ?? null,
      displayName,
      parentTaskName,
    }
  })

  return (
    <ProgressPage
      tab={tab}
      userId={userId}
      streak={streak}
      dayAchievements={dayAchievements}
      cards={cards}
      subScoresMap={subScoresMap}
      skillScoresMap={skillScoresMap}
    />
  )
}
