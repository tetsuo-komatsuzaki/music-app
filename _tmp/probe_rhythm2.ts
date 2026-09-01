import "dotenv/config"
import { prisma } from "../app/_libs/prisma"
import { Prisma } from "../app/generated/prisma"
async function main() {
  const pi = await prisma.practiceItem.findMany({
    where: { rhythmRecipe: { not: Prisma.DbNull } },
    select: { id: true, title: true, partId: true, groupId: true, buildStatus: true, rhythmRecipe: true, articulation: true },
  })
  console.log("=== リズム登録あり PracticeItem:", pi.length, "件 ===")
  for (const x of pi) console.log(`  ${x.title} | part=${x.partId ?? "通し"} | ${x.buildStatus} | recipe=${JSON.stringify(x.rhythmRecipe).slice(0, 60)}`)
  const gids = [...new Set(pi.map((x) => x.groupId).filter(Boolean))] as string[]
  const gs = await prisma.materialGroup.findMany({ where: { id: { in: gids } }, select: { id: true, title: true, parts: true } })
  console.log("\n=== 該当グループのパート定義 ===")
  for (const g of gs) {
    const n = Array.isArray(g.parts) ? (g.parts as unknown[]).length : 0
    const sibs = await prisma.practiceItem.count({ where: { groupId: g.id, partId: { not: null } } })
    console.log(`  ${g.title}: パート定義${n}個 / パート実体${sibs}件`)
  }
  const sc = await prisma.score.count({ where: { rhythmRecipe: { not: Prisma.DbNull }, deletedAt: null } })
  console.log("\nScore でリズム登録あり:", sc, "件")
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e.message); process.exit(1) })
