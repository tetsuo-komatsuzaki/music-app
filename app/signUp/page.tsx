"use client"

import { createSupabaseClient } from "@/app/_libs/supabase"
import { useState } from "react"
import styles from "./page.module.css"
import Link from "next/link"
import Image from "next/image"
import { signUpAction } from "../actions/signUpAction"



const MIN_PASSWORD_LEN = 8

export default function loginPage() {

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [plan, setPlan] = useState("")
  const [agree, setAgree] = useState(false)
  const [isSubmitting, setSubmitting] = useState(false)

  // 入力中のリアルタイム検証（送信前にユーザーが要件を把握できるようにする）
  const isPasswordLongEnough = password.length >= MIN_PASSWORD_LEN
  const passwordsMatch =
    confirmPassword.length === 0 || password === confirmPassword

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    if (!isPasswordLongEnough) {
      alert(`パスワードは${MIN_PASSWORD_LEN}文字以上で入力してください`)
      return
    }

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
          alt="アルコのアイコン"
          width={120}
          height={120}
          priority
        />
      </div>
      <h2 className={styles.title}>はじめまして、アルコだよ</h2>
      <h3 className={styles.subtitle}>
        きみの音を、きみの曲に。
      </h3>
      <h3 className={styles.subtitle}>
        上達が、目に見える。だから続く。
      </h3>
      <div className={styles.heroImageWrapper}>
        <Image
          src="/top.png"
          alt="バイオリンを弾く女の子"
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
              minLength={MIN_PASSWORD_LEN}
              aria-describedby="password-hint"
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              className={`${styles.input} ${
                password.length > 0 && !isPasswordLongEnough ? styles.inputError : ""
              }`} />
            <p
              id="password-hint"
              className={`${styles.hint} ${
                isPasswordLongEnough ? styles.hintOk : ""
              }`}
            >
              {isPasswordLongEnough
                ? `✓ ${MIN_PASSWORD_LEN}文字以上を満たしています`
                : `${MIN_PASSWORD_LEN}文字以上で入力してください`}
            </p>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>パスワード（確認）</label>
            <input
              type="password"
              value={confirmPassword}
              required
              aria-describedby="confirm-password-error"
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
              className={`${styles.input} ${
                !passwordsMatch ? styles.inputError : ""
              }`}
              placeholder="パスワードを再入力"
            />
            {!passwordsMatch && (
              <p id="confirm-password-error" className={styles.error}>
                パスワードが一致しません
              </p>
            )}
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