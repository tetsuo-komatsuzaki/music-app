// app/components/CandidateSelector.tsx
//
// UI 設計書 v3 §5-5 / §5-12 — 候補選択 3 ボタン横並び
//
// 動作:
//   - 「✓ これだ」「違う」「? 分からない」の 3 ボタンを横並び
//   - クリックは親 (ProblematicPositionList) にイベント転送するだけ
//   - 候補が複数の場合のモーダル開閉は親が制御
//   - 楽観的更新の現在状態 (currentFeedback) を視覚反映 (✓ / × / ? マーク)

"use client"

import styles from "./CandidateSelector.module.css"

export type LocalFeedback =
  | { type: "user_selected"; subTaskId: string }
  | { type: "user_rejected" }
  | { type: "user_uncertain" }

type Props = {
  currentFeedback: LocalFeedback | null
  onClickConfirm: () => void
  onClickReject: () => void
  onClickUncertain: () => void
}

export default function CandidateSelector({
  currentFeedback,
  onClickConfirm,
  onClickReject,
  onClickUncertain,
}: Props) {
  const isSelected = currentFeedback?.type === "user_selected"
  const isRejected = currentFeedback?.type === "user_rejected"
  const isUncertain = currentFeedback?.type === "user_uncertain"

  return (
    <div className={styles.row} role="group" aria-label="候補のフィードバック">
      <button
        type="button"
        className={`${styles.button} ${styles.confirm} ${isSelected ? styles.confirmActive : ""}`}
        onClick={onClickConfirm}
        aria-pressed={isSelected}
      >
        <span className={styles.icon} aria-hidden="true">
          ✓
        </span>
        これだ
      </button>
      <button
        type="button"
        className={`${styles.button} ${styles.reject} ${isRejected ? styles.rejectActive : ""}`}
        onClick={onClickReject}
        aria-pressed={isRejected}
      >
        <span className={styles.icon} aria-hidden="true">
          ×
        </span>
        違う
      </button>
      <button
        type="button"
        className={`${styles.button} ${styles.uncertain} ${isUncertain ? styles.uncertainActive : ""}`}
        onClick={onClickUncertain}
        aria-pressed={isUncertain}
      >
        <span className={styles.icon} aria-hidden="true">
          ?
        </span>
        分からない
      </button>
    </div>
  )
}
