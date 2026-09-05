/**
 * verify_all_readers.ts — 層3 (仕様 §8-3): 分析結果を読む場所を、実ユーザー5人ぶん全部呼んで
 * 落ちない・中身が出る・時間 を一覧にする。画面の描画層は呼ばず、画面が呼ぶ組み立て関数を直接叩く。
 *
 *   npx tsx scripts/verify_all_readers.ts            … 結果を表示
 *   OUT=path.json npx tsx scripts/verify_all_readers.ts … 結果を JSON にも書く (報告アーティファクト用)
 */
import "dotenv/config"
import { writeFileSync } from "node:fs"
import { prisma } from "../app/_libs/prisma"
import { buildPersonalReco } from "../app/_libs/personalReco"
import { getDailyLessonsForUserScore } from "../app/_libs/dailyLessons"
import { buildDiagnosisView, weakSlotsByPerformance } from "../app/_libs/diagnosisPresentation"
import { derivedSummariesByPerformance } from "../app/_libs/noteStoreSummary"
import { buildSubMap, computeGrowthLine, growthWindows } from "../app/_libs/growthLine"
import { selectPraise } from "../app/_libs/praiseFeedback"
import { buildKarteData, buildNumbersRoom, buildRemarkTracking, buildSkillDetail, SKILL_SUB_DEFS } from "../app/_libs/growthKarte"
import { buildUserHeatmap, buildTargetHeatmap } from "../app/_libs/fingerboard/aggregate"
import { buildFastSwitch } from "../app/_libs/fastSwitch"
import { buildWeeklySummary } from "../app/_libs/weeklySummary"

type Row = { user: string; place: string; ok: boolean; ms: number; note: string }
const rows: Row[] = []

async function run(user: string, place: string, fn: () => Promise<string>) {
  const t = performance.now()
  try {
    const note = await fn()
    rows.push({ user, place, ok: true, ms: Math.round(performance.now() - t), note })
  } catch (e) {
    rows.push({ user, place, ok: false, ms: Math.round(performance.now() - t), note: (e as Error).message.slice(0, 120) })
  }
}

