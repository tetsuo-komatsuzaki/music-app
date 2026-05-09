// app/components/PerformanceDeleteModal.tsx
//
// UI 設計書 v3 §5-7 / §5-12 — 演奏削除確認モーダル
//
// 動作:
//   - DELETE /api/practice-performances/[performanceId] を呼び出し
//   - 成功時: onDeleted(performanceId) を呼んで親に通知 + モーダル閉鎖
//   - 409 (analysisStatus=processing): モーダル内エラー表示、再試行可
//   - 404: 既に削除済みとみなして onDeleted を呼んでクライアント状態を整合
//   - その他: モーダル内エラー表示、再試行可
//   - DELETE 中はボタン無効化 + スピナー表示 (連打防止)
//   - Esc / 外側クリックで閉鎖 (削除中は無効)

"use client"

import { useEffect, useState } from "react"
import styles from "./PerformanceDeleteModal.module.css"

type Props = {
  performanceId: string
  open: boolean
  onClose: () => void
  /** 削除成功時 (または 404 で既削除を検知した時) に呼ばれる。 */
  onDeleted: (performanceId: string) => void
}

type ErrorState =
  | null
  | { kind: "in_progress" | "other"; message: string }

export default function PerformanceDeleteModal({
  performanceId,
  open,
  onClose,
  onDeleted,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ErrorState>(null)

  // モーダル open 時に前回エラーを必ずクリア
  useEffect(() => {
    if (open) setError(null)
  }, [open])

  // Esc 閉鎖 (削除中は無効)
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, loading, onClose])

  if (!open) return null

  const handleConfirm = async () => {
    if (loading) return // 連打防止
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/practice-performances/${performanceId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        onDeleted(performanceId)
        onClose()
        return
      }
      if (res.status === 409) {
        setError({
          kind: "in_progress",
          message: "解析中のため削除できません。完了後にもう一度お試しください。",
        })
      } else if (res.status === 404) {
        // 既に削除済み: クライアント状態を整合 (親が一覧から除外する)
        onDeleted(performanceId)
        onClose()
      } else {
        const text = await res.text().catch(() => `HTTP ${res.status}`)
        setError({ kind: "other", message: `削除に失敗しました (${text})` })
      }
    } catch (e) {
      setError({
        kind: "other",
        message: `削除に失敗しました (${e instanceof Error ? e.message : String(e)})`,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !loading) onClose()
  }

  return (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div className={styles.modal}>
        <h2 id="delete-modal-title" className={styles.title}>
          この演奏を削除しますか？
        </h2>
        <p className={styles.message}>
          削除すると元に戻せません。
          <br />
          スコアやカードのデータも更新されます。
        </p>
        {error && (
          <div className={styles.errorBox} role="alert">
            {error.message}
          </div>
        )}
        <div className={styles.buttonRow}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
            disabled={loading}
          >
            キャンセル
          </button>
          <button
            type="button"
            className={styles.deleteButton}
            onClick={handleConfirm}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <span className={styles.spinner} aria-hidden="true" />
                削除中です...
              </>
            ) : (
              "削除する"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
