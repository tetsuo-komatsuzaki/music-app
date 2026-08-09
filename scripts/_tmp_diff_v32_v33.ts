import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { createClient } from "@supabase/supabase-js"
import * as fs from "node:fs"
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })
function R(j:any){return Array.isArray(j)?j:j.results}

async function main() {
  const baseR = R(JSON.parse(fs.readFileSync("./baseline_v32.json", "utf-8")))
  const perf = await prisma.performance.findUnique({
    where: { id: "cmpl3o87b000004l2432ihozo" },
    select: { comparisonResultPath: true, pitchAccuracy: true, rhythmAccuracy: true, evaluatedNotes: true },
  })
  const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  let path = perf!.comparisonResultPath!
  if (path.startsWith("performances/")) path = path.slice("performances/".length)
  const { data } = await supa.storage.from("performances").download(path)
  const curR = R(JSON.parse(await data!.text()))

  console.log("=== Summary ===")
  console.log(`v32: evalNotes=64 pitch=100 rhythm=56.2`)
  console.log(`v33: evalNotes=${perf!.evaluatedNotes} pitch=${perf!.pitchAccuracy} rhythm=${perf!.rhythmAccuracy}`)
  
  let identical = 0, segDiff = 0, statusDiff = 0, pitchCentsDiff = 0, otherDiff = 0
  for (let i = 0; i < Math.min(baseR.length, curR.length); i++) {
    const b = baseR[i], c = curR[i]
    const segSame = (b.detected_start_sec ?? null) === (c.detected_start_sec ?? null)
    const stSame = b.evaluation_status === c.evaluation_status
    const pcSame = (b.pitch_cents_error ?? null) === (c.pitch_cents_error ?? null)
    const sdSame = (b.start_diff_sec ?? null) === (c.start_diff_sec ?? null)
    const pokSame = b.pitch_ok === c.pitch_ok
    const sokSame = b.start_ok === c.start_ok
    if (segSame && stSame && pcSame && sdSame && pokSame && sokSame) {
      identical++
    } else {
      if (!segSame) segDiff++
      if (!stSame) statusDiff++
      if (!pcSame) pitchCentsDiff++
      if (!sdSame || !pokSame || !sokSame) otherDiff++
      console.log(`i${i} M${b.measure_number} ${b.note_name}:`)
      if (!segSame) console.log(`  seg: ${b.detected_start_sec} → ${c.detected_start_sec}`)
      if (!stSame) console.log(`  status: ${b.evaluation_status} → ${c.evaluation_status}`)
      if (!pcSame) console.log(`  pitch_cents_error: ${b.pitch_cents_error} → ${c.pitch_cents_error}`)
      if (!sdSame) console.log(`  start_diff: ${b.start_diff_sec} → ${c.start_diff_sec}`)
      if (!pokSame) console.log(`  pitch_ok: ${b.pitch_ok} → ${c.pitch_ok}`)
      if (!sokSame) console.log(`  start_ok: ${b.start_ok} → ${c.start_ok}`)
    }
  }
  console.log(`\nIdentical notes: ${identical}/${Math.min(baseR.length, curR.length)}`)
  console.log(`seg diff: ${segDiff}, status diff: ${statusDiff}, pitch_cents diff: ${pitchCentsDiff}, other diff: ${otherDiff}`)
}
main().finally(() => prisma.$disconnect())
