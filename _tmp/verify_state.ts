import "dotenv/config"
import { computeScoreAchievementState } from "../app/_libs/scoreAchievement"
import { prisma } from "../app/_libs/prisma"
async function main() {
  // 直近で達成レコードのあるペアと、未達成ペアを数件サンプリングして評価
  const ach = await prisma.userScoreAchievement.findMany({
    take: 3, orderBy: { achievedAt: "desc" },
    select: { userId: true, scoreId: true, score: { select: { title: true } } },
  })
  for (const a of ach) {
    const st = await computeScoreAchievementState(a.userId, a.scoreId)
    console.log("達成済:", a.score.title, "| allMet:", st?.allMet, "| lessons:", st?.lessons.length, "etude:", st?.etude.required, "clean:", st?.cleanRuns)
  }
  const perf = await prisma.performance.findFirst({
    orderBy: { uploadedAt: "desc" },
    select: { userId: true, scoreId: true, score: { select: { title: true } } },
  })
  if (perf?.scoreId) {
    const st = await computeScoreAchievementState(perf.userId, perf.scoreId)
    console.log("直近演奏曲:", perf.score?.title, "| allMet:", st?.allMet, "| lessons:", st?.lessons.map(l => `${l.tagKey}:${l.cleared}`).join(","), "| etude:", JSON.stringify(st?.etude), "| clean:", st?.cleanRuns)
  }
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
