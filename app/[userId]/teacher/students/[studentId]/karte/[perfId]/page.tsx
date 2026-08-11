// 先生: 練習後カルテ1枚 (録音+分析を見て、癖・コメントを書く場)。2026-08-11 先生カルテv3 第2段②。
// 認可は annotate ルートに倣う。kind (score/practice) は ?kind= で受ける。
import { redirect } from "next/navigation"
import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { storageAdmin } from "@/app/_libs/storageAdmin"
import { encodeSignedUrl } from "@/app/_libs/encodeSignedUrl"
import { categoryLabel } from "@/app/_libs/practiceConstants"
import { SUBTASK_BY_ID } from "@/app/_libs/subtaskCatalog.generated"
import { OBSERVATION_TAG_BY_ID } from "@/app/_libs/observationCatalog"
import { getDailyLessonsForUserScore } from "@/app/_libs/dailyLessons"
import KarteDetailClient from "./KarteDetailClient"

export const metadata = { title: "練習後カルテ" }

type WeakSlot = { name: string; tree: "音程" | "リズム"; miss: number; target: number }
function topWeak(analysisSummary: unknown): WeakSlot[] {
  const dj = (analysisSummary as { diagnosis?: {
    map_available?: boolean
    per_subtask?: Record<string, { miss: number; target: number }>
    diagnosis?: { pitch?: string[]; rhythm?: string[] }
  } })?.diagnosis
  if (!dj || !dj.map_available) return []
  const out: WeakSlot[] = []
  for (const tree of ["pitch", "rhythm"] as const) {
    for (const sid of dj.diagnosis?.[tree] ?? []) {
      const def = SUBTASK_BY_ID[sid]
      if (!def || !def.diagnosable) continue
      const c = dj.per_subtask?.[sid] ?? { miss: 0, target: 0 }
      out.push({ name: def.name, tree: tree === "pitch" ? "音程" : "リズム", miss: c.miss, target: c.target })
    }
  }
  return out.slice(0, 4)
}

// ルールベースのAI候補: 弱点の語から観測タグ(癖)を推定 (LLM不使用)
const KEYWORD_OBS: { kw: RegExp; tag: string }[] = [
  { kw: /移弦/, tag: "bow_elbow_lag" },
  { kw: /スタッカート|スピッカート|トレモロ|跳ね/, tag: "bow_wrist_stiff" },
  { kw: /重音|押さえ|和音/, tag: "left_press_hard" },
  { kw: /ポジション|移動|シフト/, tag: "left_shift_tense" },
  { kw: /ビブラート/, tag: "tone_vibrato" },
]
function suggestObs(weak: WeakSlot[]): { id: string; label: string }[] {
  const ids = new Set<string>()
  for (const w of weak) for (const { kw, tag } of KEYWORD_OBS) if (kw.test(w.name)) ids.add(tag)
  return [...ids].map((id) => ({ id, label: OBSERVATION_TAG_BY_ID[id]?.label ?? id })).filter((t) => OBSERVATION_TAG_BY_ID[t.id])
}

