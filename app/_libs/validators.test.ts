import { describe, it, expect } from "vitest"
import { isValidCuid } from "./validators"

// 認証/IDOR修正で id 検証に使用。回帰防止。
describe("isValidCuid", () => {
  it("正しい cuid v1 を受理", () => {
    expect(isValidCuid("cmmm46xn40000jgjytot9eobc")).toBe(true)
  })
  it("不正な文字列を拒否", () => {
    expect(isValidCuid("")).toBe(false)
    expect(isValidCuid("abc")).toBe(false)
    expect(isValidCuid("Xmmm46xn40000jgjytot9eobc")).toBe(false) // 先頭 c でない
    expect(isValidCuid("cmmm46xn40000jgjytot9eob")).toBe(false)  // 24文字 (短い)
    expect(isValidCuid("cmmm46xn40000jgjytot9eobcX")).toBe(false) // 26文字 (長い)
    expect(isValidCuid("cMMM46xn40000jgjytot9eobc")).toBe(false)  // 大文字含む
    expect(isValidCuid("c-mm46xn40000jgjytot9eobc")).toBe(false)  // 記号含む (injection試行)
  })
  it("非文字列を拒否", () => {
    expect(isValidCuid(null)).toBe(false)
    expect(isValidCuid(undefined)).toBe(false)
    expect(isValidCuid(123)).toBe(false)
    expect(isValidCuid({})).toBe(false)
  })
})
