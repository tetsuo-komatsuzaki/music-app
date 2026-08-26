import { describe, it, expect } from "vitest"
import { planCountIn, beatInQuarters, beatsPerBar } from "./countIn"

describe("countIn: 拍の長さ (四分音符いくつ分か)", () => {
  it.each([
    [4, 4, 1],
    [3, 4, 1],
    [2, 4, 1],
    [5, 4, 1],
    [2, 2, 2],
    [3, 2, 2],
    [6, 8, 1.5],
    [9, 8, 1.5],
    [12, 8, 1.5],
    [3, 8, 0.5],
    [5, 8, 0.5],
    [7, 8, 0.5],
  ])("%i/%i の拍は四分音符 %f 個分", (n, d, expected) => {
    expect(beatInQuarters(n, d)).toBe(expected)
  })
})

describe("countIn: 1小節の拍数", () => {
  it.each([
    [4, 4, 4],
    [3, 4, 3],
    [2, 4, 2],
    [5, 4, 5],
    [6, 4, 6],
    [2, 2, 2],
    [3, 2, 3],
    [6, 8, 2],
    [9, 8, 3],
    [12, 8, 4],
    [3, 8, 3],
    [5, 8, 5],
    [7, 8, 7],
  ])("%i/%i は %i 拍", (n, d, expected) => {
    expect(beatsPerBar(n, d)).toBe(expected)
  })
})

describe("countIn: 確定した一覧 (♩=100)", () => {
  // 2026-08-27 Tetsuo 承認の表
  it.each([
    [4, 4, 4],
    [3, 4, 3],
    [2, 4, 4],   // 2拍は短い → 2小節
    [6, 8, 4],   // 同上
    [9, 8, 3],
    [12, 8, 4],
    [2, 2, 4],   // 同上
    [3, 2, 3],
    [5, 4, 5],
    [6, 4, 6],
    [3, 8, 6],   // 0.9秒しかない → 2小節
    [5, 8, 5],
    [7, 8, 7],
  ])("%i/%i は %i 回", (n, d, expected) => {
    expect(planCountIn(100, n, d).clicks).toBe(expected)
  })

  it("拍子が不明なら 4/4 として4回", () => {
    expect(planCountIn(100, null, null).clicks).toBe(4)
    expect(planCountIn(100, undefined, undefined).clicks).toBe(4)
  })
})

describe("countIn: 間隔", () => {
  it("4/4 ♩=100 は 0.6 秒間隔", () => {
    expect(planCountIn(100, 4, 4).intervalSec).toBeCloseTo(0.6, 5)
  })
  it("6/8 ♩=100 は付点四分 = 0.9 秒間隔", () => {
    expect(planCountIn(100, 6, 8).intervalSec).toBeCloseTo(0.9, 5)
  })
  it("2/2 ♩=100 は二分音符 = 1.2 秒間隔", () => {
    expect(planCountIn(100, 2, 2).intervalSec).toBeCloseTo(1.2, 5)
  })
  it("3/8 ♩=100 は八分 = 0.3 秒間隔", () => {
    expect(planCountIn(100, 3, 8).intervalSec).toBeCloseTo(0.3, 5)
  })
})

describe("countIn: 速い曲は小節を足す", () => {
  it("4/4 ♩=180 は 4拍で1.33秒しかないので2小節=8回", () => {
    const p = planCountIn(180, 4, 4)
    expect(p.clicks).toBe(8)
    expect(p.clicks * p.intervalSec).toBeGreaterThanOrEqual(1.5)
  })
  it("4/4 ♩=160 は 1.5秒ちょうどなので4回のまま", () => {
    expect(planCountIn(160, 4, 4).clicks).toBe(4)
  })
  it("どのテンポ・拍子でも合計は必ず 1.5 秒以上", () => {
    for (const bpm of [40, 60, 80, 100, 120, 160, 200, 240]) {
      for (const [n, d] of [[4,4],[3,4],[2,4],[6,8],[9,8],[12,8],[2,2],[3,2],[5,4],[3,8],[5,8],[7,8]]) {
        const p = planCountIn(bpm, n, d)
        expect(p.clicks * p.intervalSec).toBeGreaterThanOrEqual(1.5 - 1e-9)
      }
    }
  })
  it("bpm が不正でも落ちない", () => {
    expect(planCountIn(0, 4, 4).clicks).toBeGreaterThan(0)
    expect(planCountIn(-10, 4, 4).intervalSec).toBeGreaterThan(0)
  })
})
