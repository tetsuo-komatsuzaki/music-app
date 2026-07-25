import { describe, it, expect } from "vitest"
import {
  transition,
  selectActiveMark,
  selectGuideSample,
  isPageGuideActive,
  initialState,
  type GuideState,
} from "./guideMachine"
import type { CoachMarkConfig as RealConfig } from "./content/coachMarks"

// テスト用の最小マーク (必要フィールドだけ)
const mk = (id: string, over: Partial<RealConfig> = {}): RealConfig => ({
  id, targetKey: id, headline: id, body: id, trigger: "page", showDismissAllCheckbox: false, ...over,
})
const M = [mk("a"), mk("b"), mk("c")]
const CTX = { isReplaying: false }
const REPLAY = { isReplaying: true }

describe("guideMachine transition", () => {
  it("初期状態は pagePending", () => {
    expect(initialState).toEqual({ t: "pagePending" })
  })

  it("新規訪問: START で pageRunning{0} になり MARK_SEEN が起きる", () => {
    const r = transition({ t: "pagePending" }, { type: "START", marks: M }, CTX)
    expect(r.next).toEqual({ t: "pageRunning", index: 0, marks: M })
    expect(r.effects).toEqual([{ type: "MARK_SEEN" }])
  })

  it("replay 中の START は既読化しない (CLEAR は完了時)", () => {
    const r = transition({ t: "pagePending" }, { type: "START", marks: M }, REPLAY)
    expect(r.next).toEqual({ t: "pageRunning", index: 0, marks: M })
    expect(r.effects).toEqual([])
  })

  it("有効マーク0の START は idle へ (何も出さない)", () => {
    const r = transition({ t: "pagePending" }, { type: "START", marks: [] }, CTX)
    expect(r.next).toEqual({ t: "idle" })
    expect(r.effects).toEqual([])
  })

  it("既読/dismissed 相当: GATING_FAIL で idle へ", () => {
    const r = transition({ t: "pagePending" }, { type: "GATING_FAIL" }, CTX)
    expect(r.next).toEqual({ t: "idle" })
  })

  it("NEXT で index が進み、最後を越えると idle + MARK_SEEN", () => {
    const s0: GuideState = { t: "pageRunning", index: 0, marks: M }
    const s1 = transition(s0, { type: "NEXT" }, CTX).next
    expect(s1).toEqual({ t: "pageRunning", index: 1, marks: M })
    const s2 = transition(s1, { type: "NEXT" }, CTX).next
    expect(s2).toEqual({ t: "pageRunning", index: 2, marks: M })
    const last = transition(s2, { type: "NEXT" }, CTX)
    expect(last.next).toEqual({ t: "idle" })
    expect(last.effects).toEqual([{ type: "MARK_SEEN" }])
  })

  it("TARGET_TAP は NEXT と同じ前進", () => {
    const s0: GuideState = { t: "pageRunning", index: 0, marks: M }
    expect(transition(s0, { type: "TARGET_TAP" }, CTX).next).toEqual({ t: "pageRunning", index: 1, marks: M })
  })

  it("PREV で戻る (0 未満にはならない)", () => {
    const s1: GuideState = { t: "pageRunning", index: 1, marks: M }
    expect(transition(s1, { type: "PREV" }, CTX).next).toEqual({ t: "pageRunning", index: 0, marks: M })
    const s0: GuideState = { t: "pageRunning", index: 0, marks: M }
    expect(transition(s0, { type: "PREV" }, CTX).next).toEqual({ t: "pageRunning", index: 0, marks: M })
  })

  it("SKIP_ALL は idle + MARK_SEEN (replay 中は CLEAR_REPLAY)", () => {
    const s: GuideState = { t: "pageRunning", index: 1, marks: M }
    expect(transition(s, { type: "SKIP_ALL" }, CTX).effects).toEqual([{ type: "MARK_SEEN" }])
    expect(transition(s, { type: "SKIP_ALL" }, REPLAY).effects).toEqual([{ type: "CLEAR_REPLAY" }])
  })

  it("DISMISS_ALL はどの状態からでも off + DISMISS_ALL", () => {
    for (const s of [
      { t: "pagePending" }, { t: "pageRunning", index: 0, marks: M }, { t: "idle" }, { t: "analysis" },
    ] as GuideState[]) {
      const r = transition(s, { type: "DISMISS_ALL" }, CTX)
      expect(r.next).toEqual({ t: "off" })
      expect(r.effects).toEqual([{ type: "DISMISS_ALL" }])
    }
  })

  it("analysis: idle→ANALYSIS_READY→analysis→ANALYSIS_DONE→off + MARK_ANALYSIS_SEEN", () => {
    const a = transition({ t: "idle" }, { type: "ANALYSIS_READY" }, CTX).next
    expect(a).toEqual({ t: "analysis" })
    const done = transition(a, { type: "ANALYSIS_DONE" }, CTX)
    expect(done.next).toEqual({ t: "off" })
    expect(done.effects).toEqual([{ type: "MARK_ANALYSIS_SEEN" }])
  })

  it("REPLAY_START はどの状態からでも pagePending へ (既読でも再生)", () => {
    for (const s of [{ t: "idle" }, { t: "off" }, { t: "pageRunning", index: 2, marks: M }] as GuideState[]) {
      expect(transition(s, { type: "REPLAY_START" }, CTX).next).toEqual({ t: "pagePending" })
    }
  })

  // 回帰固定: 旧バグ (マウント相当で pageRunning が勝手に idle/pending に戻る) の再発防止。
  // pageRunning に対して「開始・リセット系でない」イベントは状態を変えない。
  it("回帰: pageRunning は START/GATING_FAIL/ANALYSIS_* で揺れない", () => {
    const s: GuideState = { t: "pageRunning", index: 1, marks: M }
    for (const e of [
      { type: "START", marks: M }, { type: "GATING_FAIL" }, { type: "ANALYSIS_READY" }, { type: "ANALYSIS_DONE" },
    ] as const) {
      expect(transition(s, e, CTX).next).toEqual(s)
    }
  })
})

