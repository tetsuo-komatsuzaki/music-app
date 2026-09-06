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
import { openAuthBrowser } from "@/app/_libs/arcodaAuthBrowser"
import { resolveLoginDestination } from "@/app/_libs/returnTo"

export default function LoginPage() {
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

      <button type="button" className={styles.googleButton} onClick={handleGoogleLogin}>
        <span className={styles.googleIcon}>G</span>
        Googleでログイン
      </button>

      <p className={styles.links}>
        <Link href="/forgotPassword">パスワードを忘れた方はこちら</Link>
        <span className={styles.vr} aria-hidden />
        <Link href="/signUp">新規登録</Link>
      </p>
    </div>
  )
}
