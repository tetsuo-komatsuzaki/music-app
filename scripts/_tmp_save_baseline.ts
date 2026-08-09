import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { createClient } from "@supabase/supabase-js"
import * as fs from "node:fs"

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  const perf = await prisma.performance.findUnique({
    where: { id: "cmpl3o87b000004l2432ihozo" },
    select: { comparisonResultPath: true, pitchAccuracy: true, rhythmAccuracy: true, evaluatedNotes: true },
  })
  if (!perf?.comparisonResultPath) return
  const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  let path = perf.comparisonResultPath
  if (path.startsWith("performances/")) path = path.slice("performances/".length)
  const { data, error } = await supa.storage.from("performances").download(path)
  if (error) { console.error(error); return }
  const text = await data.text()
  fs.writeFileSync("./baseline_v25.json", text)
  fs.writeFileSync("./baseline_v25_summary.txt",
    `evaluatedNotes=${perf.evaluatedNotes} pitch=${perf.pitchAccuracy} rhythm=${perf.rhythmAccuracy}\n`)
  console.log("Saved baseline:", { evaluatedNotes: perf.evaluatedNotes, pitch: perf.pitchAccuracy, rhythm: perf.rhythmAccuracy })
}
main().finally(() => prisma.$disconnect())
