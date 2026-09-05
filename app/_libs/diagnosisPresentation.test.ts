/**
 * diagnosisPresentation.test.ts — 演奏直後の診断 (ノート属性ストア版)。
 * 明細1回ぶんから、音程側2・リズム側2の束、内訳文、verdict が仕様どおりに出るか。
 */
import { describe, it, expect } from "vitest"
import type { DetailRow, ProfileRow, NoteStoreSource } from "./noteStore"
import { buildDiagnosisView, buildBreakdown, weakestBundles, DIAG_MIN_TARGET, DIAG_SHELVES } from "./diagnosisPresentation"

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
/** E4→F#4 を4回、F#4→G#4 を4回 含む8音 + 曲頭 */
const PIECE = [E4, F4, G4, E4, F4, G4, E4, F4, G4, E4, F4, G4]

function src(rows: DetailRow[], material: { itemId: string; count: number } | null = null): NoteStoreSource {
  return { fetchDetail: async () => rows, findMaterial: async () => material }
}
const deps = (s: NoteStoreSource) => ({ source: s, materialOf: async (id: string) => ({ id, title: `教材${id}`, category: "etude", star: 2, keyTonic: "E", keyMode: "major" }) })
const input = { kind: "score" as const, performanceId: "p", userId: "u", targetId: "s", star: 3 }

describe("演奏直後の診断", () => {
  it("明細が無ければ unavailable", async () => {
    const v = await buildDiagnosisView(input, deps(src([])))
    expect(v.verdict).toBe("unavailable"); expect(v.slots).toEqual([])
  })
  it("読みに失敗しても unavailable ・ 落ちない", async () => {
    const s: NoteStoreSource = { fetchDetail: async () => { throw new Error("x") }, findMaterial: async () => null }
    expect((await buildDiagnosisView(input, deps(s))).verdict).toBe("unavailable")
  })
  it("全部合っていて崩壊が無ければ perfect", async () => {
    const v = await buildDiagnosisView({ ...input, collapse: { collapsed: [], is_clean: true } }, deps(src(perf(PIECE))))
    expect(v.verdict).toBe("perfect"); expect(v.totals).toEqual({ played: 12, pitchMiss: 0, rhythmMiss: 0 })
  })
  it("弱点は無いがミスが散発なら no_specific ・ 足切り3音未満の束はスロットにならない", async () => {
    const rows = perf([E4, F4, G4, P("A4"), P("B4"), P("C5"), P("D5"), P("E5"), P("F5"), P("G5"), P("A5")], [1, 3, 5])
    const v = await buildDiagnosisView(input, deps(src(rows)))
    expect(v.verdict).toBe("no_specific"); expect(v.slots).toEqual([])
  })
  it("崩壊があれば perfect にならない", async () => {
    const v = await buildDiagnosisView({ ...input, collapse: { collapsed: [{ measure: 3 }], is_clean: false } }, deps(src(perf(PIECE))))
    expect(v.verdict).toBe("no_specific"); expect(v.collapse?.isClean).toBe(false)
  })
  it("音程側は音程のミスで、リズム側は入りのミスで束ねる ・ 各側2件まで", async () => {
    const rows = perf(PIECE, [1, 4, 7], [2, 5, 8, 11])
    const v = await buildDiagnosisView(input, deps(src(rows)))
    expect(v.verdict).toBe("weakness")
    const pitch = v.slots.filter((s) => s.tree === "pitch"), rhythm = v.slots.filter((s) => s.tree === "rhythm")
    expect(pitch[0].subtaskId).toBe("pitch|E4|F#4"); expect(pitch[0].miss).toBe(3); expect(pitch[0].target).toBe(4)
    expect(rhythm[0].subtaskId).toBe("pitch|F#4|G#4"); expect(rhythm[0].miss).toBe(4)
    expect(pitch.length).toBeLessThanOrEqual(2); expect(rhythm.length).toBeLessThanOrEqual(2)
    expect(pitch[0].subtaskName).toBe("ミ→ファ♯ の移動")
  })
  it("教材が付く ・ 無ければ noStock", async () => {
    const rows = perf(PIECE, [1, 4, 7])
    const withMat = await buildDiagnosisView(input, deps(src(rows, { itemId: "m1", count: 5 })))
    expect(withMat.slots[0].materials.map((m) => m.id)).toEqual(["m1"]); expect(withMat.slots[0].noStock).toBe(false)
    const noMat = await buildDiagnosisView(input, deps(src(rows)))
    expect(noMat.slots[0].materials).toEqual([]); expect(noMat.slots[0].noStock).toBe(true)
  })
  it("単位は演奏1回 ・ performanceId で絞る", async () => {
    const calls: unknown[] = []
    const s: NoteStoreSource = { fetchDetail: async (u) => { calls.push(u); return [] }, findMaterial: async () => null }
    await buildDiagnosisView(input, deps(s))
    expect(calls[0]).toEqual({ userId: "u", performanceId: "p", target: { type: "score", id: "s" } })
  })
  it("足切りは 3音、棚は診断用", () => {
    expect(DIAG_MIN_TARGET).toBe(3)
    expect(DIAG_SHELVES.technique).toEqual(["etude", "bowing"])
  })
})

describe("内訳文 ・ buildBreakdown", () => {
  it("移弦が6割以上なら一言。音程の束では移弦を言わない", () => {
    const a = P("E4", { string1: "D" }), b = P("A4", { string1: "A" })
    const missed: DetailRow[] = [0, 1, 2].map((i) => ({ performanceId: "p", noteIndex: i, pitchOk: false, startOk: true, evaluationStatus: "pitch_miss", expectedStartSec: i, cur: b, prev: a }))
    expect(buildBreakdown("technique|slur", missed)).toBe("うち3回は移弦を伴う音")
    expect(buildBreakdown("pitch|E4|A4", missed)).toBeNull()
  })
  it("奏法が6割以上なら一言。わざの束では奏法を言わない", () => {
    const s = P("E4", { techSlur: true })
    const missed: DetailRow[] = [0, 1].map((i) => ({ performanceId: "p", noteIndex: i, pitchOk: false, startOk: true, evaluationStatus: "pitch_miss", expectedStartSec: i, cur: s, prev: E4 }))
    expect(buildBreakdown("pitch|E4|E4", missed)).toBe("うち2回はスラーの音")
    expect(buildBreakdown("technique|slur", missed)).toBeNull()
  })
  it("2回未満や6割未満なら何も言わない", () => {
    const s = P("E4", { techSlur: true })
    expect(buildBreakdown("pitch|E4|E4", [{ performanceId: "p", noteIndex: 0, pitchOk: false, startOk: true, evaluationStatus: "pitch_miss", expectedStartSec: 0, cur: s, prev: E4 }])).toBeNull()
    const mixed: DetailRow[] = [s, E4, E4, E4].map((c, i) => ({ performanceId: "p", noteIndex: i, pitchOk: false, startOk: true, evaluationStatus: "pitch_miss", expectedStartSec: i, cur: c, prev: E4 }))
    expect(buildBreakdown("pitch|E4|E4", mixed)).toBeNull()
  })
})

describe("weakestBundles", () => {
  it("成功率の低い順、同率は弾いた回数の多い順", () => {
    const rows = perf(PIECE, [1, 4, 7, 2])
    const w = weakestBundles(rows, "pitch", 2, 3)
    expect(w.map((x) => x.key)).toEqual(["pitch|E4|F#4", "pitch|F#4|G#4"])
  })
})
