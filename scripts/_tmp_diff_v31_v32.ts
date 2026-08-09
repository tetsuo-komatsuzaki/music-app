import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { createClient } from "@supabase/supabase-js"
import * as fs from "node:fs"
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })
function R(j:any){return Array.isArray(j)?j:j.results}

async function main() {
  const baseR = R(JSON.parse(fs.readFileSync("./baseline_v31.json", "utf-8")))
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
  console.log(`v31: evalNotes=64 pitch=100 rhythm=48.4`)
  console.log(`v32: evalNotes=${perf!.evaluatedNotes} pitch=${perf!.pitchAccuracy} rhythm=${perf!.rhythmAccuracy}`)

  function statusBy(r:any[]){const s:Record<string,number>={};for(const n of r)s[n.evaluation_status]=(s[n.evaluation_status]??0)+1;return s}
  console.log("\nv31:", statusBy(baseR))
  console.log("v32:", statusBy(curR))

  console.log("\n=== Diff (changed only) ===")
  let changes = 0
  for (let i = 0; i < Math.min(baseR.length, curR.length); i++) {
    const b = baseR[i], c = curR[i]
    const sd = (b.detected_start_sec ?? null) !== (c.detected_start_sec ?? null)
    const sc = b.evaluation_status !== c.evaluation_status
    if (sd || sc) {
      changes++
      const f = (v:any) => v === null || v === undefined ? "   —  " : Number(v).toFixed(3).padStart(7)
      console.log(`${String(i).padStart(2)} M${String(b.measure_number).padStart(2)} ${String(b.note_name).padEnd(4)}  ` +
        `${String(b.evaluation_status).padEnd(13)} ${f(b.detected_start_sec)} ${f(b.start_diff_sec)}  ` +
        `${String(c.evaluation_status).padEnd(13)} ${f(c.detected_start_sec)} ${f(c.start_diff_sec)}`)
    }
  }
  console.log(`\n${changes} changed`)
}
main().finally(() => prisma.$disconnect())
