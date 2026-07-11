/**
 * starProgress.ts — 新判定体系の★/グレード表示ヘルパ（C-6b・2026-07-11）
 *
 * データ源は UserStarProgress（現在★）と UserScoreAchievement（達成/マスター記録）。
 * 旧 UserGrade / UserGradeProgress / SongMastery は退役済み（読み書きとも停止）。
 * グレードは★から導出する（spec§1-6: 1-3 初級 / 4-6 中級 / 7-9 上級 / 10 マスター）。
 */
import type { GradeLevel } from "./skillMaster"

export const STAR_UP_ACHIEVEMENTS = 10 // 同★で10曲達成 → 次の★へ (spec§1-6)

export function gradeFromStar(star: number): GradeLevel {
  if (star >= 10) return "MASTER"
  if (star >= 7) return "ADVANCED"
  if (star >= 4) return "INTERMEDIATE"
  return "BEGINNER"
}

/** 曲リストのバッジ種別（マスター ≻ 達成 ≻ なし。上位1つだけ表示 = Tetsuo確定） */
export type AchievementBadgeKind = "mastered" | "achieved" | null

export function badgeKind(a: {
  achievedAt: Date | string | null
  masteredAt: Date | string | null
} | null | undefined): AchievementBadgeKind {
  if (!a) return null
  if (a.masteredAt) return "mastered"
  if (a.achievedAt) return "achieved"
  return null
}
