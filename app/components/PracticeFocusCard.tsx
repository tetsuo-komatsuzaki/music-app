"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import styles from "../[userId]/homeBlocks.module.css"

type Piece = {
  id: string; title: string; star: number | null; latest: number; recentAvg: number | null
  badge: "mastered" | "achieved" | null; href: string
}
type Basic = { id: string; title: string; category: string; href: string; recentScore: number | null }

type AchStatus = {
  lessons: { total: number; cleared: number }
  etude: { required: boolean; achieved?: boolean }
  cleanRuns: { count: number; required: number }
  master: { recentAvg: number | null }
}

// achievement-status → マスター進捗 (平均→90 ・ 課題 cleared/total) と残課題リスト
function deriveMastery(a: AchStatus | null) {
  if (!a) return null
  const tasks: { label: string; done: boolean; note: string }[] = []
  if (a.lessons.total > 0) tasks.push({ label: "学びレッスン", done: a.lessons.cleared >= a.lessons.total, note: `${a.lessons.cleared}/${a.lessons.total}` })
  if (a.etude.required) tasks.push({ label: "エチュード課題", done: !!a.etude.achieved, note: "同★の技術曲" })
  tasks.push({ label: "崩壊ゼロ演奏", done: a.cleanRuns.count >= a.cleanRuns.required, note: `${a.cleanRuns.count}/${a.cleanRuns.required}回` })
  const cleared = tasks.filter((t) => t.done).length
  const avg = a.master.recentAvg != null ? Math.round(a.master.recentAvg) : null
  return { avg, cleared, total: tasks.length, remaining: tasks.filter((t) => !t.done) }
}

export default function PracticeFocusCard({ pieces, basics }: { pieces: Piece[]; basics: Basic[] }) {
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
  const m = deriveMastery(ach)
  const barW = m?.avg != null ? Math.min(100, Math.round((m.avg / 90) * 100)) : 0
  const chipLabel = piece.badge === "mastered" ? "マスター" : piece.badge === "achieved" ? "達成" : "挑戦中"

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.cardTitle}>いま練習している曲 <span>マスター＝平均90点＋課題クリア</span></div>

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
          <div className={`${styles.thumb} ${styles.thumbGoal}`}>♪</div>
          <div className={styles.g}>
            <div className={styles.title}>{piece.title}</div>
            <div className={styles.meta}>
              {piece.star != null ? `☆${piece.star} ・ ` : ""}直近 {piece.latest}点{piece.recentAvg != null ? ` ・ 平均 ${piece.recentAvg}点` : ""}
            </div>
          </div>
          <span className={`${styles.chip} ${styles.chipGoal}`}>{chipLabel}</span>
        </Link>

        <div className={styles.mastery}>
          <div className={styles.mrow}>
            <span>マスターまで</span>
            <span>{loading || !m ? "…" : <>平均 {m.avg ?? "—"} → <b>90</b> ・ 課題 {m.cleared}/{m.total}</>}</span>
          </div>
          <div className={styles.mbar}><i style={{ width: `${barW}%` }} /></div>
        </div>

        <div className={styles.rec2}>
          <div className={styles.recCol}>
            <div className={`${styles.recH} ${styles.recHPiece}`}><span className={styles.dot} />この曲のおすすめ</div>
            {m && m.remaining.length > 0 ? (
              m.remaining.slice(0, 2).map((t) => (
                <div key={t.label} className={styles.ritem}>
                  <span className={styles.ic}>🎯</span>
                  <div><div className={styles.rt}>{t.label}</div><div className={styles.rm}><span className={styles.chip + " " + styles.chipGood}>学びポイント</span> <span className={styles.recPrep}>教材は準備中</span></div></div>
                </div>
              ))
            ) : (
              <div className={styles.recEmpty}>{m ? "この曲は全課題クリア！あとは平均90点を目指そう" : "分析中…"}</div>
            )}
          </div>
          <div className={styles.recCol}>
            <div className={`${styles.recH} ${styles.recHDaily}`}><span className={styles.dot} />毎日の基礎練</div>
            {basics.length > 0 ? (
              basics.slice(0, 2).map((b) => (
                <Link key={b.id} href={b.href} className={styles.ritem}>
                  <span className={styles.ic}>🎵</span>
                  <div><div className={styles.rt}>{b.title.length > 8 ? b.title.slice(0, 8) + "…" : b.title}</div><div className={styles.rm}>{b.recentScore != null ? `直近 ${b.recentScore}点` : "習慣づけ"}</div></div>
                </Link>
              ))
            ) : (
              <div className={styles.recEmpty}>基礎練を始めてみよう</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
