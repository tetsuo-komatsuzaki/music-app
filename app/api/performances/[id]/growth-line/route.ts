// GET /api/performances/[id]/growth-line
//
// 成長の編み込み 案3 (2026-08-03): 採点直後の「成長1行」。
// 分母改定 (2026-08-03/04 Tetsuo指示): 窓vs窓。now=直近30日(この演奏含む) / base=その前の30日。
// 演奏期間が30日未満なら全期間を半分に割って前半vs後半 (growthWindows)。
// どちらも曲/基礎練横断の音符合算 (各8個以上)。伸びが無ければ line: null (でっち上げない)。
//
// レスポンス: { line: { label, from, to } | null }
// 認可: Performance.userId === dbUser.id のみ、他者は404 (diagnosis と同方針)

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { requireAuthApi } from "@/app/_libs/requireAuth"
import { SKILL_SUB_DEFS } from "@/app/_libs/growthKarte"
import { SUBTASK_CATALOG } from "@/app/_libs/subtaskCatalog.generated"
import { buildSubMap, computeGrowthLine, growthWindows, type SkillSubDef } from "@/app/_libs/growthLine"
import { selectPraise } from "@/app/_libs/praiseFeedback"

// 成長1行の候補: わざ系 (技術マップと同語彙・優先) + 基礎系 (診断カタログの diagnosable のみ。
// 「変化なし箱」(diagnosable=false) は診断と同じく文脈扱いで出さない)
const GROWTH_DEFS: SkillSubDef[] = [
  ...SKILL_SUB_DEFS.map((d) => ({ ...d, priority: 1 })),
  ...SUBTASK_CATALOG.filter((s) => s.v1Active && s.diagnosable)
    .map((s) => ({ label: s.name, subIds: [s.id], priority: 0 })),
]

export async function GET(
  request: NextRequest,
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

  const [firstPerfRow, firstPracRow] = await Promise.all([
    prisma.performance.findFirst({ where: { userId: dbUserId }, orderBy: { uploadedAt: "asc" }, select: { uploadedAt: true } }),
    prisma.practicePerformance.findFirst({ where: { userId: dbUserId }, orderBy: { uploadedAt: "asc" }, select: { uploadedAt: true } }),
  ])
  const firstAt = [firstPerfRow?.uploadedAt, firstPracRow?.uploadedAt]
    .filter((d): d is Date => d != null)
    .sort((a, b) => a.getTime() - b.getTime())[0] ?? perf.uploadedAt
  // scope=single (2026-08-22 Tetsuo指示): 「その日の録音から導き出されたヒント」。
  // now = この演奏1本だけ / base = その直前30日。窓vs窓だと同期間の点が全部
  // 同じ文言になるため、上達のようすの点タップ用に演奏単位で比較する。
  const single = request.nextUrl.searchParams.get("scope") === "single"
  const { nowFrom, baseFrom, baseTo } = single
    ? { nowFrom: perf.uploadedAt, baseFrom: new Date(perf.uploadedAt.getTime() - 30 * 864e5), baseTo: perf.uploadedAt }
    : growthWindows(firstAt, perf.uploadedAt)
  const [nowPerfs, nowPracs, basePerfs, basePracs] = await Promise.all([
    prisma.performance.findMany({
      where: { userId: dbUserId, uploadedAt: { gte: nowFrom, lte: perf.uploadedAt } },
      select: { analysisSummary: true },
    }),
    prisma.practicePerformance.findMany({
      where: { userId: dbUserId, uploadedAt: { gte: nowFrom, lte: perf.uploadedAt } },
      select: { analysisSummary: true },
    }),
    prisma.performance.findMany({
      where: { userId: dbUserId, uploadedAt: { gte: baseFrom, lt: baseTo } },
      select: { analysisSummary: true },
    }),
    prisma.practicePerformance.findMany({
      where: { userId: dbUserId, uploadedAt: { gte: baseFrom, lt: baseTo } },
      select: { analysisSummary: true },
    }),
  ])

  const nowSummaries = single
    ? [perf.analysisSummary]
    : [...nowPerfs, ...nowPracs].map((r) => r.analysisSummary)
  const baseSummaries = [...basePerfs, ...basePracs].map((r) => r.analysisSummary)
  const now = buildSubMap(nowSummaries)
  const base = buildSubMap(baseSummaries)
  const line = computeGrowthLine(now, base, GROWTH_DEFS)

  // ほめフィードバック (2026-08-10): 成長1行を置き換える「今日よくできたこと」1件。
  // 苦手突破→伸び→最高 の順で1つ。ランク差はユーザー★で出し分け。
  const starRow = await prisma.userStarProgress.findUnique({
    where: { userId: dbUserId },
    select: { currentStar: true },
  })
  const praise = selectPraise(nowSummaries, baseSummaries, starRow?.currentStar ?? 1)

  // 先生の強み (2026-08-06統一): 認定された表現 (UserExpressionClear) の種類数。
  // 結果画面には件数リンクだけ出し、詳細はカルテの表現マップで見る (癖は出さない線引き)
  let strengthCount = 0
  let hasTeacher = false
  try {
    hasTeacher = (await prisma.teacherStudent.findFirst({
      where: { studentId: dbUserId }, select: { id: true },
    })) != null
    const clears = await prisma.userExpressionClear.findMany({
      where: { userId: dbUserId }, select: { moodTagId: true },
    })
    strengthCount = new Set(clears.map((c) => c.moodTagId)).size
  } catch { strengthCount = 0 }

  return NextResponse.json({ line, praise, strengthCount, hasTeacher })
}
