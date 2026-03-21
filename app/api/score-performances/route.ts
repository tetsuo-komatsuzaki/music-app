import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { storageAdmin } from "@/app/_libs/storageAdmin"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const scoreId = searchParams.get("scoreId")
  const limit   = Number(searchParams.get("limit") ?? "2")

  if (!scoreId) return NextResponse.json({ error: "scoreId required" }, { status: 400 })

  const perfs = await prisma.performance.findMany({
    where: { scoreId },
    orderBy: { uploadedAt: "desc" },
    take: limit,
    select: {
      id: true,
      uploadedAt: true,
      comparisonResultPath: true,
    },
  })

  const result = await Promise.all(
    perfs.map(async (p) => {
      let comparisonResult: any[] | null = null

      if (p.comparisonResultPath) {
        const { data } = await storageAdmin.storage
          .from("performances")
          .createSignedUrl(p.comparisonResultPath, 60)

        if (data?.signedUrl) {
          try {
            const res = await fetch(data.signedUrl)
            if (res.ok) {
              const json = await res.json()
              comparisonResult = json.results ?? json
            }
          } catch { /* ignore */ }
        }
      }

      // pitchAccuracy を事前計算
      let pitchAccuracy: number | null = null
      let timingAccuracy: number | null = null

      if (comparisonResult) {
        const evaluated = comparisonResult.filter(
          (n: any) => n.evaluation_status === "evaluated" || n.evaluation_status === "pitch_only"
        )
        if (evaluated.length > 0) {
          const pitchOk  = evaluated.filter((n: any) => n.pitch_ok === true).length
          const timingOk = evaluated.filter((n: any) => n.start_ok === true).length
          pitchAccuracy  = Math.round((pitchOk  / evaluated.length) * 100)
          timingAccuracy = Math.round((timingOk / evaluated.length) * 100)
        }
      }

      return {
        id:              p.id,
        uploadedAt:      p.uploadedAt,
        pitchAccuracy,
        timingAccuracy,
        comparisonResult,
      }
    })
  )

  return NextResponse.json(result)
}
