"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import styles from "../[userId]/homeBlocks.module.css"

type Piece = {
  id: string; title: string; star: number | null; cover: string | null; latest: number; recentAvg: number | null
  badge: "mastered" | "achieved" | null; href: string
}
type Basic = { id: string; title: string; category: string; href: string; recentScore: number | null }

type AchStatus = {
  lessons: { total: number; cleared: number }
  etude: { required: boolean; achieved?: boolean }
  cleanRuns: { count: number; required: number }
  master: { recentAvg: number | null }
}

const NORM: Record<string, string> = { scales: "scale", arpeggios: "arpeggio", etudes: "etude" }
const norm = (c: string) => NORM[c] ?? c

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
  const etudeDone = !!ach?.etude?.achieved
  const cleanDone = !!ach && ach.cleanRuns.count >= ach.cleanRuns.required
  const chipLabel = piece.badge === "mastered" ? "マスター" : piece.badge === "achieved" ? "達成" : "挑戦中"

  // 基礎練カテゴリを固定表示 (直近練習があればスコア/リンク、無ければカテゴリへ)
  const catItem = (cat: string, label: string) => {
    const b = basics.find((x) => norm(x.category) === cat)
    const href = b?.href ?? `/${userId}/practice/${cat}`
    const note = b?.recentScore != null ? `直近 ${b.recentScore}点` : "はじめる →"
    return (
      <Link key={cat} href={href} className={styles.ritem}>
        <div><div className={styles.rt}>{label}</div><div className={styles.rm}>{note}</div></div>
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
          <Link href={`/${userId}/lessons`} className={`${styles.task} ${lessonsDone ? styles.taskDone : ""}`} style={{ marginTop: 9, textDecoration: "none", color: "inherit" }}>
            <span className={styles.tk}>{lessonsDone ? "✓" : "○"}</span>
            <div className={styles.tl}><span>学びレッスン</span><span className={styles.tn}>{ach.lessons.cleared}/{ach.lessons.total}</span></div>
          </Link>
        )}

        <div className={styles.rec2}>
          <div className={styles.recCol}>
            <div className={`${styles.recH} ${styles.recHPiece}`}><span className={styles.dot} />マスターへのステップ</div>
            {catItem("fingering", "フィンガリング")}
            {ach?.etude?.required && (
              <div className={`${styles.task} ${etudeDone ? styles.taskDone : ""}`} style={{ marginTop: 7 }}>
                <span className={styles.tk}>{etudeDone ? "✓" : "○"}</span>
                <div className={styles.tl}><span>エチュード</span><span className={styles.tn}>{etudeDone ? "済" : "未"}</span></div>
              </div>
            )}
            {ach && (
              <div className={`${styles.task} ${cleanDone ? styles.taskDone : ""}`} style={{ marginTop: 7 }}>
                <span className={styles.tk}>{cleanDone ? "✓" : "○"}</span>
                <div className={styles.tl}><span>通しで演奏成功</span><span className={styles.tn}>{ach.cleanRuns.count}/{ach.cleanRuns.required}</span></div>
              </div>
            )}
          </div>
          <div className={styles.recCol}>
            <div className={`${styles.recH} ${styles.recHDaily}`}><span className={styles.dot} />毎日の基礎練</div>
            {catItem("scale", "音階")}
            {catItem("arpeggio", "アルペジオ")}
            {catItem("bowing", "ボーイング")}
          </div>
        </div>
      </div>
    </div>
  )
}
