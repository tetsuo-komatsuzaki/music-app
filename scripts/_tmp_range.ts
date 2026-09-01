import { config } from "dotenv"
config()
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../app/generated/prisma/client.js"
import { createClient } from "@supabase/supabase-js"
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const SAMPLES = [55,57,60,64,67,69,72,76,79,81,84,88,91,93,96]  // G3..C7
const NAME = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"]
const nm = (m: number) => `${NAME[m % 12]}${Math.floor(m / 12) - 1}`
const shift = (m: number) => Math.min(...SAMPLES.map(s => Math.abs(s - m)))
async function main() {
  const scores = await prisma.score.findMany({
    where: { deletedAt: null, analysisStatus: "done" },
    select: { id: true, createdById: true }, take: 80,
  })
  const items = await prisma.practiceItem.findMany({ select: { id: true }, take: 900 })
  const hist: Record<number, number> = {}
  let total = 0, files = 0
  const add = (notes: any[]) => {
    for (const n of notes) {
      if (n.type === "rest" || !n.pitches?.length) continue
      for (const hz of n.pitches) {
        const m = Math.round(69 + 12 * Math.log2(Number(hz) / 440))
        hist[m] = (hist[m] ?? 0) + 1; total++
      }
    }
  }
  for (const s of scores) {
    const { data } = await sb.storage.from("musicxml").download(`${s.createdById}/${s.id}/analysis.json`)
    if (!data) continue
    add(JSON.parse(await data.text()).notes ?? []); files++
  }
  for (const it of items) {
    const { data } = await sb.storage.from("musicxml").download(`practice/${it.id}/analysis.json`)
    if (!data) continue
    add(JSON.parse(await data.text()).notes ?? []); files++
  }
  const keys = Object.keys(hist).map(Number).sort((a, b) => a - b)
  console.log(`${files}件 / 音 ${total}個\n`)
  console.log(`  最低 ${nm(keys[0])} (MIDI ${keys[0]})   最高 ${nm(keys[keys.length-1])} (MIDI ${keys[keys.length-1]})\n`)
  const buckets: Record<number, number> = {}
  for (const k of keys) buckets[shift(k)] = (buckets[shift(k)] ?? 0) + hist[k]
  console.log("  サンプルからの距離（半音）ごとの音数")
  for (const d of Object.keys(buckets).map(Number).sort((a,b)=>a-b))
    console.log(`    ${d}半音  ${String(buckets[d]).padStart(6)}個  ${(buckets[d]/total*100).toFixed(1).padStart(5)}%  ${"█".repeat(Math.round(buckets[d]/total*40))}`)
  const bad = keys.filter(k => shift(k) > 2)
  console.log(`\n  2半音を超える音: ${bad.reduce((a,k)=>a+hist[k],0)}個 (${(bad.reduce((a,k)=>a+hist[k],0)/total*100).toFixed(2)}%)`)
  if (bad.length) console.log("    " + bad.map(k => `${nm(k)}×${hist[k]}`).join(" "))
}
main().finally(() => prisma.$disconnect())
