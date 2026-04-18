"use client"

import { useState } from "react"
import { createSupabaseClient } from "@/app/_libs/supabase"
import styles from "./page.module.css"
import Link from "next/link"

export default function ForgotPasswordPage() {

  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const supabase = createSupabaseClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:3000/updatePassword"
    })

    if (error) {
      setMessage("送信に失敗しました")
    } else {
      setMessage("パスワードリセット用のメールを送信しました。")
      setEmail("")
    }

    setIsSubmitting(false)
  }

  return (
    <div className={styles.wrapper}>
      <form className={styles.form} onSubmit={handleSubmit}>

        <h2 className={styles.title}>パスワードをお忘れですか？</h2>
        <h3 className={styles.subtitle}>登録されたメールアドレスにパスワードリセット用のリンクを送信します</h3>

        <div className={styles.field}>
          <label htmlFor="email" className={styles.label}>
            メールアドレス
          </label>
          <input
            type="email"
            id="email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            className={styles.input}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={styles.button}
        >
          {isSubmitting ? "送信中..." : "リセットメールを送信"}
        </button>

        {message && <p className={styles.message}>{message}</p>}

        <Link href="/login" className={styles.link}>
          ログイン画面へ戻る
        </Link>

      </form>
    </div>
  )
}