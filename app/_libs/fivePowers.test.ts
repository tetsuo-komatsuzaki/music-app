import { describe, it, expect } from "vitest"
import { fivePowersFromRows } from "./fivePowers"
import { comparePowers, scaleWindows, type FivePowers } from "./fivePowersCore"
import type { DetailRow, ProfileRow } from "./noteStore"

let nextId = 1
function P(pitch: string, o: Partial<ProfileRow> = {}): ProfileRow {
  return {
    id: nextId++, noteCount: 1, pitch1: pitch, pitch2: "none", pitch3: "none", pitch4: "none",
    string1: "D", finger1: 1, noteType1: "quarter", dotted1: false, durationBeats1: 1, position: 1,
    techSlur: false, techPortato: false, techStaccato: false, techBowStaccato: false, techSpiccato: false,
    techRicochet: false, techPizzicato: false, techTremolo: false, techVibrato: false, techTrill: false,
    techMordent: false, techGlissando: false, techHarmonic: false,
    tupletActual: 0, tupletNormal: 0, onBeat: true, chordCont: false, restBefore: 0, ...o,
  }
}
function row(i: number, pitchOk: boolean, startOk: boolean, cur: ProfileRow, prev: ProfileRow | null): DetailRow {
  return { performanceId: "p1", noteIndex: i, pitchOk, startOk, evaluationStatus: "evaluated", expectedStartSec: i * 0.5, cur, prev }
}
const pw = (v: Partial<Record<string, number | null>>, perfCount = 1): FivePowers => ({
  values: { pitch: null, rhythm: null, fast: null, position: null, technique: null, ...v } as FivePowers["values"],
  notes: { pitch: 0, rhythm: 0, fast: 0, position: 0, technique: 0 }, perfCount,
})

describe("fivePowersFromRows", () => {
  it("音程とリズムは判定できた音の割合 ・ 10 音未満の軸は null", () => {
    const rows: DetailRow[] = []
    let prev: ProfileRow | null = null
    for (let i = 0; i < 20; i++) {
      const cur = P(i % 2 ? "A4" : "B4", { techSlur: i < 4 })
      rows.push(row(i, i % 4 !== 0, i % 5 !== 0, cur, prev))
      prev = cur
    }
    const r = fivePowersFromRows(rows)
    expect(r.values.pitch).toBe(75)
    expect(r.values.rhythm).toBe(80)
    expect(r.values.technique).toBeNull()   // スラーの音は 4 音だけ
    expect(r.values.position).toBeNull()    // 移動なし
    expect(r.perfCount).toBe(1)
  })
  it("空なら全部 null", () => {
    expect(fivePowersFromRows([]).values.pitch).toBeNull()
  })
})

describe("comparePowers", () => {
  it("測れない軸は両方 0 に落とし、録音なし に入れる", () => {
    const c = comparePowers("w", pw({ pitch: 61, rhythm: 70, fast: 87, position: null, technique: 55 }), pw({ pitch: 66, rhythm: 64, fast: 80, position: 52, technique: 58 }))
    expect(c.chart.now.position).toBe(0)
    expect(c.chart.past!.position).toBe(0)
    expect(c.chart.missing).toEqual(["position"])
  })
  it("結論は いちばん伸びた力 と いちばん下がった力", () => {
    const c = comparePowers("w", pw({ pitch: 61, rhythm: 70, fast: 87, position: 40, technique: 55 }), pw({ pitch: 66, rhythm: 64, fast: 80, position: 52, technique: 58 }))
    expect(c.conclusion.best).toBe("fast")
    expect(c.conclusion.weakest).toBe("position")
    expect(c.conclusion.text).toContain("速い指 が先週より伸びた (+7)")
    expect(c.conclusion.text).toContain("ポジション が下がった (-12)")
  })
  it("相手に録音が無ければ 相手は null で「録音なし」の文", () => {
    const c = comparePowers("w", pw({ pitch: 61, rhythm: 70 }), pw({}, 0))
    expect(c.past).toBeNull()
    expect(c.chart.past).toBeNull()
    expect(c.conclusion.text).toContain("先週は録音なし")
    expect(c.conclusion.weakest).toBe("pitch")
  })
  it("下がった力が無ければ いちばん低い力 を言う", () => {
    const c = comparePowers("m", pw({ pitch: 70, rhythm: 72 }), pw({ pitch: 60, rhythm: 70 }))
    expect(c.conclusion.text).toContain("いちばん低いのは 音程 (70%)")
  })
})

describe("scaleWindows", () => {
  it("先週の自分 = 直近 7 日 と その前の 7 日、はじめの自分 = 最初の 5 回", () => {
    const now = new Date("2026-09-06T00:00:00Z")
    const w = scaleWindows("w", now)
    expect(w.now.since.toISOString()).toBe("2026-08-30T00:00:00.000Z")
    expect("since" in w.past && w.past.since.toISOString()).toBe("2026-08-23T00:00:00.000Z")
    expect(scaleWindows("f", now).past).toEqual({ firstN: 5 })
  })
})
