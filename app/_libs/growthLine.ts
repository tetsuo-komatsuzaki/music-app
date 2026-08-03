// 成長の編み込み 案3 (2026-08-03): 採点直後の「成長1行」。
// この演奏の per_subtask を直近30日のベースラインと比べ、いちばん伸びたわざを1行で返す。
// ([[project_growth_woven_experience]] 承認済4案の1つ目・着手順3)
// prisma 非依存の純関数 (テスト対象)。わざ定義は呼び手が渡す (growthKarte の SKILL_SUB_DEFS)。

export type SubMap = Map<string, { miss: number; target: number }>
/** priority: 同着のとき大きい方を採用 (わざ系=1 > 基礎系=0。技術マップと同語彙を優先) */
export type SkillSubDef = { label: string; subIds: string[]; priority?: number }
export type GrowthLine = { label: string; from: number; to: number }

/** analysisSummary (unknown) の配列から per_subtask 合算マップを作る (subMapOf と同形・prisma非依存) */
export function buildSubMap(summaries: unknown[]): SubMap {
  const map: SubMap = new Map()
  for (const s of summaries) {
    const d = (s as { diagnosis?: { per_subtask?: Record<string, { miss?: unknown; target?: unknown }> } } | null)?.diagnosis
    if (!d?.per_subtask) continue
    for (const [sid, v] of Object.entries(d.per_subtask)) {
      if (!v || typeof v.miss !== "number" || typeof v.target !== "number") continue
      const e = map.get(sid) ?? { miss: 0, target: 0 }
      e.miss += v.miss
      e.target += v.target
      map.set(sid, e)
    }
  }
  return map
}

const pctOf = (m: SubMap, subIds: string[], minTarget: number): number | null => {
  let miss = 0
  let target = 0
  for (const sid of subIds) {
    const e = m.get(sid)
    if (!e) continue
    miss += e.miss
    target += e.target
  }
  if (target < minTarget) return null
  return (1 - miss / target) * 100
}

/**
 * 成長1行の選定 (2026-08-03 分母改定: 窓vs窓)。
 * - now = 直近30日(この演奏含む) / base = その前の30日 — どちらも合算8個以上 (1回の録音のブレを見せない)
 * - 丸め後 +3pt 以上 伸びたわざのうち、いちばん伸びたもの1つ。無ければ null (でっち上げない)
 */
export function computeGrowthLine(now: SubMap, base: SubMap, defs: SkillSubDef[]): GrowthLine | null {
  let best: GrowthLine | null = null
  let bestPriority = -1
  for (const d of defs) {
    if (d.subIds.length === 0) continue
    const to = pctOf(now, d.subIds, 8)
    const from = pctOf(base, d.subIds, 8)
    if (to == null || from == null) continue
    const rTo = Math.round(to)
    const rFrom = Math.round(from)
    if (rTo - rFrom < 3) continue
    const pri = d.priority ?? 0
    const delta = rTo - rFrom
    const bestDelta = best ? best.to - best.from : -1
    if (!best || delta > bestDelta || (delta === bestDelta && pri > bestPriority)) {
      best = { label: d.label, from: rFrom, to: rTo }
      bestPriority = pri
    }
  }
  return best
}

/**
 * 比較窓の選定 (2026-08-04 Tetsuo指示)。
 * - 通常: now = [演奏-30日, 演奏] / base = [演奏-60日, 演奏-30日)
 * - 演奏期間が30日未満 (初録音が30日以内): 全期間を半分に割り、前半=base / 後半=now
 */
export function growthWindows(firstAt: Date, perfAt: Date): { nowFrom: Date; baseFrom: Date; baseTo: Date } {
  const since30 = new Date(perfAt.getTime() - 30 * 864e5)
  if (firstAt >= since30) {
    const mid = new Date(firstAt.getTime() + (perfAt.getTime() - firstAt.getTime()) / 2)
    return { nowFrom: mid, baseFrom: firstAt, baseTo: mid }
  }
  return { nowFrom: since30, baseFrom: new Date(perfAt.getTime() - 60 * 864e5), baseTo: since30 }
}
