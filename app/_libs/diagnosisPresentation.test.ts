/**
 * diagnosisPresentation.test.ts — 演奏ごとの弱点行 (先生画面用・ノート属性ストア版)。
 */
import { describe, it, expect } from "vitest"
import type { DetailRow, ProfileRow, NoteStoreSource } from "./noteStore"
import { weakestBundles, weakSlotsFromRows, weakSlotsByPerformance, bundleName, DIAG_MIN_TARGET } from "./diagnosisPresentation"

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
function perf(profiles: ProfileRow[], miss: number[] = [], timingMiss: number[] = []): DetailRow[] {
  return profiles.map((p, i) => ({
    performanceId: "p", noteIndex: i, pitchOk: !miss.includes(i), startOk: !timingMiss.includes(i),
    evaluationStatus: miss.includes(i) ? "pitch_miss" : timingMiss.includes(i) ? "timing_miss" : "ok",
    expectedStartSec: i, cur: p, prev: i > 0 ? profiles[i - 1] : null,
  }))
}
const E4 = P("E4"), F4 = P("F#4", { finger1: 2 }), G4 = P("G#4", { finger1: 3 })
/** E4→F#4 を4回、F#4→G#4 を4回 含む12音 */
const PIECE = [E4, F4, G4, E4, F4, G4, E4, F4, G4, E4, F4, G4]

describe("weakestBundles", () => {
  it("成功率の低い順、同率は弾いた回数の多い順 ・ 足切り未満は入らない", () => {
    const rows = perf(PIECE, [1, 4, 7, 2])
    const w = weakestBundles(rows, "pitch", 2, DIAG_MIN_TARGET)
    expect(w.map((x) => x.key)).toEqual(["pitch|E4|F#4", "pitch|F#4|G#4"])
    expect(w[0]).toEqual({ key: "pitch|E4|F#4", miss: 3, target: 4 })
    // 11音の上行音階: 同じ移動は1回ずつ → 足切り3に届かず空
    const scale = perf([E4, F4, G4, P("A4"), P("B4"), P("C5"), P("D5"), P("E5"), P("F5"), P("G5"), P("A5")], [1, 3, 5])
    expect(weakestBundles(scale, "pitch", 2, DIAG_MIN_TARGET)).toEqual([])
  })
  it("音程側は音程のミス、リズム側は入りのミスで束ねる", () => {
    const rows = perf(PIECE, [1, 4, 7], [2, 5, 8, 11])
    expect(weakestBundles(rows, "pitch", 2, 3)[0]).toMatchObject({ key: "pitch|E4|F#4", miss: 3 })
    expect(weakestBundles(rows, "timing", 2, 3)[0]).toMatchObject({ key: "pitch|F#4|G#4", miss: 4 })
  })
  it("束の見出し", () => {
    expect(bundleName("pitch|E4|F#4")).toBe("ミ→ファ♯ の移動")
    expect(bundleName("technique|slur|G4")).toBe("スラーのソ")
    expect(bundleName("position|1|3")).toBe("左手を第1から第3ポジションへ移す")
    expect(bundleName("fingering|E4|F#4")).toBe("ミ→ファ♯ の速い切り替え")
  })
})

describe("先生画面の弱点行 ・ weakSlotsFromRows / weakSlotsByPerformance", () => {
  it("音程側→リズム側の順に、足切り3で、limit 件まで", () => {
    const rows = perf(PIECE, [1, 4, 7], [2, 5, 8, 11])
    const slots = weakSlotsFromRows(rows, 4)
    expect(slots[0]).toEqual({ name: "ミ→ファ♯ の移動", tree: "音程", miss: 3, target: 4 })
    expect(slots.find((s) => s.tree === "リズム")).toEqual({ name: "ファ♯→ソ♯ の移動", tree: "リズム", miss: 4, target: 4 })
    expect(weakSlotsFromRows(rows, 1)).toHaveLength(1)
    expect(weakSlotsFromRows(perf(PIECE), 4)).toEqual([])
  })
  it("明細を1回引いて演奏ごとに分ける ・ 読みに失敗したら空", async () => {
    const a = perf(PIECE, [1, 4, 7]).map((r) => ({ ...r, performanceId: "a" }))
    const b = perf(PIECE).map((r) => ({ ...r, performanceId: "b" }))
    const calls: unknown[] = []
    const s: NoteStoreSource = { fetchDetail: async (u) => { calls.push(u); return [...a, ...b] }, findMaterial: async () => null }
    const m = await weakSlotsByPerformance("u", { lastN: 5 }, 3, s)
    expect(calls).toEqual([{ userId: "u", lastN: 5 }])
    expect(m.get("a")?.[0]?.name).toBe("ミ→ファ♯ の移動")
    expect(m.get("b")).toEqual([])
    const bad: NoteStoreSource = { fetchDetail: async () => { throw new Error("x") }, findMaterial: async () => null }
    expect((await weakSlotsByPerformance("u", {}, 3, bad)).size).toBe(0)
  })
})
