// 全ユーザー横断で直近 5 件の PracticePerformance を表示
import { config } from "dotenv"
config()
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../app/generated/prisma/client.js"

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter })

  const recent = await prisma.practicePerformance.findMany({
    orderBy: { uploadedAt: "desc" },
    take: 10,
    select: {
      id: true, userId: true, uploadedAt: true, analysisStatus: true,
      pitchSkillScore: true,
      practiceItem: { select: { title: true } },
      user: { select: { supabaseUserId: true } },
    },
  })
  console.log(`=== 直近 ${recent.length} 件の PracticePerformance (全ユーザー) ===`)
  for (const p of recent) {
    console.log(
      `  ${p.id} ${p.uploadedAt.toISOString()} status=${p.analysisStatus} ` +
      `pitchSkill=${p.pitchSkillScore} item=${p.practiceItem.title} ` +
      `userId=${p.userId} (sup=${p.user.supabaseUserId.slice(0, 8)})`
    )
  }
  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
