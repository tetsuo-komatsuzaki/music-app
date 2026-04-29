"use client"

import { useState, useTransition } from "react"
import { submitFeedback, FEEDBACK_CATEGORIES } from "@/app/actions/submitFeedback"
import styles from "./Feedback.module.css"

const MAX_MESSAGE_LENGTH = 1000

export default function FeedbackClient({
  defaultEmail,
}: {
  defaultEmail: string
}) {
  const [rating, setRating] = useState<number>(0)
  const [category, setCategory] = useState<string>("")
  const [message, setMessage] = useState<string>("")
  const [contactEmail, setContactEmail] = useState<string>(defaultEmail)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const messageOver = message.length > MAX_MESSAGE_LENGTH
  const canSubmit = !isPending && rating > 0 && category !== "" && message.trim() !== "" && !messageOver

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    startTransition(async () => {
      setFeedback(null)
      const result = await submitFeedback({
        rating,
        category,
        message,
        contactEmail: contactEmail.trim() || undefined,
      })
      if (result.success) {
        setFeedback({
          type: "success",
          text: "フィードバックを受け付けました。貴重なご意見ありがとうございます。",
        })
        setRating(0)
        setCategory("")
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
      <h1 className={styles.title}>フィードバックを送る</h1>
      <p className={styles.intro}>
        サービス改善のため、ご意見・ご要望をお聞かせください。
        いただいた内容は今後の機能改善の参考にさせていただきます。
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <span className={styles.label}>
            総合的な満足度<span className={styles.required}>必須</span>
          </span>
          <div className={styles.ratingRow} role="radiogroup" aria-label="満足度">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n}点`}
                className={`${styles.starButton} ${rating >= n ? styles.starActive : ""}`}
                onClick={() => setRating(n)}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="feedback-category" className={styles.label}>
            カテゴリ<span className={styles.required}>必須</span>
          </label>
          <select
            id="feedback-category"
            className={styles.select}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">選択してください</option>
            {FEEDBACK_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="feedback-message" className={styles.label}>
            ご意見・ご要望<span className={styles.required}>必須</span>
          </label>
          <textarea
            id="feedback-message"
            className={styles.textarea}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="サービスについてのご意見をお聞かせください"
          />
          <div className={`${styles.charCount} ${messageOver ? styles.charCountOver : ""}`}>
            {message.length} / {MAX_MESSAGE_LENGTH}
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="feedback-contact" className={styles.label}>
            連絡先メールアドレス<span className={styles.optional}>任意</span>
          </label>
          <input
            id="feedback-contact"
            type="email"
            className={styles.input}
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="返信が必要な場合のみ入力してください"
          />
          <p className={styles.helperText}>
            返信は保証されません。個別の問い合わせはお問い合わせフォームをご利用ください。
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
