// app/components/GradeBadge.tsx
//
// UI 設計書 v3.1 §6-3 — 左上グレード表示の主役。
//
// 表示要素:
//   - 葉/花の成長メタファー絵文字 + グレード名 (人称形)
//   - グレード別の淡色バッジ (派手色を避け、A11y は色 + 絵文字 + テキストの 3 重)
//
// onTap が渡されると button としてレンダリング (タップで GradeDetailModal を開く)。

"use client"

import { GRADE_NAMES, type GradeLevel } from "@/app/_libs/skillMaster"
import styles from "./GradeBadge.module.css"

const GRADE_EMOJI: Record<GradeLevel, string> = {
  BEGINNER: "🌱",
  INTERMEDIATE: "🌿",
  ADVANCED: "🌳",
  MASTER: "🏆",
}

type Props = {
  grade: GradeLevel
  /** 渡されると button (押下で GradeDetailModal を開く想定)。
   *  渡されないと span として静的レンダリング。 */
  onTap?: () => void
}

export default function GradeBadge({ grade, onTap }: Props) {
  const label = GRADE_NAMES[grade]
  const emoji = GRADE_EMOJI[grade]
  const className = `${styles.badge} ${styles[`badge_${grade}`]}`

  if (onTap) {
    return (
      <button
        type="button"
        className={className}
        onClick={onTap}
        aria-label={`${label}グレードの詳細を見る`}
      >
        <span className={styles.emoji} aria-hidden="true">
          {emoji}
        </span>
        <span className={styles.label}>{label}</span>
      </button>
    )
  }
  return (
    <span className={className} aria-label={label}>
      <span className={styles.emoji} aria-hidden="true">
        {emoji}
      </span>
      <span className={styles.label}>{label}</span>
    </span>
  )
}
