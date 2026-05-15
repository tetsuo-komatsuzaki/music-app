// app/components/GradeBadge.tsx
//
// v1.6 §1-2 / Phase 4-2 (2026-05-16) — ☆ + グレード一体表示。
// currentStar (1-10) と currentGrade (BEGINNER..MASTER) を組み合わせて表示。
//
// 表示パターン:
//   - 通常 (★1-9): 緑/青/紫色 + ☆N + グレード日本語名
//   - Master (★10): 金色 + 🌟 + 「マスター達成」 (Q1=a-1 確定: ★10 Master 演出)
//
// onTap が渡されると button としてレンダリング (将来 modal 用途、Q5=c で v1.6 段階では未使用)。

"use client"

import { GRADE_NAMES, type GradeLevel } from "@/app/_libs/skillMaster"
import styles from "./GradeBadge.module.css"

type Props = {
  /** 1-10。null 時は未設定扱いで BEGINNER 相当の暫定表示 */
  currentStar: number | null
  currentGrade: GradeLevel
  onTap?: () => void
}

export default function GradeBadge({ currentStar, currentGrade, onTap }: Props) {
  const isMaster = currentGrade === "MASTER"
  const label = isMaster ? "マスター達成" : GRADE_NAMES[currentGrade]
  const starText = isMaster ? "🌟" : `☆${currentStar ?? 1}`
  const className = `${styles.badge} ${styles[`badge_${currentGrade}`]} ${
    isMaster ? styles.badgeMasterAchieved : ""
  }`

  const content = (
    <>
      <span className={styles.emoji} aria-hidden="true">
        {starText}
      </span>
      <span className={styles.label}>{label}</span>
    </>
  )

  if (onTap) {
    return (
      <button
        type="button"
        className={className}
        onClick={onTap}
        aria-label={`${label}グレードの詳細を見る`}
      >
        {content}
      </button>
    )
  }
  return (
    <span className={className} aria-label={label}>
      {content}
    </span>
  )
}
