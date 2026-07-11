"use client"

// CtaButton (C1) — v0.3 §2-5。下部固定・3D影・disabled制御。
// 文言: 中間「次へ」/ 最終質問「スタートする」/ 完了「さっそくスタートする」

import styles from "../onboarding.module.css"

export default function CtaButton({
  label,
  disabled,
  onClick,
  ghost,
  divider,
}: {
  label: string
  disabled?: boolean
  onClick?: () => void
  /** SCR-01副ボタン用ゴースト(白地+緑文字)。本フローでは未使用だが型として保持 */
  ghost?: boolean
  /** リストが長い画面でCTA背面に白帯+区切り線 (§2-5 スクロール共存) */
  divider?: boolean
}) {
  return (
    <div className={[styles.ctaWrap, divider ? styles.ctaDivider : ""].join(" ")}>
      <button
        type="button"
        className={[styles.cta, ghost ? styles.ctaGhost : ""].join(" ")}
        disabled={disabled}
        onClick={onClick}
      >
        {label}
      </button>
    </div>
  )
}
