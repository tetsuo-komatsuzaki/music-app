// app/components/SkillScoreCard.tsx
//
// UI 設計書 v3 §5-3 — 中項目スコアカード (3 件横並び)
// PerformanceSkillDetail から呼ばれ、pitch / rhythm / bowing の 3 中項目スコアを表示。

"use client"

import { TASK_IDS, TASK_NAMES, type TaskId } from "@/app/_libs/skillMaster"
import styles from "./SkillScoreCard.module.css"

export type NullReason = "skipped_low_detection" | "no_bowing_target" | null

type Scores = {
  pitch: number | null
  rhythm: number | null
  bowing: number | null
}

type Props = {
  scores: Scores
  /** 全件 null の場合の文脈 (null reason 推論結果)。
   *  - skipped_low_detection: 検出割合 < 50% で score_full がスキップ
   *  - no_bowing_target: 弦移動なし曲で bowing のみ null
   *  - null: 通常 (各 score が個別に値を持つ)
   */
  nullReason: NullReason
}

/** UI 設計書 v3 §5-3 の null 推論ロジック */
export function getNullReason(scores: Scores): NullReason {
  const { pitch, rhythm, bowing } = scores
  if (pitch === null && rhythm === null && bowing === null) {
    return "skipped_low_detection"
  }
  if (bowing === null && (pitch !== null || rhythm !== null)) {
    return "no_bowing_target"
  }
  return null
}

function tierClass(score: number | null): string {
  if (score === null) return styles.tierNull
  if (score >= 90) return styles.tierExcellent
  if (score >= 75) return styles.tierGood
  if (score >= 60) return styles.tierOk
  return styles.tierLow
}

function ScoreCell({
  taskId,
  score,
  nullReason,
}: {
  taskId: TaskId
  score: number | null
  nullReason: NullReason
}) {
  const taskName = TASK_NAMES[taskId]
  const isNull = score === null

  // null 文脈別メッセージ (UI 設計書 v3 §5-12 / §10-10)
  let nullMessage = ""
  let nullDisplay = "—"
  if (isNull) {
    if (nullReason === "skipped_low_detection") {
      nullMessage = "録音状態が不十分でした"
      nullDisplay = "—"
    } else if (nullReason === "no_bowing_target" && taskId === "bowing") {
      nullMessage = "この曲では対象外"
      nullDisplay = "対象外"
    } else {
      nullDisplay = "—"
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.taskName}>{taskName}</div>
      <div className={styles.scoreLine}>
        {isNull ? (
          <span className={`${styles.nullScore} ${tierClass(null)}`}>{nullDisplay}</span>
        ) : (
          <>
            <span className={`${styles.score} ${tierClass(score)}`}>
              {Math.round(score)}
            </span>
            <span className={styles.unit}>点</span>
          </>
        )}
      </div>
      {nullMessage && <div className={styles.message}>{nullMessage}</div>}
    </div>
  )
}

export default function SkillScoreCard({ scores, nullReason }: Props) {
  return (
    <div className={styles.row}>
      {TASK_IDS.map(taskId => (
        <ScoreCell
          key={taskId}
          taskId={taskId}
          score={scores[taskId]}
          nullReason={nullReason}
        />
      ))}
    </div>
  )
}
