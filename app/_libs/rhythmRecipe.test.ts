// リズムパターン変種の計算ロジック (2026-08-24)。
// UI とサーバ双方がこの計算で「拍の帳尻」を判定するため、境界を固定しておく。
import { describe, it, expect } from "vitest"
import { noteQl, totalQl, BASE_QL, RHYTHM_ARTICULATIONS, notePitchNos, type RhythmNote } from "./rhythmRecipe"

const n = (base: string, extra: Partial<RhythmNote> = {}): RhythmNote => ({ base, pitchNo: 1, ...extra })

describe("noteQl", () => {
  it("基本の音価", () => {
    expect(noteQl(n("w"))).toBe(4)
    expect(noteQl(n("h"))).toBe(2)
    expect(noteQl(n("q"))).toBe(1)
    expect(noteQl(n("e"))).toBe(0.5)
    expect(noteQl(n("s"))).toBe(0.25)
    expect(noteQl(n("t"))).toBe(0.125)
  })
  it("付点は1.5倍 (どの音価にも独立して掛かる)", () => {
    expect(noteQl(n("q", { dot: true }))).toBe(1.5)
    expect(noteQl(n("e", { dot: true }))).toBe(0.75)
    expect(noteQl(n("s", { dot: true }))).toBe(0.375)
  })
  it("3連は2/3倍 ・ 付点との併用も効く", () => {
    expect(noteQl(n("q", { triplet: true }))).toBeCloseTo(2 / 3, 10)
    expect(noteQl(n("e", { triplet: true }))).toBeCloseTo(1 / 3, 10)
    expect(noteQl(n("q", { dot: true, triplet: true }))).toBeCloseTo(1, 10)
  })
  it("未知の音価は null", () => {
    expect(noteQl(n("x"))).toBeNull()
    expect(noteQl(n(""))).toBeNull()
  })
})

describe("totalQl (拍の帳尻)", () => {
  it("16分×8 + 8分×4 = 4拍", () => {
    const notes = [...Array(8).fill(n("s")), ...Array(4).fill(n("e"))]
    expect(totalQl(notes)).toBeCloseTo(4, 10)
  })
  it("付点8分+16分 の繰り返し4組 = 4拍", () => {
    const notes = Array.from({ length: 4 }, () => [n("e", { dot: true }), n("s")]).flat()
    expect(totalQl(notes)).toBeCloseTo(4, 10)
  })
  it("3連8分×12 = 4拍", () => {
    expect(totalQl(Array(12).fill(n("e", { triplet: true })))).toBeCloseTo(4, 10)
  })
  it("2小節ぶん (8拍) も組める", () => {
    expect(totalQl(Array(8).fill(n("q")))).toBe(8)
  })
  it("足りない・多い場合は4拍にならない", () => {
    expect(totalQl(Array(7).fill(n("e")))).toBe(3.5)
    expect(totalQl(Array(9).fill(n("e")))).toBe(4.5)
  })
  it("不正な音価は合計に含めない", () => {
    expect(totalQl([n("q"), n("bad"), n("q")])).toBe(2)
  })
})

describe("定義の整合", () => {
  it("音価キーは6種類", () => {
    expect(Object.keys(BASE_QL).sort()).toEqual(["e", "h", "q", "s", "t", "w"])
  })
  it("奏法は「なし」+8種 (アプリの奏法バリエーションと同じ並び)", () => {
    expect(RHYTHM_ARTICULATIONS).toEqual([
      "", "legato", "staccato", "spiccato", "martele", "portato", "tenuto", "accent", "tremolo", "bow_staccato",
    ])
  })
})

describe("notePitchNos ・ 重音 (2026-09-05)", () => {
  it("単音は pitchNo だけ、重音は昇順・重複なし・最大4", () => {
    expect(notePitchNos({ base: "q", pitchNo: 2 })).toEqual([2])
    expect(notePitchNos({ base: "q", pitchNo: 1, pitchNos: [2, 1] })).toEqual([1, 2])
    expect(notePitchNos({ base: "q", pitchNo: 1, pitchNos: [3, 1, 2, 1] })).toEqual([1, 2, 3])
    expect(notePitchNos({ base: "q", pitchNo: 1, pitchNos: [1] })).toEqual([1]) // 1個だけなら単音
    expect(notePitchNos({ base: "q", pitchNo: 1, pitchNos: [1, 2, 3, 4, 5] })).toEqual([1, 2, 3, 4])
  })
})
