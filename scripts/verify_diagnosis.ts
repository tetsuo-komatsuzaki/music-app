/**
 * verify_diagnosis.ts — 演奏直後の診断 (ノート属性ストア版) を、明細を持つ全演奏で回して検査する。
 *
 *   ① 旧 (保存されている diagnosis) と新の verdict の対応 ・ 旧が古い演奏があるので一致ではなく分布を出す
 *   ② スロットが出るか、教材が付くか、教材に束が本当にあるか (写しで回数>0)
 *   ③ 内訳文が出た数
 *
 * 実行: npx tsx scripts/verify_diagnosis.ts
 */
import "dotenv/config"
import { prisma } from "../app/_libs/prisma"
import { buildDiagnosisView } from "../app/_libs/diagnosisPresentation"

async function main() {
  const perfs = await prisma.$queryRaw<{ id: string; userId: string; scoreId: string; title: string; star: number | null; keyTonic: string | null; keyMode: string | null; analysisSummary: unknown }[]>`
    SELECT p.id, p."userId", p."scoreId", s.title, s.star, s."keyTonic", s."keyMode", p."analysisSummary"
    FROM "Performance" p JOIN "Score" s ON s.id = p."scoreId"
    WHERE EXISTS (SELECT 1 FROM "PerformanceNote" pn WHERE pn."performanceKind" = 'score' AND pn."performanceId" = p.id)
    ORDER BY p."createdAt"`
  console.log(`明細を持つ演奏 ${perfs.length}件\n`)
  const pair: Record<string, number> = {}
  let slots = 0, withMat = 0, bad = 0, breakdowns = 0, unavailable = 0, coarseSlots = 0, overall = 0, basicBad = 0
  const times: number[] = []
  for (const p of perfs) {
    const summary = p.analysisSummary as { diagnosis?: { collapse?: { collapsed?: unknown[]; is_clean?: boolean }; diagnosis?: { pitch: string[]; rhythm: string[] }; map_available?: boolean } } | null
    const oldD = summary?.diagnosis
    const oldVerdict = !oldD || !oldD.map_available ? "unavailable" : ((oldD.diagnosis?.pitch.length ?? 0) + (oldD.diagnosis?.rhythm.length ?? 0)) > 0 ? "weakness" : "none"
    const s = performance.now()
    const v = await buildDiagnosisView({ kind: "score", performanceId: p.id, userId: p.userId, targetId: p.scoreId, star: p.star, key: { tonic: p.keyTonic, mode: p.keyMode }, collapse: oldD?.collapse ?? null })
    times.push(performance.now() - s)
    const k = `${oldVerdict}→${v.verdict}`
    pair[k] = (pair[k] ?? 0) + 1
    if (v.verdict === "unavailable") unavailable++
    // 基礎練 (粗い束・全体) の教材は「音階/アルペジオ ・ その人の★以下」が規則
    const userStar = (await prisma.userStarProgress.findUnique({ where: { userId: p.userId }, select: { currentStar: true } }))?.currentStar ?? p.star ?? 99
    const checkBasic = (mats: { id: string; category: string; star: number | null; keyTonic: string }[], label: string) => {
      for (const m of mats) {
        if (!["scale", "arpeggio"].includes(m.category) || (m.star ?? 0) > userStar) { basicBad++; console.log(`  基礎練の規則外 ${p.title} ${label} → ${m.category} ★${m.star} (★${userStar})`) }
      }
    }
    if (v.verdict === "overall") { overall++; checkBasic(v.overall?.materials ?? [], "全体") }
    for (const sl of v.slots) {
      slots++
      if (sl.breakdown) breakdowns++
      if (sl.coarse) { coarseSlots++; checkBasic(sl.materials, sl.subtaskId); continue }
      if (sl.materials.length) {
        withMat++
        const c = await prisma.materialBundleCount.findUnique({ where: { targetId_bundleKey: { targetId: sl.materials[0].id, bundleKey: sl.subtaskId } } })
        if (!c || c.count <= 0) { bad++; console.log(`  嘘 ${p.title} ${sl.subtaskId} → ${sl.materials[0].title}`) }
      }
    }
    if (v.verdict === "overall" || v.slots.some((sl) => sl.coarse)) console.log(`  F21 ${p.title.slice(0, 14)} ${p.id.slice(0, 8)} 旧=${oldVerdict} 新=${v.verdict} ${v.totals ? `音程${v.totals.pitchMiss}/${v.totals.played} 入り${v.totals.rhythmMiss}/${v.totals.played}` : ""} ${v.slots.filter((sl) => sl.coarse).map((sl) => `[${sl.tree}] ${sl.subtaskName} ${sl.miss}/${sl.target}`).join(" ・ ")} 教材[${(v.verdict === "overall" ? v.overall?.materials ?? [] : v.slots.find((sl) => sl.coarse)?.materials ?? []).map((m) => `${m.title.slice(0, 12)}★${m.star}`).join(",")}]`)
    if (times.length <= 6) console.log(`--- ${p.title.slice(0, 14)} ${p.id.slice(0, 8)} 旧=${oldVerdict} 新=${v.verdict} ${Math.round(times[times.length - 1])}ms\n` + v.slots.map((sl) => `   [${sl.tree}] ${sl.subtaskName} ${sl.miss}/${sl.target}${sl.breakdown ? " ・ " + sl.breakdown : ""} → ${sl.materials[0]?.title ?? "教材なし"}`).join("\n"))
  }
  times.sort((a, b) => a - b)
  console.log("\n旧→新 の verdict:", pair)
  console.log(`スロット ${slots} ・ 教材つき ${withMat} ・ 嘘 ${bad} ・ 内訳文 ${breakdowns} ・ 明細なし ${unavailable} / F21: 粗い束 ${coarseSlots} ・ 全体 ${overall} ・ 基礎練の規則外 ${basicBad}`)
  console.log(`組み立て 中央値 ${Math.round(times[Math.floor(times.length / 2)] ?? 0)}ms ・ 最大 ${Math.round(times[times.length - 1] ?? 0)}ms`)
  await prisma.$disconnect()
  if (bad > 0 || basicBad > 0) { console.log("判定: 失敗"); process.exit(1) }
  console.log("判定: 合格")
}
main().catch((e) => { console.error(e); process.exit(1) })
