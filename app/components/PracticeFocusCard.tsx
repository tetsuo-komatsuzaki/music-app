"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import styles from "../[userId]/homeBlocks.module.css"
import GoalTracker, { type AchievementStatus } from "./GoalTracker"

type Piece = {
  id: string; title: string; star: number | null; cover: string | null; latest: number; recentAvg: number | null
  badge: "mastered" | "achieved" | null; href: string
}
type Basic = { id: string; title: string; category: string; href: string; recentScore: number | null; lastPracticedAt: string; todayCount: number }

const NORM: Record<string, string> = { scales: "scale", arpeggios: "arpeggio", etudes: "etude" }
const norm = (c: string) => NORM[c] ?? c

const DAILY_GOAL = 3 // 毎日の基礎練: 3回通しで演奏

export default function PracticeFocusCard({ pieces, basics, userId }: { pieces: Piece[]; basics: Basic[]; userId: string }) {
  const [active, setActive] = useState(0)
  const piece = pieces[active] ?? pieces[0] ?? null
  const [ach, setAch] = useState<AchievementStatus | null>(null)

  useEffect(() => {
    if (!piece) return
    let aborted = false
    setAch(null)
    fetch(`/api/scores/${piece.id}/achievement-status`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (!aborted) setAch(j) })
      .catch(() => {})
    return () => { aborted = true }
  }, [piece?.id])

  // 練習している曲がまだ無いユーザー: カードごと消さず、曲選びへ誘導する (2026-07-25)。
  // 「まず1曲を通して弾く」が体験の入口なので、ホーム最上部の次に置く。
  if (!piece) {
    return (
      <div className={styles.root}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>さっそく始めよう</div>
          <p className={styles.startLead}>
            まだ練習している曲がないよ。弾きたい曲を1つ選んで、通して弾いてみよう。
          </p>
          <Link
            href={`/${userId}/practice/pieces`}
            className={styles.startCta}
            data-onboarding="home.pickPiece"
          >
            <span className={styles.startIcon} aria-hidden>♪</span>
            <span className={styles.startBody}>
              <span className={styles.startTitle}>曲を選ぶ</span>
              <span className={styles.startSub}>☆が小さいほどやさしい曲だよ</span>
            </span>
            <span className={styles.startGo} aria-hidden>→</span>
          </Link>
        </div>

      </div>
    )
  }
  const chipLabel = piece.badge === "mastered" ? "マスター" : piece.badge === "achieved" ? "達成" : "挑戦中"

  // 毎日の基礎練: 各カテゴリ「○回/3回(本日通し)」チップ。タップで教材へ
  const dailyChip = (cat: string, label: string, icon: string) => {
    const b = basics.find((x) => norm(x.category) === cat)
    const href = b?.href ?? `/${userId}/practice/${cat}`
    const count = b?.todayCount ?? 0
    const done = count >= DAILY_GOAL
    return (
      <Link key={cat} href={href} style={{ flex: "1 1 88px", display: "flex", alignItems: "center", gap: 6, background: done ? "#eefaf1" : "#f7f9fc", borderRadius: 10, padding: "8px 9px", textDecoration: "none", color: "inherit" }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: 11.5, color: "#3a4653" }}>{label}</span>
        <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 800, color: done ? "#34a06a" : "#9aa6b3" }}>{count}/{DAILY_GOAL}</span>
      </Link>
    )
  }

  return (
    <div className={styles.root}>
      <div className={styles.card} data-onboarding="home.focusCard">
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

        {/* 🏆 この曲のゴール (曲詳細と同じ GoalTracker を流用) */}
        <div style={{ fontSize: 11, fontWeight: 800, color: "#9aa6b3", margin: "14px 0 8px", borderTop: "1px solid #eef1f4", paddingTop: 11, display: "flex", alignItems: "center", gap: 5 }}>🏆 この曲のゴール</div>
        {ach ? (
          <GoalTracker achv={ach} />
        ) : (
          <div style={{ fontSize: 12.5, color: "#9aa6b3", padding: "8px 0" }}>読み込み中…</div>
        )}

        {/* 毎日の基礎練 */}
        <div style={{ fontSize: 11, fontWeight: 800, color: "#9aa6b3", margin: "16px 0 8px", borderTop: "1px solid #eef1f4", paddingTop: 11 }}>毎日の基礎練</div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {dailyChip("scale", "音階", "🎵")}
          {dailyChip("arpeggio", "アルペジオ", "🎶")}
          {dailyChip("bowing", "ボーイング", "🎻")}
        </div>
      </div>
    </div>
  )
}
