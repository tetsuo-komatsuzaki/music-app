// app/components/ScoreDetailTabs.tsx
//
// v1.3 Phase 4-1 (2026-05-16) — Score 詳細画面の最上位タブ (練習 / 上達ループ)。
// StatusTab.module.css のスタイルを流用 (Q2=A 確定)。
// 状態は URL ?tab=loop で永続化 (Q2 URL クエリストリング確定)。

"use client"

import styles from "./StatusTab.module.css"

export type ScoreDetailTabId = "practice" | "loop"

const TAB_DEFS: { id: ScoreDetailTabId; label: string }[] = [
  { id: "practice", label: "練習" },
  { id: "loop", label: "上達ループ" },
]

type Props = {
  activeTab: ScoreDetailTabId
  onChange: (tab: ScoreDetailTabId) => void
}

export default function ScoreDetailTabs({ activeTab, onChange }: Props) {
  return (
    <div className={styles.tabBar} role="tablist" aria-label="Score 詳細タブ">
      {TAB_DEFS.map(({ id, label }) => {
        const isActive = activeTab === id
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`score-detail-tab-panel-${id}`}
            className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
            onClick={() => onChange(id)}
          >
            <span className={styles.label}>{label}</span>
          </button>
        )
      })}
    </div>
  )
}
