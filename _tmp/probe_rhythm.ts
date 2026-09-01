import "dotenv/config"
import { prisma } from "../app/_libs/prisma"
async function main() {
  const pi = await prisma.practiceItem.findMany({
    where: { rhythmRecipe: { not: undefined } },
    select: { id: true, title: true, partId: true, groupId: true, buildStatus: true, rhythmRecipe: true },
  })
  console.log("=== PracticeItem でリズム登録あり:", pi.length, "件 ===")
  for (const x of pi.slice(0, 12)) console.log(`  ${x.title} part=${x.partId ?? "通し"} ${x.buildStatus}`)
  const sc = await prisma.score.findMany({
    where: { rhythmRecipe: { not: undefined }, deletedAt: null },
    select: { id: true, title: true, partId: true, groupId: true, buildStatus: true },
  })
  console.log("\n=== Score でリズム登録あり:", sc.length, "件 ===")
  for (const x of sc.slice(0, 12)) console.log(`  ${x.title} part=${x.partId ?? "通し"} ${x.buildStatus} group=${x.groupId ? "有" : "無"}`)
  // それらのグループにパート定義があるか
  const gids = [...new Set([...pi, ...sc].map((x) => x.groupId).filter(Boolean))] as string[]
  const gs = await prisma.materialGroup.findMany({ where: { id: { in: gids } }, select: { id: true, title: true, kind: true, parts: true } })
  console.log("\n=== 該当グループのパート定義 ===")
  for (const g of gs) {
    const n = Array.isArray(g.parts) ? (g.parts as unknown[]).length : 0
    console.log(`  ${g.title} [${g.kind}] パート${n}個`)
  }
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e.message); process.exit(1) })
