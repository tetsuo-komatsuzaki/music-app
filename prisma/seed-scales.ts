import * as fs from "fs"
import * as path from "path"
import * as dotenv from "dotenv"

dotenv.config()

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../app/generated/prisma/client"

// Excel reading via openpyxl is not available in TS, use xlsx
import * as XLSX from "xlsx"

const EXCEL_PATH = path.join(__dirname, "data", "arcoda_scales_936.xlsx")
const MXL_URLS_PATH = path.join(__dirname, "data", "mxl_urls.json")

const CATEGORY_MAP: Record<string, string> = {
  "音階": "scale",
  "アルペジオ": "arpeggio",
  "エチュード": "etude",
}

const BOW_KEY_MAP: Record<string, string> = {
  "デタシェ": "detache",
  "スタッカート": "staccato",
  "スラー2音": "slur2",
  "スラー4音": "slur4",
  "スラー8音": "slur8",
  "レガート": "legato",
}

const SCALE_TYPE_MAP: Record<string, string> = {
  "長音階": "major",
  "自然的短音階": "natural_minor",
  "和声的短音階": "harmonic_minor",
  "旋律的短音階": "melodic_minor",
  "半音階": "chromatic",
}

function parseTempo(s: string | null): { min: number; max: number } {
  if (!s) return { min: 60, max: 100 }
  const nums = s.match(/\d+/g)
  if (!nums) return { min: 60, max: 100 }
  if (nums.length >= 2) return { min: parseInt(nums[0]), max: parseInt(nums[1]) }
  return { min: parseInt(nums[0]), max: parseInt(nums[0]) }
}

function parsePositions(s: string | null): string[] {
  if (!s) return []
  return s.split(/[・,、]/).map(p => p.trim()).filter(Boolean)
}

function parseTags(s: string | null): string[] {
  if (!s) return []
  return s.split(/[・,、]/).map(t => t.trim()).filter(Boolean)
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter })

  // Load mxl_urls.json
  const mxlUrls: Record<string, string> = JSON.parse(fs.readFileSync(MXL_URLS_PATH, "utf-8"))

  // Load Excel
  const workbook = XLSX.readFile(EXCEL_PATH)
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 })

  // Skip header (row 0)
  const dataRows = rows.slice(1)
  console.log(`Data rows: ${dataRows.length}`)

  let created = 0
  let skipped = 0
  let tagLinks = 0

  // Process in batches of 50
  const BATCH_SIZE = 50

  for (let i = 0; i < dataRows.length; i += BATCH_SIZE) {
    const batch = dataRows.slice(i, i + BATCH_SIZE)

    for (let j = 0; j < batch.length; j++) {
      const row = batch[j]
      const rowIdx = i + j + 2 // Excel row number (1-indexed, skip header)

      const title = row[0] as string
      if (!title) continue

      const composer = row[1] as string || null
      const categoryJa = row[2] as string || "音階"
      const category = CATEGORY_MAP[categoryJa] || "scale"
      const keyTonic = row[3] as string || "C"
      const keyMode = row[4] as string || "major"
      const scaleTypeJa = row[5] as string || ""
      const minorVariant = row[6] as string || ""
      const octaves = parseInt(row[7]) || 1
      const bow = row[8] as string || "デタシェ"
      const positionStr = row[10] as string || ""
      const tempoStr = row[11] as string || ""
      const descShort = row[12] as string || null
      const descDetail = row[13] as string || null
      const primaryTagsStr = row[14] as string || ""
      const normalTagsStr = row[15] as string || ""

      const tempo = parseTempo(tempoStr)
      const positions = parsePositions(positionStr)
      const bowKey = BOW_KEY_MAP[bow] || "detache"
      // variant_key: use minor_variant (column G) for minor, "chromatic" for chromatic
      let variantKey = ""
      if (keyMode === "minor") {
        variantKey = (minorVariant || "").trim().toLowerCase()
      }
      if (scaleTypeJa === "半音階") {
        variantKey = "chromatic"
      }

      // Build filename to find storage path (must match generate_scale_mxl.py)
      const filename = `scale_${String(rowIdx).padStart(4, "0")}_${keyTonic}_${keyMode}_${variantKey}_${octaves}oct_${bowKey}.mxl`
      const storagePath = mxlUrls[filename] || ""

      if (!storagePath) {
        console.warn(`No storage path for: ${filename}`)
      }

      try {
        // Upsert PracticeItem by title
        const item = await prisma.practiceItem.upsert({
          where: { id: `scale_${String(rowIdx).padStart(4, "0")}` }, // dummy, use create
          update: {},
          create: {
            category: category as any,
            title,
            composer,
            description: descDetail,
            descriptionShort: descShort,
            keyTonic,
            keyMode,
            tempoMin: tempo.min,
            tempoMax: tempo.max,
            positions,
            instrument: "violin",
            originalXmlPath: storagePath,
            source: "seed",
            isPublished: true,
            metadata: {
              scaleType: scaleTypeJa,
              minorVariant: minorVariant || null,
              octaves,
              bowTechnique: bow,
              position: positionStr,
              recommendedTempo: tempoStr,
            },
          },
        })

        created++

        // Tag linking
        const primaryTags = parseTags(primaryTagsStr)
        const normalTags = parseTags(normalTagsStr)

        for (const tagName of primaryTags) {
          const tag = await prisma.techniqueTag.findFirst({
            where: { name: tagName },
          })
          if (tag) {
            try {
              await prisma.practiceItemTechnique.create({
                data: { practiceItemId: item.id, techniqueTagId: tag.id, isPrimary: true },
              })
              tagLinks++
            } catch { /* duplicate */ }
          }
        }

        for (const tagName of normalTags) {
          const tag = await prisma.techniqueTag.findFirst({
            where: { name: tagName },
          })
          if (tag) {
            try {
              await prisma.practiceItemTechnique.create({
                data: { practiceItemId: item.id, techniqueTagId: tag.id, isPrimary: false },
              })
              tagLinks++
            } catch { /* duplicate */ }
          }
        }

      } catch (e: any) {
        if (e.code === "P2002") {
          skipped++
        } else {
          console.error(`Error row ${rowIdx}: ${e.message}`)
        }
      }
    }

    console.log(`Progress: ${Math.min(i + BATCH_SIZE, dataRows.length)}/${dataRows.length}`)
  }

  console.log(`\nImport complete:`)
  console.log(`  Created: ${created}`)
  console.log(`  Skipped (duplicate): ${skipped}`)
  console.log(`  Tag links: ${tagLinks}`)

  await prisma.$disconnect()
}

main().catch(console.error)
