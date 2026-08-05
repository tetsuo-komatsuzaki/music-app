import { describe, it, expect } from "vitest"
import {
  computeExprFeatures, rankSongsForExpr, percentileThreshold, EXPR_AXES, type ExprFeatures,
} from "./exprSongFeatures"
import type { SymbolSourceAnalysis } from "./scoreSymbols"

const note = (i: number, over: Record<string, unknown> = {}) => ({ note_index: i, type: "quarter", pitches: [523], ...over })

describe("computeExprFeatures", () => {
  it("スラー密度と長スラー率 (区間カバレッジ)", () => {
    const a: SymbolSourceAnalysis = {
      notes: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => note(i)),
      spanners: { slurs: [{ start: 0, end: 1 }, { start: 3, end: 6 }], hairpins: [] },
    }
    const f = computeExprFeatures(a)
    expect(f.slurDensity).toBe(0.75) // 6/8
    expect(f.longSlurRate).toBe(0.5) // 4音スラー(3-6)のみ = 4/8
  })
  it("スタッカート/ロングトーン/低音域/強弱", () => {
    const a: SymbolSourceAnalysis = {
      notes: [
        note(0, { articulations: ["staccato"] }),
        note(1, { type: "half" }),
        note(2, { pitches: [220] }),
        note(3, { dynamic: "p" }),
        note(4, { dynamic: "f" }),
        note(5, { dynamic: "p" }),
        note(6), note(7),
      ],
      spanners: { slurs: [], hairpins: [{ type: "crescendo", start: 0, end: 3 }] },
    }
    const f = computeExprFeatures(a)
    expect(f.staccatoDensity).toBe(0.125)
    expect(f.longToneRate).toBe(0.125)
    expect(f.lowRegisterRate).toBe(0.125)
    expect(f.dynamicsVariety).toBe(2)
    expect(f.hairpinCount).toBe(1)
  })
})

describe("percentileThreshold (上位5%)", () => {
  it("100曲なら上位5位の値がしきい値", () => {
    const values = Array.from({ length: 100 }, (_, i) => (i + 1) / 100) // 0.01..1.00
    expect(percentileThreshold(values)).toBe(0.96) // 降順5番目
  })
  it("少数カタログでも最低1曲は通る", () => {
    expect(percentileThreshold([0.1, 0.5, 0.3])).toBe(0.5) // ceil(3*0.05)=1 → 最大値
  })
  it("全曲0なら Infinity (合う曲なし)", () => {
    expect(percentileThreshold([0, 0, 0])).toBe(Infinity)
  })
})

describe("rankSongsForExpr (相対順位)", () => {
  const feat = (over: Partial<ExprFeatures>): ExprFeatures => ({
    v: 2, notes: 100, slurDensity: 0, longSlurRate: 0, staccatoDensity: 0,
    dynamicsVariety: 0, hairpinCount: 0, longToneRate: 0, lowRegisterRate: 0, vibratoTag: false,
    loudRate: 0, softRate: 0, accentRate: 0, ornamentRate: 0, highRegisterRate: 0,
    leapRate: 0, rangeSemitones: 0, keyChangeCount: 0, tempoMarkCount: 0, ...over,
  })
  it("しきい値以上だけを降順で返す (0は常に除外)", () => {
    const ranked = rankSongsForExpr("expr_legato_singing", [
      { id: "a", title: "アリア", features: feat({ slurDensity: 0.7 }) },
      { id: "b", title: "中位曲", features: feat({ slurDensity: 0.3 }) },
      { id: "c", title: "刻み曲", features: feat({ slurDensity: 0 }) },
    ], 0.6)
    expect(ranked.map((r) => r.id)).toEqual(["a"])
  })
  it("削除済み語彙 (ルバート等) は空", () => {
    expect(rankSongsForExpr("expr_rubato", [
      { id: "a", title: "x", features: feat({}) },
    ], 0)).toEqual([])
  })
  it("4語彙すべてに軸と雰囲気語がある", () => {
    for (const id of ["expr_legato_singing", "expr_articulation", "expr_dynamics", "expr_tone_depth"]) {
      expect(EXPR_AXES[id]).toBeDefined()
      expect(EXPR_AXES[id].mood.length).toBeGreaterThan(3)
    }
  })
})
