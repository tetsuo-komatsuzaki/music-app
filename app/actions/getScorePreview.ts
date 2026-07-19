"use server"

// 練習前シート用: 曲(Score)変種の 譜面URL(OSMD) + お手本ノート(Tone) を返す (2026-07-18)。
// scoreDetail の page.tsx と同じ取得ロジックを流用。難易度=別変種なので id を変えれば出し分く。
import { prisma } from "../_libs/prisma"
import { storageAdmin } from "../_libs/storageAdmin"
import { encodeSignedUrl } from "../_libs/encodeSignedUrl"
import { requireAuthAction } from "../_libs/requireAuth"
import { isValidCuid } from "../_libs/validators"

export type PreviewNote = { freq: number; start: number; end: number }
export type ScorePreview = { buildUrl: string | null; notes: PreviewNote[] }

export async function getScorePreview(scoreId: string): Promise<ScorePreview | null> {
  // 認証必須 + 所有者/共有チェック (未認証や他人の非公開曲は拒否 = IDOR 対策)
  const auth = await requireAuthAction()
  if (!auth.ok || !isValidCuid(scoreId)) return null

  const score = await prisma.score.findFirst({
    where: { id: scoreId, deletedAt: null },
    select: {
      id: true, createdById: true, isShared: true, generatedXmlPath: true,
      analysisStatus: true, buildStatus: true,
    },
  })
  if (!score) return null
  if (score.createdById !== auth.user.dbUser.id && !score.isShared) return null

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

// 基礎練/エチュード(PracticeItem)版。generatedXmlPath + analysisPath を使う。
export async function getPracticeItemPreview(itemId: string): Promise<ScorePreview | null> {
  // 練習アイテムは共有カリキュラム(管理者作成)だが、認証は必須にする
  const auth = await requireAuthAction()
  if (!auth.ok || !isValidCuid(itemId)) return null

  const item = await prisma.practiceItem.findUnique({
    where: { id: itemId },
    select: { id: true, generatedXmlPath: true, analysisPath: true, analysisStatus: true, buildStatus: true },
  })
  if (!item) return null

  const [buildUrl, notes] = await Promise.all([
    item.buildStatus === "done" && item.generatedXmlPath
      ? storageAdmin.storage.from("musicxml").createSignedUrl(item.generatedXmlPath, 300)
          .then((r) => encodeSignedUrl(r.data?.signedUrl) ?? null)
          .catch(() => null)
      : Promise.resolve(null),
    item.analysisStatus === "done" && item.analysisPath
      ? storageAdmin.storage.from("musicxml").createSignedUrl(item.analysisPath, 60)
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
