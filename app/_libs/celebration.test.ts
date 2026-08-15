import { describe, it, expect } from "vitest"
import {
  selectCelebrations,
  parseMilestoneEvents,
  type MilestoneEvent,
} from "./celebration"

const ev = (type: string, extra: Partial<MilestoneEvent> = {}): MilestoneEvent => ({ type, ...extra })

describe("selectCelebrations", () => {
  it("未登録typeは無視される", () => {
    const r = selectCelebrations([ev("unknown_x"), ev("achieve")])
    expect(r.primary?.type).toBe("achieve")
  })

  it("tier降順で最上位を本体に (rank_upは2段目)", () => {
    const r = selectCelebrations([ev("achieve"), ev("rank_up")])
    expect(r.primary?.type).toBe("achieve")
    expect(r.secondary?.type).toBe("rank_up")
  })

  it("tie-break: master > achieve", () => {
    const r = selectCelebrations([ev("achieve"), ev("master")])
    expect(r.primary?.type).toBe("master")
    expect(r.secondary).toBeNull()
  })

  it("自己ベストは major同時なら本体に吸収 (単独表示しない)", () => {
    const r = selectCelebrations([ev("achieve"), ev("personal_best")])
    expect(r.primary?.type).toBe("achieve")
    expect(r.absorbedBest).toBe(true)
  })

  it("自己ベスト単独なら本体になる (吸収なし)", () => {
    const r = selectCelebrations([ev("personal_best")])
    expect(r.primary?.type).toBe("personal_best")
    expect(r.absorbedBest).toBe(false)
  })

  it("課題クリア単独", () => {
    const r = selectCelebrations([ev("material_clear")])
    expect(r.primary?.type).toBe("material_clear")
  })

  it("達成+マスター+昇格+自己ベスト: master本体・rank_up2段目・best吸収", () => {
    const r = selectCelebrations([ev("achieve"), ev("master"), ev("rank_up"), ev("personal_best")])
    expect(r.primary?.type).toBe("master")
    expect(r.secondary?.type).toBe("rank_up")
    expect(r.absorbedBest).toBe(true)
  })

  it("空配列 → primary null", () => {
    const r = selectCelebrations([])
    expect(r.primary).toBeNull()
    expect(r.secondary).toBeNull()
  })

  it("rank_up単独(異常系)は本体に昇格", () => {
    const r = selectCelebrations([ev("rank_up")])
    expect(r.primary?.type).toBe("rank_up")
    expect(r.secondary).toBeNull()
  })
})

describe("parseMilestoneEvents", () => {
  it("正常: events配列を返す", () => {
    const s = { milestone: { version: 1, events: [{ type: "achieve" }, { type: "rank_up", payload: { newStar: 3 } }] } }
    const r = parseMilestoneEvents(s)
    expect(r.map((e) => e.type)).toEqual(["achieve", "rank_up"])
    expect(r[1].payload).toEqual({ newStar: 3 })
  })
  it("欠落/壊れ/未定義は空配列", () => {
    expect(parseMilestoneEvents(null)).toEqual([])
    expect(parseMilestoneEvents({})).toEqual([])
    expect(parseMilestoneEvents({ milestone: {} })).toEqual([])
    expect(parseMilestoneEvents({ milestone: { events: "x" } })).toEqual([])
    expect(parseMilestoneEvents({ milestone: { events: [{ noType: 1 }, { type: "achieve" }] } }).map((e) => e.type)).toEqual(["achieve"])
  })
})

