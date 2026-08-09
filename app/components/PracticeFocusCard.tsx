"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Trophy, Sparkles, Target } from "lucide-react"
import styles from "../[userId]/homeBlocks.module.css"
import GoalTracker, { type AchievementStatus } from "./GoalTracker"
import DailyLessons from "./DailyLessons"

type Piece = {
  id: string; title: string; star: number | null; cover: string | null; latest: number; recentAvg: number | null
  badge: "mastered" | "achieved" | null; href: string
}
type Basic = { id: string; title: string; category: string; href: string; recentScore: number | null; lastPracticedAt: string; todayCount: number }

// 毎日の基礎練は achievement-status API の dailyLessons(4教材) に一本化 (2026-07-25)。
// basics(旧・履歴ベースの3チップ) は当面プロップに残すが未使用。
export default function PracticeFocusCard({ pieces, basics, userId }: { pieces: Piece[]; basics: Basic[]; userId: string }) {
  void basics
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

  return (
    <div className={styles.root}>
      <div className={styles.card} data-onboarding="home.focusCard">
        {pieces.length > 1 && (
          <div className={styles.tabs}>
            {pieces.map((p, i) => (
              <button key={p.id} type="button" onClick={() => setActive(i)} className={`${styles.tab} ${active === i ? styles.tabOn : ""}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                {p.badge === "mastered" ? <Trophy size={13} color="#b58a1e" /> : p.badge === "achieved" ? <Sparkles size={13} color="#2e8b57" /> : null}{p.title}
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

        {/* 🏆 この曲のゴール (達成/マスター。曲詳細と同じ GoalTracker を流用。体験上の重要要素・削除しない) */}
        <div style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-muted)", margin: "14px 0 8px", borderTop: "1px solid #eef1f4", paddingTop: 11, display: "flex", alignItems: "center", gap: 5 }}><Trophy size={13} color="#b58a1e" /> この曲のゴール</div>
        {ach ? (
          <GoalTracker achv={ach} userId={userId} />
        ) : (
          <div style={{ fontSize: "var(--fs-body)", color: "var(--text-muted)", padding: "8px 0" }}>読み込み中…</div>
        )}

        {/* 毎日の基礎練 (4教材: ①音階 ②フィンガリング ③④推薦上位2。ホーム/曲詳細で共通) */}
        <div style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-muted)", margin: "16px 0 8px", borderTop: "1px solid #eef1f4", paddingTop: 11, display: "flex", alignItems: "center", gap: 5 }}><Target size={13} color="#2563EB" /> 毎日の基礎練</div>
        {ach ? (
          <DailyLessons lessons={ach.dailyLessons ?? []} userId={userId} />
        ) : (
          <div style={{ fontSize: "var(--fs-body)", color: "var(--text-muted)", padding: "8px 0" }}>読み込み中…</div>
        )}
      </div>
    </div>
  )
}
