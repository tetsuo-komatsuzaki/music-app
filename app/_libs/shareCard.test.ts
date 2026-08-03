import { describe, it, expect } from "vitest"
import {
  titleFontPx, fmtMDJst, weekPeriodJst, dayKeyJst, shareText, shareOgTitle,
  isShareKind, isCelebrationKind,
} from "./shareCard"

describe("titleFontPx (長題ルール: 〜8字=基準/9〜14=79%/15〜=63%)", () => {
  it("8字以下は基準サイズ", () => {
    expect(titleFontPx("ちょうちょ", 71)).toBe(71)
    expect(titleFontPx("12345678", 71)).toBe(71)
  })
  it("9〜14字は79%", () => {
    expect(titleFontPx("123456789", 71)).toBe(Math.round(71 * 0.79))
    expect(titleFontPx("12345678901234", 71)).toBe(Math.round(71 * 0.79))
  })
  it("15字以上は63%", () => {
    expect(titleFontPx("123456789012345", 71)).toBe(Math.round(71 * 0.63))
    expect(titleFontPx("人生のメリーゴーランド（ハウルの動く城）", 71)).toBe(Math.round(71 * 0.63))
  })
  it("前後空白は数えない・サロゲートペアも1字", () => {
    expect(titleFontPx("  12345678  ", 71)).toBe(71)
    expect(titleFontPx("𝄞".repeat(8), 71)).toBe(71)
  })
})

describe("JST 日付ヘルパー", () => {
  // UTC 2026-08-02 16:00 = JST 2026-08-03 01:00 (日跨ぎの確認)
  const d = new Date("2026-08-02T16:00:00Z")
  it("fmtMDJst は JST の月/日", () => {
    expect(fmtMDJst(d)).toBe("8/3")
  })
  it("weekPeriodJst は end 含む7日間 (月跨ぎ)", () => {
    expect(weekPeriodJst(d)).toBe("7/28〜8/3")
  })
  it("dayKeyJst は JST 日付キー", () => {
    expect(dayKeyJst(d)).toBe("2026-08-03")
    expect(dayKeyJst(new Date("2026-08-02T14:59:00Z"))).toBe("2026-08-02")
  })
})

describe("shareText / shareOgTitle", () => {
  it("master は曲名入り", () => {
    expect(shareText("master", { title: "ちょうちょ" })).toContain("「ちょうちょ」をマスター")
  })
  it("weekly は日数と回数", () => {
    const t = shareText("weekly", { days: 4, recs: 9 })
    expect(t).toContain("練習4日")
    expect(t).toContain("録音9回")
  })
  it("daily は点数入り", () => {
    const t = shareText("daily", { title: "きらきら星", pitch: 82, timing: 76 })
    expect(t).toContain("音程82点")
    expect(t).toContain("リズム76点")
  })
  it("ogTitle は名前ありなら「〜さんが」", () => {
    expect(shareOgTitle("master", { title: "ちょうちょ" }, null)).toBe("「ちょうちょ」をマスター！ | アルコ")
    expect(shareOgTitle("master", { title: "ちょうちょ" }, "ゆい")).toContain("ゆいさんが")
  })
})

describe("kind 判定", () => {
  it("isShareKind", () => {
    expect(isShareKind("master")).toBe(true)
    expect(isShareKind("weekly")).toBe(true)
    expect(isShareKind("bogus")).toBe(false)
    expect(isShareKind(1)).toBe(false)
  })
  it("お祝い系=master/rank_up・報告系=weekly/daily", () => {
    expect(isCelebrationKind("master")).toBe(true)
    expect(isCelebrationKind("rank_up")).toBe(true)
    expect(isCelebrationKind("weekly")).toBe(false)
    expect(isCelebrationKind("daily")).toBe(false)
  })
})
