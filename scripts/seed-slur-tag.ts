/**
 * seed-slur-tag.ts — TechniqueTag に「スラー」を追加 (学びレッスン確定#1 2026-07-14)
 * 技術タグ13種体系 (docs/arcoda-redesign-decisions.md §2 共通技術6にスラー含む) に
 * マスタを合わせる。既存12種 + スラー = 13種。冪等 (name一致でupsert相当)。
 * 実行: npx tsx scripts/seed-slur-tag.ts
 */
import "dotenv/config"
import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

async function main() {
  const existing = await prisma.techniqueTag.findFirst({ where: { name: "スラー" } })
  if (existing) {
    console.log("スラー already exists:", existing.id)
    return
  }
  const created = await prisma.techniqueTag.create({
    data: {
      category: "演奏技法",
      name: "スラー",
      nameEn: "slur",
      xmlTags: ["<slur>"],
      isAnalyzable: "Yes", // スラー抽出は解析実装済み (v38-v40)
      implementStatus: "実装",
    },
  })
  console.log("created スラー:", created.id)
  const total = await prisma.techniqueTag.count()
  console.log("TechniqueTag total:", total, "(13期待)")
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
