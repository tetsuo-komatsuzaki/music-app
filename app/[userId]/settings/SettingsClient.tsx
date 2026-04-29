"use client"

import { useState, useTransition } from "react"
import { updateUserName } from "@/app/actions/updateUserName"
import { updateUserEmail } from "@/app/actions/updateUserEmail"
import { updateUserPassword } from "@/app/actions/updateUserPassword"
import DeleteAccountModal from "./DeleteAccountModal"
import styles from "./Settings.module.css"

interface Props {
  userId: string
  initialName: string
  currentEmail: string
  accountDeletionEnabled: boolean
}

export default function SettingsClient({
  userId: _userId,
  initialName,
  currentEmail,
  accountDeletionEnabled,
}: Props) {
  const [name, setName] = useState(initialName)
  const [savedName, setSavedName] = useState(initialName)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const [emailEditing, setEmailEditing] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [emailMessage, setEmailMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isEmailPending, startEmailTransition] = useTransition()

  const [passwordEditing, setPasswordEditing] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isPasswordPending, startPasswordTransition] = useTransition()

  const handlePasswordSave = () => {
    setPasswordMessage(null)

    // クライアントサイド事前バリデーション (UX 改善のみ、Server Action でも再チェック)
    if (currentPassword.length === 0) {
      setPasswordMessage({ type: "error", text: "現在のパスワードを入力してください" })
      return
    }
    if (newPassword.length < 8) {
      setPasswordMessage({ type: "error", text: "新しいパスワードは8文字以上で入力してください" })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "新しいパスワード (確認) が一致しません" })
      return
    }

    startPasswordTransition(async () => {
      const result = await updateUserPassword({ currentPassword, newPassword })
      if (result.success) {
        setPasswordMessage({ type: "success", text: "パスワードを変更しました" })
        setPasswordEditing(false)
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        setPasswordMessage({ type: "error", text: result.error ?? "変更に失敗しました" })
      }
    })
  }

  const handlePasswordCancel = () => {
    setPasswordEditing(false)
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setPasswordMessage(null)
  }

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  const handleEmailSave = () => {
    setEmailMessage(null)
    startEmailTransition(async () => {
      const result = await updateUserEmail({ newEmail })
      if (result.success) {
        setEmailMessage({
          type: "success",
          text: "新しいメールアドレスに確認メールを送信しました。届いた確認リンクをクリックすると変更が完了します。",
        })
        setEmailEditing(false)
        setNewEmail("")
      } else {
        setEmailMessage({ type: "error", text: result.error ?? "送信に失敗しました" })
      }
    })
  }

  const handleEmailCancel = () => {
    setEmailEditing(false)
    setNewEmail("")
    setEmailMessage(null)
  }

  const isDirty = name.trim() !== savedName && name.trim().length > 0
  const isTooLong = name.length > 30

  const handleSave = () => {
    setMessage(null)
    startTransition(async () => {
      const result = await updateUserName({ name })
      if (result.success) {
        setSavedName(name.trim())
        setMessage({ type: "success", text: "表示名を保存しました" })
      } else {
        setMessage({ type: "error", text: result.error ?? "保存に失敗しました" })
      }
    })
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>設定</h1>

      {/* アカウント情報 */}
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>アカウント情報</h2>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="settings-name">表示名</label>
          <div className={styles.inputRow}>
            <input
              id="settings-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              maxLength={50}
              disabled={isPending}
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || isTooLong || isPending}
              className={styles.primaryButton}
            >
              {isPending ? "保存中..." : "保存"}
            </button>
          </div>
          {isTooLong && (
            <p className={styles.fieldError}>30 文字以内で入力してください</p>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>メールアドレス</label>
          <p className={styles.readOnlyValue}>{currentEmail}</p>
          {!emailEditing ? (
            <button
              type="button"
              onClick={() => setEmailEditing(true)}
              className={styles.secondaryButton}
            >
              変更
            </button>
          ) : (
            <div className={styles.editForm}>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="新しいメールアドレス"
                className={styles.input}
                disabled={isEmailPending}
                autoComplete="email"
              />
              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={handleEmailSave}
                  disabled={isEmailPending || newEmail.trim().length === 0}
                  className={styles.primaryButton}
                >
                  {isEmailPending ? "送信中..." : "確認メールを送信"}
                </button>
                <button
                  type="button"
                  onClick={handleEmailCancel}
                  disabled={isEmailPending}
                  className={styles.secondaryButton}
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
          {emailMessage && (
            <p
              className={
                emailMessage.type === "success" ? styles.messageSuccess : styles.messageError
              }
            >
              {emailMessage.text}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>パスワード</label>
          {!passwordEditing ? (
            <button
              type="button"
              onClick={() => setPasswordEditing(true)}
              className={styles.secondaryButton}
            >
              パスワードを変更
            </button>
          ) : (
            <div className={styles.editForm}>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="現在のパスワード"
                className={styles.input}
                disabled={isPasswordPending}
                autoComplete="current-password"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="新しいパスワード (8文字以上)"
                className={styles.input}
                disabled={isPasswordPending}
                autoComplete="new-password"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="新しいパスワード (確認)"
                className={styles.input}
                disabled={isPasswordPending}
                autoComplete="new-password"
              />
              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={handlePasswordSave}
                  disabled={
                    isPasswordPending
                    || currentPassword.length === 0
                    || newPassword.length === 0
                    || confirmPassword.length === 0
                  }
                  className={styles.primaryButton}
                >
                  {isPasswordPending ? "変更中..." : "変更する"}
                </button>
                <button
                  type="button"
                  onClick={handlePasswordCancel}
                  disabled={isPasswordPending}
                  className={styles.secondaryButton}
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
          {passwordMessage && (
            <p
              className={
                passwordMessage.type === "success" ? styles.messageSuccess : styles.messageError
              }
            >
              {passwordMessage.text}
            </p>
          )}
        </div>

        {message && (
          <p
            className={
              message.type === "success" ? styles.messageSuccess : styles.messageError
            }
          >
            {message.text}
          </p>
        )}
      </section>

      {/* アカウント管理 */}
      {accountDeletionEnabled && (
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>アカウント管理</h2>
          <p className={styles.dangerHint}>
            退会するとすべてのデータ (録音・楽譜・解析結果・練習履歴) が完全に削除されます。
            復旧はできません。
          </p>
          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            className={styles.dangerButton}
          >
            退会する
          </button>
        </section>
      )}

      <DeleteAccountModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
      />
    </div>
  )
}
