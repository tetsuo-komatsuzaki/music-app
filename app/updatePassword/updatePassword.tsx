"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseClient } from "@/app/_libs/supabase"
import styles from "./page.module.css"

export default function UpdatePasswordPage() {

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setMessage("パスワードが一致しません")
      return
    }

    setIsSubmitting(true)

    const supabase = createSupabaseClient(window.localStorage)

    const { error } = await supabase.auth.updateUser({
      password
    })

    if (error) {
      setMessage("パスワード更新に失敗しました")
      setIsSubmitting(false)
      return
    }

    setMessage("パスワードを更新しました。ログイン画面へ移動します。")

    setTimeout(() => {
      router.push("/login")
    }, 2000)
  }

  return (
    <div className={styles.wrapper}>
      <form className={styles.form} onSubmit={handleSubmit}>

        <h2 className={styles.title}>新しいパスワードを設定</h2>

        <div className={styles.field}>
          <label className={styles.label}>新しいパスワード</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>パスワード（確認）</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isSubmitting}
            className={styles.input}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={styles.button}
        >
          {isSubmitting ? "更新中..." : "パスワードを更新"}
        </button>

        {message && <p className={styles.message}>{message}</p>}

      </form>
    </div>
  )
}