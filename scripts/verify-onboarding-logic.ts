/**
 * verify-onboarding-logic.ts — C2検証: ★判定ラダーのTS移植が参照JSと挙動同一であること
 * §27-3 全11パターン + 到達予測の期待表(指示書§4-9) を両実装で実行し完全一致を確認する。
 *
 * 実行: npx tsx scripts/verify-onboarding-logic.ts
 */
import { createRequire } from "module"
import {
  judge,
  toProvisionalFlags,
  estimatePeriod,
  type LadderAnswers,
} from "../app/onboarding/_lib/logic"

const require_ = createRequire(import.meta.url)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ref = require_("../app/onboarding/_lib/logic.reference.js")

// §27-3 判定ラダー 全11パターン
const CASES: Array<{ name: string; a: LadderAnswers }> = [
  { name: "01 これから始める(★1)", a: { beginner: true } },
  { name: "02 G1落ち(★1)", a: { beginner: false, g1: false } },
  { name: "03 G2 0選択(★2・仮習得なし)", a: { g1: true, g2: [] } },
  { name: "04 G2 1選択(★2・スタッカートのみ)", a: { g1: true, g2: ["スタッカート"] } },
  { name: "05 G2 トリル含む2選択(★2・プラルトリラーとモルデント連動)", a: { g1: true, g2: ["トリル", "スピッカート"] } },
  { name: "06 G3落ち+補足YES(★3+3rdフラグ)", a: { g1: true, g2: ["トリル", "スタッカート", "スピッカート"], g3: false, g3sup: true } },
  { name: "07 G3落ち+補足NO(★3)", a: { g1: true, g2: ["トリル", "スタッカート", "スピッカート"], g3: false, g3sup: false } },
  { name: "08 G4 0選択(★4)", a: { g1: true, g2: ["トリル", "スタッカート", "スピッカート"], g3: true, g4: [] } },
  { name: "09 G4 3rdのみ(★4+3rdタグ)", a: { g1: true, g2: ["トリル", "スタッカート", "スピッカート"], g3: true, g4: ["3rd"] } },
  { name: "10 G4 5thあり+G5不可(★5)", a: { g1: true, g2: ["トリル", "スタッカート", "スピッカート"], g3: true, g4: ["2nd", "3rd", "5th"], g5: false } },
  { name: "11 G4 6th+あり+G5可(★6+重音3度6度)", a: { g1: true, g2: ["トリル", "スタッカート", "スピッカート"], g3: true, g4: ["2nd", "3rd", "4th", "5th", "6th+"], g5: true } },
]

// 到達予測 期待表(指示書§4-9・15分/日)
const PRED_CASES: Array<{ user: number; song: number; daily: string; expect: string }> = [
  { user: 1, song: 2, daily: "15分 / 日", expect: "約2ヶ月" },
  { user: 3, song: 3, daily: "15分 / 日", expect: "約3週間" },
  { user: 6, song: 7, daily: "15分 / 日", expect: "約8ヶ月" },
  { user: 5, song: 2, daily: "5分 / 日", expect: "約1週間" }, // 格下曲=時間非依存
]

let fail = 0

console.log("=== ★判定 11パターン (TS移植 vs 参照JS) ===")
for (const c of CASES) {
  const ts = judge(c.a)
  const js = ref.judge(c.a)
  const same = JSON.stringify(ts) === JSON.stringify(js)
  const flagsSame =
    JSON.stringify(toProvisionalFlags(ts)) === JSON.stringify(ref.toProvisionalFlags(js))
  if (!same || !flagsSame) fail++
  console.log(
    `${same && flagsSame ? "✅" : "❌"} ${c.name}: ★${ts.star} tags=[${ts.tags.join(",")}]` +
      (ts.doubleStops.length ? ` doubles=[${ts.doubleStops.join(",")}]` : ""),
  )
  if (!same) console.log(`   TS=${JSON.stringify(ts)}\n   JS=${JSON.stringify(js)}`)
}

console.log("\n=== 到達予測 期待表(指示書§4-9) ===")
for (const p of PRED_CASES) {
  const ts = estimatePeriod(p.user, p.song, p.daily)
  const js = ref.estimatePeriod(p.user, p.song, p.daily)
  const same = ts.label === js.label && Math.abs(ts.weeks - js.weeks) < 1e-9
  const ok = same && ts.label === p.expect
  if (!ok) fail++
  console.log(
    `${ok ? "✅" : "❌"} ★${p.user}→⭐︎${p.song} (${p.daily}): ${ts.label} (期待 ${p.expect}, weeks=${ts.weeks.toFixed(2)})`,
  )
}

console.log(`\n==== ${fail === 0 ? "ALL PASS" : `FAIL x${fail}`} ====`)
process.exitCode = fail === 0 ? 0 : 1
