"use client"

import { useState, useTransition } from "react"
import { updateUserName } from "@/app/actions/updateUserName"
import styles from "./Settings.module.css"

interface Props {
  userId: string
  initialName: string
  currentEmail: string
  aiTrainingOptIn: boolean
  accountDeletionEnabled: boolean
}

export default function SettingsClient({
  userId: _userId,
  initialName,
  currentEmail,
  aiTrainingOptIn,
  accountDeletionEnabled,
}: Props) {
  const [name, setName] = useState(initialName)
  const [savedName, setSavedName] = useState(initialName)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

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
          <button type="button" className={styles.secondaryButton} disabled>
            変更 (近日公開)
          </button>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>パスワード</label>
          <button type="button" className={styles.secondaryButton} disabled>
            パスワードを変更 (近日公開)
          </button>
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

      {/* プライバシー (Commit 4 で機能化) */}
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>プライバシー</h2>
        <div className={styles.toggleRow}>
          <div className={styles.toggleText}>
            <p className={styles.toggleLabel}>AI 学習への利用</p>
            <p className={styles.toggleHint}>
              録音データを Arcoda の演奏解析エンジンの精度向上に利用します。
              この設定をオンにした以降の新規録音のみが対象です。
            </p>
          </div>
          <input
            type="checkbox"
            checked={aiTrainingOptIn}
            disabled
            className={styles.toggle}
            aria-label="AI 学習への利用"
          />
        </div>
        <p className={styles.fieldHint}>(近日公開)</p>
      </section>

      {/* アカウント管理 (Commit 7 で機能化) */}
      {accountDeletionEnabled && (
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>アカウント管理</h2>
          <p className={styles.dangerHint}>
            退会するとすべてのデータ (録音・楽譜・解析結果) が完全に削除されます。
            復旧はできません。
          </p>
          <button type="button" className={styles.dangerButton} disabled>
            退会する (近日公開)
          </button>
        </section>
      )}
    </div>
  )
}
