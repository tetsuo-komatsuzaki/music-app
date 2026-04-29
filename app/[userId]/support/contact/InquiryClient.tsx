"use client"

import { useState, useTransition } from "react"
import { submitInquiry, INQUIRY_CATEGORIES } from "@/app/actions/submitInquiry"
import styles from "./Inquiry.module.css"

const MAX_SUBJECT_LENGTH = 100
const MAX_MESSAGE_LENGTH = 2000

export default function InquiryClient({
  defaultEmail,
}: {
  defaultEmail: string
}) {
  const [category, setCategory] = useState<string>("")
  const [subject, setSubject] = useState<string>("")
  const [message, setMessage] = useState<string>("")
  const [replyTo, setReplyTo] = useState<string>(defaultEmail)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const subjectOver = subject.length > MAX_SUBJECT_LENGTH
  const messageOver = message.length > MAX_MESSAGE_LENGTH
  const canSubmit =
    !isPending &&
    category !== "" &&
    subject.trim() !== "" &&
    message.trim() !== "" &&
    replyTo.trim() !== "" &&
    !subjectOver &&
    !messageOver

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    startTransition(async () => {
      setFeedback(null)
      const result = await submitInquiry({
        category,
        subject,
        message,
        replyTo,
      })
      if (result.success) {
        setFeedback({
          type: "success",
          text: "お問い合わせを受け付けました。返信までしばらくお待ちください。",
        })
        setCategory("")
        setSubject("")
        setMessage("")
      } else {
        setFeedback({
          type: "error",
          text: result.error ?? "送信に失敗しました。時間をおいて再試行してください。",
        })
      }
    })
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>お問い合わせ</h1>
      <p className={styles.intro}>
        サポートチームへのご連絡フォームです。
        ご返信は返信先メールアドレス宛にお送りします。内容により返信にお時間をいただく場合があります。
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="inquiry-category" className={styles.label}>
            カテゴリ<span className={styles.required}>必須</span>
          </label>
          <select
            id="inquiry-category"
            className={styles.select}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">選択してください</option>
            {INQUIRY_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="inquiry-subject" className={styles.label}>
            件名<span className={styles.required}>必須</span>
          </label>
          <input
            id="inquiry-subject"
            type="text"
            className={styles.input}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="お問い合わせの件名"
          />
          <div className={`${styles.charCount} ${subjectOver ? styles.charCountOver : ""}`}>
            {subject.length} / {MAX_SUBJECT_LENGTH}
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="inquiry-message" className={styles.label}>
            本文<span className={styles.required}>必須</span>
          </label>
          <textarea
            id="inquiry-message"
            className={styles.textarea}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="お問い合わせ内容を具体的にご記入ください"
          />
          <div className={`${styles.charCount} ${messageOver ? styles.charCountOver : ""}`}>
            {message.length} / {MAX_MESSAGE_LENGTH}
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="inquiry-replyto" className={styles.label}>
            返信先メールアドレス<span className={styles.required}>必須</span>
          </label>
          <input
            id="inquiry-replyto"
            type="email"
            className={styles.input}
            value={replyTo}
            onChange={(e) => setReplyTo(e.target.value)}
            placeholder="example@example.com"
          />
          <p className={styles.helperText}>
            ログイン中のメールアドレスを初期値にしています。別のアドレスへの返信をご希望の場合は変更してください。
          </p>
        </div>

        {feedback && (
          <div className={`${styles.message} ${feedback.type === "success" ? styles.success : styles.error}`}>
            {feedback.text}
          </div>
        )}

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={!canSubmit}
          >
            {isPending ? "送信中..." : "送信する"}
          </button>
        </div>
      </form>
    </div>
  )
}
