import "dotenv/config"
import { prisma } from "../app/_libs/prisma"
// 実ユーザー(seed除く)の per_subtask を全履歴合算し、失点寄与の試算ができるか確認
async function main() {
  const perfs = await prisma.performance.findMany({
    where: { pitchAccuracy: { not: null }, rangeFromNote: null, analysisSummary: { not: undefined } },
    select: { userId: true, analysisSummary: true },
  })
  const byUser = new Map<string, Map<string, { miss: number; target: number }>>()
  for (const p of perfs) {
    const per = (p.analysisSummary as any)?.diagnosis?.per_subtask
    if (!per) continue
    const m = byUser.get(p.userId) ?? new Map()
    for (const [sid, v] of Object.entries<any>(per)) {
      if (typeof v?.miss !== "number" || typeof v?.target !== "number") continue
      const e = m.get(sid) ?? { miss: 0, target: 0 }
      e.miss += v.miss; e.target += v.target; m.set(sid, e)
    }
    byUser.set(p.userId, m)
  }
  for (const [uid, m] of byUser) {
    const total = [...m.values()].reduce((a, e) => a + e.target, 0)
    const totalMiss = [...m.values()].reduce((a, e) => a + e.miss, 0)
    const top = [...m.entries()]
      .filter(([, e]) => e.target >= 10)
      .map(([sid, e]) => ({ sid, rate: e.miss / e.target, share: e.miss / Math.max(1, totalMiss) }))
      .sort((a, b) => b.share - a.share).slice(0, 5)
    console.log(`\n${uid.slice(0, 8)} 判定対象${total}音 ミス${totalMiss} 種類${m.size}`)
    for (const t of top) console.log(`  ${t.sid}: 失敗率${Math.round(t.rate * 100)}% ・ 全ミスの${Math.round(t.share * 100)}%を占める`)
  }
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e.message); process.exit(1) })
