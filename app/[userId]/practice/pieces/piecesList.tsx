"use client"

import Link from "next/link"
import { useState } from "react"
import styles from "../practice.module.css"

export type Piece = {
  id: string
  title: string
  composer: string | null
  star: number | null
}

type Tab = number | "unset"

export default function PiecesList({
  userId,
  pieces,
}: {
  userId: string
  pieces: Piece[]
}) {
  // 出現する☆を昇順にタブ化。star 未設定がある場合のみ末尾に「未設定」タブ。
  const starValues = Array.from(
    new Set(pieces.map(p => p.star).filter((s): s is number => s != null)),
  ).sort((a, b) => a - b)
  const hasUnset = pieces.some(p => p.star == null)
  const tabs: Tab[] = [...starValues, ...(hasUnset ? (["unset"] as Tab[]) : [])]

  const [active, setActive] = useState<Tab | null>(tabs.length ? tabs[0] : null)

  const filtered = pieces
    .filter(p => (active === "unset" ? p.star == null : p.star === active))
    .sort((a, b) => a.title.localeCompare(b.title, "ja"))

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>練習曲</h1>

      {tabs.length === 0 ? (
        <p className={styles.cardContextEmpty}>
          公開されている練習曲はまだありません。
        </p>
      ) : (
        <>
          {/* ☆ごとの横並びタブ */}
          <div className={styles.starTabs}>
            {tabs.map(t => (
              <button
                key={String(t)}
                type="button"
                className={`${styles.starTab} ${active === t ? styles.starTabActive : ""}`}
                onClick={() => setActive(t)}
              >
                {t === "unset" ? "未設定" : `☆${t}`}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className={styles.cardContextEmpty}>この難易度の練習曲はありません。</p>
          ) : (
            <div className={styles.cardContextList}>
              {filtered.map(piece => (
                <Link
                  key={piece.id}
                  href={`/${userId}/scores/${piece.id}`}
                  className={styles.cardContextItem}
                >
                  <div className={styles.cardContextItemTitle}>
                    {piece.title}
                    {piece.star != null && ` ☆${piece.star}`}
                  </div>
                  {piece.composer && (
                    <div className={styles.cardContextItemComposer}>
                      {piece.composer}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
