// 8c 動作確認: Python 側の累積処理 (process_performance_completion_py) が実行されたか
// UserSkillScore / UserSkillSubScore / UserSkillTaskCard / UserGrade を確認。
//
// Usage:
//   cd <repo-root>
//   npx tsx scripts/_tmp_verify_8c.ts
import { config } from "dotenv"
config()
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../app/generated/prisma/client.js"

const TARGET_USER_ID = "cmmm46xn40000jgjytot9eobc"

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter })

  console.log("=== 8c verify: 累積処理 (Python 側) の効果を確認 ===\n")

  // 最新の演奏
  const latestPerf = await prisma.practicePerformance.findFirst({
    where: { userId: TARGET_USER_ID },
    orderBy: { uploadedAt: "desc" },
    select: {
      id: true, uploadedAt: true, analysisStatus: true,
      pitchSkillScore: true, rhythmSkillScore: true, bowingSkillScore: true,
      skillSubScores: true,
    },
  })
  console.log("--- 最新 PracticePerformance ---")
  if (latestPerf) {
    console.log(`id: ${latestPerf.id}`)
    console.log(`uploadedAt: ${latestPerf.uploadedAt.toISOString()}`)
    console.log(`analysisStatus: ${latestPerf.analysisStatus}`)
    console.log(`pitchSkillScore: ${latestPerf.pitchSkillScore}`)
    console.log(`rhythmSkillScore: ${latestPerf.rhythmSkillScore}`)
    console.log(`bowingSkillScore: ${latestPerf.bowingSkillScore}`)
  } else {
    console.log("(no performance found)")
  }

  // UserSkillScore (中項目 3 件)
  const scores = await prisma.userSkillScore.findMany({
    where: { userId: TARGET_USER_ID },
    orderBy: { skillTaskId: "asc" },
    select: { skillTaskId: true, currentScore: true, sampleCount: true, lastUpdatedAt: true },
  })
  console.log("\n--- UserSkillScore (3 件想定) ---")
  if (scores.length === 0) console.log("(empty)")
  for (const s of scores) {
    console.log(`  ${s.skillTaskId}: currentScore=${s.currentScore} sampleCount=${s.sampleCount} updated=${s.lastUpdatedAt.toISOString()}`)
  }

  // UserSkillSubScore (9 sub_task のうち target>0 だったもの)
  const subs = await prisma.userSkillSubScore.findMany({
    where: { userId: TARGET_USER_ID },
    orderBy: { skillSubTaskId: "asc" },
    select: { skillSubTaskId: true, matchedCount: true, totalCount: true, matchRate: true, averageScore: true },
  })
  console.log("\n--- UserSkillSubScore (target>0 の sub_task のみ) ---")
  if (subs.length === 0) console.log("(empty — 全 sub_task で target=0 だった可能性)")
  for (const s of subs) {
    console.log(`  ${s.skillSubTaskId}: matched=${s.matchedCount}/${s.totalCount} rate=${s.matchRate.toFixed(3)} avg=${s.averageScore}`)
  }

  // UserSkillTaskCard
  const cards = await prisma.userSkillTaskCard.findMany({
    where: { userId: TARGET_USER_ID },
    orderBy: { createdAt: "desc" },
    select: { id: true, cardType: true, skillTaskId: true, skillSubTaskId: true, status: true, createdAt: true },
  })
  console.log("\n--- UserSkillTaskCard ---")
  if (cards.length === 0) console.log("(empty — どの sub_task も matched=true にならず、score>=60 だった)")
  for (const c of cards) {
    const label = c.cardType === "sub_task" ? c.skillSubTaskId : c.skillTaskId
    console.log(`  [${c.cardType}] ${label}: status=${c.status} created=${c.createdAt.toISOString()}`)
  }

  // UserGrade
  const grade = await prisma.userGrade.findUnique({
    where: { userId: TARGET_USER_ID },
    select: { currentGrade: true, achievedAt: true, progressData: true, lastUpdatedAt: true },
  })
  console.log("\n--- UserGrade ---")
  if (!grade) {
    console.log("(empty — eligibility 条件 (3 score >= 90) を満たす演奏がなかった)")
  } else {
    console.log(`currentGrade: ${grade.currentGrade}`)
    console.log(`achievedAt: ${grade.achievedAt?.toISOString() ?? "null"}`)
    console.log(`progressData: ${JSON.stringify(grade.progressData)}`)
  }

  console.log("\n=== 判定 ===")
  const anyEvidence = scores.length > 0 || subs.length > 0 || cards.length > 0 || grade !== null
  if (anyEvidence) {
    console.log("✅ Python 側 process_performance_completion_py が動作している")
    console.log("   (UserSkill* / UserGrade のいずれかにレコードが入っている)")
  } else {
    console.log("⚠ どのテーブルもレコードがない")
    console.log("   原因候補:")
    console.log("   - 録音が短すぎ/不一致で pitchSkillScore=null + target_count=0 の連発")
    console.log("   - Cloud Run Job が v7 image でなく旧 image (8c 未デプロイ)")
    console.log("   → Cloud Run Logs で `[loop_engine_runner] 累積処理 done` 行を確認してください")
  }

  await prisma.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
