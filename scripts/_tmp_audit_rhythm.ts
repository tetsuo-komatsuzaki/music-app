import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { createClient } from "@supabase/supabase-js"
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })
function R(j:any){return Array.isArray(j)?j:j.results}

async function main() {
  const perf = await prisma.performance.findUnique({
    where: { id: "cmpl3o87b000004l2432ihozo" },
    select: { comparisonResultPath: true, pitchAccuracy: true, rhythmAccuracy: true, timingAccuracy: true, evaluatedNotes: true },
  })
  console.log(`DB: pitch=${perf!.pitchAccuracy} rhythm=${perf!.rhythmAccuracy} timing=${perf!.timingAccuracy} evalNotes=${perf!.evaluatedNotes}`)
  const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  let path = perf!.comparisonResultPath!
  if (path.startsWith("performances/")) path = path.slice("performances/".length)
  const { data } = await supa.storage.from("performances").download(path)
  const results = R(JSON.parse(await data!.text()))
  console.log(`\nTotal notes: ${results.length}`)

  let startOkTrue = 0, startOkFalse = 0, startOkNull = 0
  let pitchOkTrue = 0, pitchOkFalse = 0, pitchOkNull = 0
  const statusCounts: Record<string, number> = {}
  const orangeNotes: any[] = []
  const greenNotes: any[] = []
  const otherNotes: any[] = []

  for (const r of results) {
    statusCounts[r.evaluation_status] = (statusCounts[r.evaluation_status]??0) + 1
    if (r.start_ok === true) startOkTrue++
    else if (r.start_ok === false) startOkFalse++
    else startOkNull++
    if (r.pitch_ok === true) pitchOkTrue++
    else if (r.pitch_ok === false) pitchOkFalse++
    else pitchOkNull++

    // UI 色判定 (scoreDetail.tsx の getComparisonColor を再現)
    if (r.evaluation_status === "spectral_inconclusive" ||
        r.evaluation_status === "not_evaluated" ||
        r.evaluation_status === "section_missing" ||
        r.evaluation_status === "not_detected") {
      otherNotes.push({ status: "GREY", ...r })
    } else if (r.evaluation_status === "double_stop_partial" ||
               r.evaluation_status === "harmonic_normal_tone") {
      orangeNotes.push({ status: "ORANGE_partial", ...r })
    } else if (r.pitch_ok === false) {
      otherNotes.push({ status: "RED_pitch", ...r })
    } else if (r.evaluation_status === "evaluated" && r.start_ok === false) {
      orangeNotes.push({ status: "ORANGE_timing", ...r })
    } else {
      greenNotes.push({ status: "GREEN", ...r })
    }
  }
  console.log(`\nstatus counts:`, statusCounts)
  console.log(`pitch_ok: T=${pitchOkTrue} F=${pitchOkFalse} N=${pitchOkNull}`)
  console.log(`start_ok: T=${startOkTrue} F=${startOkFalse} N=${startOkNull}`)
  console.log(`\nUI color counts: GREEN=${greenNotes.length} ORANGE=${orangeNotes.length} 他=${otherNotes.length}`)
  console.log(`\nORANGE notes:`)
  for (const r of orangeNotes) {
    console.log(`  ${r.status} i${r.note_index} M${r.measure_number} ${r.note_name} start_ok=${r.start_ok} pitch_ok=${r.pitch_ok} diff=${r.start_diff_sec}`)
  }

  // rhythm accuracy 計算ロジック確認
  console.log(`\n--- rhythmAccuracy 想定計算 (= start_ok を使用と推測) ---`)
  // 一般的な計算: start_ok true / evaluated 対象
  const evaluatedNotes = results.filter((r:any) =>
    !["not_detected", "not_evaluated", "section_missing", "spectral_inconclusive"].includes(r.evaluation_status))
  const startOkInEvaluated = evaluatedNotes.filter((r:any) => r.start_ok === true).length
  console.log(`  evaluated total: ${evaluatedNotes.length}`)
  console.log(`  start_ok=true in evaluated: ${startOkInEvaluated}`)
  console.log(`  ratio: ${(startOkInEvaluated / evaluatedNotes.length * 100).toFixed(1)}%`)

  // pitch_only も含めて
  const pitchOnly = results.filter((r:any) => r.evaluation_status === "pitch_only")
  console.log(`  pitch_only notes: ${pitchOnly.length}, start_ok=${pitchOnly.filter((r:any) => r.start_ok === true).length}`)
}
main().finally(() => prisma.$disconnect())
