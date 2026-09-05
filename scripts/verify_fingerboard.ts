/**
 * verify_fingerboard.ts — 指板ヒートマップ・速い指の切り替え (ノート属性ストア版) を旧実装 (ファイル直読み) と突き合わせる。
 *
 *   ① ユーザー5人 × 直近90日: 旧 buildUserHeatmap と 新 の セル (status/level) と詳細 (n/high/low) を比べる
 *   ② 同じ5人: 旧 buildFastSwitch と 新 の帯ごとの数を比べる
 *   ③ ユーザー×曲 5組: 旧 buildTargetHeatmap と 新
 *   差の理由は限られる: 旧は skill_info (記譜順) と comparison (演奏順) を note_index で突き合わせるので
 *   繰り返しのある曲ではずれる / 旧の演奏の選び方 (comparison ファイルあり・種別ごと30本) と新 (版一致・あわせて60本) の違い /
 *   R2 (開放弦のポジション引き継ぎ) でポジション行とシフトの札が増える
 *
 * 実行: npx tsx scripts/verify_fingerboard.ts
 */
import "dotenv/config"
import { prisma } from "../app/_libs/prisma"
import { buildUserHeatmap, buildTargetHeatmap } from "../app/_libs/fingerboard/aggregate"
import { buildFastSwitch } from "../app/_libs/fastSwitch"
import { buildUserHeatmap as oldUserHeatmap, buildTargetHeatmap as oldTargetHeatmap } from "./legacy/fingerboardAggregate"
import { buildFastSwitch as oldFastSwitch } from "./legacy/fastSwitch"
import type { HeatmapData } from "../app/_libs/fingerboard/heatmapTypes"

const ms = (t: number) => `${Math.round(t)}ms`

function compareHeat(oldH: HeatmapData, newH: HeatmapData): { same: number; diff: number; onlyOld: number; onlyNew: number; detailDiff: number; lines: string[] } {
  const ids = new Set([...Object.keys(oldH.cells), ...Object.keys(newH.cells)])
  let same = 0, diff = 0, onlyOld = 0, onlyNew = 0, detailDiff = 0
  const lines: string[] = []
  for (const id of [...ids].sort()) {
    const a = oldH.cells[id], b = newH.cells[id]
    if (a && !b) { onlyOld++; lines.push(`    旧のみ ${id} ${a.status}/${a.level} n=${oldH.details[id]?.n}`); continue }
    if (!a && b) { onlyNew++; lines.push(`    新のみ ${id} ${b.status}/${b.level} n=${newH.details[id]?.n}`); continue }
    if (a.status === b.status && a.level === b.level) same++; else { diff++; lines.push(`    差 ${id} 旧${a.status}/${a.level} 新${b.status}/${b.level}`) }
    const da = oldH.details[id], db = newH.details[id]
    if (da && db && (da.n !== db.n || da.high !== db.high || da.low !== db.low)) { detailDiff++; if (lines.length < 12) lines.push(`    詳細差 ${id} 旧 n${da.n}/高${da.high}/低${da.low} 新 n${db.n}/高${db.high}/低${db.low}`) }
  }
  return { same, diff, onlyOld, onlyNew, detailDiff, lines }
}

