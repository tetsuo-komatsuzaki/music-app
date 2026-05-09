// app/components/GradeProgressDetail.tsx
//
// UI 設計書 v3.1 §7-5 — マイページの「あなたのグレード」セクション専用コンポーネント。
//
// 構成:
//   - 大きめの GradeBadge (タップで GradeDetailModal を開く想定 — onTapBadge で発火)
//   - GradeProgressBar (UI-8 の細バー、「次まで残り N 曲」付き)
//   - [グレード履歴を見る] ボタン (任意機能)
//     - タップで直近 1 つの遷移を展開: 「{prev} → {current}  YYYY年MM月DD日に達成」
//     - BEGINNER (履歴なし) のときはボタン非表示

"use client"

import { useState } from "react"
import {
  GRADE_NAMES,
  type GradeLevel,
} from "@/app/_libs/skillMaster"
import GradeBadge from "./GradeBadge"
import GradeProgressBar from "./GradeProgressBar"
import styles from "./GradeProgressDetail.module.css"

const GRADE_EMOJI: Record<GradeLevel, string> = {
  BEGINNER: "🌱",
  INTERMEDIATE: "🌿",
  ADVANCED: "🌳",
  MASTER: "🏆",
}

const PREVIOUS_GRADE: Record<GradeLevel, GradeLevel | null> = {
  BEGINNER: null,
  INTERMEDIATE: "BEGINNER",
  ADVANCED: "INTERMEDIATE",
  MASTER: "ADVANCED",
}

export type GradeProgressDetailData = {
  currentGrade: GradeLevel
  achievedAt: string | null
  nextGrade: GradeLevel | null
  remainingCount: number
  totalCompleted: number
  totalRequired: number
}

type Props = {
  data: GradeProgressDetailData
  /** バッジタップで詳細モーダルを開く想定。未指定なら静的バッジ。 */
  onTapBadge?: () => void
}

function formatJpDate(isoStr: string): string {
  const date = new Date(isoStr)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export default function GradeProgressDetail({ data, onTapBadge }: Props) {
  const [historyExpanded, setHistoryExpanded] = useState(false)

  const previousGrade = PREVIOUS_GRADE[data.currentGrade]
  const hasHistory = !!(previousGrade && data.achievedAt)

  return (
    <div className={styles.wrapper}>
      <div className={styles.row}>
        <GradeBadge grade={data.currentGrade} onTap={onTapBadge} />
        <div className={styles.progress}>
          <GradeProgressBar
            completed={data.totalCompleted}
            required={data.totalRequired}
            remainingCount={data.remainingCount}
            nextGrade={data.nextGrade}
          />
        </div>
      </div>

      {hasHistory && (
        <div className={styles.historyArea}>
          <button
            type="button"
            className={styles.historyToggle}
            onClick={() => setHistoryExpanded(v => !v)}
            aria-expanded={historyExpanded}
            aria-controls="grade-history-content"
          >
            <span aria-hidden="true">{historyExpanded ? "▲" : "▼"}</span>{" "}
            {historyExpanded ? "履歴を閉じる" : "グレード履歴を見る"}
          </button>

          {historyExpanded && (
            <div className={styles.history} id="grade-history-content">
              <div className={styles.historyTransition}>
                <span aria-hidden="true">{GRADE_EMOJI[previousGrade!]}</span>{" "}
                {GRADE_NAMES[previousGrade!]}
                <span className={styles.arrow} aria-hidden="true">
                  →
                </span>
                <span aria-hidden="true">
                  {GRADE_EMOJI[data.currentGrade]}
                </span>{" "}
                {GRADE_NAMES[data.currentGrade]}
              </div>
              <div className={styles.historyDate}>
                {data.achievedAt ? formatJpDate(data.achievedAt) : "—"} に達成
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
