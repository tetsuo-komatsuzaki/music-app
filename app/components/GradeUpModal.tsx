// app/components/GradeUpModal.tsx
//
// UI 設計書 v3 §5-8 / §10-8 / §5-13 — グレードアップ通知モーダル
//
// 表示制御:
//   - skill-detail の gradeUpdate.recentlyChanged === true で表示
//   - localStorage キー `arcoda_grade_up_notified_${performanceId}` で「通知済」管理
//   - 一度 OK ボタンを押したら以降は再表示しない (同じ performanceId について)
//   - Esc キー押下でも閉じる (§5-13 キーボード操作)

"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
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
    // localStorage は private mode / quota 超過で throw しうる。
    // 例外で setState が止まるとモーダルが閉じなくなるので try で保護。
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(key, "1")
      } catch {
        /* ignore: 通知済フラグの永続化に失敗してもモーダルは閉じる */
      }
    }
    setManuallyClosed(true)
  }

  // §5-13: Esc キーでモーダルを閉じる。表示中のみリスナーを張る。
  const isVisible = !alreadyNotified && !manuallyClosed && !!newGrade
  useEffect(() => {
    if (!isVisible) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
    // handleClose は外部状態に依存しないので依存配列に含めない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible])

  if (!isVisible) return null

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
