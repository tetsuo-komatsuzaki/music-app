import { describe, it, expect } from "vitest"
import { gradeFromStar, badgeKind, STAR_UP_ACHIEVEMENTS } from "./starProgress"
import { GRADE_LEVELS } from "./skillMaster"

// 技術⭐︎→グレード導出 (spec§1-6: 1-3 初級 / 4-6 中級 / 7-9 上級 / 10 マスター)。
// ★はレッスン教材登録star が正 (source of truth) で、その数からグレードを純導出する。

describe("gradeFromStar", () => {
  it("境界: 初級 (1-3)", () => {
    expect(gradeFromStar(1)).toBe("BEGINNER")
    expect(gradeFromStar(3)).toBe("BEGINNER")
  })
  it("境界: 中級 (4-6)", () => {
    expect(gradeFromStar(4)).toBe("INTERMEDIATE")
    expect(gradeFromStar(6)).toBe("INTERMEDIATE")
  })
  it("境界: 上級 (7-9)", () => {
    expect(gradeFromStar(7)).toBe("ADVANCED")
    expect(gradeFromStar(9)).toBe("ADVANCED")
  })
  it("境界: マスター (10)", () => {
    expect(gradeFromStar(10)).toBe("MASTER")
  })
  it("各しきい値の直前直後で段階が切り替わる", () => {
    expect(gradeFromStar(3)).toBe("BEGINNER")
    expect(gradeFromStar(4)).toBe("INTERMEDIATE")
    expect(gradeFromStar(6)).toBe("INTERMEDIATE")
    expect(gradeFromStar(7)).toBe("ADVANCED")
    expect(gradeFromStar(9)).toBe("ADVANCED")
    expect(gradeFromStar(10)).toBe("MASTER")
  })
  it("★0 (未習得) は初級に倒れる", () => {
    expect(gradeFromStar(0)).toBe("BEGINNER")
  })
  it("★10超 も MASTER にクランプされる", () => {
    expect(gradeFromStar(11)).toBe("MASTER")
    expect(gradeFromStar(99)).toBe("MASTER")
  })
  it("返り値は必ず GRADE_LEVELS のいずれか", () => {
    for (let s = 0; s <= 12; s++) {
      expect(GRADE_LEVELS as readonly string[]).toContain(gradeFromStar(s))
    }
  })
})

describe("STAR_UP_ACHIEVEMENTS", () => {
  it("同★で10曲達成 → 次の★ (spec§1-6)", () => {
    expect(STAR_UP_ACHIEVEMENTS).toBe(10)
  })
})

describe("badgeKind: マスター ≻ 達成 ≻ なし (上位1つだけ)", () => {
  it("null/undefined は null", () => {
    expect(badgeKind(null)).toBeNull()
    expect(badgeKind(undefined)).toBeNull()
  })
  it("未達成は null", () => {
    expect(badgeKind({ achievedAt: null, masteredAt: null })).toBeNull()
  })
  it("達成のみは achieved", () => {
    expect(badgeKind({ achievedAt: new Date(), masteredAt: null })).toBe("achieved")
    expect(badgeKind({ achievedAt: "2026-07-01", masteredAt: null })).toBe("achieved")
  })
  it("マスター済みは (達成日の有無に関わらず) mastered が優先", () => {
    expect(badgeKind({ achievedAt: null, masteredAt: new Date() })).toBe("mastered")
    expect(badgeKind({ achievedAt: "2026-07-01", masteredAt: "2026-07-05" })).toBe("mastered")
  })
})
