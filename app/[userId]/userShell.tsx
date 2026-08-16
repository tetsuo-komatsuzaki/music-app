"use client"

import styles from "./layout.module.css"
import { ReactNode } from "react"
import { usePathname } from "next/navigation"
import BottomTabs from "./components/BottomTabs"
import Header from "./components/Header"
import NavProgress from "./components/NavProgress"
import OnboardingErrorBoundary from "./_onboarding/OnboardingErrorBoundary"
import OnboardingProvider from "./_onboarding/OnboardingProvider"
import WelcomeSlides from "./_onboarding/WelcomeSlides"
import HelpModalContainer from "./_onboarding/HelpModalContainer"
import TeacherShell from "./TeacherShell"

export default function UserShell({
  children,
  role,
}: {
  children: ReactNode
  role?: string
}) {
  // 別シェル: /[userId]/teacher 配下は先生モードの独立クロムで描画 (生徒ナビを使わない)。
  const pathname = usePathname()
  if (/\/teacher(\/|$)/.test(pathname ?? "")) {
    return <TeacherShell>{children}</TeacherShell>
  }
  return (
    <OnboardingProvider>
      <NavProgress />
      {/* ナビ刷新 2026-08-17: サイドバー廃止 → ボトム4タブ + 右上アカウント。
          全画面幅で同じタブを使い、本文は最大560pxで中央に寄せる (要件定義 SECTION 05) */}
      <div className={styles.container}>
        <Header role={role} />
        {/* ===== PAGE CONTENT ===== */}
        <main className={styles.main}>
          <div className={styles.centered}>{children}</div>
        </main>
        <BottomTabs />
      </div>
      {/* オーバーレイのクラッシュは ErrorBoundary で吸収、既存 UI に波及させない */}
      <OnboardingErrorBoundary>
        <WelcomeSlides />
        <HelpModalContainer />
      </OnboardingErrorBoundary>
    </OnboardingProvider>
  )
}
