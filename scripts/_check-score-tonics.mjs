import "dotenv/config"
import { PrismaClient } from "../app/generated/prisma/client.js"
import { PrismaPg } from "@prisma/adapter-pg"
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })
const scores = await prisma.score.findMany({
  where: { deletedAt: null },
  select: { keyTonic: true, keyMode: true, title: true },
})
const stats = {}
let nullKey = 0
for (const s of scores) {
  if (!s.keyTonic) { nullKey++; continue }
  const k = `${s.keyTonic}_${s.keyMode ?? "null"}`
  stats[k] = (stats[k]||0)+1
}
console.log(`Total scores: ${scores.length}`)
console.log(`With null keyTonic: ${nullKey}`)
console.log("Distribution:")
for (const [k,c] of Object.entries(stats).sort()) console.log(`  ${k}: ${c}`)
const sharps = scores.filter(s => s.keyTonic && s.keyTonic.includes('#'))
const flats = scores.filter(s => s.keyTonic && s.keyTonic.includes('b'))
console.log(`\nSharp-spelled: ${sharps.length}`)
console.log(`Flat-spelled: ${flats.length}`)
await prisma.$disconnect()
