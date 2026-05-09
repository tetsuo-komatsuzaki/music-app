// app/components/StatusTab.tsx
//
// UI 設計書 v3.1 §7-3 — マイページのカード一覧を 3 タブで切り替える。
//
// タブ:
//   - active    「気になる箇所」
//   - improving 「改善傾向」
//   - cleared   「達成」
//
// 各タブにバッジ件数を表示。アクティブタブは強調表示。

"use client"

import styles from "./StatusTab.module.css"

export type CardStatus = "active" | "improving" | "cleared"

const TAB_DEFS: { id: CardStatus; label: string }[] = [
  { id: "active", label: "気になる箇所" },
  { id: "improving", label: "改善傾向" },
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
