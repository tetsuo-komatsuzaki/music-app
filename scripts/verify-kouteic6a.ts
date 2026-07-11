/**
 * verify-kouteic6a.ts — C-6a 整形層（buildDiagnosisView）のE2E検証（読み取りのみ）
 * 1. ふるさと実診断 → verdict/slots/breakdown/collapse の形を確認
 * 2. 診断なし（v65以前の演奏想定）→ unavailable
 * 3. 空診断（弱点なし）→ perfect / no_specific の出し分け
 *
 * 実行: npx tsx scripts/verify-kouteic6a.ts <diagnosis.json>
 */
import "dotenv/config"
import { readFileSync } from "fs"
import { prisma } from "../app/_libs/prisma"
import { buildDiagnosisView } from "../app/_libs/diagnosisPresentation"
import type { DiagnosisJson } from "../app/_libs/weaknessRecommendation"

async function main() {
  const diagnosis: DiagnosisJson = JSON.parse(readFileSync(process.argv[2], "utf-8"))
  const score = await prisma.score.findFirst({
    where: { title: "ふるさと" },
    select: { star: true, keyTonic: true, keyMode: true, defaultTempo: true, positions: true },
  })
  if (!score) throw new Error("score not found")
  const ctx = {
    star: score.star,
    keyTonic: score.keyTonic,
    keyMode: score.keyMode,
    tempo: score.defaultTempo,
    positions: score.positions,
  }

  // 1. 実診断
  const view = await buildDiagnosisView(diagnosis, ctx)
  console.log("=== ふるさと実診断 ===")
  console.log("verdict:", view.verdict, "collapse.isClean:", view.collapse?.isClean)
  for (const s of view.slots) {
    console.log(
      `  [${s.tree}] ${s.subtaskName} ${s.miss}/${s.target}=${(s.missRate * 100).toFixed(0)}%` +
        ` | 内訳: ${s.breakdown ?? "(なし)"} | 教材: ${s.materials.map((m) => m.title).join(" / ") || (s.noStock ? "準備中" : "-")}`
    )
  }

  // 2. 診断なし
  const v2 = await buildDiagnosisView(undefined, ctx)
  console.log("\n診断なし → verdict:", v2.verdict)

  // 3a. 完璧（ミス0・崩壊なし）
  const perfect: DiagnosisJson = {
    ...diagnosis,
    diagnosis: { pitch: [], rhythm: [] },
    per_subtask: {},
    miss_patterns: { pitch: [], rhythm: [] },
    ...( { collapse: { collapsed: [], is_clean: true },
           totals: { played: 45, pitch_miss: 0, rhythm_miss: 1 } } as object),
  }
  console.log("空診断+ミス1/45 → verdict:", (await buildDiagnosisView(perfect, ctx)).verdict)

  // 3b. 空診断だがミス多数（散発）
  const scattered: DiagnosisJson = {
    ...perfect,
    ...( { totals: { played: 45, pitch_miss: 12, rhythm_miss: 3 } } as object),
  }
  console.log("空診断+ミス12/45 → verdict:", (await buildDiagnosisView(scattered, ctx)).verdict)
}

main()
  .catch((e) => { console.error("ERR:", e); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
