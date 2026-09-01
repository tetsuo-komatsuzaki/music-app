import "dotenv/config"
import { prisma } from "../app/_libs/prisma"
async function main() {
  const [total, pending] = await Promise.all([
    prisma.userScoreAchievement.count(),
    prisma.userScoreAchievement.count({ where: { coinCelebratedAt: null } }),
  ])
  console.log("achievements:", total, "/ coin未演出(null):", pending)
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
