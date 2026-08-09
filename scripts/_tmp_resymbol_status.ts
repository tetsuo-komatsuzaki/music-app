import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })
async function main() {
  const pi = await prisma.practiceItem.groupBy({ by: ["analysisStatus"], _count: true })
  const sc = await prisma.score.groupBy({ by: ["analysisStatus"], where: { deletedAt: null }, _count: true })
  console.log("PracticeItem:", pi.map(x => `${x.analysisStatus}=${x._count}`).join(" / "))
  console.log("Score       :", sc.map(x => `${x.analysisStatus}=${x._count}`).join(" / "))
}
main().finally(() => prisma.$disconnect())
