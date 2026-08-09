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
    select: { comparisonResultPath: true },
  })
  const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  let path = perf!.comparisonResultPath!
  if (path.startsWith("performances/")) path = path.slice("performances/".length)
  const { data } = await supa.storage.from("performances").download(path)
  const results = R(JSON.parse(await data!.text()))

  console.log("--- pitch_only ノート一覧 ---")
  let rescueCount = 0
  let tiedCount = 0
  for (let i = 0; i < results.length; i++) {
    const r = results[i]
    if (r.evaluation_status !== "pitch_only") continue
    const prevR = i > 0 ? results[i-1] : null
    const samePitch = prevR && Math.abs(prevR.expected_pitch_hz - r.expected_pitch_hz) < 0.01
    const hasSegStart = r.detected_start_sec !== null
    const type = !hasSegStart && samePitch ? "SAME_PITCH_RESCUE" : "TIED_OR_TREMOLO_OR_TRILL"
    if (type === "SAME_PITCH_RESCUE") rescueCount++
    else tiedCount++
    console.log(`i${r.note_index} M${r.measure_number} ${r.note_name}: ${type} seg=${r.detected_start_sec} same_pitch=${samePitch}`)
  }
  console.log(`\n同音連続救済: ${rescueCount} 件`)
  console.log(`tied/tremolo/trill: ${tiedCount} 件`)
}
main().finally(() => prisma.$disconnect())
