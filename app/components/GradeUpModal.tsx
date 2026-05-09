// app/components/GradeUpModal.tsx
//
// UI 設計書 v3 §5-8 / §10-8 — グレードアップ通知モーダル
//
// 表示制御:
//   - skill-detail の gradeUpdate.recentlyChanged === true で表示
//   - localStorage キー `arcoda_grade_up_notified_${performanceId}` で「通知済」管理
//   - 一度 OK ボタンを押したら以降は再表示しない (同じ performanceId について)

"use client"

import { useState, useSyncExternalStore } from "react"
import { GRADE_NAMES, type GradeLevel } from "@/app/_libs/skillMaster"
import styles from "./GradeUpModal.module.css"

const STORAGE_KEY_PREFIX = "arcoda_grade_up_notified_"

type Props = {
  performanceId: string
  previousGrade?: string
  newGrade?: string
}

const isGradeLevel = (v: string | undefined): v is GradeLevel =>
  v === "BEGINNER" || v === "INTERMEDIATE" || v === "ADVANCED" || v === "MASTER"

function gradeLabel(v: string | undefined): string {
  if (!isGradeLevel(v)) return v ?? ""
  return GRADE_NAMES[v]
}

// useSyncExternalStore 用: localStorage は外部状態として扱う。subscribe は no-op
// (ユーザー手動 close での再描画は useState で別管理)。
function subscribeNoop() {
  return () => {}
}
function readNotified(key: string): boolean {
  if (typeof window === "undefined") return true // SSR は表示しない (デフォルト hide)
  return window.localStorage.getItem(key) !== null
}

export default function GradeUpModal({ performanceId, previousGrade, newGrade }: Props) {
  const key = STORAGE_KEY_PREFIX + performanceId
  // localStorage の「通知済」フラグ
  const alreadyNotified = useSyncExternalStore(
    subscribeNoop,
    () => readNotified(key),
    () => true,
  )
  // 当画面で OK を押して閉じたかどうか
  const [manuallyClosed, setManuallyClosed] = useState(false)

  const handleClose = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, "1")
    }
    setManuallyClosed(true)
  }

  if (alreadyNotified || manuallyClosed) return null
  if (!newGrade) return null // 念のため: newGrade なしなら表示しない

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="grade-up-title">
      <div className={styles.modal}>
        <h2 id="grade-up-title" className={styles.title}>🎉 グレードアップ!</h2>
        <div className={styles.gradeTransition}>
          {previousGrade && (
            <>
              <span className={styles.previousGrade}>{gradeLabel(previousGrade)}</span>
              <span className={styles.arrow}>→</span>
            </>
          )}
          <span className={styles.newGrade}>{gradeLabel(newGrade)}</span>
        </div>
        <p className={styles.message}>
          おめでとうございます。
          <br />
          素晴らしい上達です。
        </p>
        <button type="button" className={styles.okButton} onClick={handleClose}>
          OK
        </button>
      </div>
    </div>
  )
}
