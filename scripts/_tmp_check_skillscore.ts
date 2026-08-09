import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })
async function main() {
  const perf = await prisma.performance.findUnique({
    where: { id: "cmpl3o87b000004l2432ihozo" },
    select: {
      pitchAccuracy: true, rhythmAccuracy: true, bowingAccuracy: true,
      pitchSkillScore: true, rhythmSkillScore: true, bowingSkillScore: true,
      overallScore: true, evaluatedNotes: true,
      skillSubScores: true,
    },
  })
  console.log("=== Accuracy ===")
  console.log(`pitch=${perf!.pitchAccuracy} rhythm=${perf!.rhythmAccuracy} bowing=${perf!.bowingAccuracy}`)
  console.log("\n=== SkillScore ===")
  console.log(`pitch=${perf!.pitchSkillScore} rhythm=${perf!.rhythmSkillScore} bowing=${perf!.bowingSkillScore}`)
  console.log("\n=== Other ===")
  console.log(`overallScore=${perf!.overallScore} evalNotes=${perf!.evaluatedNotes}`)
  console.log(`skillSubScores: ${JSON.stringify(perf!.skillSubScores).slice(0, 300)}...`)
}
main().finally(() => prisma.$disconnect())
