// app/components/StatusTab.tsx
//
// 2026-05-10: 改善傾向タブを撤去し、active(改善傾向含む)/cleared の 2 タブ構成に変更。
//
// タブ:
//   - active  「気になる箇所」(DB の active + improving を集約)
//   - cleared 「達成」
//
// 各タブにバッジ件数を表示。アクティブタブは強調表示。

"use client"

import styles from "./StatusTab.module.css"

export type CardStatus = "active" | "improving" | "cleared"

const TAB_DEFS: { id: Exclude<CardStatus, "improving">; label: string }[] = [
  { id: "active", label: "気になる箇所" },
  { id: "cleared", label: "達成" },
]

type Props = {
  activeStatus: CardStatus
  counts: Record<CardStatus, number>
  onChange: (status: CardStatus) => void
}

export default function StatusTab({ activeStatus, counts, onChange }: Props) {
  return (
    <div className={styles.tabBar} role="tablist" aria-label="カード状態フィルタ">
      {TAB_DEFS.map(({ id, label }) => {
        const isActive = activeStatus === id
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`status-tab-panel-${id}`}
            className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
            onClick={() => onChange(id)}
          >
            <span className={styles.label}>{label}</span>
            <span
              className={`${styles.count} ${
                isActive ? styles.countActive : ""
              }`}
              aria-label={`${counts[id]} 件`}
            >
              {counts[id]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
