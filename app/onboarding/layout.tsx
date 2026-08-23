// /onboarding レイアウト (C1・2026-07-11)
// - フォント: M PLUS Rounded 1c (next/font、指示書§2)
// - 基準コンテナ 1:2.17 (container-type:size → 配下は cqh/cqw で比率解決)
//   PC配置は暫定「ビューポート中央・高さ100dvh基準」(v0.3 §7 のTODO事項)

import "./tokens.css"
import styles from "./onboarding.module.css"

export const metadata = { title: "はじめよう | Arcoda" }

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`onbRoot ${styles.stage}`}>
      <div className={styles.frame}>{children}</div>
    </div>
  )
}
