import { describe, it, expect } from "vitest"
import { SAMPLE_SETS } from "./violinSamples.generated"
import { dynamicToLayer, artIds, sustainRatio, velocityOf, techniqueOf, swellFor } from "./violinSampler"

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

// 2026-08-28: 解析は music21 のクラス名 ("Staccato") を出すが、再生側の判定は
// 小文字の奏法ID ("staccato") で書かれている。変換表が欠けると全奏法が黙って
// 素通りする (実際に一度も発火していなかった)。ここで両方の語彙を突き合わせて守る。
describe("奏法名の変換 (解析のクラス名 → 再生の奏法ID)", () => {
  it("解析が出しうるクラス名がすべて再生の語彙に変換される", () => {
    const table: [string, string][] = [
      ["Staccato", "staccato"],
      ["Staccatissimo", "staccato"],
      ["Spiccato", "spiccato"],
      ["StrongAccent", "martele"],
      ["DetachedLegato", "portato"],
      ["Tenuto", "tenuto"],
      ["Accent", "accent"],
      ["Pizzicato", "pizzicato"],
    ]
    for (const [cls, id] of table) {
      expect(artIds({ articulations: [cls] }), cls).toContain(id)
    }
  })

  it("クラス名のままの奏法で長さ・強さ・音源の判定が実際に発火する", () => {
    expect(sustainRatio({ articulations: ["Staccato"] })).toBe(0.45)
    expect(sustainRatio({ articulations: ["Spiccato"] })).toBe(0.35)
    expect(sustainRatio({ articulations: ["StrongAccent"] })).toBe(0.55)
    expect(sustainRatio({ articulations: ["DetachedLegato"] })).toBe(0.75)
    expect(sustainRatio({ articulations: ["Tenuto"] })).toBe(1.0)
    expect(velocityOf({ articulations: ["Accent"] })).toBe(0.95)
    expect(velocityOf({ articulations: ["StrongAccent"] })).toBe(1.0)
    expect(techniqueOf({ articulations: ["Pizzicato"] })).toBe("pizz")
  })

  it("スラー内でも明示のスタッカートは短く切る (ポルタート的表現)", () => {
    expect(sustainRatio({ articulations: ["Staccato"], slur: "mid" })).toBe(0.45)
    expect(sustainRatio({ articulations: [], slur: "mid" })).toBe(1.0)
  })
})

// 2026-08-29: 素材は頭の遅い膨らみを刈り、再生側が音符の長さに比例した
// 膨らみを付け直す (Tetsuo確定)。比例の係数と上下限を守る。
describe("膨らみの付け直し (swellFor)", () => {
  it("鳴る長さの15%で、20ms〜500msに収まる", () => {
    expect(swellFor(1.0)).toBeCloseTo(0.15)
    expect(swellFor(2.0)).toBeCloseTo(0.3)
    expect(swellFor(0.05)).toBe(0.02)   // 速いパッセージでも即座に芯が出る
    expect(swellFor(10)).toBe(0.5)      // 長い音でも録音の自然な膨らみ相当で留める
  })
})
