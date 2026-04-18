// scripts/remove-non-detache-scales.ts
// Usage: npx tsx scripts/remove-non-detache-scales.ts
// Détaché以外のボーイングパターンのスケール練習アイテムを削除する

import { config } from "dotenv"
config()

import { PrismaClient } from "../app/generated/prisma/client.js"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Détaché の TechniqueTag ID を取得
  const detacheTag = await prisma.techniqueTag.findFirst({
    where: { nameEn: "detache" },
    select: { id: true },
  })
  if (!detacheTag) {
    console.log("ERROR: detache technique tag not found")
    return
  }
  console.log(`detache tag id: ${detacheTag.id}`)

  // 全スケールアイテムを取得
  const allScales = await prisma.practiceItem.findMany({
    where: { category: "scale" },
    select: {
      id: true,
      descriptionShort: true,
      techniques: {
        select: { techniqueTagId: true },
      },
    },
  })
  console.log(`Total scale items: ${allScales.length}`)

  // Détaché を持つアイテム: 残す
  // Détaché を持たないアイテム: 削除対象
  const toDelete = allScales.filter(
    (item) => !item.techniques.some((t) => t.techniqueTagId === detacheTag.id)
  )
  const toKeep = allScales.filter(
    (item) => item.techniques.some((t) => t.techniqueTagId === detacheTag.id)
  )

  console.log(`Keep (has detache): ${toKeep.length}`)
  console.log(`Delete (no detache): ${toDelete.length}`)

  if (toDelete.length === 0) {
    console.log("Nothing to delete.")
    return
  }

  const deleteIds = toDelete.map((i) => i.id)

  // 関連データを先に削除
  const perfCount = await prisma.practicePerformance.deleteMany({
    where: { practiceItemId: { in: deleteIds } },
  })
  console.log(`Deleted ${perfCount.count} practice performances`)

  const techCount = await prisma.practiceItemTechnique.deleteMany({
    where: { practiceItemId: { in: deleteIds } },
  })
  console.log(`Deleted ${techCount.count} technique links`)

  const itemCount = await prisma.practiceItem.deleteMany({
    where: { id: { in: deleteIds } },
  })
  console.log(`Deleted ${itemCount.count} practice items`)

  console.log("Done.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