export default async function KarteDetailPage({
  params, searchParams,
}: {
  params: Promise<{ userId: string; studentId: string; perfId: string }>
  searchParams: Promise<{ kind?: string }>
}) {
  const { userId, studentId, perfId } = await params
  const { kind: kindRaw } = await searchParams
  const kind: "score" | "practice" = kindRaw === "practice" ? "practice" : "score"

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) redirect(`/${userId}`)
  const me = await prisma.user.findUnique({ where: { supabaseUserId: userId }, select: { id: true, role: true } })
  if (!me || me.role !== "teacher") redirect(`/${userId}`)
  const link = await prisma.teacherStudent.findUnique({
    where: { teacherId_studentId: { teacherId: me.id, studentId } }, select: { id: true },
  })
  if (!link) redirect(`/${userId}/teacher`)

  const backHref = `/${userId}/teacher/students/${studentId}`
  const avg2 = (p: number | null, t: number | null) => Math.round(((p ?? 0) + (t ?? 0)) / 2)

  let title = "演奏"; let cat = "曲"; let star: number | null = null
  let pitch = 0; let timing = 0; let avg = 0; let weak: WeakSlot[] = []
  let audioPath: string | null = null; let date = ""
  let scoreId: string | null = null
  let itemId: string | null = null

  if (kind === "score") {
    const p = await prisma.performance.findFirst({
      where: { id: perfId, userId: studentId },
      select: { uploadedAt: true, pitchAccuracy: true, timingAccuracy: true, audioPath: true, analysisSummary: true, rangeFromNote: true, scoreId: true, score: { select: { title: true, star: true } } },
    })
    if (!p) redirect(backHref)
    title = p.score?.title ?? "曲"; star = p.score?.star ?? null; cat = p.rangeFromNote != null ? "曲（区間）" : "曲"
    pitch = Math.round(p.pitchAccuracy ?? 0); timing = Math.round(p.timingAccuracy ?? 0); avg = avg2(p.pitchAccuracy, p.timingAccuracy)
    weak = topWeak(p.analysisSummary); audioPath = p.audioPath; date = `${p.uploadedAt.getMonth() + 1}/${p.uploadedAt.getDate()}`
    scoreId = p.scoreId
  } else {
    const p = await prisma.practicePerformance.findFirst({
      where: { id: perfId, userId: studentId },
      select: { uploadedAt: true, pitchAccuracy: true, timingAccuracy: true, audioPath: true, analysisSummary: true, practiceItemId: true, practiceItem: { select: { title: true, category: true, star: true } } },
    })
    if (!p) redirect(backHref)
    title = p.practiceItem?.title ?? "教材"; star = p.practiceItem?.star ?? null
    itemId = p.practiceItemId
    cat = p.practiceItem?.category ? categoryLabel(p.practiceItem.category) : "基礎練"
    pitch = Math.round(p.pitchAccuracy ?? 0); timing = Math.round(p.timingAccuracy ?? 0); avg = avg2(p.pitchAccuracy, p.timingAccuracy)
    weak = topWeak(p.analysisSummary); audioPath = p.audioPath; date = `${p.uploadedAt.getMonth() + 1}/${p.uploadedAt.getDate()}`
  }

  const audioUrl = audioPath
    ? await storageAdmin.storage.from("performances").createSignedUrl(audioPath, 600).then((x) => encodeSignedUrl(x.data?.signedUrl)).catch(() => null)
    : null

  // この曲について生徒のホームに出ている「毎日の基礎練」(4教材) + 既存の練習ポイント
  // (migration未適用環境でも落ちないよう read防御)
  let materials: { itemId: string; label: string; category: string; star: number | null; point: string }[] = []
  if (kind === "score" && scoreId) {
    try {
      const lessons = await getDailyLessonsForUserScore(studentId, scoreId)
      let noteMap = new Map<string, string>()
      try {
        const notes = await prisma.teacherMaterialNote.findMany({
          where: { teacherId: me.id, studentId, practiceItemId: { in: lessons.map((l) => l.itemId) } },
          select: { practiceItemId: true, point: true },
        })
        noteMap = new Map(notes.map((n) => [n.practiceItemId, n.point]))
      } catch { noteMap = new Map() }
      materials = lessons.map((l) => ({
        itemId: l.itemId, label: l.label, category: l.category, star: l.star,
        point: noteMap.get(l.itemId) ?? "",
      }))
    } catch { materials = [] }
  }

  // この演奏が「提出された宿題」なら、最下部に合格セクションを出す (2026-08-11 Tetsuo確定)
  let hwForPerf: { id: string; targetScore: number | null; passed: boolean } | null = null
  try {
    const hw = await prisma.assignment.findFirst({
      where: { teacherId: me.id, studentId, submittedPerformanceId: perfId },
      orderBy: { createdAt: "desc" },
      select: { id: true, targetScore: true, passedAt: true },
    })
    if (hw) hwForPerf = { id: hw.id, targetScore: hw.targetScore, passed: hw.passedAt != null }
  } catch { hwForPerf = null }

  return (
    <KarteDetailClient
      hwForPerf={hwForPerf}
      materials={materials}
      backHref={backHref}
      userId={userId}
      scoreId={scoreId}
      itemId={itemId}
      studentId={studentId}
      perfId={perfId}
      kind={kind}
      title={title}
      cat={cat}
      star={star}
      date={date}
      pitch={pitch}
      timing={timing}
      avg={avg}
      weak={weak}
      audioUrl={audioUrl}
      aiTags={suggestObs(weak)}
    />
  )
}
