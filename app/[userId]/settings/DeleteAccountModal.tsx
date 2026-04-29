"use client"

import { useState } from "react"
import { requestAccountDeletion } from "@/app/actions/requestAccountDeletion"
import { createBrowserSupabaseClient } from "@/app/_libs/supabaseBrowser"
import styles from "./Settings.module.css"

interface Props {
  open: boolean
  onClose: () => void
}

export default function DeleteAccountModal({ open, onClose }: Props) {
  const [step, setStep] = useState<"confirm" | "password">("confirm")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleClose = () => {
    if (submitting) return  // 削除中は閉じさせない
    setStep("confirm")
    setPassword("")
    setError(null)
    onClose()
  }

  const handleProceed = () => {
    setStep("password")
  }

  const handleBack = () => {
    setStep("confirm")
    setPassword("")
    setError(null)
  }

  const handleSubmit = async () => {
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const result = await requestAccountDeletion({ password })
      if (result.success) {
        const supabase = createBrowserSupabaseClient()
        await supabase.auth.signOut({ scope: "local" })
        window.location.href = "/login?deleted=1"
      } else {
        setError(result.error ?? "予期しないエラー")
        setSubmitting(false)
      }
    } catch (e) {
      console.error(e)
      setError("予期しないエラーが発生しました")
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="退会確認"
      >
        {step === "confirm" ? (
          <>
            <h2 className={styles.modalTitle}>本当に退会しますか?</h2>
            <p className={styles.modalText}>
              退会するとすべてのデータ (録音・楽譜・解析結果・練習履歴) が完全に削除されます。
              <br />
              <strong>この操作は取り消せません。</strong>
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={handleClose}
                className={styles.secondaryButton}
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleProceed}
                className={styles.dangerButton}
              >
                次へ
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className={styles.modalTitle}>パスワード入力</h2>
            <p className={styles.modalText}>
              本人確認のため、現在のパスワードを入力してください。
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="現在のパスワード"
              className={styles.input}
              disabled={submitting}
              autoComplete="current-password"
            />
            {error && (
              <p className={styles.messageError}>{error}</p>
            )}
            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={handleBack}
                disabled={submitting}
                className={styles.secondaryButton}
              >
                ← 戻る
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || password.length === 0}
                className={styles.dangerButton}
              >
                {submitting ? "退会処理中..." : "退会する"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
