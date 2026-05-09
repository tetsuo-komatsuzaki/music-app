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
  /** UI-9 (§11-3): active カード優先のレコメンド (最大 5 件) */
  songRecommendations: SongRecommendation[]
  recentHistory: {
    title: string
    subtitle: string
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
          <div className={styles.arcoHeaderLeft}>
            <span className={styles.arcoIcon}>🎻</span>
            <span className={styles.arcoName}>アルコちゃんからの案内</span>
          </div>
          <div className={styles.arcoStats}>
            <div className={styles.arcoStatItem}>
              <span className={styles.arcoStatLabel}>今週の練習</span>
              <span className={styles.arcoStatValue}>
                {weeklyDays}<span className={styles.arcoStatGoal}>/{WEEKLY_GOAL}日</span>
              </span>
            </div>
            <div className={styles.arcoStatItem}>
              <span className={styles.arcoStatLabel}>🔥 連続練習記録</span>
              <span className={styles.arcoStatValue}>
                {streak}<span className={styles.arcoStatGoal}>日</span>
              </span>
            </div>
          </div>
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

      {/* ───── UI-9 (§6-4): 次のチャレンジ (横スクロール、画像なし、テキストベース) ───── */}
      <div className={styles.card}>
        <div className={styles.sectionTitle}>次のチャレンジ</div>
        <RecommendationList recommendations={songRecommendations} />
      </div>

      {/* ───── 直近の練習 (Continue バー風レイアウト) ───── */}
      {recentHistory.length > 0 && (
        <div className={styles.card}>
          <div className={styles.sectionTitle}>直近の練習</div>
          <div className={styles.historyBarList}>
            {recentHistory.map((item, i) => (
              <Link key={i} href={item.href} className={styles.continueBar}>
                <div className={styles.continueIcon}>▶</div>
                <div className={styles.continueInfo}>
                  <div className={styles.continueTitle}>{item.title}</div>
                  <div className={styles.continueMeta}>
                    {item.subtitle ? `${item.subtitle} · ` : ""}{relativeTime(item.uploadedAt)}
                  </div>
                </div>
                <span className={styles.continueArrow}>›</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <OnboardingTrigger pageKey="home" />
    </div>
  )
}
