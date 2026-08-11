// 指板ヒートマップ 回帰テスト (ARC-SPEC-FBHM-1.0 §4-2 判定表 + セル割当 + ジオメトリ)
import { describe, it, expect } from "vitest"
import { classifyCell, intensityLevel, cellFill } from "./colors"
import { yOf, cellId, cellPolygon, colX, Y_END, STRINGS } from "./geometry"

const P = { nMin: 5, thetaOk: 0.2, dominanceK: 2.0 } // §9-B 承認値 (2026-08-11 Tetsuo)

describe("classifyCell (§4-2 判定表)", () => {
  it("n < nMin はデータ不足", () => {
    expect(classifyCell({ n: 4, high: 4, low: 0 }, P)).toBe("insufficient")
  })
  it("境界: n = nMin は判定する", () => {
    expect(classifyCell({ n: 5, high: 0, low: 0 }, P)).toBe("stable")
  })
  it("ミス率 20% 未満は安定", () => {
    expect(classifyCell({ n: 10, high: 1, low: 0 }, P)).toBe("stable")
  })
  it("境界: ミス率ちょうど 20% は安定ではない", () => {
    expect(classifyCell({ n: 10, high: 2, low: 0 }, P)).toBe("sharp")
  })
  it("高が低の2倍以上 → sharp", () => {
    expect(classifyCell({ n: 10, high: 2, low: 1 }, P)).toBe("sharp")
  })
  it("低が高の2倍以上 → flat", () => {
    expect(classifyCell({ n: 10, high: 1, low: 2 }, P)).toBe("flat")
  })
  it("どちらtoo優勢でない → unstable (双方向・§9-D採用)", () => {
    expect(classifyCell({ n: 10, high: 2, low: 3 }, P)).toBe("unstable")
    // +20centsと-20centsの平均=0で消える問題 (§4-1) がここで拾える
  })
  it("濃度はミス率で段階変化", () => {
    expect(intensityLevel(0.25, 0.2)).toBe(0)
    expect(intensityLevel(0.45, 0.2)).toBe(1)
    expect(intensityLevel(0.7, 0.2)).toBe(2)
    expect(cellFill("sharp", 2)).toBe("#e26a5d")
  })
})

describe("セル割当 (弦 + midi−開放弦midi)", () => {
  // 本番実データで確認済みの例 (2026-08-11): B5(midi83)・E線・1stポジ4の指 → 7番セル
  const OPEN = { G: 55, D: 62, A: 69, E: 76 } as const
  it("B5 on E線 → cell-E-07", () => {
    expect(cellId("E", 83 - OPEN.E)).toBe("cell-E-07")
  })
  it("開放弦は 0 番セル", () => {
    expect(cellId("A", 69 - OPEN.A)).toBe("cell-A-00")
  })
  it("同じ音でも弦が違えば別セル (A5: E線0 / A線12)", () => {
    expect(cellId("E", 81 - OPEN.E)).toBe("cell-E-05")
    expect(cellId("A", 81 - OPEN.A)).toBe("cell-A-12")
  })
})

describe("ジオメトリ (実寸パリティ)", () => {
  it("指板長 y(30) ≒ 270mm (実物)", () => {
    expect(Y_END).toBeGreaterThan(269.9)
    expect(Y_END).toBeLessThan(270.2)
  })
  it("B5セル(7番)の位置はナットから約96〜109mm (平均律 328×(1−2^(−n/12)))", () => {
    expect(yOf(6)).toBeCloseTo(96.07, 1)
    expect(yOf(7)).toBeCloseTo(109.09, 1)
  })
  it("セルは4弦×31段=124枚、ポリゴンは4点", () => {
    expect(STRINGS.length * 31).toBe(124)
    expect(cellPolygon(0, 1)).toHaveLength(4)
  })
  it("ナット幅24mm・指板端幅42mm", () => {
    expect(colX(0, 4) - colX(0, 0)).toBeCloseTo(24, 5)
    expect(colX(Y_END, 4) - colX(Y_END, 0)).toBeCloseTo(42, 5)
  })
})
