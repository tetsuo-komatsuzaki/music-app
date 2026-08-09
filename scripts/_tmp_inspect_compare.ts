import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { createClient } from "@supabase/supabase-js"

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  const perf = await prisma.performance.findUnique({
    where: { id: "cmpl3o87b000004l2432ihozo" },
    select: { comparisonResultPath: true, evaluatedNotes: true, pitchAccuracy: true, rhythmAccuracy: true },
  })
  console.log("evaluatedNotes:", perf?.evaluatedNotes, "pitch:", perf?.pitchAccuracy, "rhythm:", perf?.rhythmAccuracy)
  console.log("path:", perf?.comparisonResultPath)
  if (!perf?.comparisonResultPath) return

  const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const bucket = "performances"
  // path may include bucket prefix
  let path = perf.comparisonResultPath
  if (path.startsWith(bucket + "/")) path = path.slice(bucket.length + 1)
  const { data, error } = await supa.storage.from(bucket).download(path)
  if (error) { console.error("download err:", error); return }
  const text = await data.text()
  const json = JSON.parse(text)
  const results: any[] = Array.isArray(json) ? json : json.results
  console.log("\ntotal notes:", results.length)
  const byStatus: Record<string, number> = {}
  let startOkT = 0, startOkF = 0, startOkN = 0
  let pitchOkT = 0, pitchOkF = 0, pitchOkN = 0
  for (const r of results) {
    const s = r.evaluation_status ?? "unknown"
    byStatus[s] = (byStatus[s] ?? 0) + 1
    if (r.start_ok === true) startOkT++; else if (r.start_ok === false) startOkF++; else startOkN++
    if (r.pitch_ok === true) pitchOkT++; else if (r.pitch_ok === false) pitchOkF++; else pitchOkN++
  }
  console.log("by status:", byStatus)
  console.log(`start_ok: true=${startOkT} false=${startOkF} null=${startOkN}`)
  console.log(`pitch_ok: true=${pitchOkT} false=${pitchOkF} null=${pitchOkN}`)

  // pitch_only ノートを抽出
  const pOnly = results.filter(r => r.evaluation_status === "pitch_only")
  console.log(`\npitch_only notes: ${pOnly.length}`)
  for (const r of pOnly.slice(0, 20)) {
    console.log(`  M${r.measure_number}-i${r.note_index} ${r.note_name} start_ok=${r.start_ok} pitch_ok=${r.pitch_ok}`)
  }

  console.log("\n--- 全ノート時系列 ---")
  console.log("idx M  pitch  es      seg     diff    p t status         conf")
  for (const r of results) {
    const idx = String(r.note_index).padStart(2)
    const m = String(r.measure_number).padStart(2)
    const pitch = String(r.note_name).padEnd(4)
    const es = r.expected_start_sec?.toFixed?.(3) ?? "—"
    const seg = r.detected_start_sec?.toFixed?.(3) ?? "—"
    const diff = r.start_diff_sec?.toFixed?.(3) ?? "—"
    const p = r.pitch_ok === null ? "—" : (r.pitch_ok ? "✓" : "✗")
    const t = r.start_ok === null ? "—" : (r.start_ok ? "✓" : "✗")
    const st = String(r.evaluation_status).padEnd(14)
    const c = String(r.match_confidence ?? "—")
    console.log(`${idx} M${m} ${pitch}  ${String(es).padStart(7)} ${String(seg).padStart(7)} ${String(diff).padStart(7)}  ${p} ${t} ${st} ${c}`)
  }
}
main().finally(() => prisma.$disconnect())
