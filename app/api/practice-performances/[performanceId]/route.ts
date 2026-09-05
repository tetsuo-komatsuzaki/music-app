// DELETE /api/practice-performances/[performanceId]
//
// 演奏削除。C-6b掃除 (2026-07-11): 旧skill指標の再計算 (skillRecalc) は退役。
// 新体系の記録 (診断・達成) は遡及なし原則のため削除時の再計算はしない。

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { requireAuthApi } from "@/app/_libs/requireAuth"
import { deleteNoteStoreForPerformance } from "@/app/_libs/noteStore"

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ performanceId: string }> },
) {
  const { performanceId } = await params

  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  const dbUserId = auth.user.dbUser.id

  const perf = await prisma.practicePerformance.findUnique({
    where: { id: performanceId },
    select: { userId: true, analysisStatus: true },
  })

  // 存在しない or 他者所有 → 404 (エンティティ列挙防止)
  if (!perf || perf.userId !== dbUserId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // §12-8: 解析中は削除不可
  if (perf.analysisStatus === "processing") {
    return NextResponse.json(
      { error: "Cannot delete while analysis is in progress" },
      { status: 409 },
    )
  }

  // PerformanceSkillFeedback は CASCADE で連動削除 (schema.prisma)。
  // 演奏の明細 (PerformanceNote) は外部キーで結ばれていないので先に消す (F13・2026-09-05)
  try { await deleteNoteStoreForPerformance("practice", performanceId) } catch (e) { console.error("[practice-performance delete] PerformanceNote cleanup failed:", e) }
  await prisma.practicePerformance.delete({ where: { id: performanceId } })

  return NextResponse.json({ deleted: true, performanceId })
}
