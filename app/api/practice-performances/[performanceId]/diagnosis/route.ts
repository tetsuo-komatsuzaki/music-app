// GET /api/practice-performances/[performanceId]/diagnosis
//
// 工程C-6a (2026-07-11) — 基礎練演奏の217診断 + 弱点練習推薦（窓①）。
// Score 版 /api/performances/[id]/diagnosis とレスポンス形状を揃え、
// 画面の弱点表示コンポーネントを両方で使い回せるようにする。

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { requireAuthApi } from "@/app/_libs/requireAuth"
import { buildDiagnosisView } from "@/app/_libs/diagnosisPresentation"

/** "1st"/"3rd" 形式 → ポジション番号 */
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
      practiceItemId: true,
      analysisStatus: true,
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
  // ノート属性ストア版 (2026-09-05): その演奏の明細から束ねる。崩壊判定だけ analysisSummary から受け取る
  const summary = perf.analysisSummary as { diagnosis?: { collapse?: { collapsed?: unknown[]; is_clean?: boolean } } } | null
  const view = await buildDiagnosisView({
    kind: "practice",
    performanceId: perf.id,
    userId: perf.userId,
    targetId: perf.practiceItemId,
    star: item.star,
    key: { tonic: item.keyTonic, mode: item.keyMode },
    collapse: summary?.diagnosis?.collapse ?? null,
  })

  return NextResponse.json({
    performanceId: perf.id,
    scoreTitle: item.title,
    // C-6b: 旧skill-detail後継として解析状態も返す (シェルの解析中ポーリング用)
    analysisStatus: perf.analysisStatus,
    ...view,
  })
}
