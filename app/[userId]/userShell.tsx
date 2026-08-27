"use client"

import styles from "./layout.module.css"
import { ReactNode } from "react"
import { usePathname } from "next/navigation"
import BottomTabs from "./components/BottomTabs"
import RevealMotion from "@/app/components/RevealMotion"
import TiltEffect from "@/app/components/DeviceMotion"
import Header from "./components/Header"
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
      {/* 2026-08-27: 画面上部の青い進捗バー (NavProgress) を撤去。
          ・URL が変わった「あと」に動き出す作りで、読み込みが終わってから
            「読み込み中」を見せていた (進捗を示していなかった)
          ・色 #2563EB/#3B82F6 は配色ルールの外 (操作は紺 #2b5bc4)
          ・Web の作法であり、画面ごと切り替わるアプリには要らない
          待ち表示はルートごとの loading.tsx (アルコの金のリング) が担う。 */}
      {/* ナビ刷新 2026-08-17: サイドバー廃止 → ボトム4タブ + 右上アカウント。
          全画面幅で同じタブを使い、本文は最大560pxで中央に寄せる (要件定義 SECTION 05) */}
      <div className={styles.container}>
        <Header role={role} />
        {/* ===== PAGE CONTENT ===== */}
        <RevealMotion />
        {/* B群 (2026-08-21 リバイス4): B2チルト */}
        <TiltEffect />
        {/* 2026-08-28: DeviceFrame (黒いベゼル + ノッチの絵) を撤去。
            モックの端末枠を再現する部品で、実機の画面の上にもう一台ぶんの
            スマホの縁とノッチを描いていた。画面の四隅が黒く欠け、上部に
            黒い丸が乗る。実機では意味が無く、見た目を壊すだけだった。 */}
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
