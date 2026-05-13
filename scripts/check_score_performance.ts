// scripts/check_score_performance.ts
//
// Phase 3a Score mode (run_score_mode) の動作確認用。
// 指定 supabaseUserId + scoreId の最新 Performance を表示し、
// Phase 3a で期待される列値が入っているかチェックする。
//
// 実行: npx tsx scripts/check_score_performance.ts <supabaseUserId> <scoreId>

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
  if (typeof v === "object") {
    const s = JSON.stringify(v)
    return s.length > 120 ? s.slice(0, 120) + "..." : s
  }
  return String(v)
}

function check(label: string, actual: unknown, expected: string, pass: boolean) {
  const mark = pass ? "✅" : "❌"
  console.log(`  ${mark} ${label}: ${fmt(actual)}  (期待: ${expected})`)
}

async function main() {
  const supabaseUserId = process.argv[2]
  const scoreId = process.argv[3]
  if (!supabaseUserId || !scoreId) {
    console.error("Usage: npx tsx scripts/check_score_performance.ts <supabaseUserId> <scoreId>")
    process.exit(1)
  }

  console.log("=== Phase 3a Score mode 動作確認 (Performance) ===\n")

  // User lookup
  const user = await prisma.user.findUnique({
    where: { supabaseUserId },
    select: { id: true, name: true },
  })
  if (!user) {
    console.error(`User not found: ${supabaseUserId}`)
    process.exit(1)
  }
  console.log(`User: ${user.name} (internal id=${user.id})`)

  // Score lookup
  const score = await prisma.score.findUnique({
    where: { id: scoreId },
    select: {
      id: true, title: true, composer: true,
      star: true, ownerScope: true, isShared: true,
      skillSubTaskTags: true,
      keyTonic: true, keyMode: true,
      deletedAt: true,
    },
  })
  if (!score) {
    console.error(`Score not found: ${scoreId}`)
    process.exit(1)
  }
  console.log(`Score: "${score.title}" composer=${score.composer ?? "—"}`)
  console.log(`  ownerScope: ${score.ownerScope}  isShared: ${score.isShared}`)
  console.log(`  star: ${score.star ?? "NULL"}  key: ${score.keyTonic ?? "?"} ${score.keyMode ?? "?"}`)
  console.log(`  skillSubTaskTags: ${fmt(score.skillSubTaskTags)}`)
  console.log(`  deletedAt: ${score.deletedAt ?? "—"}\n`)

  // Phase 3a ゲート判定の事前チェック
  console.log("--- run_score_mode ゲート判定 (事前チェック) ---")
  check("ownerScope == \"admin\" (M5=B gate)", score.ownerScope, "\"admin\" 通過、それ以外 SKIP", score.ownerScope === "admin")
  check("Score.star IS NOT NULL", score.star != null, "true (NULL なら SKIP)", score.star != null)
  console.log()

  // 最新 Performance
  const perf = await prisma.performance.findFirst({
    where: { userId: user.id, scoreId: score.id },
    orderBy: { uploadedAt: "desc" },
    select: {
      id: true, performanceType: true, performanceStatus: true,
      uploadedAt: true, analysisStatus: true, errorMessage: true,
      pitchAccuracy: true,
      timingAccuracy: true,
      rhythmAccuracy: true,
      bowingAccuracy: true,
      overallScore: true,
      evaluatedNotes: true,
      pitchSkillScore: true,
      rhythmSkillScore: true,
      bowingSkillScore: true,
      skillSubScores: true,
      problematicPositions: true,
    },
  })

  if (!perf) {
    console.error("No Performance found for this user × score")
    process.exit(1)
  }

  console.log(`=== 最新 Performance ===`)
  console.log(`  id:                 ${perf.id}`)
  console.log(`  uploadedAt:         ${perf.uploadedAt.toISOString()}`)
  console.log(`  performanceType:    ${perf.performanceType}`)
  console.log(`  performanceStatus:  ${perf.performanceStatus}`)
  console.log(`  analysisStatus:     ${perf.analysisStatus}`)
  if (perf.errorMessage) console.log(`  errorMessage:       ${perf.errorMessage}`)
  console.log()

  console.log("--- run_score_mode ゲート判定 (Performance 側) ---")
  check("performanceType != \"pro\" (I4=A gate)", perf.performanceType, "\"user\" 通過、\"pro\" は SKIP", perf.performanceType !== "pro")
  console.log()

  console.log(`--- analyze_performance.py 出力 (Phase 2: K1=Y) ---`)
  check("pitchAccuracy", perf.pitchAccuracy, "Float 0-100", typeof perf.pitchAccuracy === "number")
  check("timingAccuracy (legacy mirror)", perf.timingAccuracy, "Float 0-100", typeof perf.timingAccuracy === "number")
  check("rhythmAccuracy (v1.5 正)", perf.rhythmAccuracy, "Float 0-100", typeof perf.rhythmAccuracy === "number")
  if (perf.timingAccuracy != null && perf.rhythmAccuracy != null) {
    check("timing == rhythm 同値?", perf.timingAccuracy === perf.rhythmAccuracy, "true (P-ア)", perf.timingAccuracy === perf.rhythmAccuracy)
  }
  console.log()

  console.log(`--- run_score_mode (loop_engine_runner.py / Phase 3a) 出力 ---`)
  check("pitchSkillScore", perf.pitchSkillScore, "Float", typeof perf.pitchSkillScore === "number")
  check("rhythmSkillScore", perf.rhythmSkillScore, "Float", typeof perf.rhythmSkillScore === "number")
  check("bowingSkillScore", perf.bowingSkillScore, "Float or NULL (弦移動なしなら NULL)", perf.bowingSkillScore === null || typeof perf.bowingSkillScore === "number")
  check("bowingAccuracy = bowingSkillScore (K2=a)", perf.bowingAccuracy === perf.bowingSkillScore, "同値", perf.bowingAccuracy === perf.bowingSkillScore)
  check("skillSubScores (9 sub_task)", perf.skillSubScores, "JSON object", typeof perf.skillSubScores === "object" && perf.skillSubScores !== null)
  check("problematicPositions (気になる箇所)", perf.problematicPositions, "JSON array (空でも可)", Array.isArray(perf.problematicPositions))
  console.log()

  console.log(`--- overallScore (案 α: 3 軸合成) ---`)
  if (perf.pitchAccuracy != null && perf.rhythmAccuracy != null && perf.bowingAccuracy != null) {
    const expected = Math.round(((perf.pitchAccuracy + perf.rhythmAccuracy + perf.bowingAccuracy) / 3) * 10) / 10
    check(`overallScore = ROUND((pitch + rhythm + bowing) / 3, 1)`, perf.overallScore, `${expected}`, perf.overallScore === expected)
  } else {
    console.log(`  ⚠ 3 軸揃ってないため overallScore は ${fmt(perf.overallScore)} (再計算スキップ)`)
  }
  console.log()

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
  console.log()

  // ─── Phase 3b: SkillTaskCard / SubTask / SubTaskAssignment / MissingPracticeItemFlag ───
  console.log(`=== Phase 3b 出力 (SkillTaskCard / SubTask / SubTaskAssignment / Flag) ===`)
  const THRESHOLD_MID = 70
  const THRESHOLD_SUB = 70

  // 期待される中課題カテゴリ (skillScore < 70 のもの)
  const expectedMid: string[] = []
  if (perf.pitchSkillScore != null && perf.pitchSkillScore < THRESHOLD_MID) expectedMid.push("PITCH")
  if (perf.rhythmSkillScore != null && perf.rhythmSkillScore < THRESHOLD_MID) expectedMid.push("RHYTHM")
  if (perf.bowingSkillScore != null && perf.bowingSkillScore < THRESHOLD_MID) expectedMid.push("BOWING")
  console.log(`期待される中課題カテゴリ (< ${THRESHOLD_MID}): ${expectedMid.length === 0 ? "(なし → カード生成スキップが正解)" : expectedMid.join(", ")}`)
  console.log()

  // SkillTaskCard
  const cards = await prisma.skillTaskCard.findMany({
    where: { userId: user.id, scoreId: score.id },
    orderBy: { generatedAt: "desc" },
    select: {
      id: true, taskCategory: true, status: true,
      generatedAt: true, lastMatchedAt: true, clearedAt: true,
      subTasks: {
        select: {
          id: true, subTaskType: true, status: true,
          subTaskAssignments: {
            select: {
              id: true, assignedCategory: true, isMastered: true,
              practiceItem: {
                select: { id: true, title: true, category: true, star: true, sortOrder: true },
              },
            },
          },
        },
      },
    },
  })
  console.log(`--- SkillTaskCard (${cards.length} 件) ---`)
  if (cards.length === 0 && expectedMid.length > 0) {
    console.log(`  ❌ カードゼロだが期待 ${expectedMid.length} 件 — Phase 3b 生成失敗の可能性`)
  } else if (cards.length === 0 && expectedMid.length === 0) {
    console.log(`  ✅ 中課題なし → カード生成スキップが正解`)
  }
  for (const c of cards) {
    const wasExpected = expectedMid.includes(c.taskCategory) ? "✓expected" : "(extra/legacy)"
    console.log(`  [${c.taskCategory}] status=${c.status} ${wasExpected}`)
    console.log(`    id=${c.id}`)
    console.log(`    generatedAt=${c.generatedAt.toISOString()}  lastMatchedAt=${c.lastMatchedAt?.toISOString() ?? "—"}`)
    if (c.subTasks.length === 0) {
      console.log(`    (SubTask なし — その親カテゴリの skillSubScores が全て ≥ ${THRESHOLD_SUB} か MissingFlag 発火)`)
    }
    for (const st of c.subTasks) {
      console.log(`    └ SubTask: ${st.subTaskType} status=${st.status}`)
      const byCat = new Map<string, typeof st.subTaskAssignments[number]>()
      for (const a of st.subTaskAssignments) byCat.set(a.assignedCategory, a)
      for (const cat of ["SCALE", "ARPEGGIO", "ETUDE"] as const) {
        const a = byCat.get(cat)
        if (a) {
          console.log(`        ├ ${cat.padEnd(8)} → "${a.practiceItem.title}" (star=${a.practiceItem.star} sortOrder=${a.practiceItem.sortOrder ?? "—"}) isMastered=${a.isMastered}`)
        } else {
          console.log(`        ├ ${cat.padEnd(8)} → ❌ 未アサイン (3 カテゴリ揃ってない)`)
        }
      }
    }
  }
  console.log()

  // MissingPracticeItemFlag
  const flags = await prisma.missingPracticeItemFlag.findMany({
    where: { scoreId: score.id },
    orderBy: { detectedAt: "desc" },
    select: {
      id: true, subTaskType: true, missingCategory: true,
      keyTonic: true, keyMode: true, star: true,
      detectedAt: true, resolvedAt: true,
    },
  })
  console.log(`--- MissingPracticeItemFlag (${flags.length} 件) ---`)
  if (flags.length === 0) {
    console.log(`  (なし — 全 sub_task × 3 カテゴリで教材揃った、または該当 SubTask 自体未失敗)`)
  }
  for (const f of flags) {
    const resolved = f.resolvedAt ? `resolved=${f.resolvedAt.toISOString()}` : "❗未解決"
    console.log(`  [${f.subTaskType}] missing=${f.missingCategory}  key=${f.keyTonic} ${f.keyMode} star=${f.star}  ${resolved}`)
    console.log(`    detected=${f.detectedAt.toISOString()}  id=${f.id}`)
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
