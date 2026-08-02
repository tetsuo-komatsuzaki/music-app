// app/components/ScoreLoopDetail.tsx
//
// Score 詳細「上達ループ」タブの中身 (C-6b 2026-07-11 全面新体系化)。
// GET /api/scores/[scoreId]/achievement-status 一本で:
//   1. 達成/マスター進捗トラッカー (レッスン/エチュード/通し3回/平均90)
//   2. 「取り組む課題」= 最新演奏の217診断 + 弱点練習の推薦 (WeaknessDiagnosisCard)
// 旧 loop-detail API (SkillTaskCard/旧SongMastery) 依存は撤去 (git 7520842 以前参照)。

"use client"

import { useEffect, useState } from "react"
import styles from "./ScoreLoopDetail.module.css"
import GuideSampleReview from "./GuideSampleReview"
import { useOnboarding } from "@/app/[userId]/_onboarding/hooks/useOnboarding"
import WeaknessDiagnosisCard from "./WeaknessDiagnosisCard"
import GoalTracker, { type AchievementStatus } from "./GoalTracker"
import DailyLessons from "./DailyLessons"

type Props = {
  scoreId: string
  userId: string
  /** Score detail で URL クエリ ?tab=loop に到達した瞬間に再フェッチさせるための trigger key */
  refetchKey?: number
}

export default function ScoreLoopDetail({ scoreId, userId, refetchKey }: Props) {
  const [achv, setAchv] = useState<AchievementStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  // 画面ガイドが見本を出している間だけ true 相当になる
  const { guideSample } = useOnboarding()

  useEffect(() => {
    let cancelled = false
    setError(null)
    fetch(`/api/scores/${scoreId}/achievement-status`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.error ?? `HTTP ${res.status}`)
        }
        return res.json() as Promise<AchievementStatus>
      })
      .then((json) => {
        if (!cancelled) setAchv(json)
      })
      .catch((e) => {
        if (!cancelled) setError(e.message ?? String(e))
      })
    return () => {
      cancelled = true
    }
  }, [scoreId, refetchKey])

  if (error) {
    return <div className={styles.error}>エラー: {error}</div>
  }
  if (!achv) {
    return <div className={styles.loading}>読み込み中...</div>
  }

  return (
    <div className={styles.container} role="tabpanel" id="score-detail-tab-panel-loop">
      {/* ── 1. 達成/マスター進捗 (共通部品 GoalTracker) ── */}
      <section className={styles.summarySection}>
        <h2 className={styles.sectionTitle}>🏆 この曲のゴール</h2>
        <GoalTracker achv={achv} />
      </section>

      {/* ── 2. 学びのポイント (4教材: ①音階 ②フィンガリング ③④推薦上位2。ホームと共通ロジック) ── */}
      <section className={styles.cardSection}>
        <h2 className={styles.sectionTitle}>🎯 学びのポイント</h2>
        <DailyLessons lessons={achv.dailyLessons ?? []} userId={userId} fromScoreId={scoreId} />
      </section>

      {/* ── 3. おすすめ練習 (最新演奏の217診断+弱点推薦) を「マスター」の直下に配置 ──
          「ゴール → その達成に効く練習」の流れになるよう、仕組み(詳しく)より前に出す。
          data-onboarding: 画面ガイドが「おすすめ練習はここ」と指すアンカー。
          演奏記録が無い場合も emptyHint がこの中に出るため、常に存在する。 */}
      <section className={styles.cardSection} data-onboarding="scoreDetail.recommendation">
        {achv.latestPerformanceId ? (
          <WeaknessDiagnosisCard
            performanceId={achv.latestPerformanceId}
            kind="score"
            userId={userId}
            hideMaterials
            fromScoreId={scoreId}
          />
        ) : guideSample === "review" ? (
          // 画面ガイド表示中: まだ演奏が無くても「弾くとこう出る」を見せる
          <GuideSampleReview userId={userId} />
        ) : (
          <p className={styles.emptyHint}>
            まだ演奏記録がありません。録音すると弱点と練習メニューが表示されます。
          </p>
        )}
      </section>

      {/* 達成/マスターの仕組み (詳しく) — 折りたたみ。最下部に置く */}
      <details style={{ marginBottom: 14, fontSize: 13, color: "#555" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600, color: "#4a90d9" }}>
          ？ 達成・マスターの仕組み
        </summary>
        <div style={{ marginTop: 8, lineHeight: 1.8, padding: "0 4px" }}>
          <strong>達成</strong>＝この曲を「弾ける」の認定。点数は関係なく、
          学びレッスン＋エチュード（対象がある場合）＋<strong>破綻せず3回弾き切る</strong>こと。
          <br />
          <strong>🏆 マスター</strong>＝達成に加えて<strong>直近5回の演奏スコア平均90点以上</strong>。
          達成した曲が同じ★で10曲たまると、次の★へ昇格します。
        </div>
      </details>
    </div>
  )
}
