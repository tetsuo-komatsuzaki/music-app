import "dotenv/config"
import { prisma } from "../app/_libs/prisma"
async function main() {
  const uid = "cmlz5bu3n0002dsjyi8bo1s73"
  const ach = await prisma.userScoreAchievement.count({ where: { userId: uid } })
  const distinct = await prisma.performance.findMany({ where: { userId: uid }, distinct: ["scoreId"], select: { scoreId: true } })
  const recs = await prisma.performance.count({ where: { userId: uid, rangeFromNote: null } })
  console.log("達成レコード:", ach, "/ distinct曲:", distinct.length, "/ 通し録音:", recs)
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
