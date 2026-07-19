import { describe, it, expect } from "vitest"
import { rankName, perfRank, stampComment, cheerForCount, shortDate, cardTier } from "./rankCard"

describe("cardTier", () => {
  it("★帯で銅/銀/金/ホロ", () => {
    expect(cardTier(1)).toBe("bronze")
    expect(cardTier(3)).toBe("bronze")
    expect(cardTier(4)).toBe("silver")
    expect(cardTier(6)).toBe("silver")
    expect(cardTier(7)).toBe("gold")
    expect(cardTier(9)).toBe("gold")
    expect(cardTier(10)).toBe("holo")
    expect(cardTier(12)).toBe("holo")
  })
})

describe("perfRank", () => {
  it("S/A/B/C の閾値", () => {
    expect(perfRank(96)).toBe("s")
    expect(perfRank(95)).toBe("s")
    expect(perfRank(94)).toBe("a")
    expect(perfRank(90)).toBe("a")
    expect(perfRank(89)).toBe("b")
    expect(perfRank(80)).toBe("b")
    expect(perfRank(79)).toBe("c")
    expect(perfRank(null)).toBeNull()
    expect(perfRank(undefined)).toBeNull()
  })
})

describe("rankName", () => {
  it("★4=見習い、★10以上は同一、未知でも文字列", () => {
    expect(rankName(4)).toContain("見習い")
    expect(rankName(10)).toBe(rankName(12))
    expect(rankName(99)).toBeTruthy()
    expect(rankName(0)).toBeTruthy()
  })
})

describe("cheerForCount", () => {
  it("0=スタート / 全達成=ランクアップ / 残り1 / 半分", () => {
    expect(cheerForCount(0, 10)).toContain("最初")
    expect(cheerForCount(10, 10)).toContain("ランクアップ")
    expect(cheerForCount(9, 10)).toContain("あと1曲")
    expect(cheerForCount(5, 10)).toContain("半分")
    expect(cheerForCount(1, 10)).toContain("はじめの1曲")
  })
})

describe("stampComment", () => {
  it("ランクで変わる / null は汎用", () => {
    expect(stampComment("s")).not.toBe(stampComment("b"))
    expect(stampComment(null)).toContain("おめでとう")
  })
})

describe("shortDate", () => {
  it("M/D 形式 / null は空", () => {
    expect(shortDate("2026-06-02T12:00:00.000Z")).toMatch(/^\d+\/\d+$/)
    expect(shortDate(null)).toBe("")
  })
})
