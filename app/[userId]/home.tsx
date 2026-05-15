"use client"

import Link from "next/link"
import GradeBadge from "@/app/components/GradeBadge"
import GradeProgressBar from "@/app/components/GradeProgressBar"
import RecommendationList from "@/app/components/RecommendationList"
import type { SongRecommendation } from "@/app/components/RecommendationItem"
import type { GradeLevel } from "@/app/_libs/skillMaster"
import styles from "./home.module.css"
import OnboardingTrigger from "./_onboarding/OnboardingTrigger"

// v1.6 Phase 4-2 (2026-05-16) — UserGradeProgress 準拠の表示用データ。
// 仕様書 §3-5-2 必須項目: 現在グレード + ★ + 次の★まで完全習得すべき曲数
type GradeData = {
  currentStar: number
  currentGrade: GradeLevel
  masteredSongCountAtCurrentStar: number
  gradeUpRequired: number
  gradeUpRemaining: number
  isMaster: boolean
  masterReachedAt: string | null
}

type Props = {
  userName: string
  streak: number
  weeklyDays: number
  arcoMessage: { greeting: string; cheer: string }
  /** v1.6 §3-5-2: アルコちゃんカード内に表示するグレード情報 */
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

  // v1.6 Phase 4-2 Q5=c: GradeProgressBar 直下のヒント文 (次グレード達成のヒント)
  // currentGrade と ★段階から、次グレード昇格の条件文を組み立てる
  const hintText = gradeData.isMaster
    ? undefined
    : (() => {
        const star = gradeData.currentStar
        if (star <= 2) return `☆3 まで習得すると中級者に昇格します`
        if (star === 3) return `☆4 を完全習得すると中級者に昇格します`
        if (star <= 5) return `☆6 まで習得すると上級者に昇格します`
        if (star === 6) return `☆7 を完全習得すると上級者に昇格します`
        if (star <= 8) return `☆9 まで習得すると上級者で安定します`
        if (star === 9) return `☆10 を完全習得するとマスターに到達します`
        return undefined
      })()

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

        {/* v1.6 Phase 4-2: グレード/★表示 (UserGradeProgress 準拠、Q3=A 旧 starsByLv 撤去) */}
        <div className={styles.gradeSection}>
          <div className={styles.gradeRow}>
            <GradeBadge
              currentStar={gradeData.currentStar}
              currentGrade={gradeData.currentGrade}
            />
            <div className={styles.gradeProgress}>
              <GradeProgressBar
                current={gradeData.masteredSongCountAtCurrentStar}
                target={gradeData.gradeUpRequired}
                hintText={hintText}
                isMaster={gradeData.isMaster}
                masterReachedAt={gradeData.masterReachedAt}
              />
            </div>
          </div>
        </div>
      </div>

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
