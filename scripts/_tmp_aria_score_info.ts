import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { createClient } from "@supabase/supabase-js"
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })
async function main() {
  const score = await prisma.score.findUnique({
    where: { id: "cmplsdfv8000004jsd50oxz4h" },
    select: { id: true, title: true, originalXmlPath: true, generatedXmlPath: true, defaultTempo: true, timeNumerator: true, timeDenominator: true },
  })
  console.log("Score:", JSON.stringify(score, null, 2))

  const supa = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  // Try fetching analysis.json
  const candidates = [
    `score-data/${score!.id}/analysis.json`,
    `${score!.id}/analysis.json`,
    score?.generatedXmlPath ? score.generatedXmlPath.replace(".musicxml", "_analysis.json") : null,
  ].filter(Boolean) as string[]

  for (const p of candidates) {
    console.log(`\nTrying: musicxml/${p}`)
    const { data, error } = await supa.storage.from("musicxml").download(p)
    if (data) {
      const json = JSON.parse(await data.text())
      console.log(`  ✓ Found, keys: ${Object.keys(json).join(", ")}`)
      if (json.notes) {
        const measures = new Set(json.notes.map((n: any) => n.measure_number).filter((x: any) => x))
        const sorted = Array.from(measures).sort((a: any, b: any) => Number(a) - Number(b))
        console.log(`  bpm: ${json.bpm}, time_sig: ${JSON.stringify(json.time_signature)}`)
        console.log(`  notes: ${json.notes.length}, measures: ${sorted.length} (${sorted[0]}-${sorted[sorted.length-1]})`)
      }
      break
    } else {
      console.log(`  err: ${error?.message}`)
    }
  }
}
main().finally(() => prisma.$disconnect())
