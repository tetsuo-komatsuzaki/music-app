"use client"

import { useParams } from "next/navigation"
import { useState } from "react"
import styles from "./progress.module.css"
import OnboardingTrigger from "../_onboarding/OnboardingTrigger"

// ─── 型 ──────────────────────────────────────────────────────
type WeaknessItem = { label: string; severity: number }
type WeekStat     = { label: string; sessions: number; pitchAvg: number | null }

type Props = {
  tab:             string
  streak:          number
  dayAchievements: Record<string, number>   // dateStr → 0..3
  weaknessData:    WeaknessItem[]
  weeklyStats:     WeekStat[]
}

// ─── タブ定義 ─────────────────────────────────────────────────
const TABS = [
  { key: "calendar", label: "練習カレンダー" },
  { key: "weakness", label: "弱点" },
  { key: "summary",  label: "サマリー" },
]

const DAY_HEADERS = ["月", "火", "水", "木", "金", "土", "日"]


// ─── 弱点バーの色 ─────────────────────────────────────────────
function weaknessColor(severity: number): string {
  if (severity >= 0.3) return "#E24B4A"
  if (severity >= 0.15) return "#EF9F27"
  return "#1D9E75"
}

function pad2(n: number): string { return String(n).padStart(2, "0") }

export default function ProgressPage({
  tab,
  streak,
  dayAchievements,
  weaknessData,
  weeklyStats,
}: Props) {
  const params = useParams()
  const userId = params.userId as string

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

  // 未来の月へは行けない
  const canGoNext = year < todayY || (year === todayY && month < todayM)

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

  // ── 週間セッション最大値（サマリー棒グラフ用）──
  const maxSessions = Math.max(...weeklyStats.map(w => w.sessions), 1)

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
                disabled={!canGoNext}
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
          弱点タブ
      ═══════════════════════════════════════════════════════ */}
      {tab === "weakness" && (
        <div className={styles.card} data-onboarding="progress.weakness">
          <div className={styles.cardTitle}>エラー率（低いほど良い）</div>
          {weaknessData.length === 0 ? (
            <div style={{ color: "#999", fontSize: 13 }}>
              まだデータがありません。演奏を録音して評価を確認しましょう。
            </div>
          ) : (
            weaknessData.map((w, i) => {
              const pct   = Math.round(w.severity * 100)
              const color = weaknessColor(w.severity)
              return (
                <div key={i} className={styles.weaknessItem}>
                  <div className={styles.weaknessHeader}>
                    <span className={styles.weaknessLabel}>{w.label}</span>
                    <span className={styles.weaknessPct} style={{ color }}>{pct}%</span>
                  </div>
                  <div className={styles.weaknessBar}>
                    <div
                      className={styles.weaknessBarFill}
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          サマリータブ
      ═══════════════════════════════════════════════════════ */}
      {tab === "summary" && (
        <>
          <div className={styles.card}>
            <div className={styles.summaryMetrics}>
              <div className={styles.metricBox}>
                <div className={styles.metricLabel}>総セッション数</div>
                <div className={styles.metricValue}>
                  {weeklyStats.reduce((a, w) => a + w.sessions, 0)}
                </div>
              </div>
              <div className={styles.metricBox}>
                <div className={styles.metricLabel}>過去8週間</div>
                <div className={styles.metricValue}>
                  {weeklyStats.filter(w => w.sessions > 0).length}週
                </div>
              </div>
            </div>

            <div className={styles.chartTitle}>週別セッション数</div>
            <div className={styles.barChart}>
              {weeklyStats.map((w, i) => (
                <div key={i} className={styles.barChartCol}>
                  <div
                    className={styles.barChartBar}
                    style={{ height: `${Math.max((w.sessions / maxSessions) * 80, 4)}px` }}
                  />
                  <div className={styles.barChartLabel}>{w.label}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <OnboardingTrigger pageKey="progress" />
    </div>
  )
}
