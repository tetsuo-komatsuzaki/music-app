// GET /api/practice-performances/[performanceId]/diagnosis
//
// 工程C-6a (2026-07-11) — 基礎練演奏の217診断 + 弱点練習推薦（窓①）。
// Score 版 /api/performances/[id]/diagnosis とレスポンス形状を揃え、
// 画面の弱点表示コンポーネントを両方で使い回せるようにする。

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { requireAuthApi } from "@/app/_libs/requireAuth"
import { buildDiagnosisView } from "@/app/_libs/diagnosisPresentation"
import type { DiagnosisJson } from "@/app/_libs/weaknessRecommendation"

/** "1st"/"3rd" 形式 → ポジション番号（PracticeItem.positions は String[] のまま） */
function parsePositions(positions: string[]): number[] {
  return positions
    .map((p) => {
      const m = /^(\d+)/.exec(p)
      return m ? parseInt(m[1], 10) : null
    })
    .filter((n): n is number => n !== null)
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ performanceId: string }> },
) {
  const { performanceId } = await params

  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  const dbUserId = auth.user.dbUser.id

  const perf = await prisma.practicePerformance.findUnique({
    where: { id: performanceId },
    select: {
      id: true,
      userId: true,
      analysisSummary: true,
      practiceItem: {
        select: {
          title: true,
          star: true,
          keyTonic: true,
          keyMode: true,
          tempoMin: true,
          tempoMax: true,
          positions: true,
        },
      },
    },
  })
  if (!perf || perf.userId !== dbUserId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const item = perf.practiceItem
  const summary = perf.analysisSummary as { diagnosis?: DiagnosisJson } | null
  const view = await buildDiagnosisView(summary?.diagnosis, {
    star: item.star,
    keyTonic: item.keyTonic,
    keyMode: item.keyMode,
    tempo: item.tempoMin ?? item.tempoMax,
    positions: parsePositions(item.positions),
  })

  return NextResponse.json({
    performanceId: perf.id,
    scoreTitle: item.title,
    ...view,
  })
}