describe("guideMachine selectors", () => {
  const analysis = mk("analysisMark", { trigger: "first-analysis-complete" })

  it("selectActiveMark: pageRunning は該当マークを返す", () => {
    const r = selectActiveMark({ t: "pageRunning", index: 1, marks: M }, analysis)
    expect(r).toEqual({ kind: "page", mark: M[1], index: 1, total: 3 })
  })

  it("selectActiveMark: analysis 状態で analysisMark を返す", () => {
    expect(selectActiveMark({ t: "analysis" }, analysis)).toEqual({ kind: "analysis", mark: analysis })
    expect(selectActiveMark({ t: "analysis" }, null)).toBeNull()
  })

  it("selectActiveMark: pending/idle/off は null", () => {
    expect(selectActiveMark({ t: "pagePending" }, analysis)).toBeNull()
    expect(selectActiveMark({ t: "idle" }, analysis)).toBeNull()
    expect(selectActiveMark({ t: "off" }, analysis)).toBeNull()
  })

  it("selectGuideSample: マーク単位 sample 優先、無ければ pageSample、実行外は null", () => {
    const withSample = [mk("x", { sample: "review" }), mk("y")]
    expect(selectGuideSample({ t: "pageRunning", index: 0, marks: withSample }, "home")).toBe("review")
    expect(selectGuideSample({ t: "pageRunning", index: 1, marks: withSample }, "home")).toBe("home")
    expect(selectGuideSample({ t: "pageRunning", index: 1, marks: withSample }, null)).toBeNull()
    expect(selectGuideSample({ t: "idle" }, "home")).toBeNull()
  })

  it("isPageGuideActive: pending/running のみ true", () => {
    expect(isPageGuideActive({ t: "pagePending" })).toBe(true)
    expect(isPageGuideActive({ t: "pageRunning", index: 0, marks: M })).toBe(true)
    expect(isPageGuideActive({ t: "idle" })).toBe(false)
    expect(isPageGuideActive({ t: "analysis" })).toBe(false)
    expect(isPageGuideActive({ t: "off" })).toBe(false)
  })
})
