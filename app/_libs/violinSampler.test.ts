import { describe, it, expect } from "vitest"
import { SAMPLE_SETS } from "./violinSamples.generated"
import { dynamicToLayer } from "./violinSampler"

// 2026-08-28: 強弱3層 (pp/mf/ff) × 奏法 (arco/pizz) の6セット構成。
// 一覧と実ファイルがずれると、その音だけ無音になる (404 はエラーにならない)。
// 層の中の小さな抜けは Tone.Sampler のピッチシフトが補うが、
// 離れすぎると「その音だけ変」になるので間隔に上限を置いて守る。
const NAME = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
const midi = (n: string) => {
  const m = /^([A-G]#?)(-?\d+)$/.exec(n)
  if (!m) throw new Error(`音名として読めない: ${n}`)
  return NAME.indexOf(m[1]) + 12 * (Number(m[2]) + 1)
}

describe("お手本の音源 (強弱3層)", () => {
  it("6セットすべてに音がある", () => {
    for (const key of ["arco_pp", "arco_mf", "arco_ff", "pizz_pp", "pizz_mf", "pizz_ff"] as const) {
      expect(SAMPLE_SETS[key].length, key).toBeGreaterThan(0)
    }
  })

  it("arco の各層はバイオリンの最低音 G3 から始まる", () => {
    for (const key of ["arco_pp", "arco_mf", "arco_ff"] as const) {
      expect(SAMPLE_SETS[key][0], key).toBe("G3")
    }
  })

  it("既定の mf 層は実用音域 (G3〜A7以上) を覆う", () => {
    const mf = SAMPLE_SETS.arco_mf
    expect(midi(mf[mf.length - 1])).toBeGreaterThanOrEqual(midi("A7"))
  })

  it("層の中の間隔は arco≦2半音 / pizz≦3半音 (ピッチシフトで自然に補える範囲)", () => {
    const limit = { arco: 2, pizz: 3 }
    for (const [key, notes] of Object.entries(SAMPLE_SETS)) {
      const kind = key.startsWith("arco") ? "arco" : "pizz"
      const ms = notes.map(midi)
      for (let i = 1; i < ms.length; i++) {
        expect(ms[i] - ms[i - 1], `${key}: ${notes[i - 1]}→${notes[i]}`).toBeLessThanOrEqual(limit[kind as "arco" | "pizz"])
      }
    }
  })

  it("音名がすべて解釈でき、重複が無い", () => {
    for (const notes of Object.values(SAMPLE_SETS)) {
      const ms = notes.map(midi)
      expect(new Set(ms).size).toBe(ms.length)
    }
  })

  it("強弱記号 → 層の対応 (指定なしは mf)", () => {
    expect(dynamicToLayer(null)).toBe("mf")
    expect(dynamicToLayer(undefined)).toBe("mf")
    expect(dynamicToLayer("p")).toBe("pp")
    expect(dynamicToLayer("pp")).toBe("pp")
    expect(dynamicToLayer("mp")).toBe("mf")
    expect(dynamicToLayer("mf")).toBe("mf")
    expect(dynamicToLayer("f")).toBe("ff")
    expect(dynamicToLayer("ff")).toBe("ff")
    expect(dynamicToLayer("fz")).toBe("ff")
    expect(dynamicToLayer("sfz")).toBe("ff")
  })
})
