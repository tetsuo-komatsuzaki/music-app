import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { clampLimit } from "@/app/_libs/apiLimit"
import { storageAdmin } from "@/app/_libs/storageAdmin"
import { requireAuthApi } from "@/app/_libs/requireAuth"
import { isEvaluated, pitchScore } from "@/app/types/comparisonResult"

export async function GET(request: NextRequest) {
  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  const dbUserId = auth.user.dbUser.id

  const { searchParams } = new URL(request.url)
  const practiceItemId = searchParams.get("practiceItemId")
  const limit = clampLimit(searchParams.get("limit")) // DoS/NaN 防止 (1..100)

  if (!practiceItemId) {
    return NextResponse.json({ error: "practiceItemId required" }, { status: 400 })
  }

  const performances = await prisma.practicePerformance.findMany({
    where: { practiceItemId, userId: dbUserId },
    orderBy: { uploadedAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      audioPath: true,
      comparisonResultPath: true,
      uploadedAt: true,
      analysisStatus: true,
      pitchAccuracy: true,
      timingAccuracy: true,
      evaluatedNotes: true,
      analysisSummary: true,
    },
  })

  // 先生の返し (演奏へのコメント) を練習後カルテに貼り付ける (2026-08-11 Tetsuo確定)
  let teacherNoteMap = new Map<string, { body: string; teacherName: string }[]>()
  try {
    const msgs = await prisma.message.findMany({
      where: { studentId: dbUserId, fromTeacher: true, performanceId: { in: performances.map((p) => p.id) } },
      orderBy: { createdAt: "asc" },
      select: { performanceId: true, body: true, teacher: { select: { name: true } } },
    })
    for (const m of msgs) {
      if (!m.performanceId) continue
      const arr = teacherNoteMap.get(m.performanceId) ?? []
      arr.push({ body: m.body, teacherName: m.teacher.name })
      teacherNoteMap.set(m.performanceId, arr)
    }
  } catch { teacherNoteMap = new Map() }

  const results = await Promise.all(
    performances.map(async (p) => {
      const audioUrl = await storageAdmin.storage
        .from("performances")
        .createSignedUrl(p.audioPath, 3600)
        .then(r => r.data?.signedUrl ?? null)

      if (p.pitchAccuracy != null) {
        return {
          id: p.id,
          name: p.name,
          uploadedAt: p.uploadedAt,
          status: "uploaded",
        analysisStatus: p.analysisStatus,
          audioUrl,
          pitchAccuracy: p.pitchAccuracy,
          timingAccuracy: p.timingAccuracy,
          evaluatedNotes: p.evaluatedNotes,
          teacherComments: teacherNoteMap.get(p.id) ?? [],
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

      if (compJson) {
        if (compJson.version && compJson.results) {
          comparisonResult = compJson.results
          comparisonWarnings = compJson.warnings || []
        } else if (Array.isArray(compJson)) {
          comparisonResult = compJson
        }

        if (comparisonResult) {
          const totalNotes = comparisonResult.length
          // v1.7 Phase F: 重音/ハーモニクス新 status を集計対象に含め、△は0.5点で寄与
          const evaluated = comparisonResult.filter(isEvaluated)
          if (totalNotes > 0) {
            const pitchOkSum = evaluated.reduce(
              (sum: number, n: any) => sum + pitchScore(n), 0)
            pitchAccuracy = Math.round((pitchOkSum / totalNotes) * 100)
            // 2026-08-27: タイミングの分母から測定不能を外す (解析側と同一の規則)。
            // pitch_only = 同じ音が続く区間 と タイの後半。音が途切れず開始時刻を測れない。
            // not_detected は「弾かれていない」なので分母に残す。
            const timingPool = comparisonResult.filter(
              (n: any) => n.evaluation_status !== "pitch_only")
            const timingOk = timingPool.filter((n: any) => n.start_ok === true).length
            timingAccuracy = timingPool.length > 0
              ? Math.round((timingOk / timingPool.length) * 100)
              : null
          }
        }
      }

      return {
        id: p.id,
        name: p.name,
        uploadedAt: p.uploadedAt,
        status: "uploaded",
        analysisStatus: p.analysisStatus,
        audioUrl,
        pitchAccuracy,
        timingAccuracy,
        evaluatedNotes: p.evaluatedNotes,
          teacherComments: teacherNoteMap.get(p.id) ?? [],
        analysisSummary: p.analysisSummary,
        comparisonResult,
        comparisonWarnings,
      }
    })
  )

  return NextResponse.json(results)
}
