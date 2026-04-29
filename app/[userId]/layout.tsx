"use client"

import styles from "./layout.module.css"
import { ReactNode } from "react"
import Sidebar from "./components/Sidebar"
import Header from "./components/Header"
import OnboardingErrorBoundary from "./_onboarding/OnboardingErrorBoundary"
import OnboardingProvider from "./_onboarding/OnboardingProvider"
import WelcomeSlides from "./_onboarding/WelcomeSlides"
import HelpModalContainer from "./_onboarding/HelpModalContainer"

export default function UserLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <OnboardingProvider>
      <div className={styles.container}>
        <Header />
        <div className={styles.body}>
          <Sidebar />
          {/* ===== PAGE CONTENT ===== */}
          <main className={styles.main}>
            {children}
          </main>
        </div>
      </div>
      {/* オーバーレイのクラッシュは ErrorBoundary で吸収、既存 UI に波及させない */}
      <OnboardingErrorBoundary>
        <WelcomeSlides />
        <HelpModalContainer />
      </OnboardingErrorBoundary>
    </OnboardingProvider>
  )
}
