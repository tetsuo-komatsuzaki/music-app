import { describe, it, expect } from "vitest"
import {
  BASIC_PRACTICE_CATEGORIES,
  PRACTICE_CATEGORIES,
  CATEGORY_LABELS,
  PRACTICE_TOP_GROUPS,
  categoryLabel,
  isPracticeCategory,
} from "./practiceConstants"

// INTENDED: 練習カテゴリの一元管理。ラベルは total、トップ群は全カテゴリを被覆。

describe("カテゴリ集合", () => {
  it("基礎練は6カテゴリ", () => {
    expect(BASIC_PRACTICE_CATEGORIES).toEqual([
      "scale",
      "arpeggio",
      "fingering",
      "bowing",
      "position_shift",
      "double_stop",
    ])
  })

  it("PRACTICE_CATEGORIES = 基礎練6 + etude（7種、重複なし）", () => {
    expect(PRACTICE_CATEGORIES).toEqual([...BASIC_PRACTICE_CATEGORIES, "etude"])
    expect(new Set(PRACTICE_CATEGORIES).size).toBe(7)
  })

  it("score(曲) は PracticeCategory に含めない", () => {
    expect(isPracticeCategory("score")).toBe(false)
    expect(PRACTICE_CATEGORIES).not.toContain("score")
  })
})

describe("ラベルの網羅性 (total map)", () => {
  it("全カテゴリにラベルが存在し、余剰キーがない", () => {
    for (const c of PRACTICE_CATEGORIES) {
      expect(CATEGORY_LABELS[c]).toBeTruthy()
    }
    expect(Object.keys(CATEGORY_LABELS).sort()).toEqual(
      [...PRACTICE_CATEGORIES].sort()
    )
  })

  it("categoryLabel は既知→ラベル / 未知→素通し", () => {
    expect(categoryLabel("scale")).toBe("音階")
    expect(categoryLabel("etude")).toBe("エチュード")
    expect(categoryLabel("mystery")).toBe("mystery")
  })

  it("isPracticeCategory は7カテゴリのみ受理", () => {
    for (const c of PRACTICE_CATEGORIES) expect(isPracticeCategory(c)).toBe(true)
    for (const v of ["score", "lesson", "", "SCALE"]) {
      expect(isPracticeCategory(v)).toBe(false)
    }
  })
})

describe("PRACTICE_TOP_GROUPS", () => {
  it("basic 群 + etude 群で全カテゴリを漏れなく被覆する", () => {
    const covered = PRACTICE_TOP_GROUPS.flatMap((g) => [...g.categories])
    expect(new Set(covered)).toEqual(new Set(PRACTICE_CATEGORIES))
    expect(covered.length).toBe(PRACTICE_CATEGORIES.length)
  })
})
