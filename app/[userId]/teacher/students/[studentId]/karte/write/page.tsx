// 練習後カルテ入力画面 (2026-08-11 Tetsuo確定): カルテは曲/教材にぶら下がる独立エンティティ。
// 曲別タブの「練習後カルテを書く」から遷移。直近の演奏を聴きながら、
// カルテ本文・癖(わざ先行)・表現認定・おすすめ練習ポイントをまとめて書く場。
import { redirect } from "next/navigation"
import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { storageAdmin } from "@/app/_libs/storageAdmin"
import { encodeSignedUrl } from "@/app/_libs/encodeSignedUrl"
import { categoryLabel } from "@/app/_libs/practiceConstants"
import { SUBTASK_BY_ID } from "@/app/_libs/subtaskCatalog.generated"
import { OBSERVATION_TAG_BY_ID } from "@/app/_libs/observationCatalog"
import { getDailyLessonsForUserScore } from "@/app/_libs/dailyLessons"
import { buildTargetHeatmap } from "@/app/_libs/fingerboard/aggregate"
import type { HeatmapData } from "@/app/_libs/fingerboard/heatmapTypes"
import KarteWriteClient from "./KarteWriteClient"

export const metadata = { title: "練習後カルテを書く" }

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

export default async function KarteWritePage({
  params, searchParams,
}: {
  params: Promise<{ userId: string; studentId: string }>
  searchParams: Promise<{ kind?: string; target?: string }>
}) {
  const { userId, studentId } = await params
  const { kind: kindRaw, target } = await searchParams
  const kind: "score" | "practice" = kindRaw === "practice" ? "practice" : "score"
  const backHref = `/${userId}/teacher/students/${studentId}?tab=karte`
  if (!target) redirect(backHref)

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) redirect(`/${userId}`)
  const me = await prisma.user.findUnique({ where: { supabaseUserId: userId }, select: { id: true, role: true } })
  if (!me || me.role !== "teacher") redirect(`/${userId}`)
  const link = await prisma.teacherStudent.findUnique({
    where: { teacherId_studentId: { teacherId: me.id, studentId } }, select: { id: true },
  })
  if (!link) redirect(`/${userId}/teacher`)

  const avg2 = (p: number | null, t: number | null) => Math.round(((p ?? 0) + (t ?? 0)) / 2)
  const fmtMD = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`

  // 対象 (曲 or 教材) と、聴きながら書くための直近の演奏 (音声つき・5件)
  let title = "曲"; let cat = "曲"; let star: number | null = null
  type PerfRow = { id: string; date: string; pitch: number; timing: number; avg: number; audioPath: string | null; weak: WeakSlot[]; comparisonResultPath: string | null }
  let perfs: PerfRow[] = []

  let sheetUrl: string | null = null
  if (kind === "score") {
    const score = await prisma.score.findUnique({ where: { id: target }, select: { title: true, star: true, buildStatus: true, generatedXmlPath: true } })
    if (!score) redirect(backHref)
    title = score.title; star = score.star ?? null
    if (score.buildStatus === "done" && score.generatedXmlPath) {
      sheetUrl = await storageAdmin.storage.from("musicxml").createSignedUrl(score.generatedXmlPath, 1800)
        .then((x) => encodeSignedUrl(x.data?.signedUrl)).catch(() => null)
    }
    const rows = await prisma.performance.findMany({
      where: { userId: studentId, scoreId: target, pitchAccuracy: { not: null } },
      orderBy: { uploadedAt: "desc" }, take: 5,
      select: { id: true, uploadedAt: true, pitchAccuracy: true, timingAccuracy: true, audioPath: true, analysisSummary: true, comparisonResultPath: true },
    })
    perfs = rows.map((p) => ({
      id: p.id, date: fmtMD(p.uploadedAt),
      pitch: Math.round(p.pitchAccuracy ?? 0), timing: Math.round(p.timingAccuracy ?? 0), avg: avg2(p.pitchAccuracy, p.timingAccuracy),
      audioPath: p.audioPath, weak: topWeak(p.analysisSummary), comparisonResultPath: p.comparisonResultPath,
    }))
  } else {
    const item = await prisma.practiceItem.findUnique({ where: { id: target }, select: { title: true, category: true, star: true, buildStatus: true, generatedXmlPath: true } })
    if (!item) redirect(backHref)
    title = item.title; star = item.star ?? null; cat = categoryLabel(item.category)
    if (item.buildStatus === "done" && item.generatedXmlPath) {
      sheetUrl = await storageAdmin.storage.from("musicxml").createSignedUrl(item.generatedXmlPath, 1800)
        .then((x) => encodeSignedUrl(x.data?.signedUrl)).catch(() => null)
    }
    const rows = await prisma.practicePerformance.findMany({
      where: { userId: studentId, practiceItemId: target, pitchAccuracy: { not: null } },
      orderBy: { uploadedAt: "desc" }, take: 5,
      select: { id: true, uploadedAt: true, pitchAccuracy: true, timingAccuracy: true, audioPath: true, analysisSummary: true, comparisonResultPath: true },
    })
    perfs = rows.map((p) => ({
      id: p.id, date: fmtMD(p.uploadedAt),
      pitch: Math.round(p.pitchAccuracy ?? 0), timing: Math.round(p.timingAccuracy ?? 0), avg: avg2(p.pitchAccuracy, p.timingAccuracy),
      audioPath: p.audioPath, weak: topWeak(p.analysisSummary), comparisonResultPath: p.comparisonResultPath,
    }))
  }

  // 音声の署名URL (直近5件のみなので一括発行OK)
  const performances = await Promise.all(perfs.map(async (p) => ({
    id: p.id, date: p.date, pitch: p.pitch, timing: p.timing, avg: p.avg, weak: p.weak,
    audioUrl: p.audioPath
      ? await storageAdmin.storage.from("performances").createSignedUrl(p.audioPath, 600).then((x) => encodeSignedUrl(x.data?.signedUrl)).catch(() => null)
      : null,
    // 採点スコアモーダル用: この演奏の comparison_result 署名URL
    comparisonUrl: p.comparisonResultPath
      ? await storageAdmin.storage.from("performances").createSignedUrl(p.comparisonResultPath, 1800).then((x) => encodeSignedUrl(x.data?.signedUrl)).catch(() => null)
      : null,
  })))

  // AI候補 (全演奏の弱点を合算して推定)
  const aiTags = suggestObs(perfs.flatMap((p) => p.weak))

  // 指板ヒートマップ (2026-08-11 Tetsuo確定・案5): この曲/教材の全演奏を合算。
  // 音程FBは文章ではなく指板で見せる。先生はセルをマークして「気をつける音」を渡せる
  let heatmap: HeatmapData = { cells: {}, details: {}, perfCount: 0 }
  try { heatmap = await buildTargetHeatmap(studentId, kind, target) } catch { /* storage不通でも画面は出す */ }
  let marks: { cellId: string; note: string }[] = []
  try {
    marks = (await prisma.teacherMarkedCell.findMany({
      where: { teacherId: me.id, studentId },
      select: { cellId: true, note: true },
    })).map((m) => ({ cellId: m.cellId, note: m.note }))
  } catch { marks = [] }

  // 以前指摘した癖 (未克服) の一覧: 「直った」チェック用 (2026-08-11 Tetsuo指示)。
  // タグごとの最新記録の severity が resolved 以外のものを出す
  let pastKuse: { tagId: string; label: string; date: string }[] = []
  try {
    const rows = await prisma.teacherObservation.findMany({
      where: { teacherId: me.id, studentId },
      orderBy: { createdAt: "desc" }, take: 40,
      select: { tagIds: true, severity: true, createdAt: true },
    })
    const latest = new Map<string, { severity: string | null; at: Date }>()
    for (const r of rows) for (const t of r.tagIds) {
      if (!latest.has(t)) latest.set(t, { severity: r.severity, at: r.createdAt })
    }
    pastKuse = [...latest.entries()]
      .filter(([t, v]) => v.severity !== "resolved" && OBSERVATION_TAG_BY_ID[t])
      .map(([t, v]) => ({ tagId: t, label: OBSERVATION_TAG_BY_ID[t].label, date: fmtMD(v.at) }))
      .slice(0, 8)
  } catch { pastKuse = [] }

  // この曲/教材が提出済み・未合格の宿題なら、合格判断の項目を出す (2026-08-11 Tetsuo指示)
  let hw: { id: string; targetScore: number | null; submittedScore: number | null } | null = null
  try {
    const row = await prisma.assignment.findFirst({
      where: {
        teacherId: me.id, studentId,
        ...(kind === "score" ? { scoreId: target } : { practiceItemId: target }),
        submittedAt: { not: null }, passedAt: null,
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, targetScore: true, submittedScore: true },
    })
    if (row) hw = { id: row.id, targetScore: row.targetScore, submittedScore: row.submittedScore }
  } catch { hw = null }

  // この曲について生徒のホームに出ている「毎日の基礎練」+ 既存の練習ポイント (曲のみ)
  let materials: { itemId: string; label: string; category: string; star: number | null; point: string }[] = []
  if (kind === "score") {
    try {
      const lessons = await getDailyLessonsForUserScore(studentId, target)
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

  return (
    <KarteWriteClient
      backHref={backHref}
      userId={userId}
      studentId={studentId}
      kind={kind}
      targetId={target}
      title={title}
      cat={cat}
      star={star}
      performances={performances}
      aiTags={aiTags}
      materials={materials}
      heatmap={heatmap}
      marks={marks}
      hw={hw}
      sheetUrl={sheetUrl}
      pastKuse={pastKuse}
    />
  )
}
