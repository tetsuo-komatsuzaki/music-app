"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import styles from "../[userId]/homeBlocks.module.css"
import SwipeToDelete from "./ui/SwipeToDelete"

export type FavoriteEntry = { id: string; title: string; category: string; cover: string | null; href: string }

// 表示順とラベル (曲 + 基礎練カテゴリ)。double_stop = 重音
const CATS: { key: string; label: string }[] = [
  { key: "score", label: "曲" },
  { key: "scale", label: "音階" },
  { key: "arpeggio", label: "アルペジオ" },
  { key: "etude", label: "エチュード" },
  { key: "bowing", label: "ボーイング" },
  { key: "fingering", label: "フィンガリング" },
  { key: "double_stop", label: "重音" },
]

export default function FavoritesSection({ favorites }: { favorites: FavoriteEntry[] }) {
  // スワイプ削除で即時に消せるようローカル状態で保持 (サーバ prop 変化時は同期)
  const [items, setItems] = useState<FavoriteEntry[]>(favorites)
  useEffect(() => setItems(favorites), [favorites])

  async function removeFavorite(f: FavoriteEntry) {
    const prev = items
    // 楽観的に削除
    setItems((cur) => cur.filter((x) => !(x.id === f.id && x.category === f.category)))
    const body =
      f.category === "score"
        ? { scoreId: f.id, on: false }
        : { practiceItemId: f.id, on: false }
    try {
      const r = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!r.ok) setItems(prev) // 失敗時ロールバック
    } catch {
      setItems(prev)
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.cardTitle} data-onboarding="home.favorites">お気に入り</div>
        {items.length === 0 ? (
          <div className={styles.favEmpty}>♡ を押すと、曲や教材をここに集められます</div>
        ) : (
          CATS.map((c) => {
            const catItems = items.filter((f) => f.category === c.key)
            if (catItems.length === 0) return null
            return (
              <div key={c.key} className={styles.favGroup}>
                <div className={styles.favH}>{c.label} <span>{catItems.length}</span></div>
                <div className={styles.favList}>
                  {catItems.map((f) => (
                    <div key={f.id} className={styles.favItem}>
                      <SwipeToDelete onDelete={() => removeFavorite(f)} ariaLabel={`${f.title} をお気に入りから外す`}>
                        <Link href={f.href} className="pressable" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                          <div className={styles.favThumb}>{f.cover ? <img src={f.cover} alt="" loading="lazy" /> : "♪"}</div>
                          <div className={styles.favTitle}>{f.title}</div>
                        </Link>
                      </SwipeToDelete>
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
