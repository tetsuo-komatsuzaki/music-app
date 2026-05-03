// scripts/_delete-db-minor.mjs
// Db minor (scale + arpeggio incl. dim7) の PracticeItem と
// 対応する Storage ファイルを削除する。
//
// 安全策:
//   1. dry-run 先行 (DRY=1 環境変数で制御)
//   2. 該当 PracticePerformance が 0 件であることを再確認してから削除
//   3. Storage listing → 削除候補の cuid path を出力 → 削除
//   4. 各ステップ後に件数報告

import "dotenv/config"
import { PrismaClient } from "../app/generated/prisma/client.js"
import { PrismaPg } from "@prisma/adapter-pg"
import { createClient } from "@supabase/supabase-js"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

const DRY = process.env.DRY === "1"

async function main() {
  console.log(DRY ? "=== DRY RUN ===" : "=== EXECUTE ===")

  // 1. 対象 PracticeItem 取得
  const items = await prisma.practiceItem.findMany({
    where: { keyTonic: "Db", keyMode: "minor" },
    select: { id: true, title: true, category: true, originalXmlPath: true, generatedXmlPath: true },
  })
  console.log(`\nDb minor PracticeItem 該当: ${items.length}`)
  for (const it of items) {
    console.log(`  - id=${it.id} cat=${it.category} title="${it.title}" path=${it.originalXmlPath}`)
  }

  if (items.length === 0) {
    console.log("対象なし。終了。")
    return
  }

  // 2. PracticePerformance 数の再確認
  const itemIds = items.map((i) => i.id)
  const perfCount = await prisma.practicePerformance.count({
    where: { practiceItemId: { in: itemIds } },
  })
  console.log(`\n関連 PracticePerformance: ${perfCount}`)
  if (perfCount > 0) {
    console.error(`!!! 中止: 過去演奏が ${perfCount} 件存在します。手動で対応してください。`)
    process.exit(1)
  }

  // 3. Storage 内 path listing & 削除リスト
  const storagePaths = new Set()
  for (const it of items) {
    if (it.originalXmlPath) storagePaths.add(it.originalXmlPath)
    if (it.generatedXmlPath && it.generatedXmlPath !== it.originalXmlPath) storagePaths.add(it.generatedXmlPath)
  }
  console.log(`\n削除対象 Storage path: ${storagePaths.size}`)
  for (const p of storagePaths) console.log(`  - ${p}`)

  if (DRY) {
    console.log("\n=== DRY RUN: 何も削除していません ===")
    return
  }

  // 4. Storage 削除
  console.log("\n--- Storage 削除実行 ---")
  for (const p of storagePaths) {
    const { error } = await supabase.storage.from("musicxml").remove([p])
    if (error) {
      console.error(`  Storage 削除失敗 ${p}: ${error.message}`)
    } else {
      console.log(`  Storage 削除成功: ${p}`)
    }
  }

  // 5. PracticeItem 削除 (PracticeItemTechnique は cascade で削除される schema 想定)
  console.log("\n--- PracticeItem 削除実行 ---")
  // PracticeItemTechnique を先に削除 (onDelete cascade が無い場合に備えて)
  await prisma.practiceItemTechnique.deleteMany({
    where: { practiceItemId: { in: itemIds } },
  })
  const result = await prisma.practiceItem.deleteMany({
    where: { id: { in: itemIds } },
  })
  console.log(`  PracticeItem 削除: ${result.count} 件`)

  console.log("\n=== 完了 ===")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
