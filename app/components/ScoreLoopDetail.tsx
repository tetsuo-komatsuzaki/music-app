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

// 工程D/C-6b: achievement-status API レスポンス (route.ts と同期)
type AchievementStatus = {
  lessons: {
    total: number
    cleared: number
  }
  etude: { required: boolean; id?: string; title?: string; achieved?: boolean }
  cleanRuns: { count: number; required: number }
  achieved: boolean
  mastered: boolean
  master: {
    recentAvg: number | null
    scoredCount: number
    requiredCount: number
    threshold: number
  }
  latestPerformanceId: string | null
  totalPerformanceCount: number
}

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

  const avgOk =
    achv.master.recentAvg != null &&
    achv.master.scoredCount >= achv.master.requiredCount &&
    achv.master.recentAvg >= achv.master.threshold

  const conditionRow = (ok: boolean, label: string, detail: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
      <span style={{ fontSize: 16 }}>{ok ? "✅" : "⬜"}</span>
      <span style={{ fontWeight: 600 }}>{label}</span>
      <span style={{ color: "#666", marginLeft: "auto" }}>{detail}</span>
    </div>
  )

  return (
    <div className={styles.container} role="tabpanel" id="score-detail-tab-panel-loop">
      {/* ── 1. 達成/マスター進捗トラッカー (工程D: 新判定 spec§1) ── */}
      <section className={styles.summarySection}>
        <h2 className={styles.sectionTitle}>🏆 達成・マスターまで</h2>
        {achv.mastered ? (
          <div style={{ fontWeight: 700, color: "#b5651d", fontSize: 15, padding: "4px 0" }}>
            🏆 この曲はマスター済みです！おめでとうございます
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {achv.achieved ? (
              <div style={{ fontWeight: 700, color: "#2e8b57", fontSize: 14, padding: "2px 0" }}>
                ✨ この曲は達成済み！次はマスター（平均90点）を目指そう
              </div>
            ) : (
              <>
                {/* 達成条件① 学びレッスン（要件対象タグがある曲のみ表示） */}
                {achv.lessons.total > 0 &&
                  conditionRow(
                    achv.lessons.cleared >= achv.lessons.total,
                    "学びレッスン",
                    `${achv.lessons.cleared} / ${achv.lessons.total} クリア`,
                  )}
                {/* 達成条件② エチュード要件（対象がある曲のみ表示・無ければ免除） */}
                {achv.etude.required &&
                  conditionRow(
                    achv.etude.achieved === true,
                    "エチュードを達成",
                    achv.etude.achieved
                      ? `${achv.etude.title}`
                      : `${achv.etude.title} が未達成`,
                  )}
                {/* 達成条件③ 通し演奏 累計3回×崩壊ゼロ */}
                {conditionRow(
                  achv.cleanRuns.count >= achv.cleanRuns.required,
                  "通して弾き切る",
                  `${achv.cleanRuns.count} / ${achv.cleanRuns.required} 回`,
                )}
              </>
            )}
            {/* マスター条件: 直近5回平均90 */}
            {conditionRow(
              avgOk,
              "演奏スコア 90点以上（マスター条件）",
              achv.master.recentAvg != null
                ? `現在 ${achv.master.recentAvg.toFixed(0)}点（直近${achv.master.scoredCount}回）`
                : "未測定",
            )}
          </div>
        )}
      </section>

      {/* 達成/マスターの仕組み (詳しく) — 折りたたみ。普段は進捗トラッカーで十分 */}
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

      {/* ── 2. 最新演奏の217診断 + 弱点練習の推薦 (見出しは WeaknessDiagnosisCard 側) ── */}
      {/* data-onboarding: 画面ガイドが「おすすめ練習はここ」と指すアンカー。
          演奏記録が無い場合も emptyHint がこの中に出るため、常に存在する。 */}
      <section className={styles.cardSection} data-onboarding="scoreDetail.recommendation">
        {achv.latestPerformanceId ? (
          <WeaknessDiagnosisCard
            performanceId={achv.latestPerformanceId}
            kind="score"
            userId={userId}
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
    </div>
  )
}
