// オンボーディング★判定 (2026-08-02 登録star整合版) のスペックテスト。
// 正本: docs/arcoda-design-spec.md §2-2b。旧 logic.reference.js 比較は
// ラダー再設計 (Tetsuo承認 2026-08-02) に伴い本テストへ置き換え。
import { describe, it, expect } from "vitest"
import { judge, toAcquisitionFlags, estimatePeriod } from "./logic"

const sortedTags = (a: Parameters<typeof judge>[0]) => [...judge(a).tags].sort()

describe("judge (登録star帯・★確定)", () => {
  it("これから始める → ★1・タグなし", () => {
    const r = judge({ beginner: true })
    expect(r.star).toBe(1)
    expect(r.tags).toEqual([])
    expect(r.doubleStops).toEqual([])
  })

  it("G1落ち(スラー不可) → ★1", () => {
    expect(judge({ g1: false }).star).toBe(1)
  })

  it("G2 0選択 → ★2・帯1(スラー)のみ付与", () => {
    const r = judge({ g1: true, g2: [] })
    expect(r.star).toBe(2)
    expect(r.tags).toEqual(["スラー"])
    expect(r.doubleStops).toEqual([])
  })

  it("G2 1選択 → ★2・選択分は仮習得", () => {
    const r = judge({ g1: true, g2: ["スタッカート"] })
    expect(r.star).toBe(2)
    expect([...r.tags].sort()).toEqual(["スタッカート", "スラー"].sort())
  })

  it("G3欠け(トリルのみ) → ★3・プラルトリラー連動・帯2一括+重音6度", () => {
    const r = judge({ g1: true, g2: ["スタッカート", "ピチカート", "トレモロ"], g3: ["トリル"] })
    expect(r.star).toBe(3)
    expect(r.tags).toContain("トリル")
    expect(r.tags).toContain("プラルトリラーとモルデント")
    // 帯2一括: ポルタート・連続スタッカートも含む
    expect(r.tags).toContain("ポルタート")
    expect(r.tags).toContain("連続スタッカート")
    expect(r.doubleStops).toEqual(["6度"])
  })

  it("G3落ち+補足YES → ★3+3rdポジションフラグ", () => {
    const r = judge({ g1: true, g2: ["スタッカート", "ピチカート", "トレモロ"], g3: [], g3sup: true })
    expect(r.star).toBe(3)
    expect(r.tags).toContain("ポジション移動(3rd)")
    expect(r.notes.length).toBeGreaterThan(0)
  })

  it("G4欠け(ビブラートのみ) → ★4・帯3一括+重音3度", () => {
    const r = judge({
      g1: true, g2: ["スタッカート", "ピチカート", "トレモロ"],
      g3: ["スピッカート", "トリル"], g4: ["ビブラート"],
    })
    expect(r.star).toBe(4)
    expect(r.tags).toContain("ビブラート")
    expect(r.tags).toContain("スピッカート")
    expect([...r.doubleStops].sort()).toEqual(["3度", "6度"].sort())
    expect(r.tags).not.toContain("リコシェ") // 帯4は付与されない
  })

  it("G5欠け → ★5・帯4一括(リコシェ)+重音オクターブ・選択分付与", () => {
    const r = judge({
      g1: true, g2: ["スタッカート", "ピチカート", "トレモロ"],
      g3: ["スピッカート", "トリル"], g4: ["ビブラート", "3rd"],
      g5: ["5th", "グリッサンド"],
    })
    expect(r.star).toBe(5)
    expect(r.tags).toContain("リコシェ")
    expect(r.tags).toContain("ポジション移動(3rd)")
    expect(r.tags).toContain("ポジション(5th)")
    expect(r.tags).toContain("グリッサンド")
    expect(r.tags).not.toContain("ナチュラル・ハーモニクス")
    expect([...r.doubleStops].sort()).toEqual(["3度", "6度", "オクターブ"].sort())
  })

  it("G5通過+G6 0選択 → ★5のまま", () => {
    const r = judge({
      g1: true, g2: ["スタッカート", "ピチカート", "トレモロ"],
      g3: ["スピッカート", "トリル"], g4: ["ビブラート", "3rd"],
      g5: ["5th", "グリッサンド", "ハーモニクス"], g6: [],
    })
    expect(r.star).toBe(5)
    expect(r.tags).toContain("ナチュラル・ハーモニクス")
  })

  it("G6 1選択以上 → ★6・帯5一括+重音10度・選択分付与", () => {
    const r = judge({
      g1: true, g2: ["スタッカート", "ピチカート", "トレモロ"],
      g3: ["スピッカート", "トリル"], g4: ["ビブラート", "3rd"],
      g5: ["5th", "グリッサンド", "ハーモニクス"], g6: ["2nd", "連続重音"],
    })
    expect(r.star).toBe(6)
    expect(r.tags).toContain("ポジション(2nd)")
    expect([...r.doubleStops].sort()).toEqual(["10度", "3度", "6度", "オクターブ", "連続重音"].sort())
  })
})

describe("toAcquisitionFlags (tagKey体系)", () => {
  it("position は番号・double_stop は名称そのまま", () => {
    const flags = toAcquisitionFlags(judge({
      g1: true, g2: ["スタッカート", "ピチカート", "トレモロ"],
      g3: ["スピッカート", "トリル"], g4: ["ビブラート", "3rd"],
      g5: ["5th", "グリッサンド", "ハーモニクス"], g6: ["6th+", "連続重音"],
    }))
    const find = (t: string, k: string) => flags.some((f) => f.tagType === t && f.tagKey === k)
    expect(find("position", "3")).toBe(true)
    expect(find("position", "5")).toBe(true)
    expect(find("position", "6")).toBe(true)
    expect(find("double_stop", "オクターブ")).toBe(true)
    expect(find("double_stop", "連続重音")).toBe(true)
    expect(find("technique", "スラー")).toBe(true)
  })
})

describe("estimatePeriod (期待表・パラメータ不変)", () => {
  it.each([
    [1, 2, "15分 / 日", "約2ヶ月"],
    [3, 3, "15分 / 日", "約3週間"],
    [6, 7, "15分 / 日", "約8ヶ月"],
    [5, 2, "5分 / 日", "約1週間"], // 格下曲=時間非依存
  ])("★%i→⭐︎%i (%s) = %s", (user, song, daily, expected) => {
    expect(estimatePeriod(user, song, daily).label).toBe(expected)
  })
})
