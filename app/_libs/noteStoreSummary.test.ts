/**
 * noteStoreSummary.test.ts — 明細 → 派生サマリ (per_subtask / noteStats)。
 * 規則は diagnosis._context_suffixes と analyze_performance の noteStats を写したもの。
 */
import { describe, it, expect } from "vitest"
import type { DetailRow, ProfileRow } from "./noteStore"
import { conditionSuffixes, perSubtaskOf, noteStatsOf, derivedSummaryOf, withDerived } from "./noteStoreSummary"

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
function row(cur: ProfileRow, prev: ProfileRow | null, o: Partial<DetailRow> = {}): DetailRow {
  return {
    performanceId: "p", noteIndex: 0, pitchOk: true, startOk: true, evaluationStatus: "evaluated",
    expectedStartSec: 0, noteName: cur.pitch1, pitchCentsError: 0, expectedPitchHz: 440, cur, prev, ...o,
  }
}

describe("conditionSuffixes ・ 条件の名前", () => {
  it("ポジション移動は 1〜4 と 5plus に束ねる ・ 不明なら出さない", () => {
    expect(conditionSuffixes(P("A4", { position: 3 }), P("D4", { position: 1 })).pitchCtx).toContain("posshift_1_3")
    expect(conditionSuffixes(P("A4", { position: 7 }), P("D4", { position: 5 })).pitchCtx).toContain("posshift_5plus_5plus")
    const unk = conditionSuffixes(P("A4", { position: -1 }), P("D4", { position: 1 }))
    expect(unk.pitchCtx.some((s) => s.startsWith("posshift_"))).toBe(false)
    expect(unk.pitchCtx.some((s) => s.startsWith("interval_"))).toBe(false)
    expect(conditionSuffixes(P("A4"), null).pitchCtx.some((s) => s.startsWith("posshift_"))).toBe(false)
  })
  it("重音は構成音の隣接ペアの度数 × 連続/単発", () => {
    const fifth = P("D4", { noteCount: 2, pitch2: "A4" })
    expect(conditionSuffixes(fifth, null).pitchCtx).toContain("double_fifth_single")
    const cont = P("D4", { noteCount: 2, pitch2: "A4", chordCont: true })
    expect(conditionSuffixes(cont, null).pitchCtx).toContain("double_fifth_cont")
    const tenth = P("C4", { noteCount: 2, pitch2: "E5" })
    expect(conditionSuffixes(tenth, null).pitchCtx).toContain("double_other_single")
    const triple = P("G3", { noteCount: 3, pitch2: "D4", pitch3: "B4" })
    expect(conditionSuffixes(triple, null).pitchCtx).toEqual(expect.arrayContaining(["double_fifth_single", "double_sixth_single"]))
  })
  it("わざは13種と1:1", () => {
    const s = conditionSuffixes(P("A4", { techSlur: true, techTrill: true }), null).pitchCtx
    expect(s).toEqual(expect.arrayContaining(["tech_slur", "tech_trill"]))
    expect(s.filter((x) => x.startsWith("tech_")).length).toBe(2)
  })
  it("音の移動は 弦遷移 × 方向 × 距離 ・ 同度の移弦は unison_crossing", () => {
    expect(conditionSuffixes(P("F#4", { string1: "D" }), P("E4", { string1: "D" })).pitchCtx).toContain("interval_same_up_step")
    expect(conditionSuffixes(P("D4", { string1: "D" }), P("A4", { string1: "A" })).pitchCtx).toContain("interval_adj_down_leap")
    expect(conditionSuffixes(P("E5", { string1: "E" }), P("G3", { string1: "G" })).pitchCtx).toContain("interval_skip_up_leap")
    expect(conditionSuffixes(P("A4", { string1: "D" }), P("A4", { string1: "A" })).pitchCtx).toContain("interval_unison_crossing")
    expect(conditionSuffixes(P("A4", { string1: "A" }), P("A4", { string1: "A" })).pitchCtx.some((s) => s.startsWith("interval_"))).toBe(false)
    expect(conditionSuffixes(P("A4", { string1: "unknown" }), P("D4")).pitchCtx.some((s) => s.startsWith("interval_"))).toBe(false)
  })
  it("リズムだけの文脈: 音価 ・ 付点 ・ 連符 ・ 休みの入り", () => {
    const r = conditionSuffixes(P("A4", { noteType1: "eighth", dotted1: true, tupletActual: 3, restBefore: 1.5, onBeat: false }), null).rhythmOnlyCtx
    expect(r).toEqual(["value_eighth", "value_dotted", "tuplet_3", "entry_mid_offbeat"])
    expect(conditionSuffixes(P("A4", { noteType1: "64th" }), null).rhythmOnlyCtx).toEqual(["value_32nd_plus"])
    expect(conditionSuffixes(P("A4", { tupletActual: 9 }), null).rhythmOnlyCtx).toContain("tuplet_7plus")
    expect(conditionSuffixes(P("A4", { tupletActual: 4 }), null).rhythmOnlyCtx.some((s) => s.startsWith("tuplet_"))).toBe(false)
    expect(conditionSuffixes(P("A4", { restBefore: 0.5 }), null).rhythmOnlyCtx).toContain("entry_short_onbeat")
    expect(conditionSuffixes(P("A4", { restBefore: 3 }), null).rhythmOnlyCtx).toContain("entry_long_onbeat")
    expect(conditionSuffixes(P("A4", { noteType1: "unknown" }), null).rhythmOnlyCtx).toEqual([])
  })
})

