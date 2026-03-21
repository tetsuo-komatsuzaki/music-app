"use client"

import Link from "next/link"
import styles from "./home.module.css"
import AnimatedRings from "@/app/components/AnimatedRings"

type Props = {
  userName: string
  streak: number
  weeklyDays: number
  rings: { practice: number; record: number; review: number }
  continueItem: {
    href: string
    title: string
    subtitle: string
    uploadedAt: string
  } | null
  dailyChallenge: {
    id: string
    href: string
    title: string
    category: string
    difficulty: number
    description: string | null
  } | null
  recommendations: {
    id: string
    href: string
    title: string
    category: string
    difficulty: number
    reason: string
  }[]
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
  rings,
  continueItem,
  dailyChallenge,
  recommendations,
  recentHistory,
}: Props) {
  const WEEKLY_GOAL = 5

  return (
    <div className={styles.page}>

      {/* ───── 上段3カード ───── */}
      <div className={styles.topRow}>

        {/* ストリーク */}
        <div className={`${styles.card} ${styles.streakCard}`}>
          <div className={styles.streakMain}>
            <span style={{ fontSize: 22 }}>🔥</span>
            <span className={styles.streakDays}>{streak}</span>
            <span className={styles.streakLabel}>days</span>
          </div>
          <div className={styles.streakSub}>連続練習ストリーク</div>
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

        {/* 3リング */}
        <div className={`${styles.card} ${styles.ringCard}`}>
          <AnimatedRings
            size={100} cx={50} cy={50} strokeWidth={9}
            rings={[
              { r: 44, color: "#1D9E75", bg: "#E1F5EE", progress: rings.practice },
              { r: 32, color: "#378ADD", bg: "#E6F1FB", progress: rings.record },
              { r: 20, color: "#534AB7", bg: "#EEEDFE", progress: rings.review },
            ]}
          />
          <div className={styles.ringLabels}>
            <div className={styles.ringLabel}>
              <span className={styles.ringDot} style={{ background: "#1D9E75" }} />練習
            </div>
            <div className={styles.ringLabel}>
              <span className={styles.ringDot} style={{ background: "#378ADD" }} />録音
            </div>
            <div className={styles.ringLabel}>
              <span className={styles.ringDot} style={{ background: "#534AB7" }} />確認
            </div>
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

      {/* ───── デイリーチャレンジ ───── */}
      {dailyChallenge && (
        <div className={`${styles.card} ${styles.challengeCard}`}>
          <div className={styles.challengeHeader}>
            <span className={styles.challengeBadge}>今日のチャレンジ</span>
          </div>
          <div className={styles.challengeTitle}>{dailyChallenge.title}</div>
          <div className={styles.challengeMeta}>
            {dailyChallenge.category} · 難易度 {dailyChallenge.difficulty}
          </div>
          <Link href={dailyChallenge.href} className={styles.challengeBtn}>
            スタート
          </Link>
        </div>
      )}

      {/* ───── おすすめ練習 ───── */}
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
