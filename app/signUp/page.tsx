"use client"

import { createSupabaseClient } from "@/app/_libs/supabase"
import { useState } from "react"
import styles from "./page.module.css"
import Link from "next/link"
import Image from "next/image"
import { signUpAction } from "../actions/signUpAction"



export default function loginPage() {

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [plan, setPlan] = useState("")
  const [agree, setAgree] = useState(false)
  const [isSubmitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    if (password !== confirmPassword) {
      alert("パスワードが一致しません")
      return
    }

    if (!agree) {
      alert("利用規約とプライバシーポリシーに同意してください")
      return
    }
    const result = await signUpAction(formData)

    // 🔹 エラー処理
    if (result?.error) {
      alert(result.error)
      return
    }

    // メール確認が必要なため、ログイン画面に直接遷移しない
    alert(result.message ?? "確認メールを送信しました。メールを確認してログインしてください。")
}




  const handleGoogleContinue = async () => {
    const supabase = createSupabaseClient()

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
  }



  return (
    <>
      <div className={styles.logoContainer}>
        <Image
          src="/Icon.png"
          alt="App Icon"
          width={120}
          height={120}
          priority
        />
      </div>
      <h2 className={styles.title}>バイオリン学習アプリへようこそ</h2>
      <h3 className={styles.subtitle}>
        バイオリン表現力向上支援サービスへようこそ
      </h3>
      <h3 className={styles.subtitle}>
        演奏分析と可視化で、あなたの演奏を次のレベルへ
      </h3>
      <div className={styles.heroImageWrapper}>
        <Image
          src="/top.png"
          alt="Violin Motivation"
          width={500}
          height={280}
          className={styles.heroImage}
          priority
        />
      </div>

      {/* Googleで続ける */}
      <div className={styles.oauthContainer}>
        <button
          type="button"
          className={styles.googleButton}
          onClick={handleGoogleContinue}
        >
          <span className={styles.googleIcon}>G</span>
          Googleで続ける
        </button>
      </div>

      <div className={styles.divider}>
        <span>または</span>
      </div>

      <div className={styles.wrapper}>
        <form
          className={styles.form}
          onSubmit={handleSubmit}
          >

          <div className={styles.field}>
            <label className={styles.label}>ユーザー名</label>
            <input
              type="text"
              value={username}
              required
              name="name"
              onChange={(e) => setUsername(e.target.value)}
              disabled={isSubmitting}
              className={styles.input}
              placeholder="山田 太郎"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>
              メールアドレス
            </label >
            <input
              type="text"
              name="email"
              id="email"
              value={email}
              placeholder="メールアドレスを入力してください"
              required
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              className={styles.input} />
          </div>
          <div className={styles.field}>
            <label htmlFor="plan" className={styles.label}>
              プラン
            </label >
            <select
              name="plan"
              id="plan"
              value={plan}
              required
              onChange={(e) => setPlan(e.target.value)}
              disabled={isSubmitting}
              className={styles.input}
            >
              <option value="">プランを選択してください</option>
              <option value="free">無料プラン</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>
              パスワード
            </label>
            <input
              type="password"
              name="password"
              id="password"
              value={password}
              placeholder="パスワードを入力してください"
              required
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              className={styles.input} />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>パスワード（確認）</label>
            <input
              type="password"
              value={confirmPassword}
              required
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
              className={styles.input}
              placeholder="パスワードを再入力"
            />
          </div>

          <div className={styles.field}>
            <button
              type="submit"
              disabled={isSubmitting}
              className={styles.button}>
              アカウントを作成する
            </button>
          </div>
          <div className={styles.checkboxField}>
            <input
              type="checkbox"
              id="agree"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              disabled={isSubmitting}
              required
            />
            <label htmlFor="agree">
              <Link href="/terms" className={styles.link}>利用規約</Link> および
              <Link href="/privacy" className={styles.link}> プライバシーポリシー</Link>
              に同意します
            </label>
          </div>

          <div>
            すでにアカウントをお持ちの方は<Link href="/login" className={styles.link}>ログイン</Link>
          </div>
        </form>

      </div>
    </>
  )
}