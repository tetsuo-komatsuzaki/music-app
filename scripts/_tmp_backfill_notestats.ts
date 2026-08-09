// Phase0-2b (2026-08-03): 過去演奏の noteStats バックフィル。
// 保存済み comparison JSON (storage/performances) から analyze_performance.py v97 と
// 同一ロジックで noteStats を再計算し、analysisSummary にマージする (再解析不要)。
// 既定は dry-run。--apply で書き込み。対象=done かつ comparisonResultPath あり かつ noteStats 未付与。
import { config } from "dotenv"
config()

const EVALUATED_STATUSES = new Set([
  "evaluated", "pitch_only",
  "double_stop_full", "double_stop_partial", "double_stop_miss",
  "harmonic_ok", "harmonic_normal_tone", "harmonic_miss",
])

type Row = {
  note_name?: string | null
  evaluation_status?: string | null
  pitch_ok?: boolean | null
  start_ok?: boolean | null
  pitch_cents_error?: number | null
  expected_pitch_hz?: number | null
}

// analyze_performance.py の noteStats 生成と同一 (v97・9f1c16b)
function computeNoteStats(results: Row[]) {
  const notes: Record<string, { target: number; pitch_miss: number; timing_miss: number; cents_sum: number; cents_n: number }> = {}
  const registers: Record<string, { target: number; pitch_miss: number; timing_miss: number }> = {}
  const transitions: Record<string, { target: number; miss: number }> = {}
  let prev: string | null = null
  for (const r of results) {
    const name = r.note_name || null
    const isEval = !!r.evaluation_status && EVALUATED_STATUSES.has(r.evaluation_status)
    if (!name) { prev = null; continue }
    if (isEval) {
      const pitchMiss = r.pitch_ok === false
      const timingMiss = r.start_ok === false
      const n = (notes[name] ??= { target: 0, pitch_miss: 0, timing_miss: 0, cents_sum: 0, cents_n: 0 })
      n.target++
      if (pitchMiss) n.pitch_miss++
      if (timingMiss) n.timing_miss++
      const ce = r.pitch_cents_error
      if (ce !== null && ce !== undefined) { n.cents_sum += Number(ce); n.cents_n++ }
      const hz = r.expected_pitch_hz
      if (hz) {
        const band = hz < 440.0 ? "low" : hz < 659.0 ? "mid" : "high"
        const b = (registers[band] ??= { target: 0, pitch_miss: 0, timing_miss: 0 })
        b.target++
        if (pitchMiss) b.pitch_miss++
        if (timingMiss) b.timing_miss++
      }
      if (prev) {
        const key = `${prev}>${name}`
        const t = (transitions[key] ??= { target: 0, miss: 0 })
        t.target++
        if (pitchMiss || timingMiss) t.miss++
      }
    }
    prev = name
  }
  const notesOut: Record<string, { target: number; pitch_miss: number; timing_miss: number; cents_avg: number | null }> = {}
  for (const [k, n] of Object.entries(notes)) {
    notesOut[k] = {
      target: n.target, pitch_miss: n.pitch_miss, timing_miss: n.timing_miss,
      cents_avg: n.cents_n ? Math.round((n.cents_sum / n.cents_n) * 10) / 10 : null,
    }
  }
  const transOut: Record<string, { target: number; miss: number }> = {}
  for (const [k, v] of Object.entries(transitions)) if (v.target >= 2) transOut[k] = v
  return { version: 1, notes: notesOut, registers, transitions: transOut }
}

async function main() {
  const APPLY = process.argv.includes("--apply")
  const { PrismaPg } = await import("@prisma/adapter-pg")
  const { PrismaClient } = await import("../app/generated/prisma/client.js")
  const { createClient } = await import("@supabase/supabase-js")
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
  const storage = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const stats = { checked: 0, updated: 0, emptyNotes: 0, noFile: 0, badJson: 0, alreadyHas: 0 }

  const process1 = async (kind: "score" | "practice", row: { id: string; comparisonResultPath: string | null; analysisSummary: unknown }) => {
    stats.checked++
    const sum = (row.analysisSummary ?? {}) as Record<string, unknown>
    if (sum.noteStats) { stats.alreadyHas++; return }
    if (!row.comparisonResultPath) { stats.noFile++; return }
    const dl = await storage.storage.from("performances").download(row.comparisonResultPath)
    if (dl.error || !dl.data) { stats.noFile++; return }
    let json: unknown
    try { json = JSON.parse(await dl.data.text()) } catch { stats.badJson++; return }
    // 新形式 {results:[...]} / 旧形式 配列直置き の両対応 (v67と同じ)
    const results: Row[] | null = Array.isArray(json)
      ? (json as Row[])
      : Array.isArray((json as { results?: Row[] }).results)
        ? (json as { results: Row[] }).results
        : null
    if (!results) { stats.badJson++; return }
    const ns = computeNoteStats(results)
    if (Object.keys(ns.notes).length === 0) { stats.emptyNotes++; return } // note_name無し旧データ等
    if (APPLY) {
      const data = { analysisSummary: { ...sum, noteStats: ns } }
      if (kind === "score") await prisma.performance.update({ where: { id: row.id }, data })
      else await prisma.practicePerformance.update({ where: { id: row.id }, data })
    }
    stats.updated++
    if (stats.updated <= 3) console.log(`  例[${kind} ${row.id}]: notes=${Object.keys(ns.notes).length} reg=${Object.keys(ns.registers).length} trans=${Object.keys(ns.transitions).length}`)
  }

  const perfs = await prisma.performance.findMany({
    where: { analysisStatus: "done" },
    select: { id: true, comparisonResultPath: true, analysisSummary: true },
  })
  for (const p of perfs) await process1("score", p)
  const pracs = await prisma.practicePerformance.findMany({
    where: { analysisStatus: "done" },
    select: { id: true, comparisonResultPath: true, analysisSummary: true },
  })
  for (const p of pracs) await process1("practice", p)

  console.log(`\n==== ${APPLY ? "APPLY" : "DRY-RUN"} ====`)
  console.log(`checked=${stats.checked} 付与${APPLY ? "済" : "可能"}=${stats.updated} 既に有=${stats.alreadyHas} note_name無=${stats.emptyNotes} ファイル無=${stats.noFile} JSON不正=${stats.badJson}`)
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
