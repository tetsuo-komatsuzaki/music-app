// app/components/GradeProgressBar.tsx
//
// UI 設計書 v3.1 §6-3 — 細い横バー + 「N/M」表示 + 「次まで残り X 曲」
//
// MASTER (次グレードなし) の場合は null を返してこのコンポーネントは描画しない。

"use client"

import { GRADE_NAMES, type GradeLevel } from "@/app/_libs/skillMaster"
import styles from "./GradeProgressBar.module.css"

type Props = {
  /** 現グレードの達成済み曲数 (累計) */
  completed: number
  /** 次グレード達成に必要な合計曲数 */
  required: number
  /** 残りまで M 曲表示用 (省略時は required - completed で計算) */
  remainingCount?: number
  /** 次グレード (null なら「次まで残り」非表示) */
  nextGrade?: GradeLevel | null
}

export default function GradeProgressBar({
  completed,
  required,
  remainingCount,
  nextGrade,
}: Props) {
  if (required <= 0) {
    return null
  }
  const percent = Math.min(100, Math.max(0, (completed / required) * 100))
  const remaining = remainingCount ?? Math.max(0, required - completed)

  return (
    <div className={styles.wrapper}>
      <div className={styles.barRow}>
        <div
          className={styles.bar}
          role="progressbar"
          aria-valuenow={completed}
          aria-valuemax={required}
          aria-valuemin={0}
          aria-label="グレード進捗"
        >
          <div className={styles.fill} style={{ width: `${percent}%` }} />
        </div>
        <span className={styles.count}>
          {completed}/{required}
        </span>
      </div>
      {nextGrade && remaining > 0 && (
        <div className={styles.remaining}>
          {GRADE_NAMES[nextGrade]}まで残り {remaining} 曲
        </div>
      )}
    </div>
  )
}
