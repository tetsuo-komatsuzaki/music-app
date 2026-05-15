// app/components/ScoreLoopDetail.tsx
//
// v1.3 Phase 4-1 (2026-05-16) — Score 詳細「上達ループ」タブの中身。
// GET /api/scores/[scoreId]/loop-detail を読みに行き、SongMastery / SkillTaskCard /
// SubTask / SubTaskAssignment / MissingFlag を表示する。

"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import styles from "./ScoreLoopDetail.module.css"

// ─── API レスポンスの型 (route.ts と同期) ────────────────────────────────────

type LoopDetailResponse = {
  performance: {
    id: string
    scoreId: string
    uploadedAt: string
    pitchAccuracy: number | null
    rhythmAccuracy: number | null
    bowingAccuracy: number | null
    overallScore: number | null
    pitchSkillScore: number | null
    rhythmSkillScore: number | null
    bowingSkillScore: number | null
    skillSubScores: unknown
    problematicPositions: unknown
  } | null
  songMastery: {
    recentAverageScore: number | null
    totalPerformanceCount: number
    isPerformanceMastered: boolean
    isFullyMastered: boolean
    performanceMasteredAt: string | null
    fullyMasteredAt: string | null
  } | null
  skillTaskCards: Array<{
    id: string
    taskCategory: "PITCH" | "RHYTHM" | "BOWING"
    status: "active" | "improving" | "cleared"
    generatedAt: string
    lastMatchedAt: string | null
    clearedAt: string | null
    subTasks: Array<{
      id: string
      subTaskType: string
      status: "active" | "cleared"
      clearedAt: string | null
      assignments: Array<{
        practiceItemId: string
        assignedCategory: "SCALE" | "ARPEGGIO" | "ETUDE"
        isMastered: boolean
        masteredAt: string | null
        title: string
        category: string
        star: number | null
        sortOrder: number | null
      }>
    }>
  }>
  missingFlags: Array<{
    subTaskType: string
    missingCategory: string
    detectedAt: string
  }>
}

const CATEGORY_LABELS: Record<"PITCH" | "RHYTHM" | "BOWING", string> = {
  PITCH: "音程",
  RHYTHM: "リズム",
  BOWING: "弓使い",
}

const STATUS_LABELS: Record<string, string> = {
  active: "課題中",
  improving: "改善中",
  cleared: "クリア",
}

const ASSIGN_LABELS: Record<"SCALE" | "ARPEGGIO" | "ETUDE", string> = {
  SCALE: "音階",
  ARPEGGIO: "アルペジオ",
  ETUDE: "エチュード",
}

const ASSIGN_HREF: Record<"SCALE" | "ARPEGGIO" | "ETUDE", string> = {
  SCALE: "scale",
  ARPEGGIO: "arpeggio",
  ETUDE: "etude",
}

const SUB_TASK_LABELS: Record<string, string> = {
  pitch_overall: "全体",
  pitch_high: "高音域",
  pitch_chromatic: "半音階",
  rhythm_overall: "全体",
  rhythm_fast: "高速パッセージ",
  rhythm_after_rest: "休符明け",
  string_change_volume: "音量バランス",
  string_change_slur: "スラー",
  string_change_timing: "タイミング",
}

type Props = {
  scoreId: string
  userId: string
  /** Score detail で URL クエリ ?tab=loop に到達した瞬間に再フェッチさせるための trigger key */
  refetchKey?: number
}

