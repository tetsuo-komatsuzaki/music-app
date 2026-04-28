// scripts/seed-arpeggios.ts
// Usage: npx tsx scripts/seed-arpeggios.ts
// 既存のアルペジオアイテムをすべて削除し、Excelデータで再シードする

import { config } from "dotenv"
config()

import * as fs from "fs"
import * as path from "path"
import { fileURLToPath } from "url"
import { PrismaClient } from "../app/generated/prisma/client.js"
import { PrismaPg } from "@prisma/adapter-pg"
import * as XLSX from "xlsx"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma  = new PrismaClient({ adapter })

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

const XLSX_PATH  = path.join(__dirname, "..", "prisma", "data", "arcoda_arpeggios_540.xlsx")
const URLS_JSON  = path.join(__dirname, "..", "prisma", "data", "mxl_arpeggio_urls.json")

// 最小オクターブ数（generate_arpeggio_mxl.py と同じ値）
const MIN_OCTAVES: Record<string, number> = {
  major:       3,
  minor:       3,
  augmented:   3,
  dominant7:   2,
  diminished7: 2,
}

const BOW_KEY_MAP: Record<string, string> = {
  "デタシェ":   "detache",
  "スタッカート": "staccato",
  "スラー4音":  "slur4",
}

// TechniqueTag の弓法マッピング
const BOW_TO_TECH: Record<string, string[]> = {
  detache:  ["デタシェ"],
  staccato: ["スタッカート"],
  slur4:    ["レガート"],
}

function parsePositions(posStr: string | null | undefined): string[] {
  if (!posStr) return []
  return posStr.split(/[,、・\s]+/).map(s => s.trim()).filter(Boolean)
}

function parseTempo(tempoStr: string | null | undefined): { min: number | null; max: number | null } {
  if (!tempoStr) return { min: null, max: null }
  const nums = tempoStr.match(/\d+/g)
  if (!nums) return { min: null, max: null }
  if (nums.length >= 2) return { min: parseInt(nums[0]), max: parseInt(nums[1]) }
  return { min: parseInt(nums[0]), max: parseInt(nums[0]) }
}

async function main() {
  // =========================================================
  // ① 既存のアルペジオアイテムをすべて削除
  // =========================================================
  console.log("Deleting existing arpeggio items...")

  const existingItems = await prisma.practiceItem.findMany({
    where: { category: "arpeggio" },
    select: { id: true },
  })
  const existingIds = existingItems.map(i => i.id)

  if (existingIds.length > 0) {
    await prisma.practicePerformance.deleteMany({
      where: { practiceItemId: { in: existingIds } },
    })
    await prisma.practiceItemTechnique.deleteMany({
      where: { practiceItemId: { in: existingIds } },
    })
    await prisma.practiceItem.deleteMany({
      where: { id: { in: existingIds } },
    })
    console.log(`  Deleted ${existingIds.length} existing arpeggio items.`)
  } else {
    console.log("  No existing arpeggio items found.")
  }

  // =========================================================
  // ② Excel と URLsマップを読み込む
  // =========================================================
  const urlsRaw  = fs.readFileSync(URLS_JSON, "utf-8")
  const urlsMap: Record<string, string> = JSON.parse(urlsRaw)

  const wb = XLSX.readFile(XLSX_PATH)
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null })
  const dataRows = rawRows.slice(1).filter(row => row[0]) // ヘッダー行を除く

  console.log(`Loaded ${dataRows.length} rows from Excel`)

  // TechniqueTagを取得
  const techniques = await prisma.techniqueTag.findMany({
    where: { name: { in: ["デタシェ", "スタッカート", "レガート"] } },
    select: { id: true, name: true },
  })
  const techMap: Record<string, string> = {}
  for (const t of techniques) techMap[t.name] = t.id

  // =========================================================
  // ③ PracticeItem を作成
  // =========================================================
  let created = 0
  let skipped = 0

  for (const row of dataRows) {
    const title       = String(row[0] || "").trim()
    const composer    = String(row[1] || "").trim() || null
    const tonic       = String(row[3] || "").trim()   // D列
    const keyMode     = String(row[4] || "").trim()   // E列: major/minor
    const chordKey    = String(row[6] || "").trim()   // G列: 和音種類キー
    const octExcel    = parseInt(String(row[7] || "2"))
    const bowJa       = String(row[8] || "").trim()   // I列
    const difficulty  = parseInt(String(row[9] || "1"))
    const posStr      = String(row[10] || "").trim()  // K列
    const tempoStr    = String(row[11] || "").trim()  // L列
    const descShort   = String(row[12] || "").trim() || null  // M列
    const description = String(row[13] || "").trim() || null  // N列

    const bowKey = BOW_KEY_MAP[bowJa]
    if (!bowKey) {
      console.warn(`  Skip (unknown bow): "${bowJa}" - ${title}`)
      skipped++
      continue
    }
    if (!MIN_OCTAVES[chordKey]) {
      console.warn(`  Skip (unknown chord): "${chordKey}" - ${title}`)
      skipped++
      continue
    }

    // タイトル詐称防止: Excel オクターブが MIN_OCTAVES 未満の行は drop。
    // 例: "1オクターブ major" は MIN_OCTAVES["major"]=3 で実際は 3oct MXL が再生され、
    // タイトルと演奏内容が乖離するため除外。実 MXL に一致するオクターブの行のみ残す。
    if (octExcel < MIN_OCTAVES[chordKey]) {
      skipped++
      continue
    }

    const minOct    = MIN_OCTAVES[chordKey]
    const targetOct = Math.max(octExcel, minOct)

    // ファイル名 (generate_arpeggio_mxl.py と同じ形式)
    const filename    = `arpeggio_${tonic}_${chordKey}_${targetOct}oct_${bowKey}.mxl`
    const storagePath = urlsMap[filename]

    if (!storagePath) {
      console.warn(`  Skip (no MXL): ${filename}`)
      skipped++
      continue
    }

    const positions = parsePositions(posStr)
    const { min: tempoMin, max: tempoMax } = parseTempo(tempoStr)

    const item = await prisma.practiceItem.create({
      data: {
        category:         "arpeggio",
        title,
        composer,
        description,
        descriptionShort: descShort,
        keyTonic:         tonic,
        keyMode:          keyMode || "major",
        tempoMin,
        tempoMax,
        positions,
        instrument:       "violin",
        originalXmlPath:  storagePath,
        generatedXmlPath: storagePath,
        buildStatus:      "done",
        isPublished:      true,
        source:           "seed",
        sortOrder:        created,
      },
    })

    // TechniqueTag を関連付け
    const techNames = BOW_TO_TECH[bowKey] || []
    for (const techName of techNames) {
      const techId = techMap[techName]
      if (techId) {
        await prisma.practiceItemTechnique.create({
          data: { practiceItemId: item.id, techniqueTagId: techId, isPrimary: true },
        })
      }
    }

    created++
    if (created % 100 === 0) console.log(`  Created ${created}...`)
  }

  console.log(`\nDone: created=${created}, skipped=${skipped}`)
  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
