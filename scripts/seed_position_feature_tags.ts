// ポジション習得系特徴タグ (2nd〜10thポジション = 9本) をシードする。
// 設計書 §2-2b / §346: ポジションは習得系特徴タグ (達成ゲート)。1st は既定=タグなし。
// analyze_musicxml/piece_summary が n.position(≥2) から同名タグを自動付与する前提。
// 冪等 (category+name の複合ユニークで upsert)。本番DBへは手動実行 (npx tsx scripts/seed_position_feature_tags.ts)。
import { config } from "dotenv"
config()
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../app/generated/prisma/client.js"

const ORDINALS = ["2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"]

async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
  let created = 0
  for (const o of ORDINALS) {
    const name = `${o}ポジション`
    await prisma.featureTag.upsert({
      where: { category_name: { category: "position", name } },
      update: { isAcquisition: true, extractRule: "運指/音高からポジション推定(≥2)" },
      create: { category: "position", name, isAcquisition: true, extractRule: "運指/音高からポジション推定(≥2)" },
    })
    created++
  }
  const all = await prisma.featureTag.findMany({ where: { category: "position" }, orderBy: { name: "asc" } })
  console.log(`position FeatureTag ${created}件 upsert 完了。現在:`, all.map((f) => f.name).join(" / "))
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
