// app/components/RecommendationItem.tsx
//
// UI 設計書 v3.1 §6-4 — 「次のチャレンジ」横スクロールリストの 1 件分カード。
//
// 表示要素 (画像なし、テキストベース):
//   - 曲名 (太字、大きめ)
//   - 作曲者 (任意、小さめ)
//   - 難易度 ★ (1-10 を 5 段階に変換、任意)
//   - 推薦理由 (§10-6 テンプレート)
//
// onClick / Link 経由でナビゲーション。

"use client"

import Link from "next/link"
import styles from "./RecommendationItem.module.css"

export type SongRecommendation = {
  practiceItem: {
    id: string
    title: string
    category: string
    star?: number | null
    composer?: string | null
  }
  reason: string
  /** 遷移先 (page.tsx で構築済み) */
  href: string
  triggeredByCardId?: string
}

type Props = {
  recommendation: SongRecommendation
}

// 1-10 → ★1-5 にスケール (2 刻みで 1 つ星)。null/0 は表示しない。
// v1.3 B-3 follow-up: difficultyStars → formatStarBadge にリネーム (UI 整理)
function formatStarBadge(d: number | null | undefined): {
  stars: string
  ariaLabel: string
} | null {
  if (typeof d !== "number" || d <= 0) return null
  const filled = Math.min(5, Math.max(1, Math.ceil(d / 2)))
  return {
    stars: "★".repeat(filled) + "☆".repeat(5 - filled),
    ariaLabel: `難易度 ${d} / 10`,
  }
}

export default function RecommendationItem({ recommendation }: Props) {
  const { practiceItem, reason, href } = recommendation
  const starBadge = formatStarBadge(practiceItem.star)

  return (
    <Link href={href} className={styles.card}>
      <h3 className={styles.title}>{practiceItem.title}</h3>
      {practiceItem.composer && (
        <div className={styles.composer}>{practiceItem.composer}</div>
      )}
      {starBadge && (
        <div className={styles.difficulty} aria-label={starBadge.ariaLabel}>
          {starBadge.stars}
        </div>
      )}
      <p className={styles.reason}>{reason}</p>
    </Link>
  )
}
