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

/** タブの分類。記録の分析 / わざの詳細 と同じ切り口に揃える */
export type RecoCategory = "pitch" | "position" | "technique" | "fingering"

export const RECO_TAB_LABELS: Record<RecoCategory, string> = {
  pitch: "音程",
  position: "ポジション移動",
  technique: "わざ",
  fingering: "フィンガリング",
}

/** タブごとの一言。見出しの下に1行だけ出す */
const RECO_TAB_NOTES: Record<RecoCategory, string> = {
  pitch: "音の高さがずれやすいところに効く練習だよ",
  position: "左手を動かしたあとの音に効く練習だよ",
  technique: "スラーやスタッカートなどのわざに効く練習だよ",
  fingering: "指を切り替える時間が短い音に効く練習だよ",
}

export type RecoMaterial = {
  id: string
  title: string
  /** practice のカテゴリ (scale / arpeggio / etude / bowing / fingering / doublestop) */
  category: string
  star: number | null
  keyTonic: string
  keyMode: string
}

export type RecoTab = {
  key: RecoCategory
  /** いま一番効く課題。null = 判定できる音がまだ足りない */
  focus: { name: string; successPct: number; notes: number } | null
  /** おすすめ教材。空 = 課題は出たが在庫が無い */
  materials: RecoMaterial[]
  /** focus が null のときに出す「あと◯回」の残り回数。null = 回数が読めない */
  remaining: number | null
}

export type PersonalReco = {
  tabs: RecoTab[]
}

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
      <p className={styles.lead}>いままでの録音ぜんぶから、いま効く練習をえらんでいるよ</p>

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
        <p className={styles.note}>{RECO_TAB_NOTES[tab.key]}</p>
        <TabBody tab={tab} userId={userId} />
      </div>
    </section>
  )
}

function TabBody({ tab, userId }: { tab: RecoTab; userId: string }) {
  if (!tab.focus) {
    return (
      <div className={styles.empty}>
        {tab.remaining !== null
          ? `あと${tab.remaining}回ろくおんすると、ここに練習が出るよ`
          : "もうすこし録音がたまると、ここに練習が出るよ"}
      </div>
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
        <div className={styles.notes}>これまでに{tab.focus.notes}音</div>
      </div>

      {tab.materials.length === 0 ? (
        <div className={styles.empty}>
          ぴったりの教材はいま準備中。まずは曲の中で、この部分だけゆっくり弾いてみよう
        </div>
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
