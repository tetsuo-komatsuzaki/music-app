import { describe, it, expect } from "vitest"
import { ARCO_NOTES, PIZZ_NOTES } from "./violinSamples.generated"

// 2026-08-27: 音源が実ファイルと一致し、半音の抜けが無いことを守る。
// 一覧と実ファイルがずれると、その音だけ無音になる (404 はエラーにならない)。
const NAME = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
const midi = (n: string) => {
  const m = /^([A-G]#?)(-?\d+)$/.exec(n)
  if (!m) throw new Error(`音名として読めない: ${n}`)
  return NAME.indexOf(m[1]) + 12 * (Number(m[2]) + 1)
}

describe("お手本の音源", () => {
  it("arco はバイオリンの最低音 G3 から始まる", () => {
    // 開放G弦。これより低い音は楽器として出せない
    expect(ARCO_NOTES[0]).toBe("G3")
    expect(midi("G3")).toBe(55)
  })

  it("arco は実用最高音域まで届く (C8以上)", () => {
    expect(midi(ARCO_NOTES[ARCO_NOTES.length - 1])).toBeGreaterThanOrEqual(midi("C8"))
  })

  it("arco に半音の抜けが無い", () => {
    const ms = ARCO_NOTES.map(midi)
    const gaps: string[] = []
    for (let i = 1; i < ms.length; i++) {
      if (ms[i] - ms[i - 1] !== 1) gaps.push(`${ARCO_NOTES[i - 1]}→${ARCO_NOTES[i]}`)
    }
    expect(gaps).toEqual([])
  })

  it("pizzicato にも半音の抜けが無い", () => {
    const ms = PIZZ_NOTES.map(midi)
    const gaps: string[] = []
    for (let i = 1; i < ms.length; i++) {
      if (ms[i] - ms[i - 1] !== 1) gaps.push(`${PIZZ_NOTES[i - 1]}→${PIZZ_NOTES[i]}`)
    }
    expect(gaps).toEqual([])
  })

  it("音名が昇順に並んでいる", () => {
    for (const list of [ARCO_NOTES, PIZZ_NOTES]) {
      const ms = list.map(midi)
      expect([...ms].sort((a, b) => a - b)).toEqual(ms)
    }
  })

  it("音名として読めない要素が無い", () => {
    for (const n of [...ARCO_NOTES, ...PIZZ_NOTES]) {
      expect(() => midi(n)).not.toThrow()
    }
  })
})
