/**
 * diagnosisPresentation.test.ts — 演奏直後の診断 (ノート属性ストア版)。
 * 明細1回ぶんから、音程側2・リズム側2の束、内訳文、verdict が仕様どおりに出るか。
 */
import { describe, it, expect } from "vitest"
import type { DetailRow, ProfileRow, NoteStoreSource } from "./noteStore"
import { buildDiagnosisView, buildBreakdown, weakestBundles, weakSlotsFromRows, weakSlotsByPerformance, coarseKeysOf, coarseName, DIAG_MIN_TARGET, DIAG_SHELVES, OVERALL_MISS_RATE_MIN } from "./diagnosisPresentation"

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
  it("細かい束が足切りに届かない短い曲は、粗い束 (移動の種類・弦) で診断する ・ F21 案B", async () => {
    // 11音の上行音階: 同じ移動は1回ずつ (細かい束は全部 1/1) だが「同じ弦で上へ進む移動」は 10回
    const rows = perf([E4, F4, G4, P("A4"), P("B4"), P("C5"), P("D5"), P("E5"), P("F5"), P("G5"), P("A5")], [1, 3, 5])
    const basic = { id: "sc1", title: "音階", category: "scale", star: 1, keyTonic: "D", keyMode: "major" }
    const v = await buildDiagnosisView(input, { ...deps(src(rows)), basicMaterials: async () => [basic] })
    expect(v.verdict).toBe("weakness")
    const pitch = v.slots.filter((s) => s.tree === "pitch")
    expect(pitch[0]).toMatchObject({ subtaskId: "coarse|move|same_up", subtaskName: "同じ弦で上の音へ進む移動", coarse: true, miss: 3, target: 10 })
    expect(pitch[0].materials).toEqual([basic])
    expect(v.slots.some((s) => s.tree === "rhythm")).toBe(false)
    // 粗い束はミス1回では出ない (COARSE_MIN_MISS=2)
    const one = await buildDiagnosisView(input, { ...deps(src(perf([E4, F4, G4, P("A4"), P("B4"), P("C5"), P("D5"), P("E5"), P("F5"), P("G5"), P("A5")], [3]))), basicMaterials: async () => [basic] })
    expect(one.verdict).toBe("perfect")
  })
  it("粗い束も無く散発なら no_specific ・ 粗い束の教材が無ければ noStock", async () => {
    // 弦が不明の4音でミス1 (25%): 細かい束も粗い束も作れず、半分未満なので no_specific
    const rows = perf([P("E4", { string1: "unknown" }), P("F#4", { string1: "unknown" }), P("G#4", { string1: "unknown" }), P("A4", { string1: "unknown" })], [1])
    const v = await buildDiagnosisView(input, deps(src(rows)))
    expect(v.verdict).toBe("no_specific"); expect(v.slots).toEqual([])
    const rows2 = perf([E4, F4, G4, P("A4"), P("B4"), P("C5"), P("D5"), P("E5"), P("F5"), P("G5"), P("A5")], [1, 3, 5])
    const v2 = await buildDiagnosisView(input, deps(src(rows2)))
    expect(v2.slots[0].noStock).toBe(true)
  })
  it("束が無く半分以上外れていれば overall ・ ★と調の基礎練を2件 ・ F21 案A", async () => {
    // 4音 (粗い束も足切り3に届かない) で 3音ミス
    const rows = perf([E4, F4, G4, P("A4")], [0, 1, 2])
    const calls: unknown[] = []
    const basics = [{ id: "sc", title: "音階", category: "scale", star: 2, keyTonic: "E", keyMode: "major" }, { id: "ar", title: "アルペジオ", category: "arpeggio", star: 2, keyTonic: "E", keyMode: "major" }]
    const v = await buildDiagnosisView({ ...input, key: { tonic: "E", mode: "major" } }, {
      ...deps(src(rows)), userStarOf: async () => 2, basicMaterials: async (key, star, limit) => { calls.push([key, star, limit]); return basics },
    })
    expect(v.verdict).toBe("overall")
    expect(v.overall?.materials).toEqual(basics)
    expect(calls).toEqual([[{ tonic: "E", mode: "major" }, 2, 2]]) // その人の★2 (曲の★3 ではない) と曲の調
    expect(v.totals).toEqual({ played: 4, pitchMiss: 3, rhythmMiss: 0 })
    expect(OVERALL_MISS_RATE_MIN).toBe(0.5)
  })
  it("その人の★が無ければ曲の★で基礎練を探す", async () => {
    const rows = perf([E4, F4, G4, P("A4")], [0, 1, 2])
    const calls: unknown[] = []
    await buildDiagnosisView(input, { ...deps(src(rows)), basicMaterials: async (_k, star) => { calls.push(star); return [] } })
    expect(calls).toEqual([3])
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

describe("先生画面の弱点行 ・ weakSlotsFromRows / weakSlotsByPerformance", () => {
  it("音程側→リズム側の順に、診断と同じ束と足切りで、limit 件まで", () => {
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

describe("粗い束 ・ coarseKeysOf", () => {
  it("弦の関係 × 上下、同じ音の移弦、弦ごと", () => {
    const d = P("D4", { string1: "D" }), a = P("A4", { string1: "A" }), a2 = P("A4", { string1: "D" }), f = P("F#4", { string1: "D" })
    const row = (cur: ProfileRow, prev: ProfileRow | null): DetailRow => ({ performanceId: "p", noteIndex: 0, pitchOk: true, startOk: true, evaluationStatus: "evaluated", expectedStartSec: 0, cur, prev })
    expect(coarseKeysOf(row(f, d))).toEqual(["coarse|string|D", "coarse|move|same_up"])
    expect(coarseKeysOf(row(a, d))).toEqual(["coarse|string|A", "coarse|move|adj_up"])
    expect(coarseKeysOf(row(d, a))).toEqual(["coarse|string|D", "coarse|move|adj_down"])
    expect(coarseKeysOf(row(a2, a))).toEqual(["coarse|string|D", "coarse|move|unison_cross"])
    expect(coarseKeysOf(row(P("E5", { string1: "E" }), P("G3", { string1: "G" })))).toEqual(["coarse|string|E", "coarse|move|skip_up"])
    expect(coarseKeysOf(row(P("A4", { string1: "unknown" }), d))).toEqual([])
    expect(coarseName("coarse|move|adj_down")).toBe("隣の弦へ下がる移動")
    expect(coarseName("coarse|string|G")).toBe("G線の音")
  })
})
