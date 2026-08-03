// GET /api/performances/[id]/growth-line
//
// 成長の編み込み 案3 (2026-08-03): 採点直後の「成長1行」。
// この演奏の per_subtask を、直近30日 (この演奏より前・曲/基礎練横断) のベースラインと比べ、
// いちばん伸びたわざを返す。伸びが無ければ line: null (でっち上げない)。
//
// レスポンス: { line: { label, from, to } | null }
// 認可: Performance.userId === dbUser.id のみ、他者は404 (diagnosis と同方針)

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { requireAuthApi } from "@/app/_libs/requireAuth"
import { SKILL_SUB_DEFS } from "@/app/_libs/growthKarte"
import { SUBTASK_CATALOG } from "@/app/_libs/subtaskCatalog.generated"
import { buildSubMap, computeGrowthLine, type SkillSubDef } from "@/app/_libs/growthLine"

// 成長1行の候補: わざ系 (技術マップと同語彙・優先) + 基礎系 (診断カタログの diagnosable のみ。
// 「変化なし箱」(diagnosable=false) は診断と同じく文脈扱いで出さない)
const GROWTH_DEFS: SkillSubDef[] = [
  ...SKILL_SUB_DEFS.map((d) => ({ ...d, priority: 1 })),
  ...SUBTASK_CATALOG.filter((s) => s.v1Active && s.diagnosable)
    .map((s) => ({ label: s.name, subIds: [s.id], priority: 0 })),
]

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: performanceId } = await params

  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  const dbUserId = auth.user.dbUser.id

  const perf = await prisma.performance.findUnique({
    where: { id: performanceId },
    select: { id: true, userId: true, uploadedAt: true, analysisSummary: true },
  })
  if (!perf || perf.userId !== dbUserId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const since = new Date(perf.uploadedAt.getTime() - 30 * 864e5)
  const [prevPerfs, prevPracs] = await Promise.all([
    prisma.performance.findMany({
      where: { userId: dbUserId, uploadedAt: { gte: since, lt: perf.uploadedAt }, id: { not: perf.id } },
      select: { analysisSummary: true },
    }),
    prisma.practicePerformance.findMany({
      where: { userId: dbUserId, uploadedAt: { gte: since, lt: perf.uploadedAt } },
      select: { analysisSummary: true },
    }),
  ])

  const now = buildSubMap([perf.analysisSummary])
  const base = buildSubMap([...prevPerfs, ...prevPracs].map((r) => r.analysisSummary))
  const line = computeGrowthLine(now, base, GROWTH_DEFS)
  return NextResponse.json({ line })
}
