// POST /api/practice-performances/[performanceId]/feedback
//
// v3.2.2 §10 — 候補選択フィードバック送信。
// MVP では記録のみ (PerformanceSkillFeedback insert)。β で自動学習ループの種にする。

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { requireAuthApi } from "@/app/_libs/requireAuth"
import { SUB_TASK_IDS, type SubTaskId } from "@/app/_libs/skillMaster"

const FEEDBACK_TYPES = ["user_selected", "user_rejected", "user_uncertain"] as const
type FeedbackType = (typeof FEEDBACK_TYPES)[number]

const isFeedbackType = (v: unknown): v is FeedbackType =>
  typeof v === "string" && (FEEDBACK_TYPES as readonly string[]).includes(v)

const isSubTaskId = (v: unknown): v is SubTaskId =>
  typeof v === "string" && (SUB_TASK_IDS as readonly string[]).includes(v)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ performanceId: string }> },
) {
  const { performanceId } = await params

  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  const dbUserId = auth.user.dbUser.id

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }
  const b = body as Record<string, unknown>

  const positionId = typeof b.positionId === "string" ? b.positionId : null
  if (!positionId) {
    return NextResponse.json({ error: "positionId required" }, { status: 400 })
  }

  const feedbackType = b.feedbackType
  if (!isFeedbackType(feedbackType)) {
    return NextResponse.json({ error: "Invalid feedbackType" }, { status: 400 })
  }

  // user_selected の場合のみ selectedSubTaskId が必須
  let selectedSubTaskId: SubTaskId | null = null
  if (feedbackType === "user_selected") {
    if (!isSubTaskId(b.selectedSubTaskId)) {
      return NextResponse.json(
        { error: "selectedSubTaskId required for user_selected" },
        { status: 400 },
      )
    }
    selectedSubTaskId = b.selectedSubTaskId
  }

  const comment = typeof b.comment === "string" ? b.comment : null

  // 演奏の存在 + ownership 確認 (404 で他者の演奏は隠す)
  const perf = await prisma.practicePerformance.findUnique({
    where: { id: performanceId },
    select: { userId: true },
  })
  if (!perf || perf.userId !== dbUserId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const created = await prisma.performanceSkillFeedback.create({
    data: {
      practicePerformanceId: performanceId,
      userId: dbUserId,
      positionId,
      selectedSubTaskId,
      feedbackType,
      comment,
    },
    select: { id: true, createdAt: true },
  })

  return NextResponse.json({
    feedbackId: created.id,
    createdAt: created.createdAt.toISOString(),
  })
}
