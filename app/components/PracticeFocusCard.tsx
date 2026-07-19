"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import styles from "../[userId]/homeBlocks.module.css"

type Piece = {
  id: string; title: string; star: number | null; cover: string | null; latest: number; recentAvg: number | null
  badge: "mastered" | "achieved" | null; href: string
}
type Basic = { id: string; title: string; category: string; href: string; recentScore: number | null; lastPracticedAt: string; todayCount: number }

type AchStatus = {
  lessons: { total: number; cleared: number }
  etude: { required: boolean; achieved?: boolean }
  cleanRuns: { count: number; required: number }
  master: { recentAvg: number | null }
}

const NORM: Record<string, string> = { scales: "scale", arpeggios: "arpeggio", etudes: "etude" }
const norm = (c: string) => NORM[c] ?? c

const DAILY_GOAL = 3 // 毎日の基礎練: 3回通しで演奏

export default function PracticeFocusCard({ pieces, basics, userId }: { pieces: Piece[]; basics: Basic[]; userId: string }) {
  const [active, setActive] = useState(0)
  const piece = pieces[active] ?? pieces[0] ?? null
  const [ach, setAch] = useState<AchStatus | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!piece) return
    let aborted = false
    setLoading(true); setAch(null)
    fetch(`/api/scores/${piece.id}/achievement-status`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (!aborted) { setAch(j); setLoading(false) } })
      .catch(() => { if (!aborted) setLoading(false) })
    return () => { aborted = true }
  }, [piece?.id])

  if (!piece) return null
  const avg = ach?.master?.recentAvg != null ? Math.round(ach.master.recentAvg) : null
  const barW = avg != null ? Math.min(100, Math.round((avg / 90) * 100)) : 0
  const lessonsDone = !!ach?.lessons && ach.lessons.total > 0 && ach.lessons.cleared >= ach.lessons.total
  const masterDone = avg != null && avg >= 90
  const etudeDone = !!ach?.etude?.achieved
  const cleanDone = !!ach && ach.cleanRuns.count >= ach.cleanRuns.required
  const chipLabel = piece.badge === "mastered" ? "マスター" : piece.badge === "achieved" ? "達成" : "挑戦中"

  // 統一項目: 小さいチェック + ラベル(未完了時=やること) + メトリクス
  const Step = ({ done, label, metric }: { done: boolean; label: string; metric: string }) => (
    <div className={`${styles.step} ${done ? styles.stepDone : ""}`}>
      <span className={styles.stepCk}>{done ? "✓" : ""}</span>
      <span className={styles.stepLabel}>{label}</span>
      <span className={styles.stepMetric}>{metric}</span>
    </div>
  )

  // 毎日の基礎練: 各カテゴリ「○回/3回(本日通し)」。タップで教材へ
  const dailyStep = (cat: string, label: string) => {
    const b = basics.find((x) => norm(x.category) === cat)
    const href = b?.href ?? `/${userId}/practice/${cat}`
    const count = b?.todayCount ?? 0
    const done = count >= DAILY_GOAL
    return (
      <Link key={cat} href={href} className={`${styles.step} ${done ? styles.stepDone : ""}`}>
        <span className={styles.stepCk}>{done ? "✓" : ""}</span>
        <span className={styles.stepLabel}>{label}</span>
        <span className={styles.stepMetric}>{count}/{DAILY_GOAL}</span>
      </Link>
    )
  }

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.cardTitle}>いま練習している曲</div>

        {pieces.length > 1 && (
          <div className={styles.tabs}>
            {pieces.map((p, i) => (
              <button key={p.id} type="button" onClick={() => setActive(i)} className={`${styles.tab} ${active === i ? styles.tabOn : ""}`}>
                {p.badge === "mastered" ? "🏆 " : p.badge === "achieved" ? "✨ " : ""}{p.title}
              </button>
            ))}
          </div>
        )}

        <Link href={piece.href} className={styles.piece} style={{ textDecoration: "none", color: "inherit" }}>
          <div className={`${styles.thumb} ${styles.thumbGoal}`}>{piece.cover ? <img src={piece.cover} alt="" loading="lazy" /> : "♪"}</div>
          <div className={styles.g}>
            <div className={styles.title}>{piece.title}</div>
            <div className={styles.meta}>{piece.star != null ? `☆${piece.star} ・ ` : ""}直近 {piece.latest}点</div>
          </div>
          <span className={`${styles.chip} ${styles.chipGoal}`}>{chipLabel}</span>
        </Link>

        <div className={styles.mastery}>
          <div className={styles.mrow}>
            <span>演奏マスターまで</span>
            <span>{loading || avg == null ? "…" : `あと ${Math.max(0, 90 - avg)}点`}</span>
          </div>
          <div className={styles.mbar}><i style={{ width: `${barW}%` }} /></div>
        </div>

        {/* 学びレッスン (独立項目) */}
        {ach?.lessons && ach.lessons.total > 0 && (
          <Link href={`/${userId}/lessons`} className={`${styles.step} ${lessonsDone ? styles.stepDone : ""}`} style={{ marginTop: 9 }}>
            <span className={styles.stepCk}>{lessonsDone ? "✓" : ""}</span>
            <span className={styles.stepLabel}>学びレッスン</span>
            <span className={styles.stepMetric}>{ach.lessons.cleared}/{ach.lessons.total}</span>
          </Link>
        )}

        <div className={styles.rec2}>
          <div className={styles.recCol}>
            <div className={`${styles.recH} ${styles.recHPiece}`}><span className={styles.dot} />マスターへのステップ</div>
            <Step done={masterDone} label={masterDone ? "演奏マスター" : "演奏をマスター"} metric={`${avg ?? "…"}/90`} />
            {ach?.etude?.required && (
              <Step done={etudeDone} label={etudeDone ? "エチュード達成" : "エチュードを達成"} metric={etudeDone ? "済" : "未"} />
            )}
            <Step done={cleanDone} label={cleanDone ? "通しで演奏成功" : "通しで演奏"} metric={ach ? `${ach.cleanRuns.count}/${ach.cleanRuns.required}` : "…"} />
          </div>
          <div className={styles.recCol}>
            <div className={`${styles.recH} ${styles.recHDaily}`}><span className={styles.dot} />毎日の基礎練</div>
            {dailyStep("scale", "音階")}
            {dailyStep("arpeggio", "アルペジオ")}
            {dailyStep("bowing", "ボーイング")}
          </div>
        </div>
      </div>
    </div>
  )
}
