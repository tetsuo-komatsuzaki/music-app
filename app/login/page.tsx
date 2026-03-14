'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css"
import Link from "next/link";
import Image from "next/image";
import { createBrowserSupabaseClient } from "@/app/_libs/supabaseBrowser"



export default function loginPage() {

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)


const supabase = createBrowserSupabaseClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      alert('ログインに失敗しました')
      setIsLoading(false)
      return
    } else {
      const userId = data.user.id
      await supabase.auth.getSession()
      alert('ログインに成功しました')
      router.push(`/${userId}/top`)
    }
  }

  const handleGoogleLogin = async () => {
const supabase = createBrowserSupabaseClient()

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
        アカウントにログインして練習を始めましょう
      </h3>
      <div className={styles.wrapper}>
        <form
          onSubmit={handleSubmit}
          className={styles.form}
        >
          {/* 🎻 モチベーション画像 */}
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

          {/* Googleログイン */}
          <div className={styles.oauthContainer}>
            <button
              type="button"
              className={styles.googleButton}
              onClick={handleGoogleLogin}
            >
              <span className={styles.googleIcon}>G</span>
              Googleでログイン
            </button>
          </div>

          {/* 区切り線 */}
          <div className={styles.divider}>
            <span>または</span>
          </div>

          {/* ここからメールログイン */}
          <div>
            <label
              htmlFor="email"
              className={styles.label}
            >
              メールアドレス
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={email}
              required
              placeholder="メールアドレスを入力してください"
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              disabled={isLoading}
            />
          </div>
          <div
            className={styles.field}>
            <div className={styles.passwordLabelRow}>

              <label
                htmlFor="password"
                className={styles.label}>
                パスワード
              </label>
              <Link href="/forgotPassword" className={styles.link}>
                パスワードを忘れた方はこちら
              </Link>
            </div>
            <input
              type="password"
              name="password"
              id="password"
              value={password}
              placeholder="••••••••"
              required
              disabled={isLoading}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input} />

          </div>
          <div className={styles.remember}>
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
            />
            <label htmlFor="remember">
              ログイン状態を保持する
            </label>
          </div>
          <div
            className={styles.field}>
            <button
              className={styles.button}>
              {isLoading ? "ログイン中..." : "ログイン"}
            </button>
          </div>
          <div>
            アカウントをお持ちでない方は<Link href="/signUp" className={styles.link}>新規登録</Link>
          </div>
        </form>

      </div>
    </>
  )

}