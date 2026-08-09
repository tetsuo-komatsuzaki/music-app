// Phase2 D2/D3 ビルダーの実データ検証
import { config } from "dotenv"
config()

async function main() {
  const { buildExpressionDetail, buildNumbersRoom } = await import("../app/_libs/growthKarte")
  const d2 = await buildExpressionDetail("cmrzmcrpy000004lbhwfodj6w", "expr_dynamics")
  console.log("D2:", d2 ? `${d2.label} status=${d2.status} history=${d2.history.length} kid=${!!d2.kid} arco=${d2.arcoLine.slice(0, 20)}…` : "null")
  const d3 = await buildNumbersRoom("cmmm46xn40000jgjytot9eobc", "all")
  console.log("D3(全期間/ての): keys=", d3.keys.length, "regs=", d3.registers.length, "tempo=", d3.tempoBands.length, "worst=", d3.worstNotes.length, "best=", d3.bestNotes.length, "trans=", d3.transitions.length, "moved=", d3.weekMoved.length)
  if (d3.keys[0]) console.log("  key例:", JSON.stringify(d3.keys[0]))
  if (d3.registers[0]) console.log("  reg例:", JSON.stringify(d3.registers[0]))
  if (d3.worstNotes[0]) console.log("  worst例:", JSON.stringify(d3.worstNotes[0]))
  if (d3.transitions[0]) console.log("  trans例:", JSON.stringify(d3.transitions[0]))
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