export default function ScoreLoopDetail({ scoreId, userId, refetchKey }: Props) {
  const [data, setData] = useState<LoopDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch(`/api/scores/${scoreId}/loop-detail`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.error ?? `HTTP ${res.status}`)
        }
        return res.json() as Promise<LoopDetailResponse>
      })
      .then((json) => {
        if (!cancelled) setData(json)
      })
      .catch((e) => {
        if (!cancelled) setError(e.message ?? String(e))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [scoreId, refetchKey])

  if (loading) {
    return <div className={styles.loading}>読み込み中...</div>
  }
  if (error) {
    return (
      <div className={styles.error}>
        エラー: {error}
        <br />
        {error === "Forbidden"
          ? "この曲はまだ一度も演奏していません。録音すると上達ループが起動します。"
          : null}
      </div>
    )
  }
  if (!data) {
    return <div className={styles.error}>データなし</div>
  }

  const { performance, songMastery, skillTaskCards, missingFlags } = data

  return (
    <div className={styles.container} role="tabpanel" id="score-detail-tab-panel-loop">
      {/* ── 1. SongMastery サマリ ───────────────────────── */}
      <section className={styles.summarySection}>
        <h2 className={styles.sectionTitle}>習得状態</h2>
        {songMastery ? (
          <div className={styles.summaryRow}>
            <Stat label="累計演奏" value={`${songMastery.totalPerformanceCount} 回`} />
            <Stat
              label="直近 5 回平均"
              value={
                songMastery.recentAverageScore != null
                  ? `${songMastery.recentAverageScore.toFixed(1)} 点`
                  : "—"
              }
            />
            <Stat
              label="演奏マスター"
              value={songMastery.isPerformanceMastered ? "✓ 達成" : "—"}
              highlight={songMastery.isPerformanceMastered}
            />
            <Stat
              label="完全習得"
              value={songMastery.isFullyMastered ? "🏆 達成" : "—"}
              highlight={songMastery.isFullyMastered}
            />
          </div>
        ) : (
          <p className={styles.emptyHint}>まだ演奏記録がありません</p>
        )}
      </section>

      {/* ── 2. SkillTaskCard 3 列 (中課題) ───────────────────────── */}
      <section className={styles.cardSection}>
        <h2 className={styles.sectionTitle}>上達ループの課題</h2>
        {skillTaskCards.length === 0 ? (
          <p className={styles.emptyHint}>
            現在、課題化されている中項目はありません (全 ≥ 70 点)。
          </p>
        ) : (
          <div className={styles.cardGrid}>
            {skillTaskCards.map((card) => {
              const skillScore =
                performance == null
                  ? null
                  : card.taskCategory === "PITCH"
                  ? performance.pitchSkillScore
                  : card.taskCategory === "RHYTHM"
                  ? performance.rhythmSkillScore
                  : performance.bowingSkillScore
              return (
                <article
                  key={card.id}
                  className={`${styles.card} ${
                    card.status === "cleared" ? styles.cardCleared : ""
                  }`}
                >
                  <header className={styles.cardHeader}>
                    <h3 className={styles.cardTitle}>
                      {CATEGORY_LABELS[card.taskCategory]}
                    </h3>
                    <span
                      className={`${styles.statusBadge} ${
                        styles[`status_${card.status}`] ?? ""
                      }`}
                    >
                      {STATUS_LABELS[card.status] ?? card.status}
                    </span>
                  </header>
                  {skillScore != null && (
                    <p className={styles.cardScore}>
                      直近スキル: <strong>{skillScore.toFixed(1)}</strong> / 100
                    </p>
                  )}
                  {card.subTasks.length === 0 ? (
                    <p className={styles.emptyHint}>
                      小課題なし
                      {missingFlags.some((f) =>
                        f.subTaskType.startsWith(
                          card.taskCategory.toLowerCase().slice(0, 5),
                        ),
                      )
                        ? " (該当教材不足、MissingFlag 発火)"
                        : ""}
                    </p>
                  ) : (
                    <ul className={styles.subTaskList}>
                      {card.subTasks.map((st) => (
                        <li key={st.id} className={styles.subTask}>
                          <div className={styles.subTaskHeader}>
                            <span className={styles.subTaskTitle}>
                              {SUB_TASK_LABELS[st.subTaskType] ?? st.subTaskType}
                            </span>
                            <span
                              className={`${styles.subTaskStatus} ${
                                st.status === "cleared" ? styles.subTaskCleared : ""
                              }`}
                            >
                              {st.status === "cleared" ? "✓" : "・"}
                            </span>
                          </div>
                          <div className={styles.assignmentRow}>
                            {st.assignments.map((a) => (
                              <Link
                                key={a.practiceItemId}
                                href={`/${userId}/practice/${ASSIGN_HREF[a.assignedCategory]}/${a.practiceItemId}`}
                                className={`${styles.assignmentChip} ${
                                  a.isMastered ? styles.assignmentMastered : ""
                                }`}
                                title={a.title}
                              >
                                <span className={styles.assignmentCat}>
                                  {ASSIGN_LABELS[a.assignedCategory]}
                                </span>
                                <span className={styles.assignmentTitle}>
                                  {a.title}
                                </span>
                                {a.isMastered && (
                                  <span className={styles.assignmentMark}>✓</span>
                                )}
                              </Link>
                            ))}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* ── 3. MissingPracticeItemFlag ───────────────────────── */}
      {missingFlags.length > 0 && (
        <section className={styles.flagSection}>
          <h2 className={styles.sectionTitle}>運営対応待ち</h2>
          <p className={styles.flagHint}>
            該当教材が未登録の小課題があります。運営が追加するまでお待ちください。
          </p>
          <ul className={styles.flagList}>
            {missingFlags.map((f, i) => (
              <li key={`${f.subTaskType}-${f.missingCategory}-${i}`}>
                <code className={styles.flagSub}>
                  {SUB_TASK_LABELS[f.subTaskType] ?? f.subTaskType}
                </code>{" "}
                / 欠損:{" "}
                <code className={styles.flagCat}>
                  {ASSIGN_LABELS[
                    f.missingCategory.toUpperCase() as "SCALE" | "ARPEGGIO" | "ETUDE"
                  ] ?? f.missingCategory}
                </code>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className={`${styles.stat} ${highlight ? styles.statHighlight : ""}`}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>{value}</div>
    </div>
  )
}
