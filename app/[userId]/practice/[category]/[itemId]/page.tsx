import { prisma } from "@/app/_libs/prisma"
import { storageAdmin } from "@/app/_libs/storageAdmin"
import ScoreDetail from "@/app/[userId]/top/[scoreId]/scoreDetail"
import { uploadPracticeRecord } from "@/app/actions/uploadPracticeRecord"

export default async function PracticeDetailPage({
  params,
}: {
  params: Promise<{ userId: string; category: string; itemId: string }>
}) {
  const { userId, category, itemId } = await params

  const item = await prisma.practiceItem.findUnique({
    where: { id: itemId },
    include: {
      techniques: {
        where: { isPrimary: true },
        include: { techniqueTag: { select: { name: true } } },
      },
    },
  })

  if (!item) return <div>練習メニューが見つかりません</div>

  // =========================
  // 🎼 buildUrl
  // =========================
  let buildUrl: string | null = null
  if (item.buildStatus === "done" && item.generatedXmlPath) {
    const { data } = await storageAdmin.storage
      .from("musicxml")
      .createSignedUrl(item.generatedXmlPath, 300)
    buildUrl = data?.signedUrl ?? null
  }

  // =========================
  // 📄 analysis
  // =========================
  let analysisData = null
  if (item.analysisStatus === "done" && item.analysisPath) {
    const { data } = await storageAdmin.storage
      .from("musicxml")
      .createSignedUrl(item.analysisPath, 60)
    if (data?.signedUrl) {
      const res = await fetch(data.signedUrl)
      if (res.ok) analysisData = await res.json()
    }
  }

  // =========================
  // 🎧 performances（+ comparison_result）
  // =========================
  const practicePerformances = await prisma.practicePerformance.findMany({
    where: { userId, practiceItemId: itemId },
    orderBy: { uploadedAt: "desc" },
  })

  const performances = await Promise.all(
    practicePerformances.map(async (p) => {
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
              if (json.version && json.results) {
                comparisonResult = json.results
                comparisonWarnings = json.warnings || []
              } else if (Array.isArray(json)) {
                comparisonResult = json
              }
            }
          } catch (_e) { /* ignore */ }
        }
      }

      return {
        id: p.id,
        uploadedAt: p.uploadedAt.toISOString(),
        status: "uploaded",
        audioUrl: audioData?.signedUrl ?? null,
        comparisonResult,
        comparisonWarnings,
      }
    })
  )

  // =========================
  // 練習メニュー固有ヘッダー + ScoreDetail再利用
  // =========================
  const categoryLabels: Record<string, string> = {
    scale: "音階", scales: "音階",
    arpeggio: "アルペジオ", arpeggios: "アルペジオ",
    etude: "エチュード", etudes: "エチュード",
  }

  return (
    <div>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 24px 0" }}>
        <div style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>
          <a href={`/${userId}/practice/${category}`} style={{ color: "#4a90d9" }}>
            ← {categoryLabels[category] || category}
          </a>
        </div>
        {item.description && (
          <div style={{ fontSize: 14, color: "#555", padding: "8px 12px", background: "#f8f9fa", borderRadius: 8, marginBottom: 8 }}>
            {item.description}
          </div>
        )}
        <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>
          {item.keyTonic} {item.keyMode === "major" ? "長調" : "短調"}
          {item.tempoMin && item.tempoMax && ` · 推奨テンポ: ${item.tempoMin}-${item.tempoMax}`}
          {item.positions.length > 0 && ` · ${item.positions.join(", ")}`}
          {item.techniques.length > 0 && ` · ${item.techniques.map(t => t.techniqueTag.name).join(", ")}`}
        </div>
      </div>

      <ScoreDetail
        score={{ id: item.id, title: item.title }}
        performances={performances}
        analysis={analysisData}
        uploadAction={uploadPracticeRecord}
        buildUrl={buildUrl}
      />
    </div>
  )
}
