import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })
async function main() {
  const perf = await prisma.performance.findUnique({
    where: { id: "cmplsqe3i000004i61gisxyp5" },
    select: {
      analysisStatus: true, errorMessage: true,
      pitchAccuracy: true, rhythmAccuracy: true, bowingAccuracy: true,
      overallScore: true, evaluatedNotes: true,
    },
  })
  console.log(JSON.stringify(perf, null, 2))
}
main().finally(() => prisma.$disconnect())
