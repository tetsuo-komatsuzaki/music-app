// 記号の正本 (scoreSymbolData.v1.json) の不変条件を検証する。
// レッスンの verify-lesson-content.ts と同じ位置づけ。
import { describe, it, expect } from "vitest"
import { ALL_SYMBOLS, SYMBOL_CATEGORIES, getSymbolDef } from "./scoreSymbols"
import lessonData from "../[userId]/lessons/_lib/lessonData.v1_0.json"
import DATA from "./scoreSymbolData.v1.json"

const LESSON_IDS = new Set(lessonData.lessons.map((l) => l.id))

// SymbolGuide.tsx の SymbolGlyph が実際に描ける kind (default に落ちると "?" になる)
const DRAWABLE_GLYPHS = new Set([
  "accent", "accidental", "arco", "arpeggio", "barline", "beam", "breath", "chord", "clef",
  "collegno", "cresc", "cue", "dashes", "diamond", "dim", "dotted", "doubleacc", "doubledot",
  "downbow", "dynamic", "enharmonic", "fall", "fermata", "finger", "finger_sub", "ghost",
  "gliss", "grace", "harmonic", "key", "lhpizz", "lyric", "marcato", "measure_repeat",
  "metronome", "mordent", "openstring", "ottava", "pizz", "portato", "quarter", "repeat",
  "rest", "ritard", "segno", "shift", "slur", "snappizz", "sordino", "spiccato",
  "staccatissimo", "staccato", "string", "sulpont", "sultasto", "swing", "tenuto", "text",
  "tie", "time", "timeC", "tremolo", "tremolo2", "trill", "tuning", "tuplet", "turn", "upbow",
  "vibrato", "voice", "xhead"
])

const MATCH_TYPES = new Set([
  "articulation", "flag", "spanner", "hairpin", "chordInterval", "dynamic", "tuplet",
  "rest", "key", "time",
  // ↓ まだ analysis.json に無い (supply: pending/tag)。規則だけ書いてある
  "expression", "tempo", "grace", "dots", "accidental", "clef", "repeat",
  "repeatExpression", "barline", "spannerClass", "none",
  "words", "notehead", "technical", "harmony", "cue", "beam", "measureStyle",
  "timeSymbol", "senzaMisura", "accidentalStyle", "scordatura", "dashes", "expressionAttr", "fieldValue",
  "accidentalKind", "voice", "lyric", "enharmonic", "keyChange", "timeChange",
  "fingeringSubstitution",
])

// 解析側が今すぐ供給できる match の型
const READY_MATCH_TYPES = new Set([
  "articulation", "flag", "spanner", "hairpin", "chordInterval", "dynamic", "tuplet",
  "rest", "key", "time", "fieldValue",
])

describe("scoreSymbolData.v1.json (記号の正本)", () => {
  it("id が一意", () => {
    const ids = ALL_SYMBOLS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("cat がカテゴリ定義に存在する", () => {
    for (const s of ALL_SYMBOLS) expect(SYMBOL_CATEGORIES[s.cat], s.id).toBeDefined()
  })

  it("glyph が実際に描ける種別", () => {
    for (const s of ALL_SYMBOLS) expect(DRAWABLE_GLYPHS.has(s.glyph), `${s.id}: ${s.glyph}`).toBe(true)
  })

  it("lessonId が学びレッスンに実在する", () => {
    for (const s of ALL_SYMBOLS) {
      if (s.lessonId) expect(LESSON_IDS.has(s.lessonId), `${s.id} -> ${s.lessonId}`).toBe(true)
    }
  })

  it("match.type が既知の種別", () => {
    for (const s of ALL_SYMBOLS) expect(MATCH_TYPES.has(s.match.type), `${s.id}: ${s.match.type}`).toBe(true)
  })

  it("supply=ready は今すぐ判定できる match を持つ", () => {
    for (const s of ALL_SYMBOLS) {
      if (s.supply === "ready") {
        expect(READY_MATCH_TYPES.has(s.match.type), `${s.id} は ready なのに match=${s.match.type}`).toBe(true)
      }
    }
  })

  it("supply=tag は match を持たない (記譜では判別できない奏法)", () => {
    for (const s of ALL_SYMBOLS) {
      if (s.supply === "tag") expect(s.match.type, s.id).toBe("none")
    }
  })

  it("music21 クラス名が2つの記号に重複して割り当てられていない", () => {
    const seen = new Map<string, string>()
    for (const s of ALL_SYMBOLS) {
      for (const n of s.match.m21 ?? []) {
        expect(seen.has(n), `${n} が ${seen.get(n)} と ${s.id} で重複`).toBe(false)
        seen.set(n, s.id)
      }
    }
  })

  it("説明文がすべて埋まっている", () => {
    for (const s of ALL_SYMBOLS) {
      expect(s.label.length, s.id).toBeGreaterThan(0)
      expect(s.what.length, s.id).toBeGreaterThan(10)
    }
  })

  it("getSymbolDef は値つきIDでも基底定義を返す", () => {
    expect(getSymbolDef("dynamic:f")?.id).toBe("dynamic")
    expect(getSymbolDef("tuplet:3")?.id).toBe("tuplet")
    expect(getSymbolDef("staccato")?.label).toBe("スタッカート")
    expect(getSymbolDef("no_such_symbol")).toBeUndefined()
  })

  it("採録しなかった区分は理由つきで記録されている (監査用)", () => {
    const ex = (DATA as { excluded?: { notionTool: string; reason: string }[] }).excluded ?? []
    expect(ex.length).toBeGreaterThan(0)
    for (const e of ex) {
      expect(e.notionTool.length).toBeGreaterThan(0)
      expect(e.reason.length).toBeGreaterThanOrEqual(5)
    }
  })

  it("網羅状況を記録する (増減したらこのテストを更新して意図を明示する)", () => {
    const by = (k: string) => ALL_SYMBOLS.filter((s) => s.supply === k).length
    expect({ total: ALL_SYMBOLS.length, ready: by("ready"), pending: by("pending"), tag: by("tag") })
      .toEqual({ total: 99, ready: 39, pending: 55, tag: 5 })
  })
})
