import { describe, it, expect } from "vitest"
import { selectPraise, stringOfNote } from "./praiseFeedback"

// summary ヘルパ: per_subtask (tech) / noteStats.positions / noteStats.notes を組み立てる
function tech(id: string, miss: number, target: number) {
  return { diagnosis: { per_subtask: { [`pitch_tech_${id}`]: { miss, target } } } }
}
function pos(key: string, missAxes: number, target: number) {
  return { noteStats: { positions: { [key]: { target, pitch_miss: missAxes, timing_miss: 0 } } } }
}
function note(name: string, missAxes: number, target: number) {
  return { noteStats: { notes: { [name]: { target, pitch_miss: missAxes, timing_miss: 0 } } } }
}

describe("stringOfNote", () => {
  it("1stポジの音を弦に写像", () => {
    expect(stringOfNote("A4")).toBe("A線") // 開放A
    expect(stringOfNote("G3")).toBe("G線") // 開放G
    expect(stringOfNote("E5")).toBe("E線") // 開放E
  })
  it("開放より下・上位ポジは null", () => {
    expect(stringOfNote("F3")).toBeNull() // G線開放(55)より下
    expect(stringOfNote("C6")).toBeNull() // E線+7半音超
    expect(stringOfNote("xx")).toBeNull()
  })
})

describe("selectPraise", () => {
  it("候補ゼロ → null", () => {
    expect(selectPraise([], [], 1)).toBeNull()
  })

  it("最低8音に満たなければ対象外 → null", () => {
    expect(selectPraise([note("A4", 0, 5)], [], 1)).toBeNull()
  })

  it("最高: 今回90%以上・前データなし", () => {
    const p = selectPraise([note("A4", 0, 10)], [], 1) // A線 pct100
    expect(p?.situation).toBe("best")
    expect(p?.item).toBe("string")
    expect(p?.value).toBe("A線")
    expect(p?.text).toContain("A線")
  })

  it("伸び: +10pt (前は70%以上)", () => {
    // now pct85 (miss3/20*2軸→ missAxes3,target20→ 1-3/40=92.5) 調整: base pct80, now pct92.5, delta12.5
    const p = selectPraise([pos("3", 3, 20)], [pos("3", 8, 20)], 1)
    // base: 1-8/40=80% (>=70) / now: 92.5% / delta 12.5 → growth
    expect(p?.situation).toBe("growth")
    expect(p?.item).toBe("position")
    expect(p?.value).toBe("3")
  })

  it("苦手突破: 前<70% かつ +10pt。伸び/最高より優先", () => {
    const p = selectPraise([tech("staccato", 1, 10)], [tech("staccato", 5, 10)], 1)
    // base 50% (<70) / now 90% / delta 40 → breakthrough
    expect(p?.situation).toBe("breakthrough")
    expect(p?.item).toBe("tech")
    expect(p?.value).toBe("staccato")
  })

  it("優先順 a→c→b: 苦手突破が最優先", () => {
    const now = [tech("staccato", 1, 10), note("A4", 0, 10)] // staccato=突破候補, A線=最高候補
    const base = [tech("staccato", 5, 10)]
    const p = selectPraise(now, base, 1)
    expect(p?.situation).toBe("breakthrough")
    expect(p?.item).toBe("tech")
  })

  it("同点は ①奏法 > ②ポジション", () => {
    // tech staccato now 95% / position 3 now 95% (どちらも最高・前なし)
    const now = [tech("staccato", 1, 20), pos("3", 2, 20)] // tech 1-1/20=95 / pos 1-2/40=95
    const p = selectPraise(now, [], 1)
    expect(p?.situation).toBe("best")
    expect(p?.item).toBe("tech")
  })

  it("ランク差: ★4+は中上級の文面", () => {
    const beg = selectPraise([note("A4", 0, 10)], [], 1)
    const adv = selectPraise([note("A4", 0, 10)], [], 5)
    expect(beg?.text).not.toBe(adv?.text)
    expect(beg?.text).toContain("よく取れてたね") // 初級 b
    expect(adv?.text).toContain("決まっていた") // 中上級 b
  })

  it("伸びも突破も無く90%未満 → null", () => {
    const p = selectPraise([pos("3", 8, 20)], [pos("3", 9, 20)], 1) // now80/base77.5 delta2.5
    expect(p).toBeNull()
  })
})
