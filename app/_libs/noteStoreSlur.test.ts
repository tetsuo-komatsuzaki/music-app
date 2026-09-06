/**
 * noteStoreSlur.test.ts — スラーの中の移動の束 (2026-09-06 Tetsuo確定)。
 *   同じ音数のスラー → 前後 1 音 → スラーの中の同じ移動 → 移動だけ、の順で緩める。最初の音 (弓を返す音) は数えない。
 */
import { describe, it, expect } from "vitest"
import { groupKeysOf, parseKey, relaxedKeys, fallbackKey, type DetailRow, type ProfileRow } from "./noteStore"
import { focusName } from "./personalReco"

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
const row = (cur: ProfileRow, prev: ProfileRow | null, slur: { len: number; pos: number } | null): DetailRow => ({
  performanceId: "p", noteIndex: 1, pitchOk: false, startOk: true, evaluationStatus: "evaluated", expectedStartSec: 1,
  cur, prev, slurLen: slur?.len ?? null, slurPos: slur?.pos ?? null,
})

describe("スラーの中の移動の束", () => {
  it("2 音目以降は slur|N|prev|cur。最初の音は数えない", () => {
    const g = P("G4"), a = P("A4", { techSlur: true })
    expect(groupKeysOf("technique", row(a, g, { len: 4, pos: 1 }), null)).toEqual(["slur|4|G4|A4"])
    expect(groupKeysOf("technique", row(a, g, { len: 4, pos: 0 }), null)).toEqual([])
  })
  it("スラーの情報が無い古い並びは従来の technique|slur|音", () => {
    const a = P("A4", { techSlur: true })
    expect(groupKeysOf("technique", row(a, P("G4"), null), null)).toEqual(["technique|slur|A4"])
  })
  it("ほかのわざはこれまでどおり", () => {
    const a = P("A4", { techStaccato: true, techSlur: true })
    expect(groupKeysOf("technique", row(a, P("G4"), { len: 3, pos: 2 }), null)).toEqual(["slur|3|G4|A4", "technique|staccato|A4"])
  })
  it("段階的に緩める: 前後 1 音 → 移動だけ", () => {
    expect(parseKey("slur|4|G4|A4")).toEqual({ tab: "slur", a: "4", b: "G4", c: "A4" })
    expect(relaxedKeys("slur|4|G4|A4")).toEqual([["slur|3|G4|A4", "slur|5|G4|A4"]])
    expect(relaxedKeys("slur|2|G4|A4")).toEqual([["slur|3|G4|A4"]])
    expect(fallbackKey("slur|4|G4|A4")).toBe("pitch|G4|A4")
    expect(relaxedKeys("pitch|G4|A4")).toEqual([])
    expect(fallbackKey("pitch|G4|A4")).toBeNull()
  })
  it("見出し", () => {
    expect(focusName("slur|4|G4|A4")).toBe("4音スラーの中でソからラへ")
  })
})
