'use client'

// ログイン — 原本: /proto v3 画面1 (login-mock 正) の写経 (2026-08-23)。
// メダリオンのアルコ(09B 手をふって挨拶) ・ 明朝見出し ・ 金グラデボタン ・ リンク行+縦区切り。
// 既存機能は維持: Googleログイン(原本に無いためmute枠) ・ パスワード表示切替 ・ 遷移ロジック。
// 廃止: モチベーション画像(top.png) ・ 未結線だった「ログイン状態を保持する」チェック。
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css"
import Link from "next/link";
import ArcoMotion from "@/app/components/ArcoMotion"
import { createBrowserSupabaseClient } from "@/app/_libs/supabaseBrowser"
import { isNativeApp } from "@/app/_libs/isNativeApp"
import { isAppleBilling } from "@/app/_libs/billingMode"
import { useIsNativeApp } from "@/app/_hooks/useIsNativeApp"
import { openAuthBrowser } from "@/app/_libs/arcodaAuthBrowser"
import { resolveLoginDestination } from "@/app/_libs/returnTo"

export default function LoginPage() {
  const native = useIsNativeApp()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)

    const supabase = createBrowserSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      alert('ログインに失敗しました')
      setIsLoading(false)
      return
    } else {
      const userId = data.user.id
      await supabase.auth.getSession()
      // ホームへ着地させる (旧: /scores。ログイン直後に一瞬ライブラリーが出て
      // からホームへ遷移する見え方 + コーチガイドのタイミング崩れを避ける)。
      // 未オンボーディングのユーザーは [userId]/layout の gate が /onboarding へ回す。
      // ゲスト閲覧 (2026-09-06): ゲートから来た場合は止められた場所へ戻す (?returnTo= か cookie)
      const rt = new URLSearchParams(window.location.search).get("returnTo")
      router.push(resolveLoginDestination(userId, rt))
    }
  }

  // Apple でログイン (2026-09-12 要件整理 v2.7 §3 U-11): iOS は Apple だけ。Google と同じくアプリ内ブラウザで開き arcoda:// で戻る
  const handleAppleLogin = async () => {
    const supabase = createBrowserSupabaseClient()
    const opts = isNativeApp()
      ? { redirectTo: "arcoda://auth-callback", skipBrowserRedirect: true }
      : { redirectTo: `${location.origin}/auth/callback`, skipBrowserRedirect: true }
    const { data } = await supabase.auth.signInWithOAuth({ provider: "apple", options: opts })
    if (data?.url) {
      const opened = isNativeApp() ? await openAuthBrowser(data.url) : false
      if (!opened) window.location.href = data.url
    }
  }

  const handleGoogleLogin = async () => {
    const supabase = createBrowserSupabaseClient()

    // アプリ版 (§9b): WebView内でGoogleへ行くとSafariに逃げるため、認証専用の
    // アプリ内ブラウザで開き arcoda:// でアプリに戻す (復帰処理は NativeChrome)
    if (isNativeApp()) {
      const { data } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: "arcoda://auth-callback", skipBrowserRedirect: true },
      })
      if (data?.url) {
        const opened = await openAuthBrowser(data.url)
        if (opened) return
        window.location.href = data.url
      }
      return
    }

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  return (
    <div className={styles.page}>
      <ArcoMotion kit="09B" label="相棒のアルコ" className={styles.medallion} />

      <h1 className={styles.title}>また会えたね、アルコだよ</h1>
      <p className={styles.subtitle}>さあ、今日も音を鳴らそう</p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <label htmlFor="email" className={styles.label}>メールアドレス</label>
        <div className={styles.field}>
          <input
            type="email"
            name="email"
            id="email"
            value={email}
            required
            placeholder="メールアドレス"
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            disabled={isLoading}
            autoComplete="email"
          />
        </div>

        <label htmlFor="password" className={styles.label} style={{ marginTop: 16 }}>パスワード</label>
        <div className={styles.field}>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            id="password"
            value={password}
            placeholder="パスワード"
            required
            disabled={isLoading}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            style={{ paddingRight: 46 }}
            autoComplete="current-password"
          />
          <button
            type="button"
            aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
            onClick={() => setShowPassword((v) => !v)}
            style={{ position: "absolute", right: 4, top: 0, height: 52, background: "none", border: "none", color: "#a89d85", padding: "0 12px", cursor: "pointer", lineHeight: 0 }}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" /><circle cx="12" cy="12" r="2.6" /></svg>
          </button>
        </div>

        <button className={styles.button} disabled={isLoading}>
          {isLoading ? "ログイン中…" : "ログイン"}
        </button>
      </form>

      <div className={styles.divider}>または</div>

      {isAppleBilling() && (
        <button type="button" className={styles.googleButton} onClick={handleAppleLogin} style={{ background: "#000", color: "#fff", borderColor: "#000" }}>
          <span className={styles.googleIcon} style={{ color: "#fff", display: "inline-flex" }} aria-hidden>
            <svg width="15" height="18" viewBox="0 0 17 20"><path fill="currentColor" d="M14.1 10.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.3 1.2 9.7.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.6-1-2.6-3.8zM11.7 3.4c.7-.8 1.1-2 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4z" /></svg>
          </span>
          Apple でログイン
        </button>
      )}
      {!(isAppleBilling() && native) && (
        <button type="button" className={styles.googleButton} onClick={handleGoogleLogin}>
          <span className={styles.googleIcon}>G</span>
          Googleでログイン
        </button>
      )}

      <p className={styles.links}>
        <Link href="/forgotPassword">パスワードを忘れた方はこちら</Link>
        <span className={styles.vr} aria-hidden />
        <Link href={isAppleBilling() ? "/start" : "/signUp"}>{isAppleBilling() ? "はじめる" : "新規登録"}</Link>
      </p>
    </div>
  )
}
