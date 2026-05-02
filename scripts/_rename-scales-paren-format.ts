// scripts/_rename-scales-paren-format.ts
// Usage: npx tsx scripts/_rename-scales-paren-format.ts
//
// 音階タイトルを `${tonic}(${octaves}オクターブ・${register})` 形式に統一する。
// 例: "C 長調 2オクターブ 低音域" → "C(2オクターブ・低)"
//     "F# 和声的短音階 3オクターブ 全音域" → "F#(3オクターブ・全)"
//
// 同時に variant 情報を metadata.modeVariant に保存:
//   harmonic: 和声的短音階
//   melodic:  旋律的短音階
//   natural:  自然短音階
//   chromatic: 半音階 (keyMode=chromatic で表現可だが念のため明示)
//   major 系は modeVariant 不要なので保存しない

import { config } from "dotenv"
config()

import { PrismaClient } from "../app/generated/prisma/client.js"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

type ParseResult = {
  newTitle: string
  modeVariant: "harmonic" | "melodic" | "natural" | null
}

/**
 * 既存タイトルから octaves, register, variant を抽出して新フォーマット + variant を返す。
 * 抽出できない場合は null。
 */
function parseAndRebuild(oldTitle: string, tonic: string): ParseResult | null {
  // すでに新フォーマット末尾なら scan のみして variant 取得
  const alreadyNew = /^.+\(\d+オクターブ・[低高全]\)$/.test(oldTitle)

  const octMatch = oldTitle.match(/(\d+)オクターブ/)
  if (!octMatch) return null
  const octaves = octMatch[1]

  // register: 旧形式 (低|高|全)音域 / 新形式 ・(低|高|全))
  let register: string | null = null
  const oldReg = oldTitle.match(/(低|高|全)音域/)
  if (oldReg) register = oldReg[1]
  else {
    const newReg = oldTitle.match(/・([低高全])\)$/)
    if (newReg) register = newReg[1]
  }
  if (!register) return null
  if (!tonic) return null

  // variant 検出（旧 title のみ判別可能）
  let modeVariant: ParseResult["modeVariant"] = null
  if (oldTitle.includes("和声的短音階")) modeVariant = "harmonic"
  else if (oldTitle.includes("旋律的短音階")) modeVariant = "melodic"
  else if (oldTitle.includes("自然短音階")) modeVariant = "natural"
  // 既に new format の場合は variant 取れないが、metadata 既存値を温存する想定

  const newTitle = `${tonic}(${octaves}オクターブ・${register})`

  // 既に new format で同一 → 更新不要だが variant 取得不能なので呼び出し側で扱う
  if (alreadyNew && newTitle === oldTitle) {
    return { newTitle, modeVariant }
  }

  return { newTitle, modeVariant }
}

async function main() {
  const items = await prisma.practiceItem.findMany({
    where: { category: "scale" },
    select: { id: true, title: true, keyTonic: true, keyMode: true, metadata: true },
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  })

  console.log(`Found ${items.length} scale items.\n`)

  let updatedTitle = 0
  let updatedMetadata = 0
  let unchanged = 0
  let unparseable = 0

  for (const item of items) {
    const tonic = item.keyTonic ?? ""
    const result = parseAndRebuild(item.title, tonic)

    if (!result) {
      console.warn(`  ⚠ Skip (unparseable): "${item.title}" tonic="${tonic}"`)
      unparseable++
      continue
    }

    const titleChanged = result.newTitle !== item.title

    // 既存 metadata と merge
    const existingMeta =
      typeof item.metadata === "object" && item.metadata !== null && !Array.isArray(item.metadata)
        ? (item.metadata as Record<string, unknown>)
        : {}
    let metadataChanged = false
    let newMetadata: Record<string, unknown> = existingMeta
    if (result.modeVariant) {
      if (existingMeta.modeVariant !== result.modeVariant) {
        newMetadata = { ...existingMeta, modeVariant: result.modeVariant }
        metadataChanged = true
      }
    }

    if (!titleChanged && !metadataChanged) {
      unchanged++
      continue
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {}
    if (titleChanged) {
      data.title = result.newTitle
      console.log(`  "${item.title}" → "${result.newTitle}"${result.modeVariant ? ` [variant=${result.modeVariant}]` : ""}`)
      updatedTitle++
    }
    if (metadataChanged) {
      data.metadata = newMetadata
      if (!titleChanged) {
        console.log(`  (metadata only) "${item.title}" [variant=${result.modeVariant}]`)
      }
      updatedMetadata++
    }

    await prisma.practiceItem.update({
      where: { id: item.id },
      data,
    })
  }

  console.log(`\n=== Summary ===`)
  console.log(`Updated title:    ${updatedTitle}`)
  console.log(`Updated metadata: ${updatedMetadata}`)
  console.log(`Unchanged:        ${unchanged}`)
  console.log(`Unparseable:      ${unparseable}`)
  console.log(`Total:            ${items.length}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
