"use client"

import Link from "next/link"
import styles from "../[userId]/homeBlocks.module.css"
import type { SongRecommendation } from "./RecommendationItem"

export default function NextPiecesCard({ pieces }: { pieces: SongRecommendation[] }) {
  if (pieces.length === 0) return null
  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.cardTitle}>次の曲にチャレンジ</div>
        {pieces.slice(0, 3).map((p) => (
          <Link key={p.practiceItem.id} href={p.href} className={`${styles.mat} pressable`}>
            <div className={`${styles.thumb} ${styles.thumbGoal}`}>{p.practiceItem.cover ? <img src={p.practiceItem.cover} alt="" loading="lazy" /> : "♪"}</div>
            <div className={styles.g}>
              <div className={styles.title}>{p.practiceItem.title}</div>
              <div className={styles.meta}>
                {p.practiceItem.star != null ? `☆${p.practiceItem.star}` : ""}
                {p.practiceItem.composer ? ` ・ ${p.practiceItem.composer}` : ""}
              </div>
            </div>
            <span className={styles.matGo}>挑戦</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