async function main() {
  const users = await prisma.$queryRaw<{ userId: string; n: number }[]>`
    SELECT x."userId", count(*)::int AS n FROM (
      SELECT p."userId" FROM "PerformanceNote" pn JOIN "Performance" p ON p.id = pn."performanceId" AND pn."performanceKind" = 'score'
      UNION ALL
      SELECT p."userId" FROM "PerformanceNote" pn JOIN "PracticePerformance" p ON p.id = pn."performanceId" AND pn."performanceKind" = 'practice'
    ) x GROUP BY x."userId" ORDER BY n DESC LIMIT 5`
  console.log("── ① 指板 (ユーザー・直近90日) ──")
  let cellSame = 0, cellDiff = 0, onlyOld = 0, onlyNew = 0
  for (const u of users) {
    let t = performance.now()
    const o = await oldUserHeatmap(u.userId, 90)
    const tOld = performance.now() - t
    t = performance.now()
    const n = await buildUserHeatmap(u.userId, 90)
    const tNew = performance.now() - t
    const c = compareHeat(o, n)
    cellSame += c.same; cellDiff += c.diff; onlyOld += c.onlyOld; onlyNew += c.onlyNew
    console.log(`--- ${u.userId.slice(0, 8)} 旧 ${ms(tOld)} 演奏${o.perfCount} セル${Object.keys(o.cells).length} / 新 ${ms(tNew)} 演奏${n.perfCount} セル${Object.keys(n.cells).length} → 同じ ${c.same} ・ 差 ${c.diff} ・ 旧のみ ${c.onlyOld} ・ 新のみ ${c.onlyNew} ・ 詳細差 ${c.detailDiff}`)
    for (const l of c.lines.slice(0, 8)) console.log(l)
  }
  console.log(`セル 同じ ${cellSame} ・ 差 ${cellDiff} ・ 旧のみ ${onlyOld} ・ 新のみ ${onlyNew}`)

  console.log("\n── ② 速い指の切り替え (ユーザー・直近90日) ──")
  let bandSame = 0, bandDiff = 0
  for (const u of users) {
    let t = performance.now()
    const o = await oldFastSwitch(u.userId, 90)
    const tOld = performance.now() - t
    t = performance.now()
    const n = await buildFastSwitch(u.userId, 90)
    const tNew = performance.now() - t
    const fmt = (d: typeof o) => d.bands.map((b) => `${b.label} ${b.notes}音 ${b.pitchPct ?? "-"}/${b.timingPct ?? "-"}`).join(" | ")
    const eq = fmt(o) === fmt(n)
    if (eq) bandSame++; else bandDiff++
    console.log(`--- ${u.userId.slice(0, 8)} 旧 ${ms(tOld)} 演奏${o.perfCount} / 新 ${ms(tNew)} 演奏${n.perfCount} ${eq ? "一致" : "差"}`)
    if (!eq) { console.log(`    旧 ${fmt(o)}`); console.log(`    新 ${fmt(n)}`) }
  }
  console.log(`帯 一致 ${bandSame} ・ 差 ${bandDiff}`)

  console.log("\n── ③ 指板 (ユーザー×曲) ──")
  const pairs = await prisma.$queryRaw<{ userId: string; scoreId: string; title: string; n: number }[]>`
    SELECT p."userId", p."scoreId", s.title, count(*)::int AS n
    FROM "Performance" p JOIN "Score" s ON s.id = p."scoreId"
    WHERE p."scoreNoteVersion" IS NOT NULL
    GROUP BY p."userId", p."scoreId", s.title ORDER BY n DESC LIMIT 5`
  let tSame = 0, tDiff = 0
  for (const pr of pairs) {
    const o = await oldTargetHeatmap(pr.userId, "score", pr.scoreId, 10)
    const n = await buildTargetHeatmap(pr.userId, "score", pr.scoreId, 10)
    const c = compareHeat(o, n)
    const eq = c.diff === 0 && c.onlyOld === 0 && c.onlyNew === 0 && c.detailDiff === 0
    if (eq) tSame++; else tDiff++
    console.log(`--- ${pr.userId.slice(0, 8)} × ${pr.title.slice(0, 14)} 演奏${pr.n}: 旧 演奏${o.perfCount} セル${Object.keys(o.cells).length} / 新 演奏${n.perfCount} セル${Object.keys(n.cells).length} → ${eq ? "一致" : `同じ ${c.same} ・ 差 ${c.diff} ・ 旧のみ ${c.onlyOld} ・ 新のみ ${c.onlyNew} ・ 詳細差 ${c.detailDiff}`}`)
    for (const l of c.lines.slice(0, 6)) console.log(l)
  }
  console.log(`曲 一致 ${tSame} ・ 差 ${tDiff}`)
  await prisma.$disconnect()
}
main().catch((e) => { console.error(e); process.exit(1) })
