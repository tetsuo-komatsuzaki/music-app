// 全公開曲の達成条件を棚卸し: エチュード要件の有無 (=ゴールカードにエチュード行が出るか) と
// レッスン要件数。achievement-status route / achievement.py と同一の解決ロジック。読み取りのみ。
import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })

function parsePositions(raw: string[] | number[]): number[] {
  return (raw as (string | number)[])
    .map((p) => {
      if (typeof p === "number") return p
      const m = /^(\d+)/.exec(p)
      return m ? parseInt(m[1], 10) : null
    })
    .filter((n): n is number => n !== null)
}

async function main() {
  // レッスン在庫 (公開中 lesson 教材のタグ集合)
  const lessonItems = await prisma.practiceItem.findMany({
    where: { category: "lesson", isPublished: true },
    select: {
      positions: true,
      techniques: { select: { techniqueTag: { select: { name: true } } } },
      featureTags: { select: { featureTag: { select: { category: true, name: true, isAcquisition: true } } } },
    },
  })
  const stock = { technique: new Set<string>(), double_stop: new Set<string>(), position: new Set<string>() }
  for (const li of lessonItems) {
    for (const t of li.techniques) stock.technique.add(t.techniqueTag.name)
    for (const f of li.featureTags) {
      if (f.featureTag.category === "double_stop" && f.featureTag.isAcquisition) stock.double_stop.add(f.featureTag.name)
    }
    for (const n of parsePositions(li.positions as unknown as string[])) {
      if (n >= 2) stock.position.add(n >= 6 ? "6" : String(n))
    }
  }

  const scores = await prisma.score.findMany({
    where: { deletedAt: null },
    select: {
      id: true, title: true, star: true,
      scoreTechniqueTags: { select: { techniqueTag: { select: { name: true } } } },
      featureTags: { select: { featureTag: { select: { category: true, name: true, isAcquisition: true } } } },
      positions: true,
    },
    orderBy: [{ star: "asc" }, { title: "asc" }],
  })

  const etudeStars = await prisma.practiceItem.findMany({
    where: { category: "etude", isPublished: true },
    select: { id: true, star: true, title: true, techniques: { select: { techniqueTag: { select: { name: true } } } } },
  })

  let noEtude = 0
  let noLesson = 0
  const lines: string[] = []
  for (const s of scores) {
    const techNames = s.scoreTechniqueTags.map((t) => t.techniqueTag.name)
    // エチュード要件: star一致かつ奏法が重なる公開エチュードが1つでもあれば required
    const cands = s.star == null || techNames.length === 0
      ? []
      : etudeStars.filter((e) => e.star === s.star && e.techniques.some((t) => techNames.includes(t.techniqueTag.name)))
    // レッスン要件数 (在庫のあるタグのみ)
    let lessons = 0
    for (const n of techNames) if (stock.technique.has(n)) lessons++
    for (const f of s.featureTags) {
      if (f.featureTag.category === "double_stop" && f.featureTag.isAcquisition && stock.double_stop.has(f.featureTag.name)) lessons++
    }
    const posKeys = new Set<string>()
    for (const n of s.positions) if (n >= 2) posKeys.add(n >= 6 ? "6" : String(n))
    for (const k of posKeys) if (stock.position.has(k)) lessons++

    const etude = cands.length > 0
    if (!etude) noEtude++
    if (lessons === 0) noLesson++
    lines.push(
      `${etude ? "  " : "E-"}${lessons === 0 ? "L- " : "   "}★${s.star ?? "?"} ${s.title}` +
      ` | tech=[${techNames.join(",")}] etude候補=${cands.length} lesson要件=${lessons}`,
    )
  }
  console.log(lines.join("\n"))
  console.log(`\n合計 ${scores.length}曲 / エチュード要件なし(E-) ${noEtude}曲 / レッスン要件なし(L-) ${noLesson}曲`)
  console.log("(E- の曲はゴールカードにエチュード行が出ない=達成条件は残り2種 / L- はレッスン行なし)")
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
