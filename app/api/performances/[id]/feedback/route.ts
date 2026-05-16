// GET / POST /api/performances/[id]/feedback
//
// v1.6 Phase 4-3 (2026-05-16) — Score 演奏 (Performance) に対するフィードバック API。
// 仕様書 v1.6 §10 / Q1=(i) / Q2=(a) 確定。
//
// 命名注記 (Q2=(a) で仕様書 v1.6 を「正」とする運用):
//   この endpoint は **Score Performance 専用** (Score 演奏ループに対するフィードバック)。
//   練習教材 (PracticePerformance) のフィードバックは
//   /api/practice-performances/[performanceId]/feedback (POST のみ) を使う。
//   将来統合する場合は v2 API で再設計。
//
// 認可 (Q6=(a) 確定): Performance.userId === dbUser.id の演奏のみ閲覧/投稿可。
//   別ユーザーの Performance に対する GET / POST は 404 (存在を隠す)。
//
// 冪等性 (Q1=(i) 確定):
//   非冪等 INSERT-only (Practice 版と同等の挙動)。
//   同 positionId 連打で重複レコード作成される。MVP 仕様、β で改善検討。

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

// 演奏の存在 + ownership 確認共通ヘルパー
async function assertOwnPerformance(
  performanceId: string,
  dbUserId: string,
): Promise<NextResponse | null> {
  const perf = await prisma.performance.findUnique({
    where: { id: performanceId },
    select: { userId: true },
  })
  if (!perf || perf.userId !== dbUserId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return null
}

// ─── GET: 本人の feedback 一覧取得 ──────────────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: performanceId } = await params

  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  const dbUserId = auth.user.dbUser.id

  // 認可: 本人の Performance のみ閲覧可
  const reject = await assertOwnPerformance(performanceId, dbUserId)
  if (reject) return reject

  const feedbacks = await prisma.performanceSkillFeedback.findMany({
    where: { performanceId, userId: dbUserId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      positionId: true,
      feedbackType: true,
      selectedSubTaskId: true,
      comment: true,
      createdAt: true,
    },
  })

  return NextResponse.json({
    feedbacks: feedbacks.map((f) => ({
      ...f,
      createdAt: f.createdAt.toISOString(),
    })),
  })
}

// ─── POST: feedback 投稿 (非冪等 INSERT-only、Practice 版と同等) ────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: performanceId } = await params

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

  // 認可: 本人の Performance のみ POST 可
  const reject = await assertOwnPerformance(performanceId, dbUserId)
  if (reject) return reject

  // 非冪等 INSERT (Q1=(i) 確定、Practice 版と同等)
  const created = await prisma.performanceSkillFeedback.create({
    data: {
      performanceId,
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
