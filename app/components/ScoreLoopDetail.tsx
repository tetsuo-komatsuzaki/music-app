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
import ds from "./ds.module.css"
import WeaknessDiagnosisCard from "./WeaknessDiagnosisCard"
import { type AchievementStatus } from "./GoalTracker"
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
    return <div className={styles.error}>いまうまく開けなかったみたい。少し待ってね</div>
  }
  if (!achv) {
    return <div className={styles.loading}>読み込み中...</div>
  }

  return (
    <div className={styles.container} role="tabpanel" id="score-detail-tab-panel-loop">
      {/* ゴール進捗カード(GoalTracker)は非表示: ホーム側と情報が重複するため (2026-08-16 Tetsuo指定) */}

      {/* ── 2. 学びのポイント — モック LEARN_CARD の写経: DSカード + lab + 行 ── */}
      <section className={ds.card} style={{ marginTop: 0 }}>
        <h2 className={ds.lab} style={{ margin: 0 }}>学びのポイント</h2>
        <DailyLessons lessons={achv.dailyLessons ?? []} userId={userId} fromScoreId={scoreId} />
      </section>

      {/* ── 3. 伸びしろポイント — モック GROWTH_CARD の写経 (中身は WeaknessDiagnosisCard) ──
          data-onboarding: 画面ガイドが「おすすめ練習はここ」と指すアンカー。
          演奏記録が無い場合も emptyHint がこの中に出るため、常に存在する。 */}
      <section className={ds.card} style={{ marginTop: 0 }} data-onboarding="scoreDetail.recommendation">
        <h2 className={ds.lab} style={{ margin: "0 0 6px" }}>伸びしろポイント</h2>
        {achv.latestPerformanceId ? (
          <WeaknessDiagnosisCard
            performanceId={achv.latestPerformanceId}
            kind="score"
            userId={userId}
            hideHeading
            hideMaterials
            fromScoreId={scoreId}
          />
        ) : (
          <p className={styles.emptyHint}>
            まだ録音がないよ。弾いてみると、ここに練習のヒントが出るよ
          </p>
        )}
      </section>
    </div>
  )
}
