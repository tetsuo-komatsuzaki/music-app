// 指板ヒートマップの共有型 (client-safe)。集計実体は aggregate.ts (server-only)
import type { CellStatus } from "./colors"

export type HeatCellOut = { status: CellStatus; level: 0 | 1 | 2 }

export type TransitionRow = {
  fromLabel: string
  shift: boolean
  n: number
  miss: number
  dir: "high" | "low" | "mixed"
}

export type CellDetail = {
  n: number
  high: number
  low: number
  kana: string
  transitions: TransitionRow[]
}

export type HeatmapData = {
  cells: Record<string, HeatCellOut>
  details: Record<string, CellDetail>
  perfCount: number
}
