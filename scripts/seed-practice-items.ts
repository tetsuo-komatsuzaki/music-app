// scripts/seed-practice-items.ts
// Usage: npx tsx scripts/seed-practice-items.ts
// 既存のscaleアイテムをすべて削除し、新カリキュラムで再シードする

import { config } from "dotenv"
config()

import * as fs from "fs"
import * as path from "path"
import { fileURLToPath } from "url"
import { PrismaClient } from "../app/generated/prisma/client.js"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const MXL_URLS_JSON = path.join(__dirname, "..", "prisma", "data", "mxl_urls.json")

// =========================================================
// ファイル名パーサー
// フォーマット: scale_{tonic}_{mode}_{variant}_{N}oct_{bow}_{register}.mxl
// 例: scale_G_major__2oct_detache_low.mxl
//     scale_A_minor_harmonic_2oct_slur4_high.mxl
//     scale_C_chromatic_chromatic_3oct_legato_full.mxl
// =========================================================
function parseFilename(filename: string): {
  tonic: string
  keyMode: string
  octaves: number
  bow: string
  register: string
  title: string
  difficulty: number
} | null {
  const base = filename.replace(/\.mxl$/, "")
  const parts = base.split("_")

  // 必須: ["scale", tonic, mode, variant, "Noct", bow, register] = 7 parts
  if (parts[0] !== "scale" || parts.length !== 7) return null

  const [, tonic, mode, variant, octPart, bow, register] = parts

  const octMatch = octPart?.match(/^(\d+)oct$/)
  if (!octMatch) return null
  const octaves = parseInt(octMatch[1])

  let keyMode: string
  let modeLabel: string
  if (mode === "major") {
    keyMode = "major"
    modeLabel = "長調"
  } else if (mode === "minor") {
    keyMode = "minor"
    modeLabel =
      variant === "harmonic" ? "和声的短調" :
      variant === "melodic"  ? "旋律的短調" : "自然短調"
  } else if (mode === "chromatic") {
    keyMode = "chromatic"
    modeLabel = "半音階"
  } else {
    return null
  }

  const bowLabels: Record<string, string> = {
    detache: "デタシェ", staccato: "スタッカート",
    slur2: "スラー2", slur4: "スラー4", slur8: "スラー8", legato: "レガート",
  }
  const registerLabels: Record<string, string> = { low: "低", high: "高", full: "全" }

  const bowLabel = bowLabels[bow] || bow
  const registerJa = registerLabels[register] || ""

  const title =
    mode === "chromatic"
      ? `${tonic} 半音階 ${octaves}オクターブ ${bowLabel} (${registerJa}音域)`
      : `${tonic} ${modeLabel} ${octaves}オクターブ ${bowLabel} (${registerJa}音域)`

  // 難易度: オクターブ数ベース + 短調/半音階 +1 + 高音域/全音域 +1
  let difficulty = octaves
  if (mode === "minor" || mode === "chromatic") difficulty = Math.min(difficulty + 1, 5)
  if (register === "high" || register === "full") difficulty = Math.min(difficulty + 1, 5)

  return { tonic, keyMode, octaves, bow, register, title, difficulty }
}

async function main() {
  // =========================================================
  // ① 既存のscaleアイテムをすべて削除（関連テーブルも cascade）
  // =========================================================
  console.log("Deleting existing scale items...")

  const existingItems = await prisma.practiceItem.findMany({
    where: { category: "scale" },
    select: { id: true },
  })
  const existingIds = existingItems.map((i) => i.id)

  if (existingIds.length > 0) {
    // PracticePerformance, PracticeItemTechnique は外部キー制約があるため先に削除
    await prisma.practicePerformance.deleteMany({
      where: { practiceItemId: { in: existingIds } },
    })
    await prisma.practiceItemTechnique.deleteMany({
      where: { practiceItemId: { in: existingIds } },
    })
    await prisma.practiceItem.deleteMany({
      where: { id: { in: existingIds } },
    })
    console.log(`  Deleted ${existingIds.length} existing scale items.`)
  } else {
    console.log("  No existing scale items found.")
  }

  // =========================================================
  // ② 新しいアイテムを作成
  // =========================================================
  const urlsRaw = fs.readFileSync(MXL_URLS_JSON, "utf-8")
  const urlsMap: Record<string, string> = JSON.parse(urlsRaw)

  // TechniqueTagを取得
  const techniques = await prisma.techniqueTag.findMany({
    where: { name: { in: ["デタシェ", "スタッカート", "レガート"] } },
    select: { id: true, name: true },
  })
  const techMap: Record<string, string> = {}
  for (const t of techniques) techMap[t.name] = t.id

  const bowToTech: Record<string, string[]> = {
    detache: ["デタシェ"],
    staccato: ["スタッカート"],
    legato: ["レガート"],
    slur2: ["レガート"],
    slur4: ["レガート"],
    slur8: ["レガート"],
  }

  // sortOrder: register順 (low=0, high=10000, full=20000) + 連番
  const sortCounters: Record<string, number> = { low: 0, high: 10000, full: 20000 }

  const filenames = Object.keys(urlsMap).sort()
  console.log(`Processing ${filenames.length} files...`)

  let created = 0
  let skipped = 0

  for (const filename of filenames) {
    const storagePath = urlsMap[filename]
    const meta = parseFilename(filename)
    if (!meta) {
      console.warn(`  Skip (parse fail): ${filename}`)
      skipped++
      continue
    }

    sortCounters[meta.register] = (sortCounters[meta.register] ?? 0) + 1

    const item = await prisma.practiceItem.create({
      data: {
        category: "scale",
        title: meta.title,
        keyTonic: meta.tonic,
        keyMode: meta.keyMode,
        originalXmlPath: storagePath,
        generatedXmlPath: storagePath,
        buildStatus: "done",
        isPublished: true,
        source: "seed",
        sortOrder: sortCounters[meta.register],
        instrument: "violin",
      },
    })

    const techNames = bowToTech[meta.bow] || []
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

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
