import { describe, it, expect } from "vitest"
import { computeExprFeatures, rankSongsForExpr, EXPR_MATCH_MIN, type ExprFeatures } from "./exprSongFeatures"
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

describe("rankSongsForExpr", () => {
  const feat = (over: Partial<ExprFeatures>): ExprFeatures => ({
    v: 1, notes: 100, slurDensity: 0, longSlurRate: 0, staccatoDensity: 0,
    dynamicsVariety: 0, hairpinCount: 0, longToneRate: 0, lowRegisterRate: 0, vibratoTag: false, ...over,
  })
  it("レガート: スラー密度が高くテンポ緩やかな曲が上位", () => {
    const ranked = rankSongsForExpr("expr_legato_singing", [
      { id: "a", title: "アリア", features: feat({ slurDensity: 0.7 }), tempo: 70 },
      { id: "b", title: "速い曲", features: feat({ slurDensity: 0.7 }), tempo: 160 },
      { id: "c", title: "刻み曲", features: feat({ slurDensity: 0.05 }), tempo: 80 },
    ])
    expect(ranked[0].id).toBe("a")
    expect(ranked.find((r) => r.id === "c")).toBeUndefined() // 最低ライン未満は出さない
  })
  it("ルバート (未対応語彙) は空", () => {
    expect(rankSongsForExpr("expr_rubato", [
      { id: "a", title: "x", features: feat({}), tempo: null },
    ])).toEqual([])
  })
  it("最低ライン EXPR_MATCH_MIN を下回る曲だけなら空 (でっち上げない)", () => {
    const ranked = rankSongsForExpr("expr_articulation", [
      { id: "a", title: "x", features: feat({ staccatoDensity: 0.05 }), tempo: null },
    ])
    expect(EXPR_MATCH_MIN).toBeGreaterThan(0.15)
    expect(ranked).toEqual([])
  })
})
