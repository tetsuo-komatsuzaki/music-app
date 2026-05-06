// GET /api/users/[userId]/grade
//
// v3.2.2 §10 / §15-2 — トップ画面のグレードバッジ + 進捗バー、グレードアップ通知用。
// URL の userId は supabaseUserId (page URL 規約)。

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { requireAuthApi } from "@/app/_libs/requireAuth"
import { GRADE_LEVELS, type GradeLevel } from "@/app/_libs/skillMaster"

const RECENT_GRADE_CHANGE_WINDOW_MS = 60 * 60 * 1000 // 1 時間

const NEXT_GRADE_BAND: Record<GradeLevel, { next: GradeLevel | null; difficulties: number[] }> = {
  BEGINNER: { next: "INTERMEDIATE", difficulties: [1, 2, 3] },
  INTERMEDIATE: { next: "ADVANCED", difficulties: [4, 5, 6, 7] },
  ADVANCED: { next: "MASTER", difficulties: [8, 9, 10] },
  MASTER: { next: null, difficulties: [] },
}

const PREVIOUS_GRADE: Record<GradeLevel, GradeLevel | null> = {
  BEGINNER: null,
  INTERMEDIATE: "BEGINNER",
  ADVANCED: "INTERMEDIATE",
  MASTER: "ADVANCED",
}

const isGradeLevel = (v: unknown): v is GradeLevel =>
  typeof v === "string" && (GRADE_LEVELS as readonly string[]).includes(v)

type ProgressEntry = { completed: number; required: number; practiceItemIds: string[] }

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId: urlUserId } = await params

  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  if (urlUserId !== auth.user.supabaseUser.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const dbUserId = auth.user.dbUser.id

  const showRecentChange = new URL(request.url).searchParams.get("showRecentChange") === "true"

  const userGrade = await prisma.userGrade.findUnique({
    where: { userId: dbUserId },
    select: { currentGrade: true, achievedAt: true, progressData: true },
  })

  const currentGrade: GradeLevel = isGradeLevel(userGrade?.currentGrade)
    ? userGrade.currentGrade
    : "BEGINNER"
  const progressData = (userGrade?.progressData ?? {}) as Record<string, ProgressEntry>
  const achievedAt = userGrade?.achievedAt ?? null

  // 次グレードの進捗 (§10-5)
  const band = NEXT_GRADE_BAND[currentGrade]
  let remainingCount = 0
  const nextGradeDetails: Record<string, { completed: number; required: number; remaining: number }> = {}
  for (const d of band.difficulties) {
    const dKey = String(d)
    const entry = progressData[dKey] ?? { completed: 0, required: 10, practiceItemIds: [] }
    const completed = typeof entry.completed === "number" ? entry.completed : 0
    const required = typeof entry.required === "number" ? entry.required : 10
    const remaining = Math.max(0, required - completed)
    nextGradeDetails[dKey] = { completed, required, remaining }
    remainingCount += remaining
  }

  // recentlyChanged 判定 (§10-6 — achievedAt が直近 1 時間内なら true)
  let recentlyChanged: boolean | undefined
  let previousGrade: GradeLevel | null | undefined
  if (showRecentChange) {
    recentlyChanged = !!(
      achievedAt &&
      Date.now() - achievedAt.getTime() < RECENT_GRADE_CHANGE_WINDOW_MS
    )
    if (recentlyChanged) {
      previousGrade = PREVIOUS_GRADE[currentGrade]
    }
  }

  return NextResponse.json({
    userId: urlUserId,
    currentGrade,
    achievedAt: achievedAt?.toISOString() ?? null,
    progressData,
    nextGrade: band.next,
    remainingCount,
    nextGradeDetails,
    ...(recentlyChanged !== undefined ? { recentlyChanged } : {}),
    ...(previousGrade ? { previousGrade } : {}),
  })
}
