import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })
async function main() {
  const score = await prisma.score.findUnique({
    where: { id: "cmplsdfv8000004jsd50oxz4h" },
    select: { id: true, title: true, ownerScope: true, isShared: true },
  })
  console.log(`Score: ${JSON.stringify(score)}`)

  const perfs = await prisma.performance.findMany({
    where: { scoreId: "cmplsdfv8000004jsd50oxz4h" },
    orderBy: { uploadedAt: "desc" },
    take: 5,
    select: {
      id: true, uploadedAt: true, analysisStatus: true, errorMessage: true,
      retryCount: true, lastAttemptedAt: true, executionId: true,
      pitchAccuracy: true, rhythmAccuracy: true, evaluatedNotes: true,
      userId: true,
    },
  })
  console.log(`\nFound ${perfs.length} performances:`)
  for (const p of perfs) {
    console.log(`  ${p.id}`)
    console.log(`    uploaded: ${p.uploadedAt.toISOString()}`)
    console.log(`    status: ${p.analysisStatus} retry=${p.retryCount} lastAttempt=${p.lastAttemptedAt?.toISOString()}`)
    console.log(`    error: ${p.errorMessage}`)
    console.log(`    executionId: ${p.executionId}`)
    console.log(`    pitch=${p.pitchAccuracy} rhythm=${p.rhythmAccuracy} evalNotes=${p.evaluatedNotes}`)
  }
}
main().finally(() => prisma.$disconnect())
