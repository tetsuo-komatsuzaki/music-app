import { describe, it, expect } from "vitest"
import { clampLimit } from "./apiLimit"

// 監査バッチA② DoS/NaN 対策の回帰防止
describe("clampLimit", () => {
  it("デフォルトは50", () => {
    expect(clampLimit(null)).toBe(50)
  })
  it("正常値はそのまま", () => {
    expect(clampLimit("30")).toBe(30)
    expect(clampLimit("1")).toBe(1)
    expect(clampLimit("100")).toBe(100)
  })
  it("上限100にクランプ (DoS防止)", () => {
    expect(clampLimit("100000")).toBe(100)
    expect(clampLimit("999999999")).toBe(100)
  })
  it("下限1にクランプ", () => {
    expect(clampLimit("0")).toBe(50) // 0はfallback→50
    expect(clampLimit("-5")).toBe(50) // 負もfallback
  })
  it("非数値はfallback (NaN throw 防止)", () => {
    expect(clampLimit("abc")).toBe(50)
    expect(clampLimit("")).toBe(50) // Number("")=0 → 0はfallback
    expect(clampLimit("12abc")).toBe(50) // Number("12abc")=NaN → fallback
  })
  it("min/max/fallback を上書きできる", () => {
    expect(clampLimit("500", { max: 200 })).toBe(200)
    expect(clampLimit(null, { fallback: 10 })).toBe(10)
  })
})
