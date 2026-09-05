/**
 * verify_growth.ts — 成長カルテ・成長1行・ほめ文言 (ノート属性ストア版) を実データで検査する。
 *
 *   A 派生サマリ (TS) と 保存された集計 (旧 per_subtask / noteStats) の突き合わせ
 *     ・ 旧が持つ条件の名前ごとに miss/target が一致するか。旧は再解析前の古い値を持つことがあるので
 *       一致ではなく分布を出し、差があった演奏は最大5件を例示する
 *     ・ noteStats は notes/registers/positions の一致、transitions は 旧⊆新 (旧は2回以上に間引き済み)
 *   B 読み手 4本 (buildKarteData / buildNumbersRoom / buildRemarkTracking / buildSkillDetail) を
 *     明細の多いユーザー5人で回し、落ちない・中身が出る・時間 を見る
 *   C 成長1行・ほめ文言: 直近の演奏20件で 旧サマリ入力 と 派生サマリ入力 の結果を並べる
 *   D 先生画面の弱点行 (weakSlotsByPerformance): 旧 topWeak (保存された診断) との有無を並べる
 *
 * 実行: npx tsx scripts/verify_growth.ts
 */
import "dotenv/config"
import { prisma } from "../app/_libs/prisma"
import { derivedSummariesByPerformance, type DerivedSummary } from "../app/_libs/noteStoreSummary"
import { buildKarteData, buildNumbersRoom, buildRemarkTracking, buildSkillDetail, SKILL_SUB_DEFS } from "../app/_libs/growthKarte"
import { buildSubMap, basicGrowthDefs, computeGrowthLine, growthWindows, type SkillSubDef } from "../app/_libs/growthLine"
import { selectPraise } from "../app/_libs/praiseFeedback"

type Stored = {
  diagnosis?: { version?: unknown; map_available?: boolean; per_subtask?: Record<string, { miss: number; target: number }> }
  noteStats?: {
    notes?: Record<string, { target: number; pitch_miss: number; timing_miss: number; cents_avg: number | null }>
    registers?: Record<string, { target: number; pitch_miss: number; timing_miss: number }>
    positions?: Record<string, { target: number; pitch_miss: number; timing_miss: number }>
    transitions?: Record<string, { target: number; miss: number }>
  }
} | null

const ms = (t: number) => `${Math.round(t)}ms`

