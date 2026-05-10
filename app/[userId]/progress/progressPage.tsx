"use client"

import { useParams } from "next/navigation"
import { useState } from "react"
import TasksSection from "@/app/components/TasksSection"
import type { SkillTaskCardData } from "@/app/components/SkillTaskCardItem"
import styles from "./progress.module.css"
import OnboardingTrigger from "../_onboarding/OnboardingTrigger"

type MasteryProgress = {
  perfCount: number
  averageScore: number | null
  threshold: number
  window: number
}

type Props = {
  tab:             string
  userId:          string
  streak:          number
  dayAchievements: Record<string, number>   // dateStr → 0..3
  cards:           SkillTaskCardData[]
  subScoresMap:    Record<string, number | null>
  skillScoresMap:  Record<string, number | null>
  /** 現在のユーザーグレード (BEGINNER 等) */
  currentGrade: string
  /** ユーザーグレード内でマスターしていない最低難易度。null = グレード内全てマスター済み */
  currentTargetDifficulty: number | null
  /** 現在難易度の達成進捗 (直近5回平均) */
  currentDifficultyProgress: MasteryProgress | null
}

// ─── タブ定義 ─────────────────────────────────────────────────
// 旧「弱点」「サマリー」タブは削除し、マイページから「あなたの課題」を移設。
const TABS = [
  { key: "calendar", label: "練習カレンダー" },
  { key: "tasks",    label: "あなたの課題" },
]

const DAY_HEADERS = ["月", "火", "水", "木", "金", "土", "日"]

function pad2(n: number): string { return String(n).padStart(2, "0") }

export default function ProgressPage({
  tab,
  userId: userIdProp,
  streak,
  dayAchievements,
  cards,
  subScoresMap,
  skillScoresMap,
  currentGrade,
  currentTargetDifficulty,
  currentDifficultyProgress,
}: Props) {
  const params = useParams()
  // route の userId を優先 (props の userId はサーバ側から渡された supabaseUserId)
  const userId = (params.userId as string) ?? userIdProp

  // ── カレンダー表示中の年月（クライアント状態、初期=今日の月）──
  const today = new Date()
  const todayY = today.getFullYear()
  const todayM = today.getMonth() + 1
  const todayD = today.getDate()

  const [year, setYear] = useState(todayY)
  const [month, setMonth] = useState(todayM)

  function navigateMonth(delta: number) {
    const d = new Date(year, month - 1 + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth() + 1)
  }

  function tabHref(key: string) {
    return `/${userId}/progress?tab=${key}`
  }

  // ── 達成レベルから色クラス決定 ──
  function dayClassName(achievements: number | undefined, isToday: boolean): string {
    const parts = [styles.calendarDay]
    if (achievements === 3) parts.push(styles.dayAchievement3)
    else if (achievements === 2) parts.push(styles.dayAchievement2)
    else if (achievements === 1) parts.push(styles.dayAchievement1)
    if (isToday) parts.push(styles.dayToday)
    return parts.join(" ")
  }

  // ── カレンダー描画用 ──
  const firstDow = new Date(year, month - 1, 1).getDay()
  const offset   = firstDow === 0 ? 6 : firstDow - 1
  const daysInMonth = new Date(year, month, 0).getDate()

  return (
    <div className={styles.page}>

      {/* ───── タブ ───── */}
      <div className={styles.tabs}>
        {TABS.map(t => (
          <a
            key={t.key}
            href={tabHref(t.key)}
            className={`${styles.tab} ${tab === t.key ? styles.tabActive : ""}`}
          >
            {t.label}
          </a>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════
          練習カレンダータブ (旧ストリーク + 旧3リング 統合)
      ═══════════════════════════════════════════════════════ */}
      {tab === "calendar" && (
        <>
          {/* 連続練習記録 */}
          <div className={styles.card}>
            <div className={styles.streakHero}>
              <span style={{ fontSize: 36 }}>🔥</span>
              <span className={styles.streakNumber}>{streak}</span>
              <span className={styles.streakUnit}>days</span>
            </div>
            <div className={styles.streakSub}>連続練習記録</div>
          </div>

          {/* カレンダー本体 (月ナビ + 達成レベル色) */}
          <div className={styles.card} data-onboarding="progress.calendar">
            <div className={styles.calendarHeader}>
              <button
                type="button"
                onClick={() => navigateMonth(-1)}
                className={styles.calendarNavBtn}
                aria-label="前の月"
              >
                ←
              </button>
              <div className={styles.calendarMonthLabel}>
                {year}年{month}月
              </div>
              <button
                type="button"
                onClick={() => navigateMonth(1)}
                className={styles.calendarNavBtn}
                aria-label="次の月"
              >
                →
              </button>
            </div>

            <div className={styles.calendarGrid}>
              {DAY_HEADERS.map(h => (
                <div key={h} className={styles.calendarDayHeader}>{h}</div>
              ))}
              {Array.from({ length: offset }).map((_, i) => (
                <div key={`empty-${i}`} className={styles.calendarDay} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const d       = i + 1
                const dateStr = `${year}-${pad2(month)}-${pad2(d)}`
                const isToday = year === todayY && month === todayM && d === todayD
                const ach     = dayAchievements[dateStr]
                return (
                  <div key={d} className={dayClassName(ach, isToday)}>
                    {d}
                  </div>
                )
              })}
            </div>

            {/* 凡例 */}
            <div className={styles.calendarLegend}>
              <div className={styles.legendItem}>
                <span className={`${styles.legendBox} ${styles.dayAchievement1}`} />
                1つ達成
              </div>
              <div className={styles.legendItem}>
                <span className={`${styles.legendBox} ${styles.dayAchievement2}`} />
                2つ達成
              </div>
              <div className={styles.legendItem}>
                <span className={`${styles.legendBox} ${styles.dayAchievement3}`} />
                3つ達成
              </div>
            </div>
            <div className={styles.legendNote}>
              達成項目: 練習15分以上 / 録音1回以上 / 確認2回以上
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════
          あなたの課題タブ (マイページから移設)
      ═══════════════════════════════════════════════════════ */}
      {tab === "tasks" && (
        <div className={styles.card}>
          <TasksSection
            userId={userId}
            initialCards={cards}
            subScoresMap={subScoresMap}
            skillScoresMap={skillScoresMap}
            currentGrade={currentGrade}
            currentTargetDifficulty={currentTargetDifficulty}
            currentDifficultyProgress={currentDifficultyProgress}
          />
        </div>
      )}

      <OnboardingTrigger pageKey="progress" />
    </div>
  )
}
