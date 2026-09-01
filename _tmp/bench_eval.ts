// 評価器の実測 (読み取り専用・本番DB・書き込みなし)
// 1) 初回相当: collectMetrics 相当の重い読みを全メトリクスで実行
// 2) 定常相当: スキップ判定の findFirst 4本
import "dotenv/config"
import { prisma } from "../app/_libs/prisma"

async function main() {
  // 最も録音の多いユーザー = 最悪ケースで計測
  const top = await prisma.performance.groupBy({ by: ["userId"], _count: true, orderBy: { _count: { userId: "desc" } }, take: 1 })
  const userId = top[0].userId
  console.log("user:", userId.slice(0, 8), "performances:", top[0]._count)

  // ── 定常相当 (スキップ判定4本+guideState) ──
  for (let i = 0; i < 3; i++) {
    const t0 = performance.now()
    const lastEval = new Date()
    await prisma.userGuideState.findUnique({ where: { userId }, select: { treasureEvaluatedAt: true } })
    await Promise.all([
      prisma.performance.findFirst({ where: { userId, uploadedAt: { gt: lastEval } }, select: { id: true } }),
      prisma.practicePerformance.findFirst({ where: { userId, uploadedAt: { gt: lastEval } }, select: { id: true } }),
      prisma.userTreasure.findFirst({ where: { userId, earnedAt: { gt: lastEval } }, select: { id: true } }),
      prisma.userActionCount.findFirst({ where: { userId, updatedAt: { gt: lastEval } }, select: { action: true } }),
    ])
    console.log(`steady run${i + 1}: ${(performance.now() - t0).toFixed(0)}ms`)
  }

  // ── 初回相当 (重い読み全部・collectMetricsのクエリを再現) ──
  for (let i = 0; i < 2; i++) {
    const t0 = performance.now()
    await prisma.userQuestClear.findMany({ where: { userId }, select: { questId: true } })
    await Promise.all([
      prisma.performance.count({ where: { userId, rangeFromNote: null } }),
      prisma.practicePerformance.count({ where: { userId } }),
      prisma.userLessonClear.count({ where: { userId } }),
      prisma.userPracticeAchievement.count({ where: { userId, practiceItem: { category: "etude" } } }),
      prisma.userScoreAchievement.findMany({ where: { userId }, select: { masteredAt: true } }),
      prisma.performance.findMany({
        where: { userId, rangeFromNote: null, pitchAccuracy: { not: null }, timingAccuracy: { not: null } },
        orderBy: { uploadedAt: "asc" },
        select: { scoreId: true, pitchAccuracy: true, timingAccuracy: true },
      }),
      prisma.performance.groupBy({ by: ["scoreId"], where: { userId }, _count: true }),
      prisma.userTreasure.groupBy({ by: ["kind", "sourceType"], where: { userId }, _count: true }),
      prisma.practicePerformance.findMany({
        where: { userId },
        distinct: ["practiceItemId"],
        select: { practiceItemId: true, practiceItem: { select: { keyTonic: true, keyMode: true, articulation: true, category: true } } },
      }),
      prisma.performance.findMany({ where: { userId }, select: { uploadedAt: true, scoreId: true } }),
      prisma.practicePerformance.findMany({ where: { userId }, select: { uploadedAt: true } }),
      prisma.userActionCount.findMany({ where: { userId } }),
    ])
    console.log(`fullscan run${i + 1}: ${(performance.now() - t0).toFixed(0)}ms`)
  }

  const counts = await Promise.all([
    prisma.performance.count({ where: { userId } }),
    prisma.practicePerformance.count({ where: { userId } }),
  ])
  console.log("rows: performances", counts[0], "/ practice", counts[1])
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
