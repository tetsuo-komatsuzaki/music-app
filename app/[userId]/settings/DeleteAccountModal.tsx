"use client"

// 退会 (審査 5.1.1(v): アカウント作成があるアプリはアプリ内で削除できること)。
// 2026-09-12 要件整理 v2.7 §6: Sign in with Apple の人にはパスワードが無いので、本人確認を「退会 と入力」に切り替える。
// Apple の契約は退会しても自動では止まらないので、その案内を本文に出す。
import { useEffect, useState } from "react"
import { requestAccountDeletion } from "@/app/actions/requestAccountDeletion"
import { createBrowserSupabaseClient } from "@/app/_libs/supabaseBrowser"
import { clearKnownUser } from "@/app/_libs/knownUser"
import styles from "./Settings.module.css"

interface Props {
  open: boolean
  onClose: () => void
}

const CONFIRM_WORD = "退会"

export default function DeleteAccountModal({ open, onClose }: Props) {
  const [step, setStep] = useState<"confirm" | "verify">("confirm")
  const [password, setPassword] = useState("")
  const [word, setWord] = useState("")
  const [hasPassword, setHasPassword] = useState<boolean | null>(null)
  const [hasApple, setHasApple] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // どの本人確認を出すか: email (パスワード) の identity があるかで決める
  useEffect(() => {
    if (!open) return
    const supabase = createBrowserSupabaseClient()
    supabase.auth.getUser().then(({ data }) => {
      const providers = (data.user?.app_metadata?.providers as string[] | undefined) ?? []
      setHasPassword(providers.includes("email"))
      setHasApple(providers.includes("apple"))
    }).catch(() => setHasPassword(true))
  }, [open])

  if (!open) return null

  const handleClose = () => {
    if (submitting) return  // 削除中は閉じさせない
    setStep("confirm")
    setPassword("")
    setWord("")
    setError(null)
    onClose()
  }

  const canSubmit = hasPassword === false ? word.trim() === CONFIRM_WORD : password.length > 0

  const handleSubmit = async () => {
    if (submitting || !canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const result = await requestAccountDeletion(hasPassword === false ? { confirmWord: word.trim() } : { password })
      if (result.success) {
        const supabase = createBrowserSupabaseClient()
        await supabase.auth.signOut({ scope: "local" })
        clearKnownUser()   // 端末に残した「この端末でログインした人」の記録も消す (案B)
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
            {hasApple && (
              <p className={styles.modalText} data-testid="delete-apple-note">
                Apple の契約は自動では止まりません。退会のあと、iPhone の設定 › サブスクリプション から解約してください。
              </p>
            )}
            <div className={styles.modalActions}>
              <button type="button" onClick={handleClose} className={styles.secondaryButton}>キャンセル</button>
              <button type="button" onClick={() => setStep("verify")} className={styles.dangerButton} disabled={hasPassword === null}>次へ</button>
            </div>
          </>
        ) : hasPassword === false ? (
          <>
            <h2 className={styles.modalTitle}>本人確認</h2>
            <p className={styles.modalText}>Apple でサインインしたアカウントです。確認のため「{CONFIRM_WORD}」と入力してください。</p>
            <input
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder={CONFIRM_WORD}
              className={styles.input}
              disabled={submitting}
              autoComplete="off"
              data-testid="delete-confirm-word"
            />
            {error && <p className={styles.messageError}>{error}</p>}
            <div className={styles.modalActions}>
              <button type="button" onClick={() => { setStep("confirm"); setWord(""); setError(null) }} disabled={submitting} className={styles.secondaryButton}>← 戻る</button>
              <button type="button" onClick={handleSubmit} disabled={submitting || !canSubmit} className={styles.dangerButton}>{submitting ? "退会処理中..." : "退会する"}</button>
            </div>
          </>
        ) : (
          <>
            <h2 className={styles.modalTitle}>パスワード入力</h2>
            <p className={styles.modalText}>本人確認のため、現在のパスワードを入力してください。</p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="現在のパスワード"
              className={styles.input}
              disabled={submitting}
              autoComplete="current-password"
            />
            {error && <p className={styles.messageError}>{error}</p>}
            <div className={styles.modalActions}>
              <button type="button" onClick={() => { setStep("confirm"); setPassword(""); setError(null) }} disabled={submitting} className={styles.secondaryButton}>← 戻る</button>
              <button type="button" onClick={handleSubmit} disabled={submitting || !canSubmit} className={styles.dangerButton}>{submitting ? "退会処理中..." : "退会する"}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
