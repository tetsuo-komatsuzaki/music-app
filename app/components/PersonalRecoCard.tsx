// app/components/PersonalRecoCard.tsx
//
// ホーム「あなた専用のおすすめ練習」(2026-09-03 Tetsuo確定・案2 タブ切り替え)。
//
// 曲に紐づく「毎日の基礎練」とは別枠。ユーザーの累積の苦手そのものに対する練習を、
// 音程 / ポジション移動 / わざ / フィンガリング の4分類でタブ切り替えして出す。
//
// 進め方 (Tetsuo指示): まず画面を整え、おすすめロジックは後から当てる。
// この段階では表示だけを持ち、中身は呼び手が渡す。engine は後付け。

"use client"

import { useState } from "react"
import Link from "next/link"
import styles from "./PersonalRecoCard.module.css"
import { formatKey } from "@/app/_libs/musicNotation"
import {
  RECO_TAB_LABELS,
  RECO_TAB_NOTES,
  type PersonalReco,
  type RecoCategory,
  type RecoTab,
} from "@/app/_libs/personalRecoTypes"

export type { RecoCategory, RecoMaterial, RecoTab, PersonalReco } from "@/app/_libs/personalRecoTypes"

export default function PersonalRecoCard({
  userId,
  reco,
}: {
  userId: string
  reco: PersonalReco
}) {
  const order: RecoCategory[] = ["pitch", "position", "technique", "fingering"]
  const tabs = order
    .map((k) => reco.tabs.find((t) => t.key === k))
    .filter((t): t is RecoTab => Boolean(t))

  // 最初に開くのは、中身が入っている一番左のタブ。全部空なら一番左
  const firstFilled = tabs.find((t) => t.focus && t.materials.length > 0) ?? tabs[0]
  const [active, setActive] = useState<RecoCategory>(firstFilled.key)
  const tab = tabs.find((t) => t.key === active) ?? tabs[0]

  return (
    <section className={styles.card}>
      <h2 className={styles.title}>あなた専用のおすすめ練習</h2>

      <div className={styles.tabs} role="tablist" aria-label="おすすめ練習の分類">
        {tabs.map((t) => {
          const on = t.key === active
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={on}
              className={on ? `${styles.tab} ${styles.tabOn}` : styles.tab}
              onClick={() => setActive(t.key)}
            >
              {RECO_TAB_LABELS[t.key]}
            </button>
          )
        })}
      </div>

      <div className={styles.panel} role="tabpanel">
        <p className={styles.note}>
          {tab.basics ? "まずはここからやってみよう" : RECO_TAB_NOTES[tab.key]}
        </p>
        <TabBody tab={tab} userId={userId} />
      </div>
    </section>
  )
}

function TabBody({ tab, userId }: { tab: RecoTab; userId: string }) {
  if (!tab.focus) {
    return (
      <div className={styles.empty}>録音がたまると表示</div>
    )
  }

  return (
    <>
      <div className={styles.focus}>
        <div className={styles.focusName}>{tab.focus.name}</div>
        <div className={styles.meter}>
          <span className={styles.meterLabel}>成功率</span>
          <span className={styles.track}>
            <span className={styles.fill} style={{ width: `${tab.focus.successPct}%` }} />
          </span>
          <span className={styles.pct}>
            {tab.focus.successPct}
            <small className={styles.pctUnit}>%</small>
          </span>
        </div>
      </div>

      {tab.materials.length === 0 ? (
        <div className={styles.empty}>教材準備中</div>
      ) : (
        <div className={styles.materials}>
          {tab.materials.map((m) => (
            <Link
              key={m.id}
              href={`/${userId}/practice/${m.category}/${m.id}`}
              className={styles.materialRow}
            >
              <span className={styles.materialInfo}>
                <span className={styles.materialTitle}>{m.title}</span>
                <span className={styles.materialMeta}>
                  {m.star !== null ? `★${m.star}・` : ""}
                  {formatKey(m.keyTonic, m.keyMode)}
                </span>
              </span>
              <span className={styles.go}>練習する →</span>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
