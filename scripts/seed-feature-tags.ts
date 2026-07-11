/**
 * FeatureTag 初期シード（工程F・2026-07-10 承認済）
 * 19行を upsert（再実行安全）。以後の追加は動的拡張(§23)で管理者から。
 *
 * 実行: npx tsx scripts/seed-feature-tags.ts
 */
import "dotenv/config"
import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

type Seed = { category: string; name: string; isAcquisition: boolean; extractRule: string }

const SEEDS: Seed[] = [
  // rhythm（9・すべて非習得系）§19-2
  { category: "rhythm", name: "8分音符", isAcquisition: false, extractRule: "type=eighth (最小音価)" },
  { category: "rhythm", name: "16分音符", isAcquisition: false, extractRule: "type=16th (最小音価)" },
  { category: "rhythm", name: "32分音符", isAcquisition: false, extractRule: "type=32nd以下 (最小音価)" },
  { category: "rhythm", name: "付点", isAcquisition: false, extractRule: "dot + 後続音価の組" },
  { category: "rhythm", name: "拍頭休符", isAcquisition: false, extractRule: "rest + 拍位置計算(拍頭)" },
  { category: "rhythm", name: "裏拍開始", isAcquisition: false, extractRule: "rest + 拍位置計算(裏拍)" },
  { category: "rhythm", name: "連符", isAcquisition: false, extractRule: "time-modification (3連符等)" },
  { category: "rhythm", name: "装飾音符", isAcquisition: false, extractRule: "grace" },
  { category: "rhythm", name: "シンコペーション", isAcquisition: false, extractRule: "tie + 拍境界計算(拍跨ぎ)" },
  // double_stop（8）: 学びレッスン粒度(3度/6度/オクターブ/10度/連続)=習得系true
  { category: "double_stop", name: "3度", isAcquisition: true, extractRule: "chord + 音程計算(オクターブ還元なし)" },
  { category: "double_stop", name: "4度", isAcquisition: false, extractRule: "chord + 音程計算" },
  { category: "double_stop", name: "5度", isAcquisition: false, extractRule: "chord + 音程計算" },
  { category: "double_stop", name: "6度", isAcquisition: true, extractRule: "chord + 音程計算" },
  { category: "double_stop", name: "オクターブ", isAcquisition: true, extractRule: "chord + 音程計算(8度)" },
  { category: "double_stop", name: "10度", isAcquisition: true, extractRule: "chord + 音程計算(還元なし)" },
  { category: "double_stop", name: "その他", isAcquisition: false, extractRule: "chord + 上記以外の音程" },
  { category: "double_stop", name: "連続重音", isAcquisition: true, extractRule: "連続するchord音符の走査(2連続以上)" },
  // dynamics（2・非習得系）
  { category: "dynamics", name: "クレッシェンド", isAcquisition: false, extractRule: "wedge crescendo" },
  { category: "dynamics", name: "デクレッシェンド", isAcquisition: false, extractRule: "wedge diminuendo" },
]

async function main() {
  let created = 0, updated = 0
  for (const s of SEEDS) {
    const existing = await prisma.featureTag.findUnique({
      where: { category_name: { category: s.category, name: s.name } },
    })
    if (existing) {
      await prisma.featureTag.update({
        where: { id: existing.id },
        data: { isAcquisition: s.isAcquisition, extractRule: s.extractRule },
      })
      updated++
    } else {
      await prisma.featureTag.create({ data: s })
      created++
    }
  }
  const total = await prisma.featureTag.count()
  console.log(`FeatureTag seed 完了: created=${created} updated=${updated} 総数=${total}`)
  const byCat = await prisma.featureTag.groupBy({ by: ["category"], _count: true })
  for (const c of byCat) console.log(`  ${c.category}: ${c._count}件`)
}

main().catch((e) => { console.error("ERR:", e?.message ?? e); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
