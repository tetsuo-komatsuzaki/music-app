"use server"

// 練習前シート用: 曲(Score)変種の 譜面URL(OSMD) + お手本ノート(Tone) を返す (2026-07-18)。
// scoreDetail の page.tsx と同じ取得ロジックを流用。難易度=別変種なので id を変えれば出し分く。
import { prisma } from "../_libs/prisma"
import { storageAdmin } from "../_libs/storageAdmin"
import { encodeSignedUrl } from "../_libs/encodeSignedUrl"

export type PreviewNote = { freq: number; start: number; end: number }
export type ScorePreview = { buildUrl: string | null; notes: PreviewNote[] }

export async function getScorePreview(scoreId: string): Promise<ScorePreview | null> {
  const score = await prisma.score.findFirst({
    where: { id: scoreId, deletedAt: null },
    select: {
      id: true, createdById: true, isShared: true, generatedXmlPath: true,
      analysisStatus: true, buildStatus: true,
    },
  })
  if (!score) return null

  const [buildUrl, notes] = await Promise.all([
    score.buildStatus === "done" && score.generatedXmlPath
      ? storageAdmin.storage.from("musicxml").createSignedUrl(score.generatedXmlPath, 300)
          .then((r) => encodeSignedUrl(r.data?.signedUrl) ?? null)
          .catch(() => null)
      : Promise.resolve(null),
    score.analysisStatus === "done"
      ? storageAdmin.storage.from("musicxml")
          .createSignedUrl(`${score.createdById}/${score.id}/analysis.json`, 60)
          .then((r) => {
            const u = encodeSignedUrl(r.data?.signedUrl)
            return u ? fetch(u) : null
          })
          .then((res) => (res?.ok ? res.json() : null))
          .then((a) => extractNotes(a))
          .catch(() => [] as PreviewNote[])
      : Promise.resolve([] as PreviewNote[]),
  ])

  return { buildUrl, notes }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractNotes(analysis: any): PreviewNote[] {
  const raw = Array.isArray(analysis?.notes) ? analysis.notes : []
  const out: PreviewNote[] = []
  for (const n of raw) {
    if (n?.type === "note" && Array.isArray(n.pitches) && n.pitches.length > 0 &&
        typeof n.start_time_sec === "number" && typeof n.end_time_sec === "number") {
      out.push({ freq: n.pitches[0], start: n.start_time_sec, end: n.end_time_sec })
    }
  }
  return out
}
