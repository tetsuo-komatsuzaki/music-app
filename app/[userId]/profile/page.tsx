// app/[userId]/profile/page.tsx
//
// UI 設計書 v3.1 §7 — マイページ (Server Component)。
// グレード詳細セクション + プロフィール / 設定リンク。
//
// 旧「あなたの課題」カードは 成長記録「あなたの課題」タブに移設。
// このページは グレード詳細 + フッターリンクのみ。

import { prisma } from "@/app/_libs/prisma"
import {
  GRADE_LEVELS,
  type GradeLevel,
} from "@/app/_libs/skillMaster"
import MyPage from "./myPage"

export const metadata = { title: "マイページ" }

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

export default async function ProfilePage({ params }: PageProps) {
  const { userId } = await params

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: userId },
    select: { id: true, name: true },
  })
  if (!dbUser) return <div>User not found</div>

  const internalUserId = dbUser.id

  const userGrade = await prisma.userGrade.findUnique({
    where: { userId: internalUserId },
    select: { currentGrade: true, achievedAt: true, progressData: true },
  })

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

  return (
    <MyPage
      userId={userId}
      userName={dbUser.name ?? ""}
      gradeData={gradeData}
    />
  )
}
