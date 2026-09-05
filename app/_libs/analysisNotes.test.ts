import { describe, it, expect } from "vitest"
import { firstPassNotes } from "./analysisNotes"

const seq = (ms: number[]) => ms.map((m, i) => ({ type: "note", measure_number: m, i }))
const measures = (xs: { measure_number?: number }[]) => xs.map((x) => x.measure_number)

describe("firstPassNotes ・ 繰り返し展開後の音符列から記譜の1回目だけを残す", () => {
  it("繰り返し無しはそのまま", () => {
    const n = seq([1, 1, 2, 2, 3])
    expect(firstPassNotes(n)).toHaveLength(5)
  })
  it("カイザーNo.16 型: 1〜7 を2回弾いてから 8 へ (1小節12音→24音 にならない)", () => {
    const pass = [1, 1, 2, 2, 3, 3]
    const n = seq([...pass, ...pass, 4, 4, 5])
    expect(measures(firstPassNotes(n))).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 5])
  })
  it("1番・2番カッコ: 1 2 3(1番) 1 2 4(2番) → 1 2 3 4 を各1回", () => {
    const n = seq([1, 2, 3, 1, 2, 4, 5])
    expect(measures(firstPassNotes(n))).toEqual([1, 2, 3, 4, 5])
  })
  it("ダ・カーポ: 1 2 3 4 1 2 → 1 2 3 4", () => {
    const n = seq([1, 2, 3, 4, 1, 2])
    expect(measures(firstPassNotes(n))).toEqual([1, 2, 3, 4])
  })
  it("小節番号の無い要素は残す", () => {
    const n = [{ type: "rest" }, ...seq([1, 1]), { type: "rest" }]
    expect(firstPassNotes(n)).toHaveLength(4)
  })
})