async function main() {
  const users = await prisma.$queryRaw<{ userId: string; n: number }[]>`
    SELECT x."userId", count(*)::int AS n FROM (
      SELECT p."userId" FROM "PerformanceNote" pn JOIN "Performance" p ON p.id = pn."performanceId" AND pn."performanceKind" = 'score'
      UNION ALL
      SELECT p."userId" FROM "PerformanceNote" pn JOIN "PracticePerformance" p ON p.id = pn."performanceId" AND pn."performanceKind" = 'practice'
    ) x GROUP BY x."userId" ORDER BY n DESC LIMIT 5`
  for (const u of users) {
    const userId = u.userId
    const short = `${userId.slice(0, 8)} (${u.n}音)`
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { supabaseUserId: true } })
    const sb = user?.supabaseUserId ?? ""
    const latestScore = await prisma.performance.findFirst({ where: { userId, scoreNoteVersion: { not: null } }, orderBy: { uploadedAt: "desc" }, select: { id: true, scoreId: true, uploadedAt: true, score: { select: { star: true, title: true } } } })
    const latestPrac = await prisma.practicePerformance.findFirst({ where: { userId, scoreNoteVersion: { not: null } }, orderBy: { uploadedAt: "desc" }, select: { id: true, practiceItemId: true, practiceItem: { select: { star: true, title: true } } } })

    await run(short, "ホーム4タブ", async () => {
      const r = await buildPersonalReco(userId)
      return r ? JSON.stringify(r).slice(0, 140) : "null (明細なし)"
    })
    await run(short, "基礎練②④", async () => {
      if (!latestScore) return "曲の演奏なし"
      const l = await getDailyLessonsForUserScore(userId, latestScore.scoreId)
      return `${latestScore.score.title.slice(0, 10)}: ${l.map((x) => `${x.slot}=${x.reason}`).join(" ")}`
    })
    await run(short, "演奏直後の診断 (曲)", async () => {
      if (!latestScore) return "曲の演奏なし"
      const v = await buildDiagnosisView({ kind: "score", performanceId: latestScore.id, userId, targetId: latestScore.scoreId, star: latestScore.score.star })
      return `${v.verdict} ・ スロット${v.slots.length} ${v.slots.map((s) => s.subtaskName).join("/")}`
    })
    await run(short, "演奏直後の診断 (教材)", async () => {
      if (!latestPrac) return "教材の演奏なし"
      const v = await buildDiagnosisView({ kind: "practice", performanceId: latestPrac.id, userId, targetId: latestPrac.practiceItemId, star: latestPrac.practiceItem.star })
      return `${v.verdict} ・ スロット${v.slots.length}`
    })
    await run(short, "成長1行 ・ ほめる文言", async () => {
      if (!latestScore) return "曲の演奏なし"
      const first = await prisma.performance.findFirst({ where: { userId }, orderBy: { uploadedAt: "asc" }, select: { uploadedAt: true } })
      const { nowFrom, baseFrom, baseTo } = growthWindows(first?.uploadedAt ?? latestScore.uploadedAt, latestScore.uploadedAt)
      const derived = await derivedSummariesByPerformance({ userId, since: new Date(Math.min(nowFrom.getTime(), baseFrom.getTime()) - 864e5), until: new Date(latestScore.uploadedAt.getTime() + 864e5) })
      const [nowP, baseP] = await Promise.all([
        prisma.performance.findMany({ where: { userId, uploadedAt: { gte: nowFrom, lte: latestScore.uploadedAt } }, select: { id: true } }),
        prisma.performance.findMany({ where: { userId, uploadedAt: { gte: baseFrom, lt: baseTo } }, select: { id: true } }),
      ])
      const now = nowP.map((r) => derived.get(r.id) ?? null), base = baseP.map((r) => derived.get(r.id) ?? null)
      const line = computeGrowthLine(buildSubMap(now), buildSubMap(base), SKILL_SUB_DEFS.map((d) => ({ ...d, priority: 1 })))
      const praise = selectPraise(now, base, 3)
      return `成長1行=${line ? `${line.label} ${line.from}→${line.to}` : "なし"} ・ ほめ=${praise ? praise.text.slice(0, 30) : "なし"}`
    })
    await run(short, "成長カルテ (30日)", async () => {
      const k = await buildKarteData(userId, sb, "30d")
      return `録音${k.recordingCount} ・ 安定マップ${k.grid.filter((c) => c.target > 0).length}枡 ・ 奏法行${k.techRows.length} ・ 所見${k.insights.length}`
    })
    await run(short, "成長カルテ (全期間)", async () => {
      const k = await buildKarteData(userId, sb, "all")
      return `録音${k.recordingCount} ・ 技術マップ${k.skillMap ? k.skillMap.nodes.filter((n) => n.pct != null).length + "精度あり" : "先生なし"} ・ 虫めがね${k.v2.discovery.lens?.raw ?? "なし"}`
    })
    await run(short, "数字の部屋", async () => {
      const n = await buildNumbersRoom(userId, "all")
      return `音域${n.registers.length} ・ 音${n.worstNotes.length} ・ 遷移${n.transitions.length} ・ ポジション移動${n.posShifts.length} ・ セント偏差${n.centsBias ?? "なし"}`
    })
    await run(short, "指摘トラッキング", async () => `${(await buildRemarkTracking(userId)).length}件`)
    for (const tech of ["slur", "position", "double"]) {
      await run(short, `わざ詳細 (${tech})`, async () => {
        const s = await buildSkillDetail(userId, sb, tech)
        return s ? `${s.state} ・ 精度${s.pct ?? "なし"} ・ 点${s.series.length} ・ おすすめ${s.recommended.length}` : "null"
      })
    }
    await run(short, "指板ヒートマップ (期間)", async () => {
      const h = await buildUserHeatmap(userId, 90)
      return `演奏${h.perfCount} ・ セル${Object.keys(h.cells).length}`
    })
    await run(short, "指板ヒートマップ (曲)", async () => {
      if (!latestScore) return "曲の演奏なし"
      const h = await buildTargetHeatmap(userId, "score", latestScore.scoreId, 10)
      return `演奏${h.perfCount} ・ セル${Object.keys(h.cells).length}`
    })
    await run(short, "速い指の切り替え", async () => {
      const f = await buildFastSwitch(userId, 90)
      return `演奏${f.perfCount} ・ ${f.bands.map((b) => `${b.label}:${b.notes}`).join(" ")}`
    })
    await run(short, "先生画面の弱点行", async () => {
      const m = await weakSlotsByPerformance(userId, {}, 3)
      const withSlots = [...m.values()].filter((v) => v.length > 0).length
      return `演奏${m.size} ・ 弱点行あり${withSlots}`
    })
    await run(short, "週間サマリー", async () => {
      const w = await buildWeeklySummary(userId)
      return `今週${w.count}回 ・ 変化${w.changes.length}行 ・ はじめて${w.newThings.length}`
    })
  }
  const places = [...new Set(rows.map((r) => r.place))]
  console.log(`\n${"場所".padEnd(22)} ${users.map((u) => u.userId.slice(0, 8)).join("   ")}`)
  for (const p of places) {
    const cells = users.map((u) => {
      const r = rows.find((x) => x.place === p && x.user.startsWith(u.userId.slice(0, 8)))
      return r ? `${r.ok ? "ok" : "NG"} ${String(r.ms).padStart(5)}ms` : "-"
    })
    console.log(`${p.padEnd(22)} ${cells.join("  ")}`)
  }
  const fails = rows.filter((r) => !r.ok)
  console.log(`\n呼び出し ${rows.length} ・ 失敗 ${fails.length}`)
  for (const f of fails) console.log(`  NG ${f.user} ${f.place}: ${f.note}`)
  for (const r of rows.filter((x) => x.ok).slice(0, 200)) console.log(`  ${r.user} ${r.place} ${r.ms}ms ・ ${r.note}`)
  if (process.env.OUT) writeFileSync(process.env.OUT, JSON.stringify({ at: new Date().toISOString(), users: users.map((u) => ({ id: u.userId.slice(0, 8), notes: u.n })), rows }, null, 1), "utf-8")
  await prisma.$disconnect()
  if (fails.length) process.exit(1)
}
main().catch((e) => { console.error(e); process.exit(1) })
