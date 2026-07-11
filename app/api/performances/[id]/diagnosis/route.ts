// GET /api/performances/[id]/diagnosis
//
// 工程C-6a (2026-07-11) — 演奏直後の217診断 + 弱点練習推薦（窓①）。
// 旧 /skill-detail (55体系) の後継。旧ルートはC-6bの完全撤去まで並走させる
// （URLを分けるのはデプロイ中の新旧JS混在とロールバックを安全にするため）。
//
// レスポンス: DiagnosisView
//   verdict: "perfect" | "no_specific" | "weakness" | "unavailable"
//   slots[]: 弱点最大4（音程2+リズム2）× 推薦教材 + 内訳文
//   collapse: 崩壊小節
//
// 認可: Performance.userId === dbUser.id のみ、他者は404（列挙防止・旧ルートと同方針）

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { requireAuthApi } from "@/app/_libs/requireAuth"
import { buildDiagnosisView } from "@/app/_libs/diagnosisPresentation"
import type { DiagnosisJson } from "@/app/_libs/weaknessRecommendation"

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
    select: {
      id: true,
      userId: true,
      analysisSummary: true,
      score: {
        select: {
          title: true,
          star: true,
          keyTonic: true,
          keyMode: true,
          defaultTempo: true,
          positions: true,
        },
      },
    },
  })
  if (!perf || perf.userId !== dbUserId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const summary = perf.analysisSummary as { diagnosis?: DiagnosisJson } | null
  const view = await buildDiagnosisView(summary?.diagnosis, {
    star: perf.score.star,
    keyTonic: perf.score.keyTonic,
    keyMode: perf.score.keyMode,
    tempo: perf.score.defaultTempo,
    positions: perf.score.positions,
  })

  return NextResponse.json({
    performanceId: perf.id,
    scoreTitle: perf.score.title,
    ...view,
  })
}
