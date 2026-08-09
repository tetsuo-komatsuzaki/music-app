// 8a 動作確認: アップロード後の PracticePerformance v3.2.2 列が埋まっているかチェック
// Usage:
//   npx tsx scripts/_tmp_verify_8a.ts <performanceId>
//   npx tsx scripts/_tmp_verify_8a.ts                    # 自分の最新 perf を自動選択
import { config } from "dotenv"
config()
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../app/generated/prisma/client.js"

const TARGET_USER_ID = "cmmm46xn40000jgjytot9eobc"

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter })

  const arg = process.argv[2]
  let perf
  if (arg) {
    perf = await prisma.practicePerformance.findUnique({
      where: { id: arg },
      select: {
        id: true, userId: true, practiceItemId: true, uploadedAt: true,
        analysisStatus: true, errorMessage: true,
        pitchAccuracy: true, timingAccuracy: true, overallScore: true,
        pitchSkillScore: true, rhythmSkillScore: true, bowingSkillScore: true,
        skillSubScores: true, problematicPositions: true,
      },
    })
    if (!perf) { console.error(`PracticePerformance not found: ${arg}`); process.exit(1) }
  } else {
    perf = await prisma.practicePerformance.findFirst({
      where: { userId: TARGET_USER_ID },
      orderBy: { uploadedAt: "desc" },
      select: {
        id: true, userId: true, practiceItemId: true, uploadedAt: true,
        analysisStatus: true, errorMessage: true,
        pitchAccuracy: true, timingAccuracy: true, overallScore: true,
        pitchSkillScore: true, rhythmSkillScore: true, bowingSkillScore: true,
        skillSubScores: true, problematicPositions: true,
      },
    })
    if (!perf) { console.error("No PracticePerformance found"); process.exit(1) }
  }

  console.log(`\n=== PracticePerformance ${perf.id} ===`)
  console.log(`uploadedAt: ${perf.uploadedAt.toISOString()}`)
  console.log(`analysisStatus: ${perf.analysisStatus}`)
  if (perf.errorMessage) console.log(`errorMessage: ${perf.errorMessage}`)
  console.log(`\n--- Legacy 列 (analyze_performance.py) ---`)
  console.log(`pitchAccuracy:  ${perf.pitchAccuracy}`)
  console.log(`timingAccuracy: ${perf.timingAccuracy}`)
  console.log(`overallScore:   ${perf.overallScore}`)

  console.log(`\n--- v3.2.2 列 (loop_engine_runner) ---`)
  const v322Filled =
    perf.pitchSkillScore != null ||
    perf.rhythmSkillScore != null ||
    perf.bowingSkillScore != null ||
    perf.skillSubScores != null ||
    perf.problematicPositions != null

  console.log(`pitchSkillScore:  ${perf.pitchSkillScore}`)
  console.log(`rhythmSkillScore: ${perf.rhythmSkillScore}`)
  console.log(`bowingSkillScore: ${perf.bowingSkillScore}`)
  if (perf.skillSubScores) {
    const subs = perf.skillSubScores as Record<string, { matched?: boolean; target_count?: number }>
    const matchedSubs = Object.entries(subs).filter(([, v]) => v?.matched).map(([k]) => k)
    console.log(`skillSubScores: 9 keys (matched: ${matchedSubs.join(", ") || "none"})`)
  } else {
    console.log(`skillSubScores: null`)
  }
  if (perf.problematicPositions) {
    const arr = perf.problematicPositions as unknown[]
    console.log(`problematicPositions: ${arr.length} positions`)
  } else {
    console.log(`problematicPositions: null`)
  }

  console.log(`\n=== Result ===`)
  if (v322Filled) {
    console.log(`✅ loop_engine_runner が成功している (v3.2.2 列が埋まっている)`)
    console.log(`\nNext: ブラウザ DevTools で:`)
    console.log(`  fetch("/api/practice-performances/${perf.id}/skill-detail").then(r=>r.json()).then(console.log)`)
  } else {
    console.log(`❌ v3.2.2 列が空 → loop_engine_runner が動いていない`)
    console.log(`Cloud Run Logs を確認してください。`)
  }

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
