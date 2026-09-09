/**
 * 5 つの力 ・ 集計 (サーバー専用。2026-09-06)。素の規則と型は fivePowersCore.ts。
 */
// (server-only は付けない: テストからも読む。画面側は fivePowersCore だけを読む)
import { aggregate, prismaSource, type DetailRow, type Unit } from "./noteStore"
import { fastSwitchRows } from "./fastSwitch"
import { EMPTY_POWERS, MIN_NOTES, comparePowers, scaleWindows, type CompareScale, type FivePowers, type PowersComparison } from "./fivePowersCore"
export * from "./fivePowersCore"

function pct(ok: number, n: number): number | null {
  return n >= MIN_NOTES ? Math.round((ok / n) * 100) : null
}
function sumAgg(m: Map<string, { target: number; miss: number }>): { target: number; miss: number } {
  let target = 0, miss = 0
  for (const v of m.values()) { target += v.target; miss += v.miss }
  return { target, miss }
}

/** 明細 (演奏ごと noteIndex 順) → 5 つの力。純粋 */
export function fivePowersFromRows(rows: DetailRow[]): FivePowers {
  if (rows.length === 0) return EMPTY_POWERS
  const perfs = new Set(rows.map((r) => r.performanceId))
  // 音程 ・ リズム: 判定できた音のうち合っていた割合 (not_detected はミス)
  let pN = 0, pOk = 0, rN = 0, rOk = 0
  for (const r of rows) {
    if (r.evaluationStatus === "not_detected" || r.pitchOk != null) { pN++; if (r.pitchOk === true) pOk++ }
    if (r.evaluationStatus === "not_detected" || r.startOk != null) { rN++; if (r.startOk === true) rOk++ }
  }
  // 速い指: 帯ごとの音程成功率を音数で重み付け
  const fs = fastSwitchRows(rows)
  let fN = 0, fOk = 0
  for (const b of fs.bands) { if (b.pitchPct != null) { fN += b.notes; fOk += (b.pitchPct / 100) * b.notes } }
  // ポジション ・ 奏法: 束の合計
  const pos = sumAgg(aggregate("position", rows, "pitch"))
  const tech = sumAgg(aggregate("technique", rows, "pitch"))
  return {
    values: {
      pitch: pct(pOk, pN), rhythm: pct(rOk, rN), fast: pct(Math.round(fOk), fN),
      position: pct(pos.target - pos.miss, pos.target), technique: pct(tech.target - tech.miss, tech.target),
    },
    notes: { pitch: pN, rhythm: rN, fast: fN, position: pos.target, technique: tech.target },
    perfCount: perfs.size,
  }
}

export async function buildFivePowers(unit: Unit): Promise<FivePowers> {
  return fivePowersFromRows(await prismaSource.fetchDetail(unit))
}

/** 相手の窓を日付で返す (下の箱 = buildNumbersRoom の range 用)。「はじめの 5 回」は最初の 5 回の演奏の日付から。録音が無ければ null */
export async function pastRange(userId: string, scale: CompareScale, now = new Date()): Promise<{ since: Date; until: Date } | null> {
  const w = scaleWindows(scale, now)
  if (!("firstN" in w.past)) return w.past
  const { prisma } = await import("./prisma")
  const [a, b] = await Promise.all([
    prisma.performance.findMany({ where: { userId }, orderBy: { uploadedAt: "asc" }, take: w.past.firstN, select: { uploadedAt: true } }),
    prisma.practicePerformance.findMany({ where: { userId }, orderBy: { uploadedAt: "asc" }, take: w.past.firstN, select: { uploadedAt: true } }),
  ])
  const dates = [...a, ...b].map((r) => r.uploadedAt.getTime()).sort((x, y) => x - y).slice(0, w.past.firstN)
  if (dates.length === 0) return null
  return { since: new Date(dates[0]), until: new Date(dates[dates.length - 1] + 1000) }
}
/** 相手側の 速い指 (窓 or 最初の N 回) */
export async function buildPastFastSwitch(userId: string, scale: CompareScale, now = new Date()) {
  const w = scaleWindows(scale, now)
  const { buildFastSwitchUnit } = await import("./fastSwitch")
  return "firstN" in w.past ? buildFastSwitchUnit({ userId, firstN: w.past.firstN }) : buildFastSwitchUnit({ userId, since: w.past.since, until: w.past.until })
}

/** 尺度に沿って いま と 相手 を集計して比べる */
export async function buildPowersComparison(userId: string, scale: CompareScale, now = new Date()): Promise<PowersComparison> {
  const w = scaleWindows(scale, now)
  const [cur, past] = await Promise.all([
    buildFivePowers({ userId, since: w.now.since, until: w.now.until }),
    "firstN" in w.past ? buildFivePowers({ userId, firstN: w.past.firstN }) : buildFivePowers({ userId, since: w.past.since, until: w.past.until }),
  ])
  return comparePowers(scale, cur, past)
}