async function partA() {
  console.log("── A 派生サマリ vs 保存された集計 ──")
  const users = await prisma.$queryRaw<{ userId: string }[]>`
    SELECT DISTINCT "userId" FROM "Performance" WHERE "scoreNoteVersion" IS NOT NULL
    UNION SELECT DISTINCT "userId" FROM "PracticePerformance" WHERE "scoreNoteVersion" IS NOT NULL`
  let perfs = 0, subEq = 0, subDiff = 0, subNoOld = 0, keysCompared = 0, keysDiff = 0
  let nsEq = 0, nsDiff = 0, nsNoOldPos = 0, trSuperset = 0, trMissing = 0
  const examples: string[] = []
  const reasons: Record<string, number> = {}
  const nsExamples: string[] = []
  for (const u of users) {
    const derived = await derivedSummariesByPerformance({ userId: u.userId })
    const [ps, pps] = await Promise.all([
      prisma.performance.findMany({ where: { userId: u.userId, scoreNoteVersion: { not: null } }, select: { id: true, analysisSummary: true, score: { select: { title: true } } } }),
      prisma.practicePerformance.findMany({ where: { userId: u.userId, scoreNoteVersion: { not: null } }, select: { id: true, analysisSummary: true, practiceItem: { select: { title: true } } } }),
    ])
    const rows = [
      ...ps.map((p) => ({ id: p.id, title: p.score.title, stored: p.analysisSummary as Stored })),
      ...pps.map((p) => ({ id: p.id, title: p.practiceItem.title, stored: p.analysisSummary as Stored })),
    ]
    for (const r of rows) {
      const d = derived.get(r.id)
      if (!d) continue
      perfs++
      const oldPer = r.stored?.diagnosis?.per_subtask
      if (!oldPer || !r.stored?.diagnosis?.map_available) { subNoOld++ } else {
        const diffs: string[] = []
        let onlyPlusOne = true, missingKey = false, techOrDouble = false, onlyPosIntervalShrink = true, onlyKnownMix = true
        for (const [k, v] of Object.entries(oldPer)) {
          keysCompared++
          const n = d.diagnosis.per_subtask[k]
          if (!n || n.miss !== v.miss || n.target !== v.target) {
            keysDiff++
            diffs.push(`${k} 旧${v.miss}/${v.target} 新${n ? `${n.miss}/${n.target}` : "なし"}`)
            if (!n) missingKey = true
            else if (!(n.target - v.target === 1 && n.miss - v.miss >= 0 && n.miss - v.miss <= 1)) onlyPlusOne = false
            if (/_(tech|double)_/.test(k)) techOrDouble = true
            // 低信頼ポジション (F16): その音の posshift / interval だけが消えるので、両者の target が減る
            if (!(/_(posshift|interval)_/.test(k) && n && n.target < v.target)) onlyPosIntervalShrink = false
            // 混合: 同じ演奏に F16 の減り (posshift/interval) と 繰り返し境目の +1 が同居する
            const plusOne = !!n && n.target - v.target === 1 && n.miss - v.miss >= 0 && n.miss - v.miss <= 1
            const shrink = !!n && /_(posshift|interval)_/.test(k) && n.target < v.target
            if (!plusOne && !shrink) onlyKnownMix = false
          }
        }
        if (diffs.length === 0) subEq++
        else {
          subDiff++
          const reason = missingKey ? (techOrDouble ? "旧が古い・奏法/重音の条件が新に無い" : "旧の条件が新に無い (低信頼ポジション F16 か 対応づけ)")
            : onlyPlusOne ? "繰り返し境目 (+1音)" : onlyPosIntervalShrink ? "低信頼ポジション F16 (posshift/interval が減る)" : onlyKnownMix ? "F16 と 繰り返し境目 の混合" : techOrDouble ? "旧が古い・奏法/重音" : "要調査"
          reasons[reason] = (reasons[reason] ?? 0) + 1
          if (reason === "要調査" || examples.length < 5) examples.push(`  [${reason}] ${r.title.slice(0, 16)} ${r.id.slice(0, 8)} 差${diffs.length}/${Object.keys(oldPer).length}: ${(reason === "要調査" ? diffs : diffs.slice(0, 3)).join(" ・ ")}`)
        }
      }
      const oldNs = r.stored?.noteStats
      if (oldNs) {
        const same = (a: Record<string, { target: number; pitch_miss: number; timing_miss: number }> | undefined, b: Record<string, { target: number; pitch_miss: number; timing_miss: number }>) => {
          const ak = Object.keys(a ?? {}), bk = Object.keys(b)
          if (ak.length !== bk.length) return false
          return ak.every((k) => b[k] && b[k].target === a![k].target && b[k].pitch_miss === a![k].pitch_miss && b[k].timing_miss === a![k].timing_miss)
        }
        const notesOk = same(oldNs.notes, d.noteStats.notes) && Object.entries(oldNs.notes ?? {}).every(([k, v]) => (v.cents_avg ?? null) === (d.noteStats.notes[k]?.cents_avg ?? null))
        // 旧のポジション別は analysis.json に position が無い時代のものが空 (undefined/{}) → 比べられないので別に数える
        const oldHasPos = Object.keys(oldNs.positions ?? {}).length > 0
        if (!oldHasPos) nsNoOldPos++
        const ok = notesOk && same(oldNs.registers, d.noteStats.registers) && (!oldHasPos || same(oldNs.positions, d.noteStats.positions))
        if (ok) nsEq++; else {
          nsDiff++
          if (nsExamples.length < 3) {
            const on = oldNs.notes ?? {}, nn = d.noteStats.notes
            const onlyOld = Object.keys(on).filter((k) => !nn[k]), onlyNew = Object.keys(nn).filter((k) => !on[k])
            const valDiff = Object.keys(on).filter((k) => nn[k] && (nn[k].target !== on[k].target || nn[k].pitch_miss !== on[k].pitch_miss || nn[k].timing_miss !== on[k].timing_miss || (nn[k].cents_avg ?? null) !== (on[k].cents_avg ?? null)))
              .slice(0, 3).map((k) => `${k} 旧${on[k].target}/${on[k].pitch_miss}/${on[k].timing_miss}/${on[k].cents_avg} 新${nn[k].target}/${nn[k].pitch_miss}/${nn[k].timing_miss}/${nn[k].cents_avg}`)
            nsExamples.push(`  ${r.title.slice(0, 14)} ${r.id.slice(0, 8)} notes 旧のみ[${onlyOld.slice(0, 4)}] 新のみ[${onlyNew.slice(0, 4)}] 値差 ${valDiff.join(" ・ ")}\n     registers 旧${JSON.stringify(oldNs.registers)} 新${JSON.stringify(d.noteStats.registers)}\n     positions 旧${JSON.stringify(oldNs.positions)} 新${JSON.stringify(d.noteStats.positions)}`)
          }
        }
        const missing = Object.entries(oldNs.transitions ?? {}).filter(([k, v]) => { const n = d.noteStats.transitions[k]; return !n || n.target !== v.target || n.miss !== v.miss })
        if (missing.length === 0) trSuperset++; else trMissing++
      }
    }
  }
  console.log(`明細を持つ演奏 ${perfs} ・ per_subtask 一致 ${subEq} ・ 差あり ${subDiff} ・ 旧なし ${subNoOld}`)
  console.log(`  条件の名前 ${keysCompared} 個を比較 ・ 差 ${keysDiff} 個`)
  if (examples.length) console.log(examples.join("\n"))
  console.log("  差の理由:", reasons)
  console.log("  (noteStats の positions 差は、旧が開放弦を数えていない (analysis.json の position 無し) のに対し新は R2 で手のポジションを引き継ぐため。意図した差)")
  console.log(`noteStats (notes/registers/positions) 一致 ${nsEq} ・ 差あり ${nsDiff} ・ うち旧にポジション別なし ${nsNoOldPos} / transitions 旧⊆新 ${trSuperset} ・ 旧にあって新に無い ${trMissing}`)
  if (nsExamples.length) console.log(nsExamples.join("\n"))
  return { perfs, subEq, subDiff, nsEq, nsDiff, trMissing, reasons }
}

