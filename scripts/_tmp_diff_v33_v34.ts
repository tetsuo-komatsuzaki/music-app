import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { createClient } from "@supabase/supabase-js"
import * as fs from "node:fs"
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })
function R(j:any){return Array.isArray(j)?j:j.results}

async function main() {
  const baseR = R(JSON.parse(fs.readFileSync("./baseline_v33.json", "utf-8")))
  const perf = await prisma.performance.findUnique({
    where: { id: "cmpl3o87b000004l2432ihozo" },
    select: { comparisonResultPath: true, pitchAccuracy: true, rhythmAccuracy: true, evaluatedNotes: true },
  })
  const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  let path = perf!.comparisonResultPath!
  if (path.startsWith("performances/")) path = path.slice("performances/".length)
  const { data } = await supa.storage.from("performances").download(path)
  const curR = R(JSON.parse(await data!.text()))

  console.log(`v33: evalNotes=64 pitch=100 rhythm=56.2`)
  console.log(`v34: evalNotes=${perf!.evaluatedNotes} pitch=${perf!.pitchAccuracy} rhythm=${perf!.rhythmAccuracy}`)
  
  function statusBy(r:any[]){const s:Record<string,number>={};for(const n of r)s[n.evaluation_status]=(s[n.evaluation_status]??0)+1;return s}
  console.log("\nv33:", statusBy(baseR))
  console.log("v34:", statusBy(curR))

  let pitchOnlyChanges = 0
  let pitchOnlyValueChanges = 0
  let otherChanges = 0
  for (let i = 0; i < Math.min(baseR.length, curR.length); i++) {
    const b = baseR[i], c = curR[i]
    const isPo = b.evaluation_status === "pitch_only" && c.evaluation_status === "pitch_only"
    const statusSame = b.evaluation_status === c.evaluation_status
    const segSame = (b.detected_start_sec ?? null) === (c.detected_start_sec ?? null)
    const pcSame = (b.pitch_cents_error ?? null) === (c.pitch_cents_error ?? null)
    const dphSame = (b.detected_pitch_hz ?? null) === (c.detected_pitch_hz ?? null)
    if (!statusSame || (!isPo && (!segSame || !pcSame || !dphSame))) {
      otherChanges++
      console.log(`i${i} M${b.measure_number} ${b.note_name}: NON-pitch_only diff`)
      console.log(`  status: ${b.evaluation_status} → ${c.evaluation_status}`)
      console.log(`  seg: ${b.detected_start_sec} → ${c.detected_start_sec}`)
      console.log(`  pitch_cents: ${b.pitch_cents_error} → ${c.pitch_cents_error}`)
    } else if (isPo && (!pcSame || !dphSame)) {
      pitchOnlyValueChanges++
      console.log(`i${i} M${b.measure_number} ${b.note_name}: pitch_only value changed (expected for ⑦ fix)`)
      console.log(`  detected_pitch_hz: ${b.detected_pitch_hz} → ${c.detected_pitch_hz}`)
      console.log(`  pitch_cents_error: ${b.pitch_cents_error} → ${c.pitch_cents_error}`)
    }
  }
  console.log(`\npitch_only fresh計算による変化: ${pitchOnlyValueChanges}`)
  console.log(`想定外の変化: ${otherChanges}`)
}
main().finally(() => prisma.$disconnect())
