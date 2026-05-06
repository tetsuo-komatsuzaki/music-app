// GET /api/users/[userId]/skill-sub-scores
//
// v3.2.2 §15-2 — マイページのカード詳細展開時の補足表示用。
// ?subTaskIds=pitch_overall,rhythm_fast で絞り込み可能。

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { requireAuthApi } from "@/app/_libs/requireAuth"
import { SUB_TASK_IDS, type SubTaskId } from "@/app/_libs/skillMaster"

const isSubTaskId = (v: string): v is SubTaskId =>
  (SUB_TASK_IDS as readonly string[]).includes(v)

function parseSubTaskIds(raw: string | null): SubTaskId[] | null {
  if (!raw) return null
  const items = raw.split(",").map(s => s.trim()).filter(Boolean)
  const filtered = items.filter(isSubTaskId)
  return filtered.length > 0 ? filtered : null
}

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

  const filter = parseSubTaskIds(new URL(request.url).searchParams.get("subTaskIds"))
  const targetIds = filter ?? [...SUB_TASK_IDS]

  const rows = await prisma.userSkillSubScore.findMany({
    where: { userId: dbUserId, skillSubTaskId: { in: targetIds } },
    select: {
      skillSubTaskId: true,
      matchedCount: true,
      totalCount: true,
      matchRate: true,
      averageScore: true,
      lastMatchedAt: true,
    },
  })

  const byId = new Map(rows.map(r => [r.skillSubTaskId, r]))
  const subScores: Record<string, {
    matchedCount: number
    totalCount: number
    matchRate: number
    averageScore: number | null
    lastMatchedAt: string | null
  }> = {}

  for (const id of targetIds) {
    const r = byId.get(id)
    subScores[id] = {
      matchedCount: r?.matchedCount ?? 0,
      totalCount: r?.totalCount ?? 0,
      matchRate: r?.matchRate ?? 0,
      averageScore: r?.averageScore ?? null,
      lastMatchedAt: r?.lastMatchedAt?.toISOString() ?? null,
    }
  }

  return NextResponse.json({ userId: urlUserId, subScores })
}