async function partB() {
  console.log("\n── B 読み手4本 ・ 明細の多いユーザー5人 ──")
  const users = await prisma.$queryRaw<{ userId: string; n: number }[]>`
    SELECT x."userId", count(*)::int AS n FROM (
      SELECT p."userId", pn."noteIndex" FROM "PerformanceNote" pn JOIN "Performance" p ON p.id = pn."performanceId" AND pn."performanceKind" = 'score'
      UNION ALL
      SELECT p."userId", pn."noteIndex" FROM "PerformanceNote" pn JOIN "PracticePerformance" p ON p.id = pn."performanceId" AND pn."performanceKind" = 'practice'
    ) x GROUP BY x."userId" ORDER BY n DESC LIMIT 5`
  let failures = 0
  for (const u of users) {
    const user = await prisma.user.findUnique({ where: { id: u.userId }, select: { supabaseUserId: true } })
    const sb = user?.supabaseUserId ?? ""
    try {
      let t = performance.now()
      const k = await buildKarteData(u.userId, sb, "all")
      const tK = performance.now() - t
      t = performance.now()
      const n = await buildNumbersRoom(u.userId, "all")
      const tN = performance.now() - t
      t = performance.now()
      const r = await buildRemarkTracking(u.userId)
      const tR = performance.now() - t
      t = performance.now()
      const s = await buildSkillDetail(u.userId, sb, "slur")
      const tS = performance.now() - t
      const sPos = await buildSkillDetail(u.userId, sb, "position")
      const sDbl = await buildSkillDetail(u.userId, sb, "double")
      const gridTarget = k.grid.reduce((a, c) => a + c.target, 0)
      const nodesWithPct = k.skillMap?.nodes.filter((x) => x.pct != null).length ?? null
      console.log(`--- ${u.userId.slice(0, 8)} 明細${u.n}音`)
      console.log(`   カルテ ${ms(tK)}: 安定マップ target合計 ${gridTarget} ・ 奏法行 ${k.techRows.length} ・ 所見 ${k.insights.length} ・ 技術マップ精度あり ${nodesWithPct ?? "先生なし"} ・ 虫めがね ${k.v2.discovery.lens?.raw ?? "なし"} ・ 音域 ${k.v2.discovery.registerWorst?.band ?? "なし"}`)
      console.log(`   数字の部屋 ${ms(tN)}: 音域 ${n.registers.length} ・ 音 ${n.worstNotes.length} ・ 遷移 ${n.transitions.length} ・ ポジション移動 ${n.posShifts.length} ・ セント偏差 ${n.centsBias ?? "なし"}`)
      console.log(`   指摘トラッキング ${ms(tR)}: ${r.length}件 ${r.map((x) => `${x.label.slice(0, 12)}=${x.status}`).join(", ")}`)
      console.log(`   わざ詳細(スラー) ${ms(tS)}: state ${s?.state ?? "なし"} ・ 精度 ${s?.pct ?? "なし"} ・ 点 ${s?.series.length ?? 0} ・ おすすめ ${s?.recommended.length ?? 0} [${s?.recommended.map((m) => m.title.slice(0, 10)).join(",")}]`)
      console.log(`   わざ詳細(ポジション移動): 精度 ${sPos?.pct ?? "なし"} ・ おすすめ ${sPos?.recommended.length ?? 0} [${sPos?.recommended.map((m) => m.title.slice(0, 10)).join(",")}] / (重音): 精度 ${sDbl?.pct ?? "なし"} ・ おすすめ ${sDbl?.recommended.length ?? 0} [${sDbl?.recommended.map((m) => m.title.slice(0, 10)).join(",")}]`)
    } catch (e) {
      failures++
      console.log(`--- ${u.userId.slice(0, 8)} 失敗: ${(e as Error).message}`)
    }
  }
  return { failures }
}

