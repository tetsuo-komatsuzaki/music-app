import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { storageAdmin } from "@/app/_libs/storageAdmin"
import { requireAuthApi } from "@/app/_libs/requireAuth"

export async function GET(request: NextRequest) {
  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  const dbUserId = auth.user.dbUser.id

  const { searchParams } = new URL(request.url)
  const practiceItemId = searchParams.get("practiceItemId")
  const limit = Number(searchParams.get("limit") ?? "50")

  if (!practiceItemId) {
    return NextResponse.json({ error: "practiceItemId required" }, { status: 400 })
  }

  const performances = await prisma.practicePerformance.findMany({
    where: { practiceItemId, userId: dbUserId },
    orderBy: { uploadedAt: "desc" },
    take: limit,
    select: {
      id: true,
      audioPath: true,
      comparisonResultPath: true,
      uploadedAt: true,
      pitchAccuracy: true,
      timingAccuracy: true,
      overallScore: true,
      evaluatedNotes: true,
      analysisSummary: true,
    },
  })

  const results = await Promise.all(
    performances.map(async (p) => {
      const audioUrl = await storageAdmin.storage
        .from("performances")
        .createSignedUrl(p.audioPath, 3600)
        .then(r => r.data?.signedUrl ?? null)

      if (p.pitchAccuracy != null) {
        return {
          id: p.id,
          uploadedAt: p.uploadedAt,
          status: "uploaded",
          audioUrl,
          pitchAccuracy: p.pitchAccuracy,
          timingAccuracy: p.timingAccuracy,
          overallScore: p.overallScore,
          evaluatedNotes: p.evaluatedNotes,
          analysisSummary: p.analysisSummary,
          comparisonResult: null,
          comparisonWarnings: [],
        }
      }

      const compJson = p.comparisonResultPath
        ? await storageAdmin.storage
            .from("performances")
            .createSignedUrl(p.comparisonResultPath, 3600)
            .then(r => r.data?.signedUrl ? fetch(r.data.signedUrl) : null)
            .then(res => res && res.ok ? res.json() : null)
            .catch(() => null)
        : null

      let comparisonResult = null
      let comparisonWarnings: string[] = []
      let pitchAccuracy: number | null = null
      let timingAccuracy: number | null = null
      let overallScore: number | null = null

      if (compJson) {
        if (compJson.version && compJson.results) {
          comparisonResult = compJson.results
          comparisonWarnings = compJson.warnings || []
        } else if (Array.isArray(compJson)) {
          comparisonResult = compJson
        }

        if (comparisonResult) {
          const totalNotes = comparisonResult.length
          const evaluated = comparisonResult.filter(
            (n: any) => n.evaluation_status === "evaluated" || n.evaluation_status === "pitch_only"
          )
          if (totalNotes > 0) {
            const pitchOk = evaluated.filter((n: any) => n.pitch_ok === true).length
            pitchAccuracy = Math.round((pitchOk / totalNotes) * 100)
            const timingOk = evaluated.filter((n: any) => n.start_ok === true).length
            timingAccuracy = Math.round((timingOk / totalNotes) * 100)
            if (pitchAccuracy != null && timingAccuracy != null) {
              overallScore = Math.round(pitchAccuracy * 0.6 + timingAccuracy * 0.4)
            }
          }
        }
      }

      return {
        id: p.id,
        uploadedAt: p.uploadedAt,
        status: "uploaded",
        audioUrl,
        pitchAccuracy,
        timingAccuracy,
        overallScore,
        evaluatedNotes: p.evaluatedNotes,
        analysisSummary: p.analysisSummary,
        comparisonResult,
        comparisonWarnings,
      }
    })
  )

  return NextResponse.json(results)
}
