import { prisma } from "@/app/_libs/prisma"
import { storageAdmin } from "@/app/_libs/storageAdmin"
import ScoreDetail from "./scoreDetail"
import { uploadRecord } from "@/app/actions/uploadRecord"

export default async function Page({
  params
}: {
  params: Promise<{ userId: string; scoreId: string }>
}) {
  const { userId, scoreId } = await params

  const score = await prisma.score.findUnique({
    where: { id: scoreId },
    include: {
      performances: {
        orderBy: { uploadedAt: "desc" }
      }
    }
  })

  if (!score) return <div>スコアが見つかりません</div>

  // アクセス制御: 自分のスコアまたは共有スコアのみ閲覧可
  if (score.createdById !== userId && !score.isShared) {
    return <div>このスコアへのアクセス権がありません</div>
  }

  // =========================
  // 🎼 buildUrl
  // =========================

  let buildUrl: string | null = null

  if (score.buildStatus === "done" && score.generatedXmlPath) {
    const { data } = await storageAdmin.storage
      .from("musicxml")
      .createSignedUrl(score.generatedXmlPath, 300)

    buildUrl = data?.signedUrl ?? null
  }

  // =========================
  // 📄 analysis
  // =========================

  let analysisData = null

  if (score.analysisStatus === "done") {
    const analysisPath = `${score.createdById}/${score.id}/analysis.json`

    const { data } = await storageAdmin.storage
      .from("musicxml")
      .createSignedUrl(analysisPath, 60)

    if (data?.signedUrl) {
      const res = await fetch(data.signedUrl)
      if (res.ok) {
        analysisData = await res.json()
      }
    }
  }

  // =========================
  // 🎧 performances（+ comparison_result）
  // =========================

  const performances = await Promise.all(
    score.performances.map(async (p) => {
      const { data: audioData } = await storageAdmin.storage
        .from("performances")
        .createSignedUrl(p.audioPath, 60)

      let comparisonResult = null
      let comparisonWarnings: string[] = []
      if (p.comparisonResultPath) {
        const { data: compData } = await storageAdmin.storage
          .from("performances")
          .createSignedUrl(p.comparisonResultPath, 60)

        if (compData?.signedUrl) {
          try {
            const res = await fetch(compData.signedUrl)
            if (res.ok) {
              const json = await res.json()
              // v2.0: { version, warnings, results }
              if (json.version && json.results) {
                comparisonResult = json.results
                comparisonWarnings = json.warnings || []
              } else if (Array.isArray(json)) {
                // v1.0 互換
                comparisonResult = json
              }
            }
          } catch (_e) {
            // 取得失敗は無視
          }
        }
      }

      return {
        id: p.id,
        uploadedAt: p.uploadedAt.toISOString(),
        status: p.performanceStatus,
        audioUrl: audioData?.signedUrl ?? null,
        comparisonResult: comparisonResult,
        comparisonWarnings: comparisonWarnings
      }
    })
  )

  return (
    <ScoreDetail
      score={{
        id: score.id,
        title: score.title
      }}
      performances={performances}
      analysis={analysisData}
      uploadAction={uploadRecord}
      buildUrl={buildUrl}
    />
  )
}
