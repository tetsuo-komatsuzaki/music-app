/**
 * diagnosisPresentation.ts — 演奏ごとの弱点行 (2026-09-05 ノート属性ストア版)
 *
 * 役割: 演奏1回の明細 (PerformanceNote → ScoreNote → NoteProfile) を束ね、成功率の低い束を
 * 「弱点行」として返す。読むのは先生の画面 (生徒ページ・練習後カルテ・カルテを書く・先生ホームのAIの一言)。
 *
 * 生徒向けの「演奏直後の診断」カードと API は 2026-09-05 Tetsuo 決定で復活させず削除した。
 * 生徒に見える「やること」は 毎日の基礎練 (dailyLessons ④) と 録音直後のほめる文言に一本化。
 *
 *  - 束は 音程 (前の音名→今の音名)・ポジション移動・わざ・速い指の切り替え の4種、成功率の低い順
 *  - 音程側は音程のミス、リズム側は入りのミスで束ねる。各側2件、合計は呼び手の limit
 *  - 足切りはこの読み手の値 3音 (R4)
 */
import {
  aggregate, parseKey, prismaSource,
  type DetailRow, type GroupKey, type MissKind, type NoteStoreSource, type TabKey, type Unit,
} from "./noteStore"
import { movementLabel, fastSwitchLabel, positionMoveLabel, techniqueLabel, slurMoveLabel } from "./conditionName"

/** 候補に入るのに必要な弾いた音数 ・ 演奏1回の弱点行 (R4) */
export const DIAG_MIN_TARGET = 3
/** 各側 (音程/リズム) に出す束の数 */
const SLOTS_PER_SIDE = 2
const TABS: TabKey[] = ["pitch", "position", "technique", "fingering"]

export function bundleName(key: GroupKey): string {
  const { tab, a, b, c } = parseKey(key)
  switch (tab) {
    case "pitch": return movementLabel(a, b)
    case "fingering": return fastSwitchLabel(a, b)
    case "position": return positionMoveLabel(parseInt(a, 10), parseInt(b, 10), c || undefined)
    case "technique": return techniqueLabel(a, b || undefined)
    case "slur": return slurMoveLabel(parseInt(a, 10), b, c)
    default: return key
  }
}

/** 片側 (音程 or リズム) の弱点束を、成功率の低い順に最大 n 件 */
export function weakestBundles(rows: DetailRow[], kind: MissKind, n: number, minTarget: number): { key: GroupKey; miss: number; target: number }[] {
  const all: { key: GroupKey; miss: number; target: number; pct: number }[] = []
  for (const tab of TABS) {
    for (const [key, v] of aggregate(tab, rows, kind).entries()) {
      if (v.target < minTarget || v.miss === 0) continue
      all.push({ key, miss: v.miss, target: v.target, pct: Math.round((1 - v.miss / v.target) * 100) })
    }
  }
  all.sort((a, b) => a.pct - b.pct || b.target - a.target || a.key.localeCompare(b.key))
  return all.slice(0, n).map(({ key, miss, target }) => ({ key, miss, target }))
}

/** 先生画面の一覧・練習後カルテ用の弱点行 */
export type WeakSlotLite = { name: string; tree: "音程" | "リズム"; miss: number; target: number }

/** 演奏1回の明細 → 弱点行 (音程側→リズム側の順・最大 limit 件) */
export function weakSlotsFromRows(rows: DetailRow[], limit = 4): WeakSlotLite[] {
  const out: WeakSlotLite[] = []
  for (const [tree, kind] of [["音程", "pitch"], ["リズム", "timing"]] as const) {
    for (const b of weakestBundles(rows, kind, SLOTS_PER_SIDE, DIAG_MIN_TARGET)) {
      out.push({ name: bundleName(b.key), tree, miss: b.miss, target: b.target })
    }
  }
  return out.slice(0, limit)
}

/**
 * 単位 (ユーザー・期間・曲・演奏1回…) の明細を1回引き、演奏ごとに弱点行を作る。
 * 先生の生徒ページ (直近72演奏) のように演奏が多くても、明細の読みは1回で済む。
 * 読みに失敗したら空 (表が無い環境でも呼び手を落とさない)。
 */
export async function weakSlotsByPerformance(userId: string, unit: Omit<Unit, "userId"> = {}, limit = 4, source: NoteStoreSource = prismaSource): Promise<Map<string, WeakSlotLite[]>> {
  let rows: DetailRow[]
  try { rows = await source.fetchDetail({ userId, ...unit }) } catch { rows = [] }
  const byPerf = new Map<string, DetailRow[]>()
  for (const r of rows) {
    const list = byPerf.get(r.performanceId)
    if (list) list.push(r); else byPerf.set(r.performanceId, [r])
  }
  const out = new Map<string, WeakSlotLite[]>()
  for (const [id, list] of byPerf) out.set(id, weakSlotsFromRows(list, limit))
  return out
}
