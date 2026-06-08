// app/components/ScoreLoopDetail.tsx
//
// v1.3 Phase 4-1 (2026-05-16) — Score 詳細「上達ループ」タブの中身。
// GET /api/scores/[scoreId]/loop-detail を読みに行き、SongMastery / SkillTaskCard /
// SubTask / SubTaskAssignment / MissingFlag を表示する。

"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import styles from "./ScoreLoopDetail.module.css"
import {
  assignedCategoryLabel,
  assignedCategoryHref,
} from "@/app/_libs/practiceConstants"

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
          ? "この曲はまだ一度も演奏していません。録音すると課題の取り組み状況が表示されます。"
          : null}
      </div>
    )
  }
  if (!data) {
    return <div className={styles.error}>データなし</div>
  }

  const { songMastery, skillTaskCards, missingFlags } = data

  // 曲マスター進捗トラッカー用の集計 ([[project_clear_master_philosophy]])
  const totalCards = skillTaskCards.length
  const clearedCards = skillTaskCards.filter((c) => c.status === "cleared").length
  const remainingCards = totalCards - clearedCards
  const challengesOk = remainingCards === 0
  const avg = songMastery?.recentAverageScore ?? null
  const avgOk = avg != null && avg >= 90

  return (
    <div className={styles.container} role="tabpanel" id="score-detail-tab-panel-loop">
      {/* ── 1. 曲マスター進捗トラッカー ([[project_clear_master_philosophy]]) ── */}
      <section className={styles.summarySection}>
        <h2 className={styles.sectionTitle}>🏆 曲マスターまで</h2>
        {songMastery ? (
          songMastery.isFullyMastered ? (
            <div style={{ fontWeight: 700, color: "#b5651d", fontSize: 15, padding: "4px 0" }}>
              🏆 この曲はマスター済みです！おめでとうございます
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {/* 条件1: 課題を全部クリア */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <span style={{ fontSize: 16 }}>{challengesOk ? "✅" : "⬜"}</span>
                <span style={{ fontWeight: 600 }}>課題をすべてクリア</span>
                <span style={{ color: "#666", marginLeft: "auto" }}>
                  {clearedCards} / {totalCards} 個
                  {!challengesOk && `（あと ${remainingCards} 個）`}
                </span>
              </div>
              {/* 条件2: 演奏スコア 90点以上 */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <span style={{ fontSize: 16 }}>{avgOk ? "✅" : "⬜"}</span>
                <span style={{ fontWeight: 600 }}>演奏スコア 90点以上</span>
                <span style={{ color: "#666", marginLeft: "auto" }}>
                  {avg != null ? `現在 ${avg.toFixed(0)}点` : "未測定"}
                  {avg != null && !avgOk && `（あと ${Math.max(1, Math.ceil(90 - avg))}点）`}
                </span>
              </div>
            </div>
          )
        ) : (
          <p className={styles.emptyHint}>まだ演奏記録がありません。録音するとここに進捗が出ます。</p>
        )}
        <div style={{ fontSize: 12, color: "#aaa", marginTop: 10 }}>
          累計演奏 {songMastery?.totalPerformanceCount ?? 0} 回 ／ 演奏スコア＝直近5回の音程＋リズム平均
        </div>
      </section>

      {/* クリアの仕組み (詳しく) — 折りたたみ。普段は進捗トラッカーで十分 */}
      <details style={{ marginBottom: 14, fontSize: 13, color: "#555" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600, color: "#4a90d9" }}>
          ？ 課題クリア・曲マスターの仕組み
        </summary>
        <div style={{ marginTop: 8, lineHeight: 1.8, padding: "0 4px" }}>
          曲を弾く → 弱点（<strong>課題</strong>）が見つかる → その課題の
          <strong>練習教材をクリア</strong>すると<strong>課題クリア</strong>。
          すべての課題をクリアし、<strong>直近5回の演奏スコアが90点以上</strong>になると
          <strong> 🏆 曲マスター</strong>です。
        </div>
      </details>

      {/* ── 2. SkillTaskCard 3 列 (中課題) ───────────────────────── */}
      <section className={styles.cardSection}>
        <h2 className={styles.sectionTitle}>取り組む課題</h2>
        {skillTaskCards.length === 0 ? (
          <p className={styles.emptyHint}>
            現在、課題化されている中項目はありません (全 ≥ 70 点)。
          </p>
        ) : (
          <div className={styles.cardGrid}>
            {skillTaskCards.map((card) => {
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
                  {/* 中項目スキルスコア(音程/リズム/弓使いの◯◯点)は非表示化 (2026-06-08 Tetsuo) */}
                  {/* 教材クリア進捗: 課題クリア=配下の練習教材(小課題)を全クリア */}
                  {card.subTasks.length > 0 && (
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        margin: "2px 0 8px",
                        color: card.status === "cleared" ? "#2e8b57" : "#c47a00",
                      }}
                    >
                      {card.status === "cleared"
                        ? "✓ この課題はクリア済み"
                        : `練習教材 ${card.subTasks.filter((st) => st.status === "cleared").length} / ${card.subTasks.length} クリア（全部クリアでこの課題クリア）`}
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
                                href={`/${userId}/practice/${assignedCategoryHref(a.assignedCategory)}/${a.practiceItemId}`}
                                className={`${styles.assignmentChip} ${
                                  a.isMastered ? styles.assignmentMastered : ""
                                }`}
                                title={a.title}
                              >
                                <span className={styles.assignmentCat}>
                                  {assignedCategoryLabel(a.assignedCategory)}
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
                  {assignedCategoryLabel(f.missingCategory.toUpperCase())}
                </code>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

