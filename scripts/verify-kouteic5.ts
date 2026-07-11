/**
 * verify-kouteic5.ts — 工程C-5 推薦エンジンのE2E検証（本番DB読み取りのみ・書き込みゼロ）
 *
 * 1. 窓①: ふるさとの実診断JSON（Python diagnose の出力）→ 推薦
 * 2. 窓②: 実ユーザーの累積カウンタ → 推薦（v65直後は217系行が無く空が正・落ちないこと）
 * 3. キャッシュ効果の実測
 *
 * 実行: npx tsx scripts/verify-kouteic5.ts <diagnosis.json のパス>
 */
import "dotenv/config"
import { readFileSync } from "fs"
import { prisma } from "../app/_libs/prisma"
import {
  getInventory,
  recommendForPerformance,
  recommendCumulative,
  type DiagnosisJson,
} from "../app/_libs/weaknessRecommendation"

const USER_ID = "cmoecf4zv000104l7a52almdg"
const SCORE_TITLE = "ふるさと"

function printSlots(label: string, slots: Awaited<ReturnType<typeof recommendForPerformance>>) {
  console.log(`\n=== ${label} ===`)
  if (slots.length === 0) console.log("  (推薦スロットなし)")
  for (const s of slots) {
    console.log(
      `  [${s.tree}] ${s.subtaskName} (${s.subtaskId}) ` +
        `${s.miss}/${s.target}=${(s.missRate * 100).toFixed(0)}%` +
        (s.noStock ? " → 在庫なし(教材準備中)" : "")
    )
    for (const m of s.materials) {
      console.log(
        `      → ${m.title} [${m.category}] star=${m.star} ${m.keyTonic}${m.keyMode === "minor" ? "m" : ""}` +
          ` tempo=${m.tempoMin ?? "?"}-${m.tempoMax ?? "?"} pos=[${m.positions.join(",")}]`
      )
    }
  }
}

async function main() {
  const diagPath = process.argv[2]
  if (!diagPath) throw new Error("usage: tsx scripts/verify-kouteic5.ts <diagnosis.json>")
  const diagnosis: DiagnosisJson = JSON.parse(readFileSync(diagPath, "utf-8"))

  // 診断元の曲の文脈
  const score = await prisma.score.findFirst({
    where: { title: SCORE_TITLE },
    select: { star: true, keyTonic: true, keyMode: true, defaultTempo: true, positions: true },
  })
  if (!score) throw new Error("score not found")
  console.log("診断元の曲の文脈:", score)

  // キャッシュ実測
  let t = performance.now()
  const inv = await getInventory()
  const cold = performance.now() - t
  t = performance.now()
  await getInventory()
  const warm = performance.now() - t
  console.log(`在庫: ${inv.length}件 cold=${cold.toFixed(0)}ms cached=${warm.toFixed(2)}ms`)

  // 窓①
  t = performance.now()
  const slots = await recommendForPerformance(diagnosis, {
    star: score.star,
    keyTonic: score.keyTonic,
    keyMode: score.keyMode,
    tempo: score.defaultTempo,
    positions: score.positions,
  })
  printSlots(`窓① 演奏直後 (${(performance.now() - t).toFixed(1)}ms)`, slots)

  // 窓②
  t = performance.now()
  const cumulative = await recommendCumulative(USER_ID)
  printSlots(`窓② 累積 (${(performance.now() - t).toFixed(0)}ms)`, cumulative)
  console.log(
    "\n(注) v65デプロイ直後のため217系の累積行はまだ無い想定 → 窓②が空でも正常。" +
      "\n     旧55のIDが混在しても diagnosable/v1Active フィルタで安全に無視されることの確認。"
  )
}

main()
  .catch((e) => {
    console.error("ERR:", e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
