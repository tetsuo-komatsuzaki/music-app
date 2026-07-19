import { describe, it, expect } from "vitest"
import {
  DIFFICULTIES,
  ARTICULATIONS,
  isDifficulty,
  difficultyLabel,
  isArticulation,
  articulationLabel,
  usesDifficulty,
  usesArticulation,
} from "./materialVariant"
import {
  BASIC_PRACTICE_CATEGORIES,
  PRACTICE_CATEGORIES,
} from "./practiceConstants"

// INTENDED: 変種軸。難易度=曲/エチュード、奏法=基礎練。マッピングは total かつ consistent。

describe("難易度 (DifficultyId)", () => {
  it("Difficulty enum と一致する3段階を持つ", () => {
    expect(DIFFICULTIES.map((d) => d.id)).toEqual([
      "BEGINNER",
      "INTERMEDIATE",
      "ADVANCED",
    ])
  })

  it("isDifficulty は定義済みを受理し未知を拒否", () => {
    for (const d of DIFFICULTIES) expect(isDifficulty(d.id)).toBe(true)
    for (const v of ["beginner", "EXPERT", "", "初級"]) {
      expect(isDifficulty(v)).toBe(false)
    }
  })

  it("difficultyLabel は既知→ラベル / 未知・null・undefined→空文字", () => {
    expect(difficultyLabel("BEGINNER")).toBe("初級")
    expect(difficultyLabel("INTERMEDIATE")).toBe("中級")
    expect(difficultyLabel("ADVANCED")).toBe("上級")
    expect(difficultyLabel("EXPERT")).toBe("")
    expect(difficultyLabel(null)).toBe("")
    expect(difficultyLabel(undefined)).toBe("")
  })
})

describe("奏法 (ArticulationId)", () => {
  it("6奏法を定義順で持ち、id は重複しない", () => {
    const ids = ARTICULATIONS.map((a) => a.id)
    expect(ids).toEqual([
      "legato",
      "staccato",
      "martele",
      "slur",
      "spiccato",
      "portato",
    ])
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("全奏法が非空ラベルを持つ", () => {
    for (const a of ARTICULATIONS) expect(a.label.length).toBeGreaterThan(0)
  })

  it("isArticulation は定義済みを受理し未知を拒否", () => {
    for (const a of ARTICULATIONS) expect(isArticulation(a.id)).toBe(true)
    for (const v of ["Legato", "detache", "", "レガート"]) {
      expect(isArticulation(v)).toBe(false)
    }
  })

  it("articulationLabel は既知→ラベル / 未知・null→空文字", () => {
    expect(articulationLabel("legato")).toBe("レガート")
    expect(articulationLabel("spiccato")).toBe("スピッカート")
    expect(articulationLabel("nope")).toBe("")
    expect(articulationLabel(null)).toBe("")
    expect(articulationLabel(undefined)).toBe("")
  })
})

describe("変種軸の判定 (usesDifficulty / usesArticulation)", () => {
  it("難易度軸は score / etude のみ", () => {
    expect(usesDifficulty("score")).toBe(true)
    expect(usesDifficulty("etude")).toBe(true)
    for (const c of BASIC_PRACTICE_CATEGORIES) {
      expect(usesDifficulty(c)).toBe(false)
    }
    expect(usesDifficulty("lesson")).toBe(false)
    expect(usesDifficulty("unknown")).toBe(false)
  })

  it("奏法軸は基礎練6カテゴリ（score/etude/lesson を除く全て）", () => {
    for (const c of BASIC_PRACTICE_CATEGORIES) {
      expect(usesArticulation(c)).toBe(true)
    }
    expect(usesArticulation("score")).toBe(false)
    expect(usesArticulation("etude")).toBe(false)
    // lesson は明示的に除外（変種を持たない導入コンテンツ）
    expect(usesArticulation("lesson")).toBe(false)
  })

  it("難易度軸と奏法軸は排他（同一カテゴリで両方 true にならない）", () => {
    const cats = [...PRACTICE_CATEGORIES, "score", "lesson", "unknown"]
    for (const c of cats) {
      expect(usesDifficulty(c) && usesArticulation(c)).toBe(false)
    }
  })

  it("各実カテゴリはいずれかの変種軸を持つ（lesson を除く）", () => {
    // 思想: 教材=グループ⊃変種。実カテゴリ(score/etude/基礎練)は必ず軸を持つ。
    for (const c of [...PRACTICE_CATEGORIES, "score"]) {
      expect(usesDifficulty(c) || usesArticulation(c)).toBe(true)
    }
  })
})
