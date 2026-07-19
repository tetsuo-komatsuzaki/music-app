"use client"

import Link from "next/link"
import styles from "../[userId]/homeBlocks.module.css"

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
  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.cardTitle}>お気に入り</div>
        {favorites.length === 0 ? (
          <div className={styles.favEmpty}>♡ を押すと、曲や教材をここに集められます</div>
        ) : (
          CATS.map((c) => {
            const items = favorites.filter((f) => f.category === c.key)
            if (items.length === 0) return null
            return (
              <div key={c.key} className={styles.favGroup}>
                <div className={styles.favH}>{c.label} <span>{items.length}</span></div>
                <div className={styles.favList}>
                  {items.map((f) => (
                    <Link key={f.id} href={f.href} className={styles.favItem}>
                      <div className={styles.favThumb}>{f.cover ? <img src={f.cover} alt="" loading="lazy" /> : "♪"}</div>
                      <div className={styles.favTitle}>{f.title}</div>
                    </Link>
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
