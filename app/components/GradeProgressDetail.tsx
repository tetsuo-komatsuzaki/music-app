// app/components/GradeProgressDetail.tsx
//
// v1.6 Phase 4-2 (2026-05-16) — マイページの「あなたのグレード」セクション専用コンポーネント。
//
// 構成:
//   - 大きめの GradeBadge (currentStar + currentGrade)
//   - GradeProgressBar (★昇格進捗 + Master 演出)
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

const PREVIOUS_GRADE: Record<GradeLevel, GradeLevel | null> = {
  BEGINNER: null,
  INTERMEDIATE: "BEGINNER",
  ADVANCED: "INTERMEDIATE",
  MASTER: "ADVANCED",
}

export type GradeProgressDetailData = {
  /** v1.6 UserGradeProgress.currentStar (1-10) */
  currentStar: number
  currentGrade: GradeLevel
  /** v1.6 §2-7 ★昇格までの完全習得曲数 */
  masteredSongCountAtCurrentStar: number
  gradeUpRequired: number
  /** Master 達成日 (ISO string)。null = 未達 */
  masterReachedAt: string | null
  /** legacy: 旧 UserGrade.achievedAt (履歴表示用) */
  achievedAt: string | null
}

type Props = {
  data: GradeProgressDetailData
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

export default function GradeProgressDetail({ data }: Props) {
  const [historyExpanded, setHistoryExpanded] = useState(false)

  const previousGrade = PREVIOUS_GRADE[data.currentGrade]
  const hasHistory = !!(previousGrade && data.achievedAt)
  const isMaster = data.currentGrade === "MASTER"

  return (
    <div className={styles.wrapper}>
      <div className={styles.row}>
        <GradeBadge
          currentStar={data.currentStar}
          currentGrade={data.currentGrade}
        />
        <div className={styles.progress}>
          <GradeProgressBar
            current={data.masteredSongCountAtCurrentStar}
            target={data.gradeUpRequired}
            isMaster={isMaster}
            masterReachedAt={data.masterReachedAt}
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
                {GRADE_NAMES[previousGrade!]}
                <span className={styles.arrow} aria-hidden="true">
                  →
                </span>
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