describe("perSubtaskOf ・ ミスの帰属", () => {
  it("音程の木は pitchOk、リズムの木は startOk、not_detected は両方", () => {
    const slur = P("A4", { techSlur: true })
    const rows = [
      row(slur, null, { pitchOk: false }),
      row(slur, null, { startOk: false }),
      row(slur, null, { evaluationStatus: "not_detected", pitchOk: null, startOk: null }),
      row(slur, null),
    ]
    const per = perSubtaskOf(rows)
    expect(per.get("pitch_tech_slur")).toEqual({ miss: 2, target: 4 })
    expect(per.get("rhythm_tech_slur")).toEqual({ miss: 2, target: 4 })
  })
  it("リズムだけの文脈は rhythm_ にしか出ない", () => {
    const per = perSubtaskOf([row(P("A4", { dotted1: true }), null, { pitchOk: false })])
    expect(per.get("rhythm_value_dotted")).toEqual({ miss: 0, target: 1 })
    expect(per.has("pitch_value_dotted")).toBe(false)
  })
})

describe("noteStatsOf", () => {
  it("音名別 ・ 音域帯 ・ ポジション別 ・ 遷移 を旧と同じ形で作る", () => {
    const a = P("A4", { position: 1 }), e = P("E5", { position: 3 })
    const rows = [
      row(a, null, { noteIndex: 0, expectedPitchHz: 440, pitchCentsError: -20 }),
      row(e, a, { noteIndex: 1, expectedPitchHz: 659.3, pitchOk: false, pitchCentsError: 12 }),
      row(a, e, { noteIndex: 2, expectedPitchHz: 440, startOk: false, pitchCentsError: -10 }),
      row(e, a, { noteIndex: 3, expectedPitchHz: 659.3, pitchCentsError: null }),
    ]
    const ns = noteStatsOf(rows)
    expect(ns.notes["A4"]).toEqual({ target: 2, pitch_miss: 0, timing_miss: 1, cents_avg: -15 })
    expect(ns.notes["E5"]).toEqual({ target: 2, pitch_miss: 1, timing_miss: 0, cents_avg: 12 })
    expect(ns.registers).toEqual({ mid: { target: 2, pitch_miss: 0, timing_miss: 1 }, high: { target: 2, pitch_miss: 1, timing_miss: 0 } })
    expect(ns.positions).toEqual({ "1": { target: 2, pitch_miss: 0, timing_miss: 1 }, "3": { target: 2, pitch_miss: 1, timing_miss: 0 } })
    expect(ns.transitions).toEqual({ "A4>E5": { target: 2, miss: 1 }, "E5>A4": { target: 1, miss: 1 } })
  })
  it("評価していない音は数えない ・ 演奏をまたぐ遷移は作らない", () => {
    const a = P("A4"), b = P("B4")
    const rows = [
      row(a, null, { performanceId: "p1", evaluationStatus: "not_detected", pitchOk: null, startOk: null }),
      row(b, a, { performanceId: "p1" }),
      row(a, b, { performanceId: "p2" }),
    ]
    const ns = noteStatsOf(rows)
    expect(ns.notes["A4"].target).toBe(1)
    expect(ns.notes["B4"].target).toBe(1)
    expect(ns.transitions).toEqual({ "A4>B4": { target: 1, miss: 0 } })
  })
  it("低い音域は 440Hz 未満 ・ 高いポジションは 4plus", () => {
    const g = P("G3", { position: 5 })
    const ns = noteStatsOf([row(g, null, { expectedPitchHz: 196 })])
    expect(ns.registers).toEqual({ low: { target: 1, pitch_miss: 0, timing_miss: 0 } })
    expect(Object.keys(ns.positions)).toEqual(["4plus"])
  })
})

describe("derivedSummaryOf / withDerived", () => {
  it("analysisSummary と同じ形 ・ 明細の無い演奏は null", () => {
    const s = derivedSummaryOf([row(P("A4", { techSlur: true }), null)])
    expect(s.diagnosis.map_available).toBe(true)
    expect(s.diagnosis.per_subtask["pitch_tech_slur"]).toEqual({ miss: 0, target: 1 })
    expect(s.noteStats.notes["A4"].target).toBe(1)
    const out = withDerived([{ id: "x", other: 1 }, { id: "y", other: 2 }], new Map([["x", s]]))
    expect(out[0].analysisSummary).toBe(s)
    expect(out[1].analysisSummary).toBeNull()
    expect(out[1].other).toBe(2)
  })
})
