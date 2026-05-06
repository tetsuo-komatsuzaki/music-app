// DELETE /api/practice-performances/[performanceId]
//
// v3.2.2 §10 / §12 — 演奏削除 + 累積データ再計算 (transaction)。

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { requireAuthApi } from "@/app/_libs/requireAuth"
import { recalculateAllForUser } from "@/app/_libs/skillRecalc"

const TX_TIMEOUT_MS = 30_000 // 累積再計算 4 関数 + 削除を含むため余裕を取る

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

  // PerformanceSkillFeedback は CASCADE で連動削除 (schema.prisma:426)
  const recalculatedAt = await prisma.$transaction(
    async tx => {
      await tx.practicePerformance.delete({ where: { id: performanceId } })
      await recalculateAllForUser(tx, dbUserId)
      return new Date()
    },
    { timeout: TX_TIMEOUT_MS },
  )

  return NextResponse.json({
    deleted: true,
    performanceId,
    recalculatedAt: recalculatedAt.toISOString(),
  })
}
