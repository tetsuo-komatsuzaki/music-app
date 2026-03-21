"use client"

import { useParams, useRouter, useSearchParams } from "next/navigation"
import styles from "./progress.module.css"
import AnimatedRings from "@/app/components/AnimatedRings"

// ─── 型 ──────────────────────────────────────────────────────
type CalendarMonth = {
  year:  number
  month: number
  days:  Record<string, "done" | "today" | "miss">
}

type DayRings = {
  dateStr:  string
  practice: number
  record:   number
  review:   number
}

type WeaknessItem = { label: string; severity: number }
type WeekStat     = { label: string; sessions: number; pitchAvg: number | null }

type Props = {
  tab:            string
  streak:         number
  calendarMonths: CalendarMonth[]
  weekRings:      DayRings[]
  weaknessData:   WeaknessItem[]
  weeklyStats:    WeekStat[]
}

// ─── タブ定義 ─────────────────────────────────────────────────
const TABS = [
  { key: "streak",   label: "ストリーク" },
  { key: "rings",    label: "3リング" },
  { key: "weakness", label: "弱点" },
  { key: "summary",  label: "サマリー" },
  { key: "reminder", label: "リマインダー" },
]

const DAY_HEADERS = ["月", "火", "水", "木", "金", "土", "日"]


// ─── 弱点バーの色 ─────────────────────────────────────────────
function weaknessColor(severity: number): string {
  if (severity >= 0.3) return "#E24B4A"
  if (severity >= 0.15) return "#EF9F27"
  return "#1D9E75"
}

export default function ProgressPage({
  tab,
  streak,
  calendarMonths,
  weekRings,
  weaknessData,
  weeklyStats,
}: Props) {
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string

  function tabHref(key: string) {
    return `/${userId}/progress?tab=${key}`
  }

  // ── 週間セッション最大値（サマリー棒グラフ用）──
  const maxSessions = Math.max(...weeklyStats.map(w => w.sessions), 1)

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
          ストリークタブ
      ═══════════════════════════════════════════════════════ */}
      {tab === "streak" && (
        <>
          <div className={styles.card}>
            <div className={styles.streakHero}>
              <span style={{ fontSize: 36 }}>🔥</span>
              <span className={styles.streakNumber}>{streak}</span>
              <span className={styles.streakUnit}>days</span>
            </div>
            <div className={styles.streakSub}>連続練習ストリーク</div>
          </div>

          {calendarMonths.map(({ year, month, days }) => {
            // 月の1日の曜日（0=日〜6=土 → 月基準に変換）
            const firstDow = new Date(year, month - 1, 1).getDay()
            const offset   = firstDow === 0 ? 6 : firstDow - 1
            const daysInMonth = new Date(year, month, 0).getDate()

            return (
              <div key={`${year}-${month}`} className={styles.card}>
                <div className={styles.calendarMonthLabel}>
                  {year}年{month}月
                </div>
                <div className={styles.calendarGrid}>
                  {DAY_HEADERS.map(h => (
                    <div key={h} className={styles.calendarDayHeader}>{h}</div>
                  ))}
                  {Array.from({ length: offset }).map((_, i) => (
                    <div key={`empty-${i}`} className={`${styles.calendarDay} ${styles.dayEmpty}`} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const d       = i + 1
                    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`
                    const state   = days[dateStr]
                    const cls = state === "done"  ? styles.dayDone
                              : state === "today" ? styles.dayToday
                              : state === "miss"  ? styles.dayMiss
                              : styles.dayEmpty
                    return (
                      <div key={d} className={`${styles.calendarDay} ${cls}`}>
                        {d}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════
          3リングタブ
      ═══════════════════════════════════════════════════════ */}
      {tab === "rings" && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>過去7日間の3リング</div>
          <div className={styles.weekRingGrid}>
            {weekRings.map(day => {
              const d    = new Date(day.dateStr + "T00:00:00")
              const dow  = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()]
              const date = `${d.getMonth() + 1}/${d.getDate()}`
              return (
                <div key={day.dateStr} className={styles.weekRingDay}>
                  <div className={styles.weekRingLabel}>{dow}</div>
                  <AnimatedRings
                    size={46} cx={23} cy={23} strokeWidth={5}
                    rings={[
                      { r: 20, color: "#1D9E75", bg: "#E1F5EE", progress: day.practice },
                      { r: 14, color: "#378ADD", bg: "#E6F1FB", progress: day.record },
                      { r:  8, color: "#534AB7", bg: "#EEEDFE", progress: day.review },
                    ]}
                  />
                  <div className={styles.weekRingDate}>{date}</div>
                </div>
              )
            })}
          </div>

          <div className={styles.ringLegend}>
            <div className={styles.ringLegendItem}>
              <span className={styles.ringLegendDot} style={{ background: "#1D9E75" }} />
              練習 (15分以上)
            </div>
            <div className={styles.ringLegendItem}>
              <span className={styles.ringLegendDot} style={{ background: "#378ADD" }} />
              録音 (1回以上)
            </div>
            <div className={styles.ringLegendItem}>
              <span className={styles.ringLegendDot} style={{ background: "#534AB7" }} />
              確認 (2回以上)
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          弱点タブ
      ═══════════════════════════════════════════════════════ */}
      {tab === "weakness" && (
        <div className={styles.card}>
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

      {/* ═══════════════════════════════════════════════════════
          リマインダータブ
      ═══════════════════════════════════════════════════════ */}
      {tab === "reminder" && (
        <>
          <div className={styles.card}>
            <div className={styles.reminderRow}>
              <span className={styles.reminderLabel}>リマインダーを有効化</span>
              <button className={styles.toggleOn}>ON</button>
            </div>
            <div className={styles.reminderRow}>
              <span className={styles.reminderLabel}>AI最適タイミング</span>
              <button className={styles.toggleOn}>ON</button>
            </div>
            <div className={styles.reminderRow}>
              <span className={styles.reminderLabel}>文脈に合わせたメッセージ</span>
              <button className={styles.toggleOn}>ON</button>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.notificationPreview}>
              <div className={styles.previewTitle}>通知プレビュー</div>
              <div className={styles.previewItem}>
                <div className={styles.previewTime}>平日 18:30</div>
                <div className={styles.previewText}>
                  今日も練習しましょう！ストリークを維持するチャンスです。
                </div>
              </div>
              <div className={styles.previewItem} style={{ borderLeftColor: "#EF9F27" }}>
                <div className={styles.previewTime}>20:00（未練習の場合）</div>
                <div className={styles.previewText}>
                  ストリークが途切れそうです。3分でもスケール練習はいかがですか？
                </div>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  )
}
