// 指板ヒートマップの共有型 (client-safe)。集計実体は aggregate.ts (server-only)
import type { CellStatus } from "./colors"

export type HeatCellOut = { status: CellStatus; level: 0 | 1 | 2 }

export type TransitionRow = {
  fromLabel: string
  /** 遷移元セル (弦と枠番号)。弾き始め等は null。案Cの弦図に使う (2026-08-22) */
  from?: { s: string; n: number } | null
  /** 差分バッジ: "1st→3rd"(シフト) / "移弦のみ" / "同じ弦" / null(弾き始め等) */
  badge: string | null
  badgeKind: "shift" | "info" | null
  n: number
  miss: number
  dir: "high" | "low" | "mixed"
}

/** ポジションべつの精度 (タップ詳細v2・2026-08-11 Tetsuo承認) */
export type PositionRow = {
  position: number
  finger: number | null
  n: number
  miss: number
  dir: "high" | "low" | "mixed"
}

/** シフト直後 vs 移動なし の比較 (シフト直後が2回以上ある時のみ) */
export type ShiftSplit = {
  after: { n: number; miss: number; dir: "high" | "low" | "mixed" }
  normal: { n: number; miss: number }
}

export type CellDetail = {
  n: number
  high: number
  low: number
  kana: string
  positions: PositionRow[]
  shiftSplit: ShiftSplit | null
  transitions: TransitionRow[]
}

export type HeatmapData = {
  cells: Record<string, HeatCellOut>
  details: Record<string, CellDetail>
  perfCount: number
}

/** ポジション番号 → 表示ラベル (1st/2nd/3rd/4th/...) */
export function posLabel(p: number): string {
  return p === 1 ? "1st" : p === 2 ? "2nd" : p === 3 ? "3rd" : `${p}th`
}