async function partC() {
  console.log("\n── C 成長1行・ほめ文言 ・ 直近20演奏 旧サマリ入力 vs 派生サマリ入力 ──")
  const growthDefs = (maps: Map<string, { miss: number; target: number }>[]): SkillSubDef[] => [
    ...SKILL_SUB_DEFS.map((d) => ({ ...d, priority: 1 })),
    ...basicGrowthDefs(maps),
  ]
  const perfs = await prisma.performance.findMany({
    where: { scoreNoteVersion: { not: null } }, orderBy: { uploadedAt: "desc" }, take: 20,
    select: { id: true, userId: true, uploadedAt: true, score: { select: { title: true } } },
  })
  let lineSame = 0, lineDiff = 0, praiseSame = 0, praiseDiff = 0
  for (const perf of perfs) {
    const [firstPerf, firstPrac] = await Promise.all([
      prisma.performance.findFirst({ where: { userId: perf.userId }, orderBy: { uploadedAt: "asc" }, select: { uploadedAt: true } }),
      prisma.practicePerformance.findFirst({ where: { userId: perf.userId }, orderBy: { uploadedAt: "asc" }, select: { uploadedAt: true } }),
    ])
    const firstAt = [firstPerf?.uploadedAt, firstPrac?.uploadedAt].filter((d): d is Date => d != null).sort((a, b) => a.getTime() - b.getTime())[0] ?? perf.uploadedAt
    const { nowFrom, baseFrom, baseTo } = growthWindows(firstAt, perf.uploadedAt)
    const [nowP, nowQ, baseP, baseQ] = await Promise.all([
      prisma.performance.findMany({ where: { userId: perf.userId, uploadedAt: { gte: nowFrom, lte: perf.uploadedAt } }, select: { id: true, analysisSummary: true } }),
      prisma.practicePerformance.findMany({ where: { userId: perf.userId, uploadedAt: { gte: nowFrom, lte: perf.uploadedAt } }, select: { id: true, analysisSummary: true } }),
      prisma.performance.findMany({ where: { userId: perf.userId, uploadedAt: { gte: baseFrom, lt: baseTo } }, select: { id: true, analysisSummary: true } }),
      prisma.practicePerformance.findMany({ where: { userId: perf.userId, uploadedAt: { gte: baseFrom, lt: baseTo } }, select: { id: true, analysisSummary: true } }),
    ])
    const derived = await derivedSummariesByPerformance({ userId: perf.userId, since: new Date(Math.min(nowFrom.getTime(), baseFrom.getTime()) - 864e5), until: new Date(perf.uploadedAt.getTime() + 864e5) })
    const oldNow = [...nowP, ...nowQ].map((r) => r.analysisSummary), oldBase = [...baseP, ...baseQ].map((r) => r.analysisSummary)
    const pick = (rows: { id: string }[]): (DerivedSummary | null)[] => rows.map((r) => derived.get(r.id) ?? null)
    const newNow = pick([...nowP, ...nowQ]), newBase = pick([...baseP, ...baseQ])
    const star = (await prisma.userStarProgress.findUnique({ where: { userId: perf.userId }, select: { currentStar: true } }))?.currentStar ?? 1
    const oM = [buildSubMap(oldNow), buildSubMap(oldBase)], nM = [buildSubMap(newNow), buildSubMap(newBase)]
    const oldLine = computeGrowthLine(oM[0], oM[1], growthDefs(oM))
    const newLine = computeGrowthLine(nM[0], nM[1], growthDefs(nM))
    const oldPraise = selectPraise(oldNow, oldBase, star), newPraise = selectPraise(newNow, newBase, star)
    const l = (x: typeof oldLine) => (x ? `${x.label} ${x.from}→${x.to}` : "なし")
    const p = (x: typeof oldPraise) => (x ? `${x.situation}/${x.item}/${x.value}` : "なし")
    if (l(oldLine) === l(newLine)) lineSame++; else lineDiff++
    if (p(oldPraise) === p(newPraise)) praiseSame++; else praiseDiff++
    console.log(`--- ${perf.score.title.slice(0, 14)} ${perf.id.slice(0, 8)} 成長1行 旧[${l(oldLine)}] 新[${l(newLine)}] / ほめ 旧[${p(oldPraise)}] 新[${p(newPraise)}]`)
  }
  console.log(`成長1行 同じ ${lineSame} ・ 違う ${lineDiff} / ほめ 同じ ${praiseSame} ・ 違う ${praiseDiff}`)
}

