import { describe, it, expect } from "vitest"
import {
  BASIC_PRACTICE_CATEGORIES,
  PRACTICE_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  PRACTICE_TOP_GROUPS,
  ASSIGNED_CATEGORY_ORDER,
  ASSIGNED_TO_PRACTICE,
  categoryLabel,
  categoryIcon,
  isPracticeCategory,
  assignedCategoryLabel,
  assignedCategoryHref,
} from "./practiceConstants"

// INTENDED: 練習カテゴリの一元管理。ラベル/アイコン/大文字↔小文字対応は total。

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

describe("ラベル/アイコンの網羅性 (total map)", () => {
  it("全カテゴリにラベルが存在し、余剰キーがない", () => {
    for (const c of PRACTICE_CATEGORIES) {
      expect(CATEGORY_LABELS[c]).toBeTruthy()
    }
    expect(Object.keys(CATEGORY_LABELS).sort()).toEqual(
      [...PRACTICE_CATEGORIES].sort()
    )
  })

  it("全カテゴリにアイコンが存在し、余剰キーがない", () => {
    for (const c of PRACTICE_CATEGORIES) {
      expect(CATEGORY_ICONS[c]).toBeTruthy()
    }
    expect(Object.keys(CATEGORY_ICONS).sort()).toEqual(
      [...PRACTICE_CATEGORIES].sort()
    )
  })

  it("categoryLabel は既知→ラベル / 未知→素通し", () => {
    expect(categoryLabel("scale")).toBe("音階")
    expect(categoryLabel("etude")).toBe("エチュード")
    expect(categoryLabel("mystery")).toBe("mystery")
  })

  it("categoryIcon は既知→アイコン / 未知→デフォルト🎵", () => {
    expect(categoryIcon("bowing")).toBe("🎻")
    expect(categoryIcon("mystery")).toBe("🎵")
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

describe("AssignedCategory ↔ PracticeCategory 対応", () => {
  it("ASSIGNED_TO_PRACTICE は ASSIGNED_CATEGORY_ORDER 全キーを持つ (total)", () => {
    expect(Object.keys(ASSIGNED_TO_PRACTICE).sort()).toEqual(
      [...ASSIGNED_CATEGORY_ORDER].sort()
    )
  })

  it("各値は有効な PracticeCategoryId で、7↔7 の全単射", () => {
    const values = Object.values(ASSIGNED_TO_PRACTICE)
    for (const v of values) expect(isPracticeCategory(v)).toBe(true)
    expect(new Set(values)).toEqual(new Set(PRACTICE_CATEGORIES))
    expect(values.length).toBe(PRACTICE_CATEGORIES.length)
  })

  it("大文字→小文字は素直な対応 (SCALE→scale 等)", () => {
    for (const upper of ASSIGNED_CATEGORY_ORDER) {
      expect(ASSIGNED_TO_PRACTICE[upper]).toBe(upper.toLowerCase())
    }
  })

  it("assignedCategoryLabel は既知→ラベル / 未知→素通し", () => {
    expect(assignedCategoryLabel("SCALE")).toBe("音階")
    expect(assignedCategoryLabel("ETUDE")).toBe("エチュード")
    expect(assignedCategoryLabel("MYSTERY")).toBe("MYSTERY")
  })

  it("assignedCategoryHref は既知→practice id / 未知→lower-case", () => {
    expect(assignedCategoryHref("POSITION_SHIFT")).toBe("position_shift")
    expect(assignedCategoryHref("MYSTERY")).toBe("mystery")
  })
})
