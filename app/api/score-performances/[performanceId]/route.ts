// DELETE /api/score-performances/[performanceId]
//
// v1.6 Phase 5 (2026-05-18) — Score 演奏 (Performance) 削除 + 累積データ再計算。
// practice 版 DELETE /api/practice-performances/[performanceId] と対称。
//
// skillRecalc は Phase 5 で Practice + Score 合算 (ノート数加重平均) に拡張済。
// Score 演奏削除でも recalculateAllForUser を走らせ skill 指標を一貫再計算する。
//
// 認可: Performance.userId === dbUser.id の演奏のみ削除可、他者/不在は 404。
// Phase 3c 累積 (SongMastery / UserGradeProgress 等) は Q1=B 永続設計のため
// 削除時の逆再計算は行わない (次演奏時に recentAverage 等は自然再計算される)。

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { requireAuthApi } from "@/app/_libs/requireAuth"
import { recalculateAllForUser } from "@/app/_libs/skillRecalc"

const TX_TIMEOUT_MS = 30_000 // 累積再計算 + 削除を含むため余裕を取る

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ performanceId: string }> },
) {
  const { performanceId } = await params

  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  const dbUserId = auth.user.dbUser.id

  const perf = await prisma.performance.findUnique({
    where: { id: performanceId },
    select: { userId: true, analysisStatus: true },
  })

  // 存在しない or 他者所有 → 404 (エンティティ列挙防止)
  if (!perf || perf.userId !== dbUserId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // 解析中は削除不可 (practice 版 §12-8 と同方針)
  if (perf.analysisStatus === "processing") {
    return NextResponse.json(
      { error: "Cannot delete while analysis is in progress" },
      { status: 409 },
    )
  }

  // PerformanceSkillFeedback は CASCADE で連動削除
  const recalculatedAt = await prisma.$transaction(
    async tx => {
      await tx.performance.delete({ where: { id: performanceId } })
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
