import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { createClient } from "@supabase/supabase-js"
import * as fs from "node:fs"

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function loadCurrent() {
  const perf = await prisma.performance.findUnique({
    where: { id: "cmpl3o87b000004l2432ihozo" },
    select: { comparisonResultPath: true, pitchAccuracy: true, rhythmAccuracy: true, evaluatedNotes: true },
  })
  const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  let path = perf!.comparisonResultPath!
  if (path.startsWith("performances/")) path = path.slice("performances/".length)
  const { data } = await supa.storage.from("performances").download(path)
  const text = await data!.text()
  return { meta: perf, json: JSON.parse(text) }
}

function getResults(json: any): any[] {
  return Array.isArray(json) ? json : json.results
}

async function main() {
  const baseRaw = fs.readFileSync("./baseline_v25.json", "utf-8")
  const baseJson = JSON.parse(baseRaw)
  const baseR = getResults(baseJson)

  const cur = await loadCurrent()
  const curR = getResults(cur.json)

  console.log("=== Summary ===")
  console.log(`v25 baseline:  evaluatedNotes=51 pitch=75 rhythm=26.6`)
  console.log(`v26 current:   evaluatedNotes=${cur.meta?.evaluatedNotes} pitch=${cur.meta?.pitchAccuracy} rhythm=${cur.meta?.rhythmAccuracy}`)

  console.log("\n=== Status counts ===")
  function statusBy(r: any[]) {
    const s: Record<string, number> = {}
    for (const n of r) s[n.evaluation_status] = (s[n.evaluation_status] ?? 0) + 1
    return s
  }
  console.log("v25:", statusBy(baseR))
  console.log("v26:", statusBy(curR))

  console.log("\n=== Diff (notes that changed) ===")
  console.log("idx M  pitch  v25_status     v25_seg   v25_diff   v26_status     v26_seg   v26_diff")
  let changes = 0
  for (let i = 0; i < Math.min(baseR.length, curR.length); i++) {
    const b = baseR[i], c = curR[i]
    const segChanged = (b.detected_start_sec ?? null) !== (c.detected_start_sec ?? null)
    const statusChanged = b.evaluation_status !== c.evaluation_status
    if (segChanged || statusChanged) {
      changes++
      const fmt = (v: any) => v === null || v === undefined ? "   —  " : Number(v).toFixed(3).padStart(7)
      console.log(`${String(i).padStart(2)} M${String(b.measure_number).padStart(2)} ${String(b.note_name).padEnd(4)}  ` +
        `${String(b.evaluation_status).padEnd(13)} ${fmt(b.detected_start_sec)} ${fmt(b.start_diff_sec)}  ` +
        `${String(c.evaluation_status).padEnd(13)} ${fmt(c.detected_start_sec)} ${fmt(c.start_diff_sec)}`)
    }
  }
  console.log(`\n${changes} note(s) changed`)
}
main().finally(() => prisma.$disconnect())
