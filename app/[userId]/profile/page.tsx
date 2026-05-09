// app/[userId]/profile/page.tsx
//
// UI 設計書 v3.1 §7 — マイページ (Server Component)。
// グレード詳細 + あなたの課題 (3 タブ) を表示する。
//
// 既存の空 placeholder を本実装に置き換え (UI-10)。

import { prisma } from "@/app/_libs/prisma"
import {
  GRADE_LEVELS,
  SKILL_TASKS,
  SUB_TASK_NAMES,
  TASK_NAMES,
  type GradeLevel,
  type SubTaskId,
  type TaskId,
} from "@/app/_libs/skillMaster"
import MyPage from "./myPage"
import type { SkillTaskCardData } from "@/app/components/SkillTaskCardItem"

export const metadata = { title: "マイページ" }

// UI-8 と同じグレード境界定義
const NEXT_GRADE_BAND: Record<
  GradeLevel,
  { next: GradeLevel | null; difficulties: number[] }
> = {
  BEGINNER: { next: "INTERMEDIATE", difficulties: [1, 2, 3] },
  INTERMEDIATE: { next: "ADVANCED", difficulties: [4, 5, 6, 7] },
  ADVANCED: { next: "MASTER", difficulties: [8, 9, 10] },
  MASTER: { next: null, difficulties: [] },
}

const isGradeLevel = (v: unknown): v is GradeLevel =>
  typeof v === "string" && (GRADE_LEVELS as readonly string[]).includes(v)

type PageProps = {
  params: Promise<{ userId: string }>
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

export default async function ProfilePage({ params }: PageProps) {
  const { userId } = await params

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: userId },
    select: { id: true, name: true },
  })
  if (!dbUser) return <div>User not found</div>

  const internalUserId = dbUser.id

  // ── 全データを並列フェッチ ──
  const [userGrade, rawCards, subScores, skillScores] = await Promise.all([
    prisma.userGrade.findUnique({
      where: { userId: internalUserId },
      select: { currentGrade: true, achievedAt: true, progressData: true },
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

  // ── gradeData (UI-8 と同じ形) ──
  type ProgressEntry = {
    completed: number
    required: number
    practiceItemIds: string[]
  }
  const currentGrade: GradeLevel = isGradeLevel(userGrade?.currentGrade)
    ? userGrade.currentGrade
    : "BEGINNER"
  const progressData = (userGrade?.progressData ?? {}) as Record<
    string,
    ProgressEntry
  >
  const band = NEXT_GRADE_BAND[currentGrade]
  let remainingCount = 0
  const nextGradeDetails: Record<
    string,
    { completed: number; required: number; remaining: number }
  > = {}
  for (const d of band.difficulties) {
    const dKey = String(d)
    const entry = progressData[dKey] ?? {
      completed: 0,
      required: 10,
      practiceItemIds: [],
    }
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
  const gradeData = {
    currentGrade,
    achievedAt: userGrade?.achievedAt?.toISOString() ?? null,
    nextGrade: band.next,
    remainingCount,
    nextGradeDetails,
    totalCompleted,
    totalRequired,
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

  // ── カードデータをクライアント用に整形 (Date → ISO 文字列 + 表示名付与) ──
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
    <MyPage
      userId={userId}
      userName={dbUser.name ?? ""}
      gradeData={gradeData}
      cards={cards}
      subScoresMap={subScoresMap}
      skillScoresMap={skillScoresMap}
    />
  )
}
