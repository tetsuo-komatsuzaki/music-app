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

// ── 「この曲のゴール」ビジュアル部品 (2026-07-25: 文字羅列 → 進捗リング/点数ゲージ) ──
type NodeOn = "a" | "m" | ""
function TrackNode({ em, label, on }: { em: string; label: string; on: NodeOn }) {
  const bg = on === "a" ? "#e9f7ef" : on === "m" ? "#fbf0da" : "#f1f4f8"
  const col = on === "a" ? "#2e8b57" : on === "m" ? "#b5651d" : "#9aa6b3"
  const bd = on === "a" ? "#bfe6cf" : on === "m" ? "#eecfa0" : "transparent"
  return (
    <div style={{ flex: 1, textAlign: "center", fontSize: 11, fontWeight: 800, padding: "7px 4px", borderRadius: 10, background: bg, color: col, border: `1.5px solid ${bd}` }}>
      <span style={{ display: "block", fontSize: 17, lineHeight: 1.1, marginBottom: 1, filter: on ? "none" : "grayscale(1) opacity(.5)" }}>{em}</span>
      {label}
    </div>
  )
}
function StepHead({ n, title, sub, tone }: { n: string; title: string; sub: string; tone: "s1" | "s2" }) {
  const pillBg = tone === "s1" ? "#e9f7ef" : "#fbf0da"
  const pillCol = tone === "s1" ? "#2e8b57" : "#b5651d"
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, color: "#22303c", margin: "0 0 8px" }}>
      <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 999, background: pillBg, color: pillCol }}>{n}</span>
      {title}
      <span style={{ fontWeight: 600, color: "#94a0ad", fontSize: 11 }}>{sub}</span>
    </div>
  )
}
function GoalRing({ full, pct, done, total }: { full?: boolean; pct?: number; done?: number; total?: number }) {
  const base = { position: "relative" as const, width: 72, height: 72, flex: "none" as const, borderRadius: "50%", display: "grid", placeItems: "center" }
  if (full) {
    return <div style={{ ...base, background: "#34a06a" }}><b style={{ fontSize: 30, fontWeight: 900, color: "#fff", lineHeight: 1 }}>✓</b></div>
  }
  return (
    <div style={{ ...base, background: `conic-gradient(#34a06a ${pct ?? 0}%, #e2ebe5 0)` }}>
      <div style={{ position: "absolute", inset: 8, background: "#fff", borderRadius: "50%" }} />
      <b style={{ position: "relative", zIndex: 1, fontSize: 18, fontWeight: 900, color: "#2e8b57", lineHeight: 1 }}>
        {done}<small style={{ fontSize: 11, fontWeight: 800, color: "#7bad92" }}>/{total}</small>
      </b>
    </div>
  )
}
function GoalDot({ icon, name, done, st }: { icon: string; name: string; done: boolean; st: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
      <span style={{ width: 26, height: 26, flex: "none", borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 14, background: done ? "#e3f5ea" : "#eef1f5", filter: done ? "none" : "grayscale(.4) opacity(.7)" }}>{icon}</span>
      <span style={{ fontWeight: 700, color: done ? "#1f7a4d" : "#3a4653" }}>{name}</span>
      <span style={{ marginLeft: "auto", fontSize: 11.5, fontWeight: 700, color: done ? "#34a06a" : "#9aa6b3" }}>{st}</span>
    </div>
  )
}
const goalCheer = (gold?: boolean) => ({
  margin: "10px 0 0", fontSize: gold ? 14 : 12.5, fontWeight: 800, textAlign: "center" as const,
  color: gold ? "#b5651d" : "#2e8b57", background: gold ? "#fbf0da" : "#eafaf0", borderRadius: 10, padding: gold ? 12 : 7,
})

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

  // ── 達成条件（対象がある曲だけ・通し演奏は常に）→ リング進捗 ──
  const condItems = [
    ...(achv.lessons.total > 0
      ? [{
          icon: "📘", name: "学びレッスン",
          done: achv.lessons.cleared >= achv.lessons.total,
          st: achv.lessons.cleared >= achv.lessons.total ? "✓" : `${achv.lessons.cleared}/${achv.lessons.total}`,
        }]
      : []),
    ...(achv.etude.required
      ? [{
          icon: "🎼", name: "エチュード",
          done: achv.etude.achieved === true,
          st: achv.etude.achieved ? "✓" : "まだ",
        }]
      : []),
    {
      icon: "🎻", name: "通して弾く",
      done: achv.cleanRuns.count >= achv.cleanRuns.required,
      st: achv.cleanRuns.count >= achv.cleanRuns.required ? "✓" : `${achv.cleanRuns.count}/${achv.cleanRuns.required}回`,
    },
  ]
  const condTotal = condItems.length
  const condDone = condItems.filter((c) => c.done).length
  const ringPct = condTotal > 0 ? Math.round((condDone / condTotal) * 100) : 0

  // ── マスター: 直近5回平均のゲージ ──
  const avg = achv.master.recentAvg
  const avgPct = avg != null ? Math.max(0, Math.min(100, avg)) : 0
  const needMore = achv.master.scoredCount < achv.master.requiredCount
  const remainingRuns = achv.master.requiredCount - achv.master.scoredCount

  // 道 (スタート→達成→マスター) の点灯
  const n1On: NodeOn = achv.mastered ? "a" : achv.achieved ? "" : "a"
  const n1Label = !achv.achieved && !achv.mastered ? "いま挑戦中" : "スタート"
  const n2On: NodeOn = achv.achieved || achv.mastered ? "a" : ""
  const n2Label = achv.mastered ? "達成" : achv.achieved ? "達成ずみ✨" : "達成"
  const n3On: NodeOn = achv.mastered ? "m" : ""
  const n3Label = achv.mastered ? "マスター！" : "マスター"

  const hr = <div style={{ height: 1, background: "#eef1f4", margin: "14px 0" }} />

  return (
    <div className={styles.container} role="tabpanel" id="score-detail-tab-panel-loop">
      {/* ── 1. 達成/マスター進捗 (工程D: 新判定 spec§1) ──
          文字羅列だと味気ないので、達成=進捗リング / マスター=点数ゲージで見せる。 */}
      <section className={styles.summarySection}>
        <h2 className={styles.sectionTitle}>🏆 この曲のゴール</h2>

        {/* 道: スタート → 達成 → マスター */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "2px 0 14px" }}>
          <TrackNode em="🎻" label={n1Label} on={n1On} />
          <span style={{ color: "#c4ccd6", fontWeight: 900 }}>›</span>
          <TrackNode em="🎯" label={n2Label} on={n2On} />
          <span style={{ color: "#c4ccd6", fontWeight: 900 }}>›</span>
          <TrackNode em="🏆" label={n3Label} on={n3On} />
        </div>

        {achv.mastered ? (
          <div style={goalCheer(true)}>🏆 この曲をマスター！ おつかれさま、すごい！</div>
        ) : (
          <>
            <StepHead n="STEP 1" title="達成" sub="まず弾けるように" tone="s1" />
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {condDone >= condTotal
                ? <GoalRing full />
                : <GoalRing pct={ringPct} done={condDone} total={condTotal} />}
              <div style={{ display: "flex", flexDirection: "column", gap: 7, flex: 1, minWidth: 0 }}>
                {condItems.map((c) => (
                  <GoalDot key={c.name} icon={c.icon} name={c.name} done={c.done} st={c.st} />
                ))}
              </div>
            </div>
            <div style={goalCheer()}>
              {achv.achieved ? "✨ 達成ずみ！「弾ける」認定" : `あと ${condTotal - condDone}つ で達成！`}
            </div>
          </>
        )}

        {hr}

        <StepHead n="STEP 2" title="マスター" sub="平均90点で認定" tone="s2" />
        {!achv.achieved && !achv.mastered ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f4f6f9", borderRadius: 12, padding: "12px 14px", color: "#9aa6b3", fontSize: 12.5, fontWeight: 700 }}>
            🔒 達成すると、マスターへの挑戦がはじまるよ
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, margin: "2px 0 12px" }}>
              <span style={{ fontSize: 34, fontWeight: 900, lineHeight: 0.9, color: "#b5651d" }}>
                {avg != null ? avg.toFixed(0) : "—"}<small style={{ fontSize: 14, fontWeight: 800 }}>点</small>
              </span>
              <span style={{ fontSize: 11.5, color: "#9aa6b3", fontWeight: 700, paddingBottom: 3 }}>
                {achv.mastered ? "直近5回の平均" : avg != null && avg < 90 ? `あと ${Math.max(1, Math.ceil(90 - avg))}点！` : "いまの平均"}
              </span>
            </div>
            <div style={{ position: "relative", paddingTop: 16 }}>
              <div style={{ position: "absolute", top: 0, left: "90%", transform: "translateX(-50%)", fontSize: 10, fontWeight: 900, color: "#b5651d" }}>
                90
                <div style={{ width: 2, height: 8, background: "#b5651d", margin: "1px auto 0" }} />
              </div>
              <div style={{ height: 12, borderRadius: 8, background: "#eef1f5", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 8, width: `${avgPct}%`, background: "linear-gradient(90deg,#e6a94a,#b5651d)" }} />
              </div>
            </div>
            <p style={{ margin: "9px 0 0", fontSize: 11.5, color: "#9aa6b3", fontWeight: 600, lineHeight: 1.6 }}>
              {avg == null
                ? "まだ演奏がないよ"
                : needMore
                ? `5回ぶん演奏すると判定できるよ（いま${achv.master.scoredCount}回・あと${remainingRuns}回）`
                : "直近5回の平均で判定中"}
            </p>
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
