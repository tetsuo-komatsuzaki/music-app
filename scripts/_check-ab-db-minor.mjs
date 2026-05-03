// scripts/_check-ab-db-minor.mjs
// Ab minor / Db minor の PracticeItem と PracticePerformance 件数を確認

import "dotenv/config"
import { PrismaClient } from "../app/generated/prisma/client.js"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("=== PracticeItem (DB レコード) ===")
  for (const tonic of ["Ab", "Db"]) {
    for (const cat of ["scale", "arpeggio"]) {
      const items = await prisma.practiceItem.findMany({
        where: { category: cat, keyTonic: tonic, keyMode: "minor" },
        select: { id: true, title: true, originalXmlPath: true, metadata: true },
      })
      console.log(`  ${tonic} minor (${cat}): ${items.length} items`)
      for (const it of items) {
        const meta = (typeof it.metadata === "object" && it.metadata !== null) ? it.metadata : {}
        console.log(`    - id=${it.id.slice(0,8)} title="${it.title}" variant=${meta.modeVariant ?? "(none)"} path=${it.originalXmlPath}`)
      }
    }
  }

  console.log("\n=== PracticePerformance (過去演奏) ===")
  for (const tonic of ["Ab", "Db"]) {
    const items = await prisma.practiceItem.findMany({
      where: { keyTonic: tonic, keyMode: "minor" },
      select: { id: true },
    })
    const itemIds = items.map((i) => i.id)
    const perfCount = itemIds.length === 0 ? 0 : await prisma.practicePerformance.count({
      where: { practiceItemId: { in: itemIds } },
    })
    console.log(`  ${tonic} minor: ${perfCount} performances (across ${items.length} items)`)
  }
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
