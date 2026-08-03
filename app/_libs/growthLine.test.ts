import { describe, it, expect } from "vitest"
import { buildSubMap, computeGrowthLine, type SkillSubDef } from "./growthLine"

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
    // base: miss 26/100 = 74% / now: miss 1/9+0/3 → (1-1/12)=91.7%…ではなく現実的に: 22/100→78%
    const base = buildSubMap([summary({ pitch_tech_slur: { miss: 26, target: 100 } })])
    const now = buildSubMap([summary({ pitch_tech_slur: { miss: 2, target: 9 } })]) // 77.8→78
    const line = computeGrowthLine(now, base, DEFS)
    expect(line).toEqual({ label: "スラー", from: 74, to: 78 })
  })
  it("複数伸びたら いちばん伸びたわざ", () => {
    const base = buildSubMap([summary({
      pitch_tech_slur: { miss: 30, target: 100 },      // 70%
      pitch_tech_staccato: { miss: 30, target: 100 },  // 70%
    })])
    const now = buildSubMap([summary({
      pitch_tech_slur: { miss: 1, target: 4 },        // 75% (+5)
      pitch_tech_staccato: { miss: 0, target: 5 },    // 100% (+30)
    })])
    expect(computeGrowthLine(now, base, DEFS)?.label).toBe("スタッカート")
  })
  it("今回target<3 / ベースtarget<8 は対象外", () => {
    const base7 = buildSubMap([summary({ pitch_tech_slur: { miss: 0, target: 7 } })])
    const now = buildSubMap([summary({ pitch_tech_slur: { miss: 0, target: 3 } })])
    expect(computeGrowthLine(now, base7, DEFS)).toBeNull()
    const base8 = buildSubMap([summary({ pitch_tech_slur: { miss: 3, target: 8 } })])
    const now2 = buildSubMap([summary({ pitch_tech_slur: { miss: 0, target: 2 } })])
    expect(computeGrowthLine(now2, base8, DEFS)).toBeNull()
  })
  it("伸びが+3pt未満なら null (でっち上げない)", () => {
    const base = buildSubMap([summary({ pitch_tech_slur: { miss: 25, target: 100 } })]) // 75%
    const now = buildSubMap([summary({ pitch_tech_slur: { miss: 1, target: 4 } })]) // 75%
    expect(computeGrowthLine(now, base, DEFS)).toBeNull()
  })
  it("下がったときも null (成長1行はポジティブ専用)", () => {
    const base = buildSubMap([summary({ pitch_tech_slur: { miss: 10, target: 100 } })]) // 90%
    const now = buildSubMap([summary({ pitch_tech_slur: { miss: 2, target: 4 } })]) // 50%
    expect(computeGrowthLine(now, base, DEFS)).toBeNull()
  })
})
