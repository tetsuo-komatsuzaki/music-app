import { describe, expect, it } from "vitest"
import { sanitizeAnnotationData } from "./annotationSanitize"

describe("sanitizeAnnotationData", () => {
  it("正常なデータはそのまま通す", () => {
    const d = {
      highlight: [{ fromNote: 0, toNote: 3, color: "var(--text-error)" }],
      warnings: [{ noteIndex: 2, dy: 1, kind: "text", text: "気をつけて" }],
      notation: [{ noteIndex: 5, kind: "dynamic", value: "ff" }],
    }
    expect(sanitizeAnnotationData(d)).toEqual(d)
  })

  it("各配列を500件に丸める", () => {
    const many = Array.from({ length: 2000 }, (_, i) => ({ noteIndex: i, kind: "staccato" }))
    const out = sanitizeAnnotationData({ notation: many })
    expect(out.notation).toHaveLength(500)
  })

  it("巨大な text/value を切り詰める (肥大化防止)", () => {
    const out = sanitizeAnnotationData({
      warnings: [{ noteIndex: 0, kind: "text", text: "あ".repeat(9999) }],
      notation: [{ noteIndex: 0, kind: "dynamic", value: "x".repeat(9999) }],
    })
    expect(out.warnings![0].text!.length).toBe(40)
    expect(out.notation![0].value!.length).toBe(8)
  })

  it("数値でない noteIndex の要素は捨てる", () => {
    const out = sanitizeAnnotationData({
      // @ts-expect-error 不正な型を意図的に渡す
      notation: [{ noteIndex: "evil", kind: "x" }, { noteIndex: 3, kind: "staccato" }],
    })
    expect(out.notation).toHaveLength(1)
    expect(out.notation![0].noteIndex).toBe(3)
  })

  it("kind が空文字の要素は捨てる", () => {
    const out = sanitizeAnnotationData({ notation: [{ noteIndex: 0, kind: "", value: "x" }] })
    expect(out.notation).toHaveLength(0)
  })

  it("配列でないフィールドは無視する", () => {
    // @ts-expect-error 不正な型
    const out = sanitizeAnnotationData({ highlight: "not-an-array", notation: null })
    expect(out.highlight).toBeUndefined()
    expect(out.notation).toBeUndefined()
  })

  it("color は24字に丸める (CSS注入の間口を狭めつつ rgba/var を切らない)", () => {
    const out = sanitizeAnnotationData({ highlight: [{ fromNote: 0, toNote: 1, color: "x".repeat(100) }] })
    expect(out.highlight![0].color!.length).toBe(24)
  })

  it("rgba/var の色は切られずに通る (Phase3 色バグ修正)", () => {
    const out = sanitizeAnnotationData({
      highlight: [
        { fromNote: 0, toNote: 1, color: "rgba(255,213,74,.46)" },
        { fromNote: 2, toNote: 3, color: "var(--text-error)" },
      ],
    })
    expect(out.highlight![0].color).toBe("rgba(255,213,74,.46)")
    expect(out.highlight![1].color).toBe("var(--text-error)")
  })

  it("spans を通し、不正要素は捨てる (Phase3 範囲スパナ)", () => {
    const out = sanitizeAnnotationData({
      spans: [
        { fromNote: 0, toNote: 4, kind: "slur" },
        // @ts-expect-error 不正 (from が数値でない)
        { fromNote: "x", toNote: 4, kind: "cresc" },
        { fromNote: 1, toNote: 2, kind: "" }, // kind 空 → 捨てる
      ],
    })
    expect(out.spans).toHaveLength(1)
    expect(out.spans![0]).toEqual({ fromNote: 0, toNote: 4, kind: "slur" })
  })
})
