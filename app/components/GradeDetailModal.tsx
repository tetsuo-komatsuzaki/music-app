// app/components/GradeDetailModal.tsx
//
// UI 設計書 v3.1 §6-3 / §11-1 / §9-3 (C8) — グレードバッジタップで開く詳細モーダル
//
// 表示要素:
//   - 現グレード (絵文字 + 人称名)
//   - MASTER の場合: 「マスター達成おめでとう」風メッセージ
//   - それ以外: 累計進捗 + 次グレード達成条件 (難易度別) + 説明文
//   - 達成日 (achievedAt)
//
// 閉鎖手段 (C8: GradeDetailModal は 3 通り全て):
//   - Esc キー
//   - 背景オーバーレイクリック
//   - 「閉じる」ボタン

"use client"

import { useEffect } from "react"
import { GRADE_NAMES, type GradeLevel } from "@/app/_libs/skillMaster"
import styles from "./GradeDetailModal.module.css"

const GRADE_EMOJI: Record<GradeLevel, string> = {
  BEGINNER: "🌱",
  INTERMEDIATE: "🌿",
  ADVANCED: "🌳",
  MASTER: "🏆",
}

export type GradeDetailData = {
  currentGrade: GradeLevel
  achievedAt: string | null
  nextGrade: GradeLevel | null
  remainingCount: number
  nextGradeDetails: Record<
    string,
    { completed: number; required: number; remaining: number }
  >
}

type Props = {
  open: boolean
  onClose: () => void
  data: GradeDetailData
}

export default function GradeDetailModal({ open, onClose, data }: Props) {
  // Esc 閉鎖 (C8)
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  const isMaster = data.currentGrade === "MASTER"

  // 累計進捗を計算 (次グレード対象の難易度のみ)
  const detailEntries = Object.entries(data.nextGradeDetails)
  const totalCompleted = detailEntries.reduce(
    (sum, [, d]) => sum + d.completed,
    0,
  )
  const totalRequired = detailEntries.reduce(
    (sum, [, d]) => sum + d.required,
    0,
  )
  const overallPercent =
    totalRequired > 0
      ? Math.min(100, (totalCompleted / totalRequired) * 100)
      : 0
  const requiredPerDifficulty = detailEntries[0]?.[1]?.required ?? 10

  return (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="grade-detail-title"
    >
      <div className={styles.modal}>
        <header className={styles.header}>
          <span className={styles.emoji} aria-hidden="true">
            {GRADE_EMOJI[data.currentGrade]}
          </span>
          <h2 id="grade-detail-title" className={styles.title}>
            {GRADE_NAMES[data.currentGrade]}
          </h2>
        </header>

        {isMaster ? (
          <div className={styles.masterMessage}>
            🎉 マスター達成おめでとうございます！
            <br />
            すべての難易度を踏破しました。
            <br />
            これからも自分のペースで音楽を楽しんでください。
          </div>
        ) : (
          <>
            <section className={styles.section}>
              <div className={styles.sectionTitle}>累計進捗</div>
              <div
                className={styles.overallBar}
                role="progressbar"
                aria-valuenow={totalCompleted}
                aria-valuemax={totalRequired}
                aria-valuemin={0}
                aria-label="累計進捗"
              >
                <div
                  className={styles.overallFill}
                  style={{ width: `${overallPercent}%` }}
                />
              </div>
              <div className={styles.overallCount}>
                {totalCompleted} / {totalRequired} 曲達成
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionTitle}>
                次のグレード:{" "}
                {data.nextGrade ? GRADE_NAMES[data.nextGrade] : "—"}
              </div>
              <div className={styles.detailList}>
                {detailEntries.map(([d, entry]) => {
                  const percent =
                    entry.required > 0
                      ? Math.min(100, (entry.completed / entry.required) * 100)
                      : 0
                  return (
                    <div key={d} className={styles.detailRow}>
                      <span className={styles.detailLabel}>難易度 {d}</span>
                      <div className={styles.detailBar}>
                        <div
                          className={styles.detailFill}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className={styles.detailCount}>
                        {entry.completed}/{entry.required}
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>

            <p className={styles.note}>
              各難易度から {requiredPerDifficulty} 曲ずつ、
              <br />
              3 つのスキル全てが 90 点以上で達成すると次のグレードに進みます。
            </p>
          </>
        )}

        {data.achievedAt && (
          <p className={styles.achievedAt}>
            現在のグレード達成日:{" "}
            {new Date(data.achievedAt).toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}

        <div className={styles.buttonRow}>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}
