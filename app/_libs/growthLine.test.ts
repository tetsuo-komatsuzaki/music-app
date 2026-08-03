import { describe, it, expect } from "vitest"
import { buildSubMap, computeGrowthLine, growthWindows, type SkillSubDef } from "./growthLine"

const DEFS: SkillSubDef[] = [
  { label: "スラー", subIds: ["pitch_tech_slur", "rhythm_tech_slur"] },
  { label: "スタッカート", subIds: ["pitch_tech_staccato", "rhythm_tech_staccato"] },
]

const summary = (per: Record<string, { miss: number; target: number }>) => ({ diagnosis: { per_subtask: per } })

describe("buildSubMap", () => {
  it("複数演奏の per_subtask を合算する", () => {
    const m = buildSubMap([
      summary({ pitch_tech_slur: { miss: 2, target: 10 } }),
      summary({ pitch_tech_slur: { miss: 1, target: 5 }, rhythm_tech_slur: { miss: 0, target: 4 } }),
    ])
    expect(m.get("pitch_tech_slur")).toEqual({ miss: 3, target: 15 })
    expect(m.get("rhythm_tech_slur")).toEqual({ miss: 0, target: 4 })
  })
  it("壊れた行・null・diagnosisなしは無視", () => {
    const m = buildSubMap([null, {}, { diagnosis: {} }, summary({ x: { miss: "a" as unknown as number, target: 3 } })])
    expect(m.size).toBe(0)
  })
})

describe("computeGrowthLine", () => {
  it("+3pt以上 伸びたわざを返す (74→78)", () => {
    // base(前の30日): miss 26/100 = 74% / now(直近30日): miss 22/100 = 78%
    const base = buildSubMap([summary({ pitch_tech_slur: { miss: 26, target: 100 } })])
    const now = buildSubMap([summary({ pitch_tech_slur: { miss: 22, target: 100 } })])
    const line = computeGrowthLine(now, base, DEFS)
    expect(line).toEqual({ label: "スラー", from: 74, to: 78 })
  })
  it("複数伸びたら いちばん伸びたわざ", () => {
    const base = buildSubMap([summary({
      pitch_tech_slur: { miss: 30, target: 100 },      // 70%
      pitch_tech_staccato: { miss: 30, target: 100 },  // 70%
    })])
    const now = buildSubMap([summary({
      pitch_tech_slur: { miss: 2, target: 8 },        // 75% (+5)
      pitch_tech_staccato: { miss: 0, target: 8 },    // 100% (+30)
    })])
    expect(computeGrowthLine(now, base, DEFS)?.label).toBe("スタッカート")
  })
  it("直近30日側・前30日側とも合算8個未満は対象外", () => {
    const base7 = buildSubMap([summary({ pitch_tech_slur: { miss: 0, target: 7 } })])
    const now = buildSubMap([summary({ pitch_tech_slur: { miss: 0, target: 8 } })])
    expect(computeGrowthLine(now, base7, DEFS)).toBeNull()
    const base8 = buildSubMap([summary({ pitch_tech_slur: { miss: 3, target: 8 } })])
    const now2 = buildSubMap([summary({ pitch_tech_slur: { miss: 0, target: 7 } })])
    expect(computeGrowthLine(now2, base8, DEFS)).toBeNull()
  })
  it("伸びが+3pt未満なら null (でっち上げない)", () => {
    const base = buildSubMap([summary({ pitch_tech_slur: { miss: 25, target: 100 } })]) // 75%
    const now = buildSubMap([summary({ pitch_tech_slur: { miss: 2, target: 8 } })]) // 75%
    expect(computeGrowthLine(now, base, DEFS)).toBeNull()
  })
  it("下がったときも null (成長1行はポジティブ専用)", () => {
    const base = buildSubMap([summary({ pitch_tech_slur: { miss: 10, target: 100 } })]) // 90%
    const now = buildSubMap([summary({ pitch_tech_slur: { miss: 4, target: 8 } })]) // 50%
    expect(computeGrowthLine(now, base, DEFS)).toBeNull()
  })
})

describe("growthWindows (窓の選定)", () => {
  const day = 864e5
  it("演奏期間30日以上: 直近30日 vs その前の30日", () => {
    const perfAt = new Date("2026-08-04T00:00:00Z")
    const firstAt = new Date(perfAt.getTime() - 90 * day)
    const w = growthWindows(firstAt, perfAt)
    expect(w.nowFrom.getTime()).toBe(perfAt.getTime() - 30 * day)
    expect(w.baseTo.getTime()).toBe(perfAt.getTime() - 30 * day)
    expect(w.baseFrom.getTime()).toBe(perfAt.getTime() - 60 * day)
  })
  it("演奏期間30日未満: 全期間を半分に割る (前半=base/後半=now)", () => {
    const perfAt = new Date("2026-08-04T00:00:00Z")
    const firstAt = new Date(perfAt.getTime() - 10 * day)
    const w = growthWindows(firstAt, perfAt)
    const mid = new Date(firstAt.getTime() + 5 * day)
    expect(w.baseFrom.getTime()).toBe(firstAt.getTime())
    expect(w.baseTo.getTime()).toBe(mid.getTime())
    expect(w.nowFrom.getTime()).toBe(mid.getTime())
  })
  it("ちょうど30日も半分割 (通常窓だと前30日窓が空でnullになるため)", () => {
    const perfAt = new Date("2026-08-04T00:00:00Z")
    const firstAt = new Date(perfAt.getTime() - 30 * day)
    const w = growthWindows(firstAt, perfAt)
    expect(w.baseFrom.getTime()).toBe(firstAt.getTime())
    expect(w.baseTo.getTime()).toBe(firstAt.getTime() + 15 * day)
  })
})
