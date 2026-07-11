/**
 * link-onboarding-songs.ts — 目標曲カタログ(OnboardingSong)と既存の共有楽譜(Score)の一括結線
 *
 * 照合: 正規化名(括弧書き/空白除去)の一致。複数Scoreが一致した場合は結線せず報告のみ。
 * 再実行可能(既結線はスキップ)。新規アップロード分は uploadScore が自動結線するので、
 * このスクリプトは初回バックフィルと張り直し用。
 *
 * 実行: npx tsx scripts/link-onboarding-songs.ts        (dry-run)
 *       npx tsx scripts/link-onboarding-songs.ts --apply (実結線)
 */
import "dotenv/config"
import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { normalizeSongName } from "../app/_libs/onboardingSongLink"

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

async function main() {
  const apply = process.argv.includes("--apply")
  const [songs, scores] = await Promise.all([
    prisma.onboardingSong.findMany({
      where: { isActive: true },
      select: { id: true, category: true, name: true, star: true, scoreId: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    }),
    prisma.score.findMany({
      where: { isShared: true, ownerScope: "admin", deletedAt: null },
      select: { id: true, title: true, star: true },
    }),
  ])
  const scoreByKey = new Map<string, { ids: string[]; titles: string[] }>()
  for (const s of scores) {
    const key = normalizeSongName(s.title)
    if (!key) continue
    const e = scoreByKey.get(key) ?? { ids: [], titles: [] }
    e.ids.push(s.id)
    e.titles.push(s.title)
    scoreByKey.set(key, e)
  }

  let linked = 0
  let already = 0
  let ambiguous = 0
  let unmatched = 0
  for (const song of songs) {
    if (song.scoreId) {
      already++
      continue
    }
    const hit = scoreByKey.get(normalizeSongName(song.name))
    if (!hit) {
      unmatched++
      continue
    }
    if (hit.ids.length > 1) {
      ambiguous++
      console.log(`AMBIGUOUS: ${song.name} -> ${hit.titles.join(" / ")} (結線見送り)`)
      continue
    }
    linked++
    console.log(`${apply ? "LINK" : "DRY"}: [${song.category}] ${song.name} -> "${hit.titles[0]}" (${hit.ids[0]})`)
    if (apply) {
      await prisma.onboardingSong.update({
        where: { id: song.id },
        data: { scoreId: hit.ids[0] },
      })
    }
  }
  console.log(
    `\n${apply ? "適用" : "dry-run"}: 結線 ${linked} / 既結線 ${already} / 曖昧 ${ambiguous} / 該当楽譜なし ${unmatched} (カタログ${songs.length}曲, 共有楽譜${scores.length}件)`,
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
