import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })
async function main() {
  const perf = await prisma.performance.findUnique({
    where: { id: "cmpl3o87b000004l2432ihozo" },
    select: { pitchAccuracy: true, rhythmAccuracy: true, timingAccuracy: true, evaluatedNotes: true },
  })
  console.log(`v35: pitch=${perf!.pitchAccuracy} rhythm=${perf!.rhythmAccuracy} timing=${perf!.timingAccuracy} evalNotes=${perf!.evaluatedNotes}`)
}
main().finally(() => prisma.$disconnect())
