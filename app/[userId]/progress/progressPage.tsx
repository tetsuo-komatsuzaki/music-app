"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"
import GradeBadge from "@/app/components/GradeBadge"
import GradeProgressBar from "@/app/components/GradeProgressBar"
import type { GradeLevel } from "@/app/_libs/skillMaster"
import { PRACTICE_CATEGORIES, categoryLabel } from "@/app/_libs/practiceConstants"
import styles from "./progress.module.css"
import OnboardingTrigger from "../_onboarding/OnboardingTrigger"

// v1.6 Phase 4-2 (2026-05-16) — Progress ページ Client Component
// 仕様書 §3-5-3 引用: 「本書 §1-2 グレード ↔ ★マッピングと §2 マスター条件に整合させる」

type GradeData = {
  currentStar: number
  currentGrade: GradeLevel
  masteredSongCountAtCurrentStar: number
  gradeUpRequired: number
  masterReachedAt: string | null
  isMaster: boolean
}

type MasteredSong = {
  scoreId: string
  title: string
  composer: string | null
  star: number | null
  keyTonic: string | null
  keyMode: string | null
  recentAverageScore: number | null
  totalPerformanceCount: number
  fullyMasteredAt: string | null
}

type Props = {
  tab:             string
  userId:          string
  streak:          number
  dayAchievements: Record<string, number>   // dateStr → 0..3
  gradeData:       GradeData
  masteredSongs:   MasteredSong[]
  practiceMasterySummary: Record<string, number>
}

// ─── タブ定義 (v1.6 Phase 4-2: 旧 tasks タブ削除、mastery タブ追加) ─────
const TABS = [
  { key: "mastery",  label: "習得状況" },
  { key: "calendar", label: "練習カレンダー" },
]

const DAY_HEADERS = ["月", "火", "水", "木", "金", "土", "日"]

function pad2(n: number): string { return String(n).padStart(2, "0") }

function formatJpDate(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("ja-JP", {
    year: "numeric", month: "long", day: "numeric",
  })
}

export default function ProgressPage({
  tab,
  userId: userIdProp,
  streak,
  dayAchievements,
  gradeData,
  masteredSongs,
  practiceMasterySummary,
}: Props) {
  const params = useParams()
  const userId = (params.userId as string) ?? userIdProp

  // ── カレンダー表示中の年月 ──
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

  function dayClassName(achievements: number | undefined, isToday: boolean): string {
    const parts = [styles.calendarDay]
    if (achievements === 3) parts.push(styles.dayAchievement3)
    else if (achievements === 2) parts.push(styles.dayAchievement2)
    else if (achievements === 1) parts.push(styles.dayAchievement1)
    if (isToday) parts.push(styles.dayToday)
    return parts.join(" ")
  }

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
          v1.6 Phase 4-2: 習得状況タブ (新タブ、デフォルト)
      ═══════════════════════════════════════════════════════ */}
      {tab === "mastery" && (
        <>
          {/* 1a. グレードサマリ */}
          <div className={styles.card}>
            <div className={styles.sectionTitle}>あなたのグレード</div>
            <div className={styles.gradeRow}>
              <GradeBadge
                currentStar={gradeData.currentStar}
                currentGrade={gradeData.currentGrade}
              />
              <div className={styles.gradeProgress}>
                <GradeProgressBar
                  current={gradeData.masteredSongCountAtCurrentStar}
                  target={gradeData.gradeUpRequired}
                  isMaster={gradeData.isMaster}
                  masterReachedAt={gradeData.masterReachedAt}
                />
              </div>
            </div>
          </div>

          {/* 1b. 完全習得曲リスト */}
          <div className={styles.card}>
            <div className={styles.sectionTitle}>
              完全習得した曲 ({masteredSongs.length}件)
            </div>
            {masteredSongs.length === 0 ? (
              <p className={styles.emptyHint}>
                まだ完全習得した曲はありません。Score 演奏で 5 回平均 ≥ 90 点 + 全演奏技法習得 + 全中課題クリアを目指しましょう。
              </p>
            ) : (
              <ul className={styles.masteredList}>
                {masteredSongs.map(song => (
                  <li key={song.scoreId} className={styles.masteredItem}>
                    <Link
                      href={`/${userId}/scores/${song.scoreId}`}
                      className={styles.masteredLink}
                    >
                      <div className={styles.masteredHeader}>
                        <span className={styles.masteredTitle}>{song.title}</span>
                        {song.star != null && (
                          <span className={styles.masteredStar}>☆{song.star}</span>
                        )}
                      </div>
                      {song.composer && (
                        <div className={styles.masteredMeta}>
                          作曲: {song.composer}
                        </div>
                      )}
                      <div className={styles.masteredMeta}>
                        完全習得: {formatJpDate(song.fullyMasteredAt)}
                        {song.recentAverageScore != null && (
                          <> · 直近 5 回平均 {song.recentAverageScore.toFixed(1)} 点</>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 1d. 練習教材マスター状況サマリ */}
          <div className={styles.card}>
            <div className={styles.sectionTitle}>練習教材マスター状況</div>
            <div className={styles.masterySummaryGrid}>
              {PRACTICE_CATEGORIES.map(cat => (
                <div key={cat} className={styles.masterySummaryItem}>
                  <div className={styles.masterySummaryLabel}>{categoryLabel(cat)}</div>
                  <div className={styles.masterySummaryValue}>
                    {practiceMasterySummary[cat] ?? 0}<span className={styles.masterySummaryUnit}>件</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════
          練習カレンダータブ (現状温存、Phase 4-2 範囲外)
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

      <OnboardingTrigger pageKey="progress" />
    </div>
  )
}