async function partD() {
  console.log("\n── D 先生画面の弱点行 ・ 直近の演奏 (旧 topWeak は保存された診断・新は明細) ──")
  const { weakSlotsByPerformance } = await import("../app/_libs/diagnosisPresentation")
  const perfs = await prisma.performance.findMany({
    where: { scoreNoteVersion: { not: null } }, orderBy: { uploadedAt: "desc" }, take: 40,
    select: { id: true, userId: true, analysisSummary: true, score: { select: { title: true } } },
  })
  const byUser = new Map<string, typeof perfs>()
  for (const p of perfs) { const l = byUser.get(p.userId); if (l) l.push(p); else byUser.set(p.userId, [p]) }
  let both = 0, oldOnly = 0, newOnly = 0, neither = 0, shown = 0
  for (const [userId, list] of byUser) {
    const t = performance.now()
    const m = await weakSlotsByPerformance(userId, {}, 3)
    const dt = performance.now() - t
    for (const p of list) {
      const d = (p.analysisSummary as { diagnosis?: { map_available?: boolean; diagnosis?: { pitch?: string[]; rhythm?: string[] } } } | null)?.diagnosis
      const oldN = d?.map_available ? (d.diagnosis?.pitch?.length ?? 0) + (d.diagnosis?.rhythm?.length ?? 0) : 0
      const nw = m.get(p.id) ?? []
      if (oldN > 0 && nw.length > 0) both++; else if (oldN > 0) oldOnly++; else if (nw.length > 0) newOnly++; else neither++
      if (shown < 8) { shown++; console.log(`--- ${p.score.title.slice(0, 12)} ${p.id.slice(0, 8)} 旧${oldN}件 新${nw.length}件 ${nw.map((w) => `[${w.tree}] ${w.name} ${w.miss}/${w.target}`).join(" ・ ")} (${ms(dt)}/ユーザー)`) }
    }
  }
  console.log(`弱点行 両方あり ${both} ・ 旧だけ ${oldOnly} ・ 新だけ ${newOnly} ・ どちらも無し ${neither}`)
}

async function main() {
  const only = process.env.ONLY
  const a = only === "BD" ? { perfs: 0, subEq: 0, subDiff: 0, nsEq: 0, nsDiff: 0, trMissing: 0, reasons: {} as Record<string, number> } : await partA()
  const b = only === "A" ? { failures: 0 } : await partB()
  if (only !== "A") await partD()
  if (only !== "A" && only !== "BD") await partC()
  await prisma.$disconnect()
  const unexplained = a.reasons["要調査"] ?? 0
  if (b.failures > 0 || a.trMissing > 0 || unexplained > 0) { console.log(`\n判定: 失敗 (要調査 ${unexplained})`); process.exit(1) }
  console.log("\n判定: 合格 (差の内訳は上の例示を見て判断)")
}
main().catch((e) => { console.error(e); process.exit(1) })
