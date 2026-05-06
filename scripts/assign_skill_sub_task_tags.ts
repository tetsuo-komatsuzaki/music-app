// scripts/assign_skill_sub_task_tags.ts
//
// v3.2.2 Commit 8 / §11-6 — PracticeItem.skillSubTaskTags 初期付与。
//
// Usage:
//   npx tsx scripts/assign_skill_sub_task_tags.ts --dry-run
//   npx tsx scripts/assign_skill_sub_task_tags.ts --apply
//   npx tsx scripts/assign_skill_sub_task_tags.ts --apply --force  # 既存値も上書き
//
// 付与ルール:
//   scale:
//     - keyMode="chromatic" → ["pitch_overall", "pitch_chromatic"]
//     - 上記以外 → ["pitch_overall"]
//     - title に「高」or「全」が含まれる場合 → さらに "pitch_high" を追加
//   arpeggio:
//     - ["pitch_overall", "string_change_volume", "string_change_timing"]
//   etude:
//     - ["pitch_overall", "rhythm_overall"] (admin 個別調整前提の最小デフォルト)
//
// 既存値が NOT NULL の行は --force なしでスキップ (admin の手動編集を温存)。

import { config } from "dotenv"
config()

import { Prisma } from "../app/generated/prisma"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../app/generated/prisma/client.js"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

type Mode = "dry-run" | "apply"

function deriveTags(item: {
  category: string
  keyMode: string
  title: string
}): string[] {
  if (item.category === "scale") {
    const tags = ["pitch_overall"]
    if (item.keyMode === "chromatic") tags.push("pitch_chromatic")
    if (/高|全/.test(item.title)) tags.push("pitch_high")
    return tags
  }
  if (item.category === "arpeggio") {
    return ["pitch_overall", "string_change_volume", "string_change_timing"]
  }
  if (item.category === "etude") {
    return ["pitch_overall", "rhythm_overall"]
  }
  return []
}

async function main() {
  const args = process.argv.slice(2)
  const mode: Mode = args.includes("--apply") ? "apply" : "dry-run"
  const force = args.includes("--force")
  console.log(`mode: ${mode}${force ? " (force overwrite)" : ""}\n`)

  const items = await prisma.practiceItem.findMany({
    select: {
      id: true,
      category: true,
      keyMode: true,
      title: true,
      skillSubTaskTags: true,
    },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  })

  // --- 集計 ---
  const summary: Record<string, { total: number; willUpdate: number; willSkip: number; tagDist: Record<string, number> }> = {}
  type Plan = { id: string; category: string; title: string; tags: string[]; willUpdate: boolean; reason?: string }
  const plans: Plan[] = []

  for (const it of items) {
    if (!summary[it.category]) {
      summary[it.category] = { total: 0, willUpdate: 0, willSkip: 0, tagDist: {} }
    }
    summary[it.category].total++

    const newTags = deriveTags({
      category: it.category,
      keyMode: it.keyMode,
      title: it.title,
    })
    const existingIsNull = it.skillSubTaskTags === null
    const willUpdate = existingIsNull || force

    if (willUpdate) {
      summary[it.category].willUpdate++
      const tagsKey = newTags.slice().sort().join("+")
      summary[it.category].tagDist[tagsKey] =
        (summary[it.category].tagDist[tagsKey] ?? 0) + 1
    } else {
      summary[it.category].willSkip++
    }

    plans.push({
      id: it.id,
      category: it.category,
      title: it.title,
      tags: newTags,
      willUpdate,
      reason: !willUpdate ? "already set (use --force to overwrite)" : undefined,
    })
  }

  console.log("=== Summary ===")
  for (const [cat, s] of Object.entries(summary)) {
    console.log(`${cat}: total=${s.total}, willUpdate=${s.willUpdate}, willSkip=${s.willSkip}`)
    for (const [tags, count] of Object.entries(s.tagDist).sort((a, b) => b[1] - a[1])) {
      console.log(`  [${tags.replace(/\+/g, ", ")}] × ${count}`)
    }
  }

  console.log("\n=== Sample (first 5 of each category) ===")
  const seen: Record<string, number> = {}
  for (const p of plans) {
    seen[p.category] = (seen[p.category] ?? 0) + 1
    if (seen[p.category] > 5) continue
    const tagStr = p.tags.length > 0 ? `[${p.tags.join(", ")}]` : "(empty)"
    console.log(`  [${p.category}] "${p.title}" → ${tagStr}${p.reason ? ` SKIP: ${p.reason}` : ""}`)
  }

  if (mode === "dry-run") {
    console.log("\n(no changes written. Run with --apply to commit.)")
    await prisma.$disconnect()
    return
  }

  // --- apply ---
  console.log("\n=== Applying ===")
  let updated = 0
  for (const p of plans) {
    if (!p.willUpdate) continue
    await prisma.practiceItem.update({
      where: { id: p.id },
      data: { skillSubTaskTags: p.tags as Prisma.InputJsonValue },
    })
    updated++
    if (updated % 50 === 0) console.log(`  updated ${updated}...`)
  }
  console.log(`\nDone: ${updated} items updated.`)

  // --- verify ---
  const remainingNull = await prisma.practiceItem.count({
    where: { skillSubTaskTags: { equals: Prisma.DbNull } },
  })
  const total = await prisma.practiceItem.count()
  console.log(`After: ${total - remainingNull}/${total} items have skillSubTaskTags (${remainingNull} remain NULL).`)

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
