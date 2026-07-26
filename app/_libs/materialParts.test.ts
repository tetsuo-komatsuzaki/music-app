import { describe, it, expect } from "vitest"
import {
  parseParts,
  validatePart,
  validateParts,
  resolvePartToNoteRange,
  type Part,
  type NoteRef,
} from "./materialParts"

const P = (over: Partial<Part> = {}): Part => ({
  id: "p1", name: "サビ", startMeasure: 1, endMeasure: 8, order: 0, ...over,
})

describe("parseParts", () => {
  it("配列でない/壊れた入力は空配列", () => {
    expect(parseParts(null)).toEqual([])
    expect(parseParts(undefined)).toEqual([])
    expect(parseParts("x")).toEqual([])
    expect(parseParts([{ id: "p1" }])).toEqual([]) // 必須欠落は除外
  })
  it("order昇順で返す・order欠落は出現順で補完", () => {
    const parts = parseParts([
      { id: "b", name: "B", startMeasure: 9, endMeasure: 16, order: 1 },
      { id: "a", name: "A", startMeasure: 1, endMeasure: 8, order: 0 },
    ])
    expect(parts.map((p) => p.id)).toEqual(["a", "b"])
  })
})

describe("validatePart", () => {
  it("正常は null", () => {
    expect(validatePart(P())).toBeNull()
  })
  it("名前空・開始<1・終了<開始・小節超過を弾く", () => {
    expect(validatePart(P({ name: "  " }))).toMatch(/パート名/)
    expect(validatePart(P({ startMeasure: 0 }))).toMatch(/開始小節/)
    expect(validatePart(P({ startMeasure: 8, endMeasure: 4 }))).toMatch(/終了小節/)
    expect(validatePart(P({ endMeasure: 40 }), 32)).toMatch(/超えて/)
  })
  it("任意スポット: 重なり・隙間・部分カバーは許容(単体では弾かない)", () => {
    expect(validatePart(P({ startMeasure: 5, endMeasure: 12 }), 32)).toBeNull()
  })
})

describe("validateParts", () => {
  it("ID重複は不可", () => {
    const parts = [P({ id: "x" }), P({ id: "x", name: "別", startMeasure: 9, endMeasure: 16 })]
    expect(validateParts(parts)).toMatch(/重複/)
  })
  it("重なり・隙間は許容(スポット)", () => {
    const parts = [
      P({ id: "a", startMeasure: 1, endMeasure: 8 }),
      P({ id: "b", startMeasure: 5, endMeasure: 12 }), // 重なり
      P({ id: "c", startMeasure: 20, endMeasure: 24 }), // 隙間
    ]
    expect(validateParts(parts, 32)).toBeNull()
  })
})

describe("resolvePartToNoteRange", () => {
  const notes: NoteRef[] = [
    { note_index: 0, measure_number: 1 },
    { note_index: 1, measure_number: 1 },
    { note_index: 2, measure_number: 2 },
    { note_index: 3, measure_number: 3 },
    { note_index: 4, measure_number: 8 },
    { note_index: 5, measure_number: 9 },
  ]
  it("小節範囲→音符範囲(先頭/末尾のindex)", () => {
    expect(resolvePartToNoteRange({ startMeasure: 1, endMeasure: 8 }, notes)).toEqual({
      rangeFromNote: 0,
      rangeToNote: 4,
    })
  })
  it("部分範囲", () => {
    expect(resolvePartToNoteRange({ startMeasure: 2, endMeasure: 3 }, notes)).toEqual({
      rangeFromNote: 2,
      rangeToNote: 3,
    })
  })
  it("範囲内に音符が無ければ null", () => {
    expect(resolvePartToNoteRange({ startMeasure: 20, endMeasure: 24 }, notes)).toBeNull()
  })
})
