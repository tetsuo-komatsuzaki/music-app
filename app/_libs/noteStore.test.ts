/**
 * noteStore.test.ts — 読み手の純粋部 (音名→MIDI・重音の度数・重音の束)。
 * 束ね (aggregate/pickWeakest) は personalReco.test.ts、条件の名前は noteStoreSummary.test.ts が見る。
 */
import { describe, it, expect } from "vitest"
import { pitchToMidi, chordIntervalLabel, aggregateChords, type DetailRow, type ProfileRow } from "./noteStore"

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
const row = (cur: ProfileRow, i: number, pitchOk: boolean | null = true): DetailRow => ({
  performanceId: "p", noteIndex: i, pitchOk, startOk: true, evaluationStatus: pitchOk === null ? "not_detected" : "evaluated",
  expectedStartSec: i, cur, prev: null,
})

describe("pitchToMidi", () => {
  it("♯♭とオクターブを読む ・ 不明は null", () => {
    expect(pitchToMidi("A4")).toBe(69)
    expect(pitchToMidi("G3")).toBe(55)
    expect(pitchToMidi("F#4")).toBe(66)
    expect(pitchToMidi("Bb4")).toBe(70)
    expect(pitchToMidi("C##5")).toBe(74)
    expect(pitchToMidi("unknown")).toBeNull()
    expect(pitchToMidi("none")).toBeNull()
  })
})

describe("chordIntervalLabel ・ lib/note_store.py と同じ語", () => {
  it("3度 4度 5度 6度 オクターブ その他", () => {
    expect(chordIntervalLabel("C4", "E4")).toBe("3度")
    expect(chordIntervalLabel("D4", "G4")).toBe("4度")
    expect(chordIntervalLabel("D4", "A4")).toBe("5度")
    expect(chordIntervalLabel("G3", "E4")).toBe("6度")
    expect(chordIntervalLabel("A4", "A5")).toBe("オクターブ")
    expect(chordIntervalLabel("C4", "E5")).toBe("その他")
    expect(chordIntervalLabel("unknown", "E5")).toBe("その他")
  })
})

describe("aggregateChords", () => {
  it("構成音の隣接ペアごとに束ね、ミスは音程 ・ 単音は数えない", () => {
    const fifth = P("D4", { noteCount: 2, pitch2: "A4" })
    const triple = P("G3", { noteCount: 3, pitch2: "D4", pitch3: "B4" }) // 5度 + 6度
    const agg = aggregateChords([row(fifth, 0), row(fifth, 1, false), row(triple, 2, null), row(P("A4"), 3, false)])
    // 度数 + 低い方の音 (2026-09-05)
    expect(agg.get("chord|5度|D4")).toEqual({ target: 2, miss: 1 })
    expect(agg.get("chord|5度|G3")).toEqual({ target: 1, miss: 1 })
    expect(agg.get("chord|6度|D4")).toEqual({ target: 1, miss: 1 })
    expect(agg.size).toBe(3)
  })
})
