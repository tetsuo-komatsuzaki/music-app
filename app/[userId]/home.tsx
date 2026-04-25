"use client"

import Link from "next/link"
import styles from "./home.module.css"

type RecommendedItem = {
  id: string
  href: string
  title: string
  category: string
  reason: string
}

type Props = {
  userName: string
  streak: number
  weeklyDays: number
  arcoMessage: { greeting: string; cheer: string }
  arcoRecommendation: RecommendedItem | null
  continueItem: {
    href: string
    title: string
    subtitle: string
    uploadedAt: string
  } | null
  recommendations: RecommendedItem[]
  recentHistory: {
    title: string
    href: string
    uploadedAt: string
  }[]
}

// ─── 時間を相対表示 ───────────────────────────────────────────
function relativeTime(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 60)  return `${mins}分前`
  if (hours < 24)  return `${hours}時間前`
  if (days  < 7)   return `${days}日前`
  return new Date(isoStr).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })
}

const CATEGORY_ICON: Record<string, string> = {
  scale:    "🎵",
  arpeggio: "🎶",
  etude:    "📄",
}

export default function HomeClient({
  userName,
  streak,
  weeklyDays,
  arcoMessage,
  arcoRecommendation,
  continueItem,
  recommendations,
  recentHistory,
}: Props) {
  const WEEKLY_GOAL = 5

  return (
    <div className={styles.page}>

      {/* ───── アルコちゃんからの案内 (最上部・主役) ───── */}
      <div className={`${styles.card} ${styles.arcoCard}`}>
        <div className={styles.arcoHeader}>
          <span className={styles.arcoIcon}>🎻</span>
          <span className={styles.arcoName}>アルコちゃんからの案内</span>
        </div>

        <div className={styles.arcoGreeting}>{arcoMessage.greeting}</div>
        <div className={styles.arcoCheer}>{arcoMessage.cheer}</div>

        {arcoRecommendation && (
          <div className={styles.arcoRecommend}>
            <div className={styles.arcoRecommendLabel}>今日のおすすめ</div>
            <div className={styles.arcoRecommendItem}>
              <span className={styles.arcoRecommendIcon}>
                {CATEGORY_ICON[arcoRecommendation.category] ?? "🎵"}
              </span>
              <div className={styles.arcoRecommendInfo}>
                <div className={styles.arcoRecommendTitle}>{arcoRecommendation.title}</div>
                <div className={styles.arcoRecommendReason}>{arcoRecommendation.reason}</div>
              </div>
            </div>
            <Link href={arcoRecommendation.href} className={styles.arcoCta}>
              スタート →
            </Link>
          </div>
        )}
      </div>

      {/* ───── 上段2カード (ストリーク + 今週、3リング削除) ───── */}
      <div className={styles.topRow}>

        {/* ストリーク */}
        <div className={`${styles.card} ${styles.streakCard}`}>
          <div className={styles.streakMain}>
            <span style={{ fontSize: 22 }}>🔥</span>
            <span className={styles.streakDays}>{streak}</span>
            <span className={styles.streakLabel}>days</span>
          </div>
          <div className={styles.streakSub}>連続練習記録</div>
        </div>

        {/* 週間 */}
        <div className={`${styles.card} ${styles.weeklyCard}`}>
          <div className={styles.weeklyTitle}>今週の練習</div>
          <div className={styles.weeklyCount}>
            {weeklyDays}
            <span style={{ fontSize: 14, fontWeight: 400, color: "#999" }}>/{WEEKLY_GOAL}日</span>
          </div>
          <div className={styles.weeklyBar}>
            <div
              className={styles.weeklyBarFill}
              style={{ width: `${Math.min(weeklyDays / WEEKLY_GOAL, 1) * 100}%` }}
            />
          </div>
        </div>

      </div>

      {/* ───── Continue バー ───── */}
      {continueItem && (
        <div className={styles.card}>
          <Link href={continueItem.href} className={styles.continueBar}>
            <div className={styles.continueIcon}>▶</div>
            <div className={styles.continueInfo}>
              <div className={styles.continueTitle}>{continueItem.title}</div>
              <div className={styles.continueMeta}>
                {continueItem.subtitle} · {relativeTime(continueItem.uploadedAt)}
              </div>
            </div>
            <span className={styles.continueArrow}>›</span>
          </Link>
        </div>
      )}

      {/* ───── おすすめ練習 (AI 案内に出していない代替肢を 1件) ───── */}
      {recommendations.length > 0 && (
        <div className={styles.card}>
          <div className={styles.sectionTitle}>おすすめ練習</div>
          <div className={styles.recommendList}>
            {recommendations.map(item => (
              <Link key={item.id} href={item.href} className={styles.recommendItem}>
                <span className={styles.recommendIcon}>
                  {CATEGORY_ICON[item.category] ?? "🎵"}
                </span>
                <div className={styles.recommendInfo}>
                  <div className={styles.recommendTitle}>{item.title}</div>
                  <div className={styles.recommendReason}>{item.reason}</div>
                </div>
                <span className={styles.recommendArrow}>›</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ───── 直近の練習履歴 ───── */}
      {recentHistory.length > 0 && (
        <div className={styles.card}>
          <div className={styles.sectionTitle}>直近の練習</div>
          <div className={styles.historyList}>
            {recentHistory.map((item, i) => (
              <Link key={i} href={item.href} className={styles.historyItem}>
                <span className={styles.historyDate}>{relativeTime(item.uploadedAt)}</span>
                <span className={styles.historyTitle}>{item.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
