"use client"

import Link from "next/link"
import { useState } from "react"
import GradeBadge from "@/app/components/GradeBadge"
import GradeProgressBar from "@/app/components/GradeProgressBar"
import GradeDetailModal, {
  type GradeDetailData,
} from "@/app/components/GradeDetailModal"
import RecommendationList from "@/app/components/RecommendationList"
import type { SongRecommendation } from "@/app/components/RecommendationItem"
import styles from "./home.module.css"
import OnboardingTrigger from "./_onboarding/OnboardingTrigger"

// UI-8: ホーム画面のグレード表示用 (page.tsx で構築)
type GradeData = GradeDetailData & {
  totalCompleted: number
  totalRequired: number
}

type Props = {
  userName: string
  streak: number
  weeklyDays: number
  arcoMessage: { greeting: string; cheer: string }
  /** UI-8: アルコちゃんカード内に表示するグレード情報 */
  gradeData: GradeData
  continueItem: {
    href: string
    title: string
    subtitle: string
    uploadedAt: string
  } | null
  /** UI-9 (§11-3): active カード優先のレコメンド (最大 5 件) */
  songRecommendations: SongRecommendation[]
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

export default function HomeClient({
  userName: _userName,
  streak,
  weeklyDays,
  arcoMessage,
  gradeData,
  continueItem,
  songRecommendations,
  recentHistory,
}: Props) {
  void _userName
  const WEEKLY_GOAL = 5

  // UI-8: グレード詳細モーダルの開閉状態
  const [gradeModalOpen, setGradeModalOpen] = useState(false)

  return (
    <div className={styles.page}>

      {/* ───── アルコちゃんからの案内 (最上部・主役) ───── */}
      <div className={`${styles.card} ${styles.arcoCard}`} data-onboarding="home.arcoCard">
        <div className={styles.arcoHeader}>
          <span className={styles.arcoIcon}>🎻</span>
          <span className={styles.arcoName}>アルコちゃんからの案内</span>
        </div>

        <div className={styles.arcoGreeting}>{arcoMessage.greeting}</div>
        <div className={styles.arcoCheer}>{arcoMessage.cheer}</div>

        {/* UI-8: グレード表示 (旧「今日のおすすめ」を置き換え) */}
        <div className={styles.gradeSection}>
          <div className={styles.gradeRow}>
            <GradeBadge
              grade={gradeData.currentGrade}
              onTap={() => setGradeModalOpen(true)}
            />
            <div className={styles.gradeProgress}>
              <GradeProgressBar
                completed={gradeData.totalCompleted}
                required={gradeData.totalRequired}
                remainingCount={gradeData.remainingCount}
                nextGrade={gradeData.nextGrade}
              />
            </div>
          </div>
        </div>
      </div>

      {/* UI-8: グレード詳細モーダル */}
      <GradeDetailModal
        open={gradeModalOpen}
        onClose={() => setGradeModalOpen(false)}
        data={gradeData}
      />

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
        <div className={styles.card} data-onboarding="home.continueItem">
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

      {/* ───── UI-9 (§6-4): 次のチャレンジ (横スクロール、画像なし、テキストベース) ───── */}
      <div className={styles.card}>
        <div className={styles.sectionTitle}>次のチャレンジ</div>
        <RecommendationList recommendations={songRecommendations} />
      </div>

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

      <OnboardingTrigger pageKey="home" />
    </div>
  )
}
