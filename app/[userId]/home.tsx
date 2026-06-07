"use client"

import { useState } from "react"
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
  /** UI-9 (§11-3): active カード優先のレコメンド (最大 5 件) = 課題クリア用の練習教材 */
  songRecommendations: SongRecommendation[]
  recentHistory: {
    title: string
    subtitle: string
    href: string
    uploadedAt: string
  }[]
  /** 直近の練習曲 (Score) + 曲別 直近平均スコア */
  recentPieces: { id: string; title: string; recentAvg: number | null; href: string }[]
  /** いまの課題名 (active カード由来)。null = 課題なし → フォールバック文言 */
  challengeName: string | null
}

// スコア → ランク色 (scoreDetail と同じ閾値)
function scoreColor(score: number): { color: string; bg: string } {
  if (score >= 90) return { color: "#085041", bg: "#E1F5EE" }
  if (score >= 75) return { color: "#0C447C", bg: "#E6F1FB" }
  if (score >= 60) return { color: "#633806", bg: "#FAEEDA" }
  return { color: "#791F1F", bg: "#FCEBEB" }
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

// ─── 今日の練習 (直近の練習曲タブ + 課題アドバイス + 教材リンク) ──────────
function TodayPanel({
  recentPieces,
  challengeName,
  materials,
}: {
  recentPieces: Props["recentPieces"]
  challengeName: string | null
  materials: SongRecommendation[]
}) {
  const [active, setActive] = useState(0)
  const piece = recentPieces[active] ?? recentPieces[0] ?? null

  return (
    <div className={styles.card}>
      <div className={styles.sectionTitle}>今日の練習</div>

      {/* 直近の練習曲: 複数なら横タブ */}
      {recentPieces.length > 0 && (
        <>
          {recentPieces.length > 1 && (
            <div
              style={{
                display: "flex",
                gap: 8,
                overflowX: "auto",
                paddingBottom: 6,
                marginBottom: 10,
              }}
            >
              {recentPieces.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActive(i)}
                  style={{
                    flex: "0 0 auto",
                    padding: "6px 12px",
                    borderRadius: 999,
                    border: "1px solid",
                    borderColor: active === i ? "#4a90d9" : "#ddd",
                    background: active === i ? "#4a90d9" : "#fff",
                    color: active === i ? "#fff" : "#555",
                    fontSize: 13,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.title}
                </button>
              ))}
            </div>
          )}

          {piece && (
            <Link
              href={piece.href}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "12px 14px",
                borderRadius: 12,
                background: "#f7f9fc",
                textDecoration: "none",
                color: "inherit",
                marginBottom: 12,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, color: "#888" }}>直近平均スコア</div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {piece.title}
                </div>
              </div>
              {piece.recentAvg != null ? (
                <span
                  style={{
                    flex: "0 0 auto",
                    fontSize: 22,
                    fontWeight: 700,
                    padding: "4px 12px",
                    borderRadius: 10,
                    ...scoreColor(piece.recentAvg),
                  }}
                >
                  {piece.recentAvg}
                  <span style={{ fontSize: 12, fontWeight: 500 }}>点</span>
                </span>
              ) : (
                <span style={{ flex: "0 0 auto", fontSize: 13, color: "#aaa" }}>未評価</span>
              )}
            </Link>
          )}
        </>
      )}

      {/* 課題アドバイス: あれば課題名、なければフォールバック */}
      {challengeName ? (
        <div style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 10 }}>
          いま「<strong>{challengeName}</strong>」が課題と出ているね。
          <br />
          クリアまでに以下の課題練習をしてみよう！
        </div>
      ) : (
        <div style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 10, color: "#555" }}>
          直近の課題はありません！<br />次の曲にチャレンジしてみよう！
        </div>
      )}

      {/* 課題クリア用の練習教材リンク */}
      <RecommendationList recommendations={materials} />
    </div>
  )
}

export default function HomeClient({
  userName: _userName,
  streak,
  weeklyDays,
  arcoMessage,
  gradeData,
  songRecommendations,
  recentHistory,
  recentPieces,
  challengeName,
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

      {/* ───── 今日の練習: 直近の練習曲 + 課題アドバイス + 教材リンク ───── */}
      <TodayPanel
        recentPieces={recentPieces}
        challengeName={challengeName}
        materials={songRecommendations}
      />

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
