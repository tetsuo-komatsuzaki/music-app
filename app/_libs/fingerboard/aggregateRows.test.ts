/**
 * aggregateRows.test.ts — 指板ヒートマップ・速い指の切り替え の純関数部 (ノート属性ストア版)。
 */
import { describe, it, expect } from "vitest"
import type { DetailRow, ProfileRow } from "../noteStore"
import { profileCell, aggregateHeatmapRows } from "./aggregate"
import { cellId } from "./geometry"
import { fastSwitchRows } from "../fastSwitch"

let nextId = 1
function P(pitch: string, string1: string, o: Partial<ProfileRow> = {}): ProfileRow {
  return {
    id: nextId++, noteCount: 1, pitch1: pitch, pitch2: "none", pitch3: "none", pitch4: "none",
    string1, finger1: 1, noteType1: "quarter", dotted1: false, durationBeats1: 1, position: 1,
    techSlur: false, techPortato: false, techStaccato: false, techBowStaccato: false, techSpiccato: false,
    techRicochet: false, techPizzicato: false, techTremolo: false, techVibrato: false, techTrill: false,
    techMordent: false, techGlissando: false, techHarmonic: false,
    tupletActual: 0, tupletNormal: 0, onBeat: true, chordCont: false, restBefore: 0, ...o,
  }
}
function row(cur: ProfileRow, i: number, o: Partial<DetailRow> = {}): DetailRow {
  return {
    performanceId: "p", noteIndex: i, pitchOk: true, startOk: true, evaluationStatus: "evaluated",
    expectedStartSec: i * 0.5, noteName: cur.pitch1, pitchCentsError: 0, expectedPitchHz: 440, cur, prev: null, ...o,
  }
}

describe("profileCell ・ かたち → 弦/半音セル", () => {
  it("弦と音名から枠番号を出す ・ 開放弦は 0", () => {
    expect(profileCell(P("A4", "A"))).toMatchObject({ s: "A", n: 0, midi: 69 })
    expect(profileCell(P("F#4", "D"))).toMatchObject({ s: "D", n: 4 })
    expect(profileCell(P("Bb4", "A"))).toMatchObject({ s: "A", n: 1 })
  })
  it("弦不明・音名不明・指板の外は null ・ ポジション不明と指不明は null に落とす", () => {
    expect(profileCell(P("A4", "unknown"))).toBeNull()
    expect(profileCell(P("unknown", "A"))).toBeNull()
    expect(profileCell(P("C3", "G"))).toBeNull() // 開放より下
    expect(profileCell(P("A4", "A", { position: -1, finger1: -1 }))).toMatchObject({ position: null, finger: null })
  })
})

describe("aggregateHeatmapRows", () => {
  const e = P("E5", "A", { finger1: 4 }) // A線 7枠
  it("向きつきのミスだけ数える ・ 5音未満のセルは返さない ・ 判定不能は除外", () => {
    const rows = [
      row(e, 0, { pitchOk: false, pitchCentsError: 30 }),
      row(e, 1, { pitchOk: false, pitchCentsError: 25 }),
      row(e, 2, { pitchOk: false, pitchCentsError: null }), // 向き不明のミス: n には入るが高低に入らない
      row(e, 3), row(e, 4), row(e, 5, { pitchOk: null }),
    ]
    const h = aggregateHeatmapRows(rows)
    expect(Object.keys(h.cells)).toEqual([cellId("A", 7)])
    expect(h.details[cellId("A", 7)]).toMatchObject({ n: 5, high: 2, low: 0, kana: "ミ" })
    expect(h.perfCount).toBe(1)
    const few = aggregateHeatmapRows(rows.slice(0, 4))
    expect(Object.keys(few.cells)).toEqual([])
  })
  it("遷移元は同じ演奏の直前の音 ・ ポジションが変われば札はシフト ・ 演奏が変われば切る", () => {
    const a = P("A4", "A", { position: 1, finger1: 0 })
    const c = P("C#5", "A", { position: 3, finger1: 1 })
    const rows: DetailRow[] = []
    for (let k = 0; k < 3; k++) {
      rows.push(row(a, 2 * k, { performanceId: `p${k}` }), row(c, 2 * k + 1, { performanceId: `p${k}`, pitchOk: false, pitchCentsError: -20 }))
    }
    rows.push(row(c, 0, { performanceId: "p3", pitchOk: false, pitchCentsError: -20 }), row(c, 1, { performanceId: "p3" }))
    const h = aggregateHeatmapRows(rows)
    const d = h.details[cellId("A", 4)]
    expect(d).toBeDefined()
    expect(d.n).toBe(5)
    expect(d.low).toBe(4)
    const fromA = d.transitions.find((t) => t.from?.s === "A" && t.from?.n === 0)
    expect(fromA).toMatchObject({ badge: "1st→3rd", badgeKind: "shift", n: 3, miss: 3, dir: "low" })
    expect(fromA?.fromLabel).toBe("ラ・A線・開放")
    expect(d.shiftSplit).toMatchObject({ after: { n: 3, miss: 3 }, normal: { n: 1, miss: 0 } })
    expect(d.positions.map((p) => p.position)).toEqual([3])
    expect(h.perfCount).toBe(4)
  })
})

describe("fastSwitchRows", () => {
  const b = P("B4", "A", { finger1: 1 }), c = P("C#5", "A", { finger1: 2 }), open = P("A4", "A", { finger1: 0 })
  it("前の音からの実時間で帯に入れる ・ 開放弦と同音連続と演奏の切れ目は除く", () => {
    const rows: DetailRow[] = []
    for (let k = 0; k < 25; k++) {
      // 0.2秒間隔 B→C# (0.3秒未満の帯) ・ C#→C# (同音・除く) ・ C#→A開放 (除く)
      rows.push(row(b, 4 * k, { expectedStartSec: k * 10 }))
      rows.push(row(c, 4 * k + 1, { expectedStartSec: k * 10 + 0.2, pitchOk: k % 5 !== 0 }))
      rows.push(row(c, 4 * k + 2, { expectedStartSec: k * 10 + 0.4 }))
      rows.push(row(open, 4 * k + 3, { expectedStartSec: k * 10 + 0.6 }))
    }
    const d = fastSwitchRows(rows)
    expect(d.bands[0]).toEqual({ label: "0.3秒未満", notes: 25, pitchPct: 80, timingPct: 100 })
    // 開放弦 A → 次の周回の B (押弦音・9.4秒あき) は「1.0秒以上」の帯に入る (除外は「開放弦が今の音」のときだけ)
    expect(d.bands[3]).toEqual({ label: "1.0秒以上", notes: 24, pitchPct: 100, timingPct: 100 })
    expect(d.bands[1].notes + d.bands[2].notes).toBe(0)
    expect(d.perfCount).toBe(1)
  })
  it("20音に届かない帯は成功率 null ・ 別の演奏にまたぐ組は数えない", () => {
    const rows = [row(b, 0, { performanceId: "x", expectedStartSec: 0 }), row(c, 1, { performanceId: "y", expectedStartSec: 0.2 })]
    const d = fastSwitchRows(rows)
    expect(d.bands.every((x) => x.notes === 0 && x.pitchPct === null)).toBe(true)
    expect(d.perfCount).toBe(0)
  })
})
