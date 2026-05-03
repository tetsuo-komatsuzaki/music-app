// scripts/_reupload-ab-minor.mjs
// Ab minor の 12 PracticeItem (scale 9 + arpeggio 3) を、それぞれの cuid path に
// 再生成済みのローカル .mxl ファイルでアップロード（上書き）する。
//
// マッピング:
//   - DB から PracticeItem (keyTonic=Ab, keyMode=minor) を取得
//   - title から該当ローカル .mxl ファイルを推定
//   - Storage に upsert アップロード
//
// 安全策:
//   - DRY=1 で実行内容を確認できる
//   - title から .mxl 推定ロジックは PracticeItem.metadata.modeVariant + octaves + register を使う
//   - 推定不能 / ローカルファイルが無い場合は中止して報告

import "dotenv/config"
import * as fs from "node:fs"
import * as path from "node:path"
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
const SCALE_DIR = "prisma/data/mxl"
const ARP_DIR = "prisma/data/mxl_arpeggio"

/** PracticeItem (scale Ab minor) → ローカル .mxl ファイルパスを推定 */
function pickScaleLocalFile(item) {
  // title 例: "Ab(2オクターブ・低)"
  const m = item.title.match(/^(\S+)\((\d+)オクターブ・(低|高|全)\)$/)
  if (!m) return null
  const [, tonic, oct, regJa] = m
  const regKey = { 低: "low", 高: "high", 全: "full" }[regJa]
  const meta = item.metadata && typeof item.metadata === "object" ? item.metadata : {}
  const variant = meta.modeVariant ?? "natural"
  // detache 限定 (seed の方針)
  return path.join(SCALE_DIR, `scale_${tonic}_minor_${variant}_${oct}oct_detache_${regKey}.mxl`)
}

/** PracticeItem (arpeggio Ab minor / dim7) → ローカル .mxl ファイルパスを推定 */
function pickArpeggioLocalFile(item) {
  // title 例: "Ab 短調 短和音 3オクターブ デタシェ" / "Ab 短調 減7和音 2オクターブ デタシェ"
  const m = item.title.match(/^(\S+)\s+短調\s+(短和音|減7和音)\s+(\d+)オクターブ\s+デタシェ$/)
  if (!m) return null
  const [, tonic, chordJa, oct] = m
  const chordKey = chordJa === "短和音" ? "minor" : "diminished7"
  return path.join(ARP_DIR, `arpeggio_${tonic}_${chordKey}_${oct}oct_detache.mxl`)
}

async function main() {
  console.log(DRY ? "=== DRY RUN ===" : "=== EXECUTE ===")

  const items = await prisma.practiceItem.findMany({
    where: { keyTonic: "Ab", keyMode: "minor" },
    select: { id: true, title: true, category: true, originalXmlPath: true, metadata: true },
  })
  console.log(`\nAb minor PracticeItem: ${items.length}`)

  const plans = []
  for (const it of items) {
    const localPath = it.category === "scale" ? pickScaleLocalFile(it) : pickArpeggioLocalFile(it)
    if (!localPath || !fs.existsSync(localPath)) {
      console.error(`  ✗ ローカルファイル不明 / 不存在: id=${it.id} title="${it.title}" → ${localPath ?? "(parse failed)"}`)
      process.exit(1)
    }
    plans.push({ id: it.id, title: it.title, storagePath: it.originalXmlPath, localPath })
  }

  console.log("\n--- アップロード予定 ---")
  for (const p of plans) {
    const size = fs.statSync(p.localPath).size
    console.log(`  ${p.localPath} (${size} bytes) → ${p.storagePath}`)
  }

  if (DRY) {
    console.log("\n=== DRY RUN: 何もアップロードしていません ===")
    return
  }

  console.log("\n--- アップロード実行 ---")
  let ok = 0, fail = 0
  for (const p of plans) {
    const buf = fs.readFileSync(p.localPath)
    const { error } = await supabase.storage
      .from("musicxml")
      .upload(p.storagePath, buf, {
        upsert: true,
        contentType: "application/vnd.recordare.musicxml+zip",
      })
    if (error) {
      console.error(`  ✗ ${p.storagePath}: ${error.message}`)
      fail++
    } else {
      console.log(`  ✓ ${p.storagePath}`)
      ok++
    }
  }
  console.log(`\n=== 完了: 成功 ${ok}, 失敗 ${fail} ===`)
  if (fail > 0) process.exit(1)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
