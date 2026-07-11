"use client"

// OptionCard (C1) — v0.3 §2-4 の4型 + 2行拡張。見た目の正 = プロトタイプ .card
//  (a) アイコン+ラベル / (b) ラベルのみ / (c) ラベル+右補助 / (d) 複数選択(チェックボックス)
//  2行拡張(tall): 1行目=ラベル、2行目=動作説明 (G2/G4ゲート用)

import styles from "../onboarding.module.css"

export type OptionCardProps = {
  label: string
  /** (a)(d)型: 左アイコン(絵文字) */
  icon?: string
  /** (c)型: 右補助テキスト */
  sub?: string
  /** 2行拡張: 2行目の動作説明 (高さ 8.7%H) */
  desc?: string
  /** (d)型: チェックボックス表示 (checked と併用) */
  checkbox?: boolean
  checked?: boolean
  selected?: boolean
  onClick?: () => void
  /** YES/NOゲートの300msハイライト用に外から選択色を強制 */
  forceSelected?: boolean
  disabled?: boolean
}

export default function OptionCard({
  label,
  icon,
  sub,
  desc,
  checkbox,
  checked,
  selected,
  forceSelected,
  onClick,
  disabled,
}: OptionCardProps) {
  const isSel = forceSelected || selected || (checkbox && checked)
  return (
    <button
      type="button"
      className={[
        styles.card,
        isSel ? styles.cardSel : "",
        desc ? styles.cardTall : "",
      ].join(" ")}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className={styles.cardIco}>{icon}</span>}
      <span className={styles.cardMain}>{label}</span>
      {sub && <span className={styles.cardSub}>{sub}</span>}
      {checkbox && (
        <span
          className={[styles.checkbox, checked ? styles.checkboxOn : ""].join(" ")}
        >
          {checked ? "✓" : ""}
        </span>
      )}
      {desc && <span className={styles.cardDesc}>{desc}</span>}
    </button>
  )
}
