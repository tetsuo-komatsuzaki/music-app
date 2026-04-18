// scripts/rename-scale-titles.ts
// Usage: npx tsx scripts/rename-scale-titles.ts
// スケール練習アイテムの題名を「ト長調 2オクターブ 低音域」形式に変更する

import { config } from "dotenv"
config()

import { PrismaClient } from "../app/generated/prisma/client.js"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// 英語トニック → 日本語調名
const tonicToJa: Record<string, string> = {
  "C": "ハ", "G": "ト", "D": "ニ", "A": "イ", "E": "ホ", "B": "ロ",
  "F#": "嬰ヘ", "F": "ヘ",
  "Bb": "変ロ", "Eb": "変ホ", "Ab": "変イ", "Db": "変ニ",
  "Gb": "変ト", "Cb": "変ハ",
  "C#": "嬰ハ", "D#": "嬰ニ", "G#": "嬰ト", "A#": "嬰イ",
}

function buildTitle(title: string, tonic: string, mode: string): string {
  // 既存タイトルからオクターブと音域を抽出
  const octMatch = title.match(/(\d+)オクターブ/)
  const octaves = octMatch ? octMatch[1] : "2"

  const registerMatch = title.match(/\((.+?)音域\)/)
  const register = registerMatch ? registerMatch[1] : ""

  const tonicJa = tonicToJa[tonic] || tonic

  let modeName: string
  if (mode === "major") {
    modeName = "長調"
  } else if (mode === "minor") {
    // 短調のバリエーションを既存タイトルから判定
    if (title.includes("和声的")) modeName = "和声的短音階"
    else if (title.includes("旋律的")) modeName = "旋律的短音階"
    else modeName = "自然短音階"
  } else if (mode === "chromatic") {
    modeName = "半音階"
  } else {
    modeName = mode
  }

  const registerSuffix = register ? ` ${register}音域` : ""

  if (mode === "chromatic") {
    return `${tonicJa} ${modeName} ${octaves}オクターブ${registerSuffix}`
  }
  return `${tonicJa}${modeName} ${octaves}オクターブ${registerSuffix}`
}

async function main() {
  const items = await prisma.practiceItem.findMany({
    where: { category: "scale" },
    select: { id: true, title: true, keyTonic: true, keyMode: true },
  })

  console.log(`Processing ${items.length} items...`)

  let updated = 0
  for (const item of items) {
    const newTitle = buildTitle(item.title, item.keyTonic ?? "", item.keyMode ?? "")
    if (newTitle !== item.title) {
      console.log(`  "${item.title}" → "${newTitle}"`)
      await prisma.practiceItem.update({
        where: { id: item.id },
        data: { title: newTitle },
      })
      updated++
    }
  }

  console.log(`Updated ${updated} / ${items.length} items.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
