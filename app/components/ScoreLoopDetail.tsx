// app/components/ScoreLoopDetail.tsx
//
// v1.3 Phase 4-1 (2026-05-16) — Score 詳細「上達ループ」タブの中身。
// GET /api/scores/[scoreId]/loop-detail を読みに行き、SongMastery / SkillTaskCard /
// SubTask / SubTaskAssignment / MissingFlag を表示する。

"use client"

import { useEffect, useState } from "react"
import styles from "./ScoreLoopDetail.module.css"
import WeaknessDiagnosisCard from "./WeaknessDiagnosisCard"

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

  const { songMastery, skillTaskCards } = data

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

      {/* ── 2. 工程C-6a (2026-07-11): 旧SkillTaskCard(55体系)を217診断の弱点+推薦に置換。
             「この曲から生じた課題」= 最新演奏の診断 (Tetsuo確定)。
             旧 MissingFlag 表示は新カードの「教材準備中です」(noStock) が代替 ── */}
      <section className={styles.cardSection}>
        <h2 className={styles.sectionTitle}>取り組む課題</h2>
        {data.performance ? (
          <WeaknessDiagnosisCard
            performanceId={data.performance.id}
            kind="score"
            userId={userId}
          />
        ) : (
          <p className={styles.emptyHint}>
            まだ演奏記録がありません。録音すると弱点と練習メニューが表示されます。
          </p>
        )}
      </section>
    </div>
  )
}

