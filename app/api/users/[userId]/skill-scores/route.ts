// GET /api/users/[userId]/skill-scores
//
// v3.2.2 §15-2 — マイページの中項目スコア表示用。

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { requireAuthApi } from "@/app/_libs/requireAuth"
import { TASK_IDS, type TaskId } from "@/app/_libs/skillMaster"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId: urlUserId } = await params

  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  if (urlUserId !== auth.user.supabaseUser.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const dbUserId = auth.user.dbUser.id

  const rows = await prisma.userSkillScore.findMany({
    where: { userId: dbUserId },
    select: {
      skillTaskId: true,
      currentScore: true,
      sampleCount: true,
      lastUpdatedAt: true,
    },
  })

  const byTaskId = new Map(rows.map(r => [r.skillTaskId, r]))
  const scores: Record<TaskId, {
    currentScore: number
    sampleCount: number
    lastUpdatedAt: string | null
  }> = {} as never

  for (const taskId of TASK_IDS) {
    const r = byTaskId.get(taskId)
    scores[taskId] = {
      currentScore: r?.currentScore ?? 0,
      sampleCount: r?.sampleCount ?? 0,
      lastUpdatedAt: r?.lastUpdatedAt?.toISOString() ?? null,
    }
  }

  return NextResponse.json({ userId: urlUserId, scores })
}
