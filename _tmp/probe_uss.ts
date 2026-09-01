import "dotenv/config"
import { prisma } from "../app/_libs/prisma"
async function main() {
  const g = await prisma.userSkillSubScore.groupBy({ by: ["userId"], _count: true })
  console.log("UserSkillSubScore 保有ユーザー:", g.length, g.map((x) => x._count))
  const rows = await prisma.userSkillSubScore.findMany({
    where: { totalCount: { gte: 10 } }, take: 200,
    select: { userId: true, skillSubTaskId: true, matchedCount: true, totalCount: true, lastUpdatedAt: true },
  })
  const byU = new Map<string, typeof rows>()
  for (const r of rows) { const a = byU.get(r.userId) ?? []; a.push(r); byU.set(r.userId, a) }
  for (const [u, rs] of byU) {
    const tot = rs.reduce((a, r) => a + r.totalCount, 0), mis = rs.reduce((a, r) => a + r.matchedCount, 0)
    console.log(`\n${u.slice(0,8)} 種類${rs.length} 判定${tot} ミス${mis} 最終更新${rs[0].lastUpdatedAt.toISOString().slice(0,10)}`)
    const p = mis / tot
    const top = rs.map((r) => ({ id: r.skillSubTaskId, rate: r.matchedCount / r.totalCount,
      excess: (r.matchedCount / r.totalCount - p) * r.totalCount, t: r.totalCount }))
    console.log(" 失敗率順:", top.slice().sort((a,b)=>b.rate-a.rate).slice(0,3).map((x)=>`${x.id}(${Math.round(x.rate*100)}%/${x.t}音)`).join(" "))
    console.log(" 影響度順:", top.slice().sort((a,b)=>b.excess-a.excess).slice(0,3).map((x)=>`${x.id}(+${Math.round(x.excess)}音ぶん)`).join(" "))
  }
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e.message); process.exit(1) })
