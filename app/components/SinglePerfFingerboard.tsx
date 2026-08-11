"use client"

// 演奏直後の「実測塗り」指板 (2026-08-11 Tetsuo確定):
// 1回の演奏では統計判定 (n_min=5) をせず、その演奏で高かった音=赤 / 低かった音=青 /
// 合っていた音=緑 をそのまま塗る。弾いていない音・判定不能の音は白。
// 同じセルを複数回弾いて高低が混ざったら紫 (両方にブレ)。
import { useMemo } from "react"
import FingerboardPanel from "./FingerboardPanel"
import type { HeatCellOut, CellDetail } from "@/app/_libs/fingerboard/heatmapTypes"

export type FingerNote = { s: "G" | "D" | "A" | "E"; n: number }

type CompNote = { note_index?: number; pitch_ok?: boolean | null; pitch_cents_error?: number | null }

const OPEN_MIDI = { G: 55, D: 62, A: 69, E: 76 } as const
const KANA = ["ド", "ド♯", "レ", "レ♯", "ミ", "ファ", "ファ♯", "ソ", "ソ♯", "ラ", "ラ♯", "シ"] as const

export default function SinglePerfFingerboard({
  fingerNotes, comparison,
}: {
  /** note_index → 指板セル (musicxml_skill_info 由来・サーバーで構築) */
  fingerNotes: Record<number, FingerNote>
  comparison: CompNote[]
}) {
  const { cells, details } = useMemo(() => {
    const agg = new Map<string, { s: string; midi: number; n: number; ok: number; high: number; low: number; maxAbs: number }>()
    for (const r of comparison) {
      if (r.note_index == null || r.pitch_ok == null) continue
      const fn = fingerNotes[r.note_index]
      if (!fn) continue
      const id = `cell-${fn.s}-${String(fn.n).padStart(2, "0")}`
      let e = agg.get(id)
      if (!e) { e = { s: fn.s, midi: OPEN_MIDI[fn.s] + fn.n, n: 0, ok: 0, high: 0, low: 0, maxAbs: 0 }; agg.set(id, e) }
      e.n++
      const cents = r.pitch_cents_error
      if (r.pitch_ok) e.ok++
      else if (cents != null && cents > 0) { e.high++; e.maxAbs = Math.max(e.maxAbs, Math.abs(cents)) }
      else if (cents != null && cents < 0) { e.low++; e.maxAbs = Math.max(e.maxAbs, Math.abs(cents)) }
      else e.n-- // 向き不明のミスは塗らない (方向別表示の定義)
    }
    const cells: Record<string, HeatCellOut> = {}
    const details: Record<string, CellDetail> = {}
    for (const [id, e] of agg) {
      if (e.n <= 0) continue
      const status = e.high > 0 && e.low > 0 ? "unstable" : e.high > 0 ? "sharp" : e.low > 0 ? "flat" : "stable"
      const level = status === "stable" ? 0 : e.maxAbs >= 75 ? 2 : 1
      cells[id] = { status, level: level as 0 | 1 | 2 }
      details[id] = {
        n: e.n, high: e.high, low: e.low, kana: KANA[e.midi % 12],
        positions: [], shiftSplit: null, transitions: [],
      }
    }
    return { cells, details }
  }, [fingerNotes, comparison])

  if (Object.keys(cells).length === 0) return null
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: "var(--fs-label)", fontWeight: 900, color: "var(--text-muted)", marginBottom: 5 }}>
        この演奏の音程マップ（実測）
      </div>
      <FingerboardPanel cells={cells} details={details} />
    </div>
  )
}
