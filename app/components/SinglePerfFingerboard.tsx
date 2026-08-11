"use client"

// 演奏直後の「実測塗り」指板 (2026-08-11 Tetsuo確定):
// 1回の演奏では統計判定 (n_min=5) をせず、その演奏で高かった音=赤 / 低かった音=青 /
// 合っていた音=緑 をそのまま塗る。弾いていない音・判定不能の音は白。
// 同じセルを複数回弾いて高低が混ざったら紫 (両方にブレ)。
// 2026-08-11 改良: 演奏履歴カード内で小さすぎたため縦積み(stack)で全幅表示にし、
// タップ詳細にもこの演奏の遷移 (どこからの移動でずれたか・シフト/移弦バッジ) を出す。
import { useMemo } from "react"
import FingerboardPanel from "./FingerboardPanel"
import { posLabel, type HeatCellOut, type CellDetail, type TransitionRow } from "@/app/_libs/fingerboard/heatmapTypes"

export type FingerNote = { s: "G" | "D" | "A" | "E"; n: number; p?: number | null }

type CompNote = { note_index?: number; pitch_ok?: boolean | null; pitch_cents_error?: number | null }

const OPEN_MIDI = { G: 55, D: 62, A: 69, E: 76 } as const
const KANA = ["ド", "ド♯", "レ", "レ♯", "ミ", "ファ", "ファ♯", "ソ", "ソ♯", "ラ", "ラ♯", "シ"] as const
const kanaOf = (fn: FingerNote) => KANA[(OPEN_MIDI[fn.s] + fn.n) % 12]

export default function SinglePerfFingerboard({
  fingerNotes, comparison,
}: {
  /** note_index → 指板セル (musicxml_skill_info 由来・サーバーで構築) */
  fingerNotes: Record<number, FingerNote>
  comparison: CompNote[]
}) {
  const { cells, details } = useMemo(() => {
    type TransAgg = { n: number; miss: number; high: number; low: number; label: string; badge: string | null; badgeKind: "shift" | "info" | null }
    const agg = new Map<string, { s: string; midi: number; n: number; ok: number; high: number; low: number; maxAbs: number; trans: Map<string, TransAgg> }>()
    const sorted = [...comparison].filter((r) => r.note_index != null).sort((a, b) => a.note_index! - b.note_index!)
    for (const r of sorted) {
      if (r.pitch_ok == null) continue
      const fn = fingerNotes[r.note_index!]
      if (!fn) continue
      const id = `cell-${fn.s}-${String(fn.n).padStart(2, "0")}`
      let e = agg.get(id)
      if (!e) { e = { s: fn.s, midi: OPEN_MIDI[fn.s] + fn.n, n: 0, ok: 0, high: 0, low: 0, maxAbs: 0, trans: new Map() }; agg.set(id, e) }
      const cents = r.pitch_cents_error
      const isHigh = r.pitch_ok === false && cents != null && cents > 0
      const isLow = r.pitch_ok === false && cents != null && cents < 0
      if (r.pitch_ok === false && !isHigh && !isLow) continue // 向き不明のミスは塗らない
      e.n++
      if (r.pitch_ok) e.ok++
      else if (isHigh) { e.high++; e.maxAbs = Math.max(e.maxAbs, Math.abs(cents!)) }
      else { e.low++; e.maxAbs = Math.max(e.maxAbs, Math.abs(cents!)) }
      // この演奏の遷移 (直前の音番号が連続している場合のみ。楽譜上の並びで判定)
      const prev = fingerNotes[r.note_index! - 1]
      const fromKey = prev ? `${prev.s}:${prev.n}` : "__start__"
      let label = "弾き始め・休符のあと"
      let badge: string | null = null
      let badgeKind: "shift" | "info" | null = null
      if (prev) {
        const shift = prev.p != null && fn.p != null && prev.p !== fn.p
        label = `${kanaOf(prev)}・${prev.s}線${prev.n === 0 ? "・開放" : prev.p != null ? `・${posLabel(prev.p)}` : ""}`
        if (shift) { badge = `${posLabel(prev.p!)}→${posLabel(fn.p!)}`; badgeKind = "shift" }
        else if (prev.s !== fn.s) { badge = "移弦のみ"; badgeKind = "info" }
        else { badge = "同じ弦"; badgeKind = "info" }
      }
      let t = e.trans.get(fromKey)
      if (!t) { t = { n: 0, miss: 0, high: 0, low: 0, label, badge, badgeKind }; e.trans.set(fromKey, t) }
      t.n++
      if (isHigh) { t.miss++; t.high++ }
      if (isLow) { t.miss++; t.low++ }
    }
    const cells: Record<string, HeatCellOut> = {}
    const details: Record<string, CellDetail> = {}
    for (const [id, e] of agg) {
      if (e.n <= 0) continue
      const status = e.high > 0 && e.low > 0 ? "unstable" : e.high > 0 ? "sharp" : e.low > 0 ? "flat" : "stable"
      const level = status === "stable" ? 0 : e.maxAbs >= 75 ? 2 : 1
      cells[id] = { status, level: level as 0 | 1 | 2 }
      const transitions: TransitionRow[] = [...e.trans.values()]
        .map((t) => ({
          fromLabel: t.label, badge: t.badge, badgeKind: t.badgeKind, n: t.n, miss: t.miss,
          dir: (t.high >= 2 * t.low ? "high" : t.low >= 2 * t.high ? "low" : "mixed") as "high" | "low" | "mixed",
        }))
        .sort((a, b) => b.miss / b.n - a.miss / a.n)
        .slice(0, 4)
      details[id] = {
        n: e.n, high: e.high, low: e.low, kana: KANA[e.midi % 12],
        positions: [], shiftSplit: null, transitions,
      }
    }
    return { cells, details }
  }, [fingerNotes, comparison])

  if (Object.keys(cells).length === 0) return null
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: "var(--fs-label)", fontWeight: 900, color: "var(--text-muted)", marginBottom: 5 }}>
        この演奏の音程マップ
      </div>
      <FingerboardPanel cells={cells} details={details} stack />
    </div>
  )
}
