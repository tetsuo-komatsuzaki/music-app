"use client"

import { useState, useTransition } from "react"
import { MessageCircle } from "lucide-react"
import { updateUserName } from "@/app/actions/updateUserName"
import { updateUserEmail } from "@/app/actions/updateUserEmail"
import { updateUserPassword } from "@/app/actions/updateUserPassword"
import { setTeacherEmailOff } from "@/app/actions/updateNotificationPref"
import DeleteAccountModal from "./DeleteAccountModal"
import TeacherLinkCard from "./TeacherLinkCard"
import GoalCard from "./GoalCard"
import PlanCard from "./PlanCard"
import { sendAppFeedback } from "@/app/actions/scoringFeedback"
import styles from "./Settings.module.css"

interface Props {
  userId: string
  initialName: string
  currentEmail: string
  accountDeletionEnabled: boolean
  hasTeacher?: boolean
  teacherEmailOff?: boolean
  billing?: {
    billingEnabled: boolean
    isPlus: boolean
    planStatus: string | null
    periodEnd: string | null
    trialEligible: boolean
  }
}

export default function SettingsClient({
  userId: _userId,
  initialName,
  currentEmail,
  accountDeletionEnabled,
  hasTeacher = false,
  teacherEmailOff = false,
  billing,
}: Props) {
  // 先生からの通知メール: オフ(配信停止)にできる
  const [emailOff, setEmailOff] = useState(teacherEmailOff)
  const [notifyPending, startNotifyTransition] = useTransition()
  const toggleTeacherEmail = () => {
    const next = !emailOff
    setEmailOff(next)
    startNotifyTransition(async () => {
      const r = await setTeacherEmailOff(next)
      if (!r.ok) setEmailOff(!next) // 失敗したら戻す
    })
  }
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

      {/* プラン (課金 Phase 2, 2026-08-07): Stripe 未構成の間は非表示 */}
      {billing && <PlanCard {...billing} />}

      {/* 目標の変更 (2026-08-02): オンボで答えた目標曲/時期/かなえたいこと */}
      <GoalCard />

      {/* 先生とつながる (先生機能 MVP 2026-07-28) */}
      <TeacherLinkCard />

      {/* 通知設定 (先生がいる生徒のみ・2026-08-01) */}
      {hasTeacher && (
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>通知</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#22303c" }}>先生からの通知メール</div>
              <div style={{ fontSize: 12, color: "#8a9099", marginTop: 3, lineHeight: 1.6 }}>
                先生から宿題・添削・メッセージが届いたとき、登録メールにお知らせします。
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!emailOff}
              onClick={toggleTeacherEmail}
              disabled={notifyPending}
              style={{ flex: "none", width: 46, height: 27, borderRadius: 999, border: "none", cursor: "pointer", position: "relative", background: emailOff ? "#cfd4da" : "#34a06a", transition: "background .15s", padding: 0 }}
            >
              <span style={{ position: "absolute", top: 3, left: emailOff ? 3 : 22, width: 21, height: 21, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,.25)", transition: "left .15s" }} />
            </button>
          </div>
          <div style={{ fontSize: 11.5, color: "#9aa6b3", marginTop: 8 }}>
            {emailOff ? "いまはオフ（メールは届きません）" : "いまはオン（メールが届きます）"}
          </div>
        </section>
      )}

      {/* ご意見・要望 (2026-08-03): 改善要望の常設入口。運営メールへ届く */}
      <FeedbackCard />

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

/** ご意見・要望 (2026-08-03): アプリ改善の常設入口。運営メールへ届く */
function FeedbackCard() {
  const [text, setText] = useState("")
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle")
  const [pending, start] = useTransition()
  const send = () => {
    if (!text.trim()) return
    setState("sending")
    start(async () => {
      const r = await sendAppFeedback({ message: text })
      if (r.ok) { setState("done"); setText("") }
      else setState("error")
    })
  }
  return (
    <section style={{ background: "#fff", border: "1px solid #eceff3", borderRadius: 14, padding: "16px 18px", marginBottom: 14 }}>
      <h2 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 4px", color: "#22303c", display: "flex", alignItems: "center", gap: 5 }}><MessageCircle size={16} /> ご意見・要望</h2>
      <p style={{ fontSize: 12, color: "#8a9099", margin: "0 0 10px", lineHeight: 1.6 }}>
        「こうだったらいいのに」「採点がおかしい気がする」— なんでも運営に届きます。アプリはみなさんの声で良くなります。
      </p>
      {state === "done" ? (
        <div style={{ fontSize: 12.5, fontWeight: 800, color: "#2e8b57" }}>届きました！ありがとうございます</div>
      ) : (
        <>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={2000}
            placeholder="例: 演奏履歴の点数が実際より低い気がする / こんな機能がほしい"
            style={{ width: "100%", border: "1px solid #dfe3e8", borderRadius: 9, padding: "9px 11px", fontSize: 13, resize: "vertical" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
            {state === "error" && <span style={{ fontSize: 11.5, color: "#c0392b" }}>送信できませんでした。時間をおいて試してください</span>}
            <button type="button" onClick={send} disabled={pending || !text.trim()}
              style={{ marginLeft: "auto", fontSize: 12.5, fontWeight: 800, color: "#fff", background: "#3555d4", border: "none", borderRadius: 9, padding: "9px 20px", cursor: "pointer", opacity: pending || !text.trim() ? 0.5 : 1 }}>
              {pending ? "送信中…" : "送信する"}
            </button>
          </div>
        </>
      )}
    </section>
  )
}
