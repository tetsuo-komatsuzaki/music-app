// scripts/_check-affected-performances.mjs
// Usage: node scripts/_check-affected-performances.mjs
// 影響範囲確認: 私が DIFF を出した 180 ファイルに該当する PracticePerformance 数
// (Bb/C/Eb/F minor harmonic+melodic, D/G minor melodic)

import "dotenv/config"
import { PrismaClient } from "../app/generated/prisma/client.js"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const TARGETS = [
  { tonic: "Bb", variant: "harmonic" },
  { tonic: "Bb", variant: "melodic"  },
  { tonic: "C",  variant: "harmonic" },
  { tonic: "C",  variant: "melodic"  },
  { tonic: "D",  variant: "melodic"  },
  { tonic: "Eb", variant: "harmonic" },
  { tonic: "Eb", variant: "melodic"  },
  { tonic: "F",  variant: "harmonic" },
  { tonic: "F",  variant: "melodic"  },
  { tonic: "G",  variant: "melodic"  },
]

async function main() {
  let totalAffected = 0
  let totalItems = 0
  const rows = []
  for (const t of TARGETS) {
    const items = await prisma.practiceItem.findMany({
      where: {
        category: "scale",
        keyTonic: t.tonic,
        keyMode: "minor",
      },
      select: { id: true, metadata: true, title: true },
    })
    const variantItems = items.filter((i) => {
      const m = i.metadata
      return m && typeof m === "object" && !Array.isArray(m) && (m).modeVariant === t.variant
    })
    const itemIds = variantItems.map((i) => i.id)
    const perfCount = itemIds.length === 0 ? 0 : await prisma.practicePerformance.count({
      where: { practiceItemId: { in: itemIds } },
    })
    rows.push({
      tonic: t.tonic,
      variant: t.variant,
      itemCount: variantItems.length,
      perfCount,
    })
    totalItems += variantItems.length
    totalAffected += perfCount
  }
  console.log("=== Affected scope (DIFF と判定された 180 件に対応する DB レコード数) ===")
  console.table(rows)
  console.log(`\nTotal PracticeItems (該当 variant のみ): ${totalItems}`)
  console.log(`Total PracticePerformances (過去演奏): ${totalAffected}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
