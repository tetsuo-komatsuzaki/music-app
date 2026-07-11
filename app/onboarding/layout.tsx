// /onboarding レイアウト (C1・2026-07-11)
// - フォント: M PLUS Rounded 1c (next/font、指示書§2)
// - 基準コンテナ 1:2.17 (container-type:size → 配下は cqh/cqw で比率解決)
//   PC配置は暫定「ビューポート中央・高さ100dvh基準」(v0.3 §7 のTODO事項)

import { M_PLUS_Rounded_1c } from "next/font/google"
import "./tokens.css"
import styles from "./onboarding.module.css"

const rounded = M_PLUS_Rounded_1c({
  weight: ["400", "700", "800"],
  subsets: ["latin"],
  display: "swap",
})

export const metadata = { title: "はじめよう | Arcoda" }

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`onbRoot ${rounded.className} ${styles.stage}`}>
      <div className={styles.frame}>{children}</div>
    </div>
  )
}
