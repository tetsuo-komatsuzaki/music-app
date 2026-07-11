// scripts/check_phase3a_result.ts
//
// Phase 3a / Phase 2 後の動作確認用スクリプト。
// 指定 supabaseUserId + practiceItemId の最新 PracticePerformance を表示し、
// 期待される列値が入っているかチェックする。
//
// 実行: npx tsx scripts/check_phase3a_result.ts <supabaseUserId> <practiceItemId>
// 例:   npx tsx scripts/check_phase3a_result.ts a0952076-2a93-4270-876d-0d8ece45a647 cmooefqcw0001h8jyarerbj7a

import "dotenv/config"
import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
})
const prisma = new PrismaClient({ adapter })

function fmt(v: unknown): string {
  if (v === null) return "NULL"
  if (v === undefined) return "(undefined)"
  if (typeof v === "object") return JSON.stringify(v).slice(0, 120) + (JSON.stringify(v).length > 120 ? "..." : "")
  return String(v)
}

function check(label: string, actual: unknown, expected: string, pass: boolean) {
  const mark = pass ? "✅" : "❌"
  console.log(`  ${mark} ${label}: ${fmt(actual)}  (期待: ${expected})`)
}

async function main() {
  const supabaseUserId = process.argv[2]
  const practiceItemId = process.argv[3]
  if (!supabaseUserId || !practiceItemId) {
    console.error("Usage: npx tsx scripts/check_phase3a_result.ts <supabaseUserId> <practiceItemId>")
    process.exit(1)
  }

  console.log("=== Phase 2/3a 動作確認 (PracticePerformance) ===\n")

  // 1. User lookup
  const user = await prisma.user.findUnique({
    where: { supabaseUserId },
    select: { id: true, name: true },
  })
  if (!user) {
    console.error(`User not found for supabaseUserId=${supabaseUserId}`)
    process.exit(1)
  }
  console.log(`User: ${user.name} (internal id=${user.id})`)

  // 2. PracticeItem lookup
  const item = await prisma.practiceItem.findUnique({
    where: { id: practiceItemId },
    select: { id: true, title: true, category: true, star: true, skillSubTaskTags: true },
  })
  if (!item) {
    console.error(`PracticeItem not found: ${practiceItemId}`)
    process.exit(1)
  }
  console.log(`PracticeItem: "${item.title}" (category=${item.category}, star=${item.star})`)
  console.log(`  skillSubTaskTags: ${fmt(item.skillSubTaskTags)}\n`)

  // 3. Latest PracticePerformance
  const perf = await prisma.practicePerformance.findFirst({
    where: { userId: user.id, practiceItemId: item.id },
    orderBy: { uploadedAt: "desc" },
    select: {
      id: true,
      uploadedAt: true,
      analysisStatus: true,
      errorMessage: true,
      // analyze_performance.py が書き込む列 (Phase 2: rhythmAccuracy 追加、timingAccuracy 温存)
      pitchAccuracy: true,
      timingAccuracy: true,
      rhythmAccuracy: true,
      bowingAccuracy: true,
      overallScore: true,
      evaluatedNotes: true,
      // loop_engine_runner.py が書き込む列 (Phase 2: bowingAccuracy + overallScore 再計算)
      pitchSkillScore: true,
      rhythmSkillScore: true,
      bowingSkillScore: true,
      skillSubScores: true,
      problematicPositions: true,
    },
  })

  if (!perf) {
    console.error("No PracticePerformance found for this user × item")
    process.exit(1)
  }

  console.log(`=== 最新 PracticePerformance ===`)
  console.log(`  id:              ${perf.id}`)
  console.log(`  uploadedAt:      ${perf.uploadedAt.toISOString()}`)
  console.log(`  analysisStatus:  ${perf.analysisStatus}`)
  if (perf.errorMessage) console.log(`  errorMessage:    ${perf.errorMessage}`)
  console.log()

  console.log(`--- analyze_performance.py 出力 (Phase 2: K1=Y) ---`)
  check("pitchAccuracy", perf.pitchAccuracy, "Float 0-100", typeof perf.pitchAccuracy === "number")
  check("timingAccuracy (legacy mirror, P-ア)", perf.timingAccuracy, "Float 0-100", typeof perf.timingAccuracy === "number")
  check("rhythmAccuracy (v1.5 正、timingAccuracy と同値)", perf.rhythmAccuracy, "Float 0-100", typeof perf.rhythmAccuracy === "number")
  if (perf.timingAccuracy != null && perf.rhythmAccuracy != null) {
    check("timing == rhythm 同値?", perf.timingAccuracy === perf.rhythmAccuracy, "true (P-ア)", perf.timingAccuracy === perf.rhythmAccuracy)
  }
  check("evaluatedNotes", perf.evaluatedNotes, "Int (音符数)", typeof perf.evaluatedNotes === "number")
  console.log()

  console.log(`--- loop_engine_runner.py 出力 (Phase 2: K2=(a) + 案 α) ---`)
  check("pitchSkillScore", perf.pitchSkillScore, "Float (skill 系)", typeof perf.pitchSkillScore === "number")
  check("rhythmSkillScore", perf.rhythmSkillScore, "Float", typeof perf.rhythmSkillScore === "number")
  check("bowingSkillScore", perf.bowingSkillScore, "Float or NULL (弦移動なし曲では NULL)", perf.bowingSkillScore === null || typeof perf.bowingSkillScore === "number")
  check("bowingAccuracy = bowingSkillScore (K2=a)", perf.bowingAccuracy, "bowingSkillScore と同値", perf.bowingAccuracy === perf.bowingSkillScore)
  check("skillSubScores (9 sub_task 結果)", perf.skillSubScores, "JSON object", typeof perf.skillSubScores === "object" && perf.skillSubScores !== null)
  check("problematicPositions (気になる箇所)", perf.problematicPositions, "JSON array (空でも可)", Array.isArray(perf.problematicPositions))
  console.log()

  console.log(`--- overallScore (案 α: 3 軸合成) ---`)
  if (perf.pitchAccuracy != null && perf.rhythmAccuracy != null && perf.bowingAccuracy != null) {
    const expected = Math.round(((perf.pitchAccuracy + perf.rhythmAccuracy + perf.bowingAccuracy) / 3) * 10) / 10
    check(`overallScore = ROUND((pitch + rhythm + bowing) / 3, 1)`, perf.overallScore, `${expected} (3 軸新式)`, perf.overallScore === expected)
  } else if (perf.pitchAccuracy != null && perf.rhythmAccuracy != null && perf.bowingAccuracy == null) {
    console.log(`  ⚠ bowingAccuracy NULL (弦移動なし曲 or skill 解析失敗) → overallScore = ${fmt(perf.overallScore)} は未更新 (legacy or NULL)`)
  } else {
    console.log(`  ⚠ pitch / rhythm / bowing のどれかが NULL → overallScore = ${fmt(perf.overallScore)}`)
  }
  console.log()

  // skillSubScores の中身ダンプ (検査用)
  if (perf.skillSubScores) {
    console.log(`--- skillSubScores の中身 (9 sub_task) ---`)
    const subs = perf.skillSubScores as Record<string, { matched?: boolean; score?: number; target_count?: number }>
    for (const [subId, v] of Object.entries(subs)) {
      const m = v.matched ? "✓matched" : "·"
      const s = v.score != null ? `score=${v.score}` : ""
      const t = v.target_count != null ? `target=${v.target_count}` : ""
      console.log(`  ${subId.padEnd(25)} ${m} ${s} ${t}`)
    }
  }
}

main()
  .catch((e) => {
    console.error("[ERROR]", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
