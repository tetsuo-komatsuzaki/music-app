// 骨組みの構造テスト: 評価器をTetsuoアカウントで実走 (遡及=演出なしの初回評価)
import "dotenv/config"
process.env.REWARD_SYSTEM_LIT = "1"
import { prisma } from "../app/_libs/prisma"
import { evaluateTreasures, getTreasureQueue } from "../app/_libs/treasureEngine"

async function main() {
  const me = await prisma.user.findFirst({
    where: { name: { contains: "tetsuo" }, role: "student" },
    select: { id: true, name: true },
  })
  if (!me) throw new Error("test user not found")
  console.log("user:", me.name, me.id)
  const t0 = performance.now()
  const r = await evaluateTreasures(me.id)
  console.log(`evaluate: ${(performance.now() - t0).toFixed(0)}ms`, r)
  const queue = await getTreasureQueue(me.id)
  console.log("演出待ちキュー (初回は0のはず):", queue.length)
  const treasures = await prisma.userTreasure.findMany({
    where: { userId: me.id },
    orderBy: { catalogNo: "asc" },
    select: { kind: true, sourceType: true, sourceId: true, catalogNo: true, awardedAt: true },
  })
  console.log("宝物:", treasures.length)
  for (const t of treasures) console.log(" ", t.kind, t.sourceType, t.sourceId, t.catalogNo ?? "", t.awardedAt ? "棚" : "演出待ち")
  const clears = await prisma.userQuestClear.count({ where: { userId: me.id } })
  console.log("クエストクリア:", clears)
  // 2回目実行の冪等性
  const t1 = performance.now()
  const r2 = await evaluateTreasures(me.id)
  console.log(`2回目: ${(performance.now() - t1).toFixed(0)}ms`, r2)
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
