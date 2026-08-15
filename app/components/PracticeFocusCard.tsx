"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Trophy, Sparkles, Target } from "lucide-react"
import styles from "../[userId]/homeBlocks.module.css"
import GoalTracker, { goalHeadline, type AchievementStatus } from "./GoalTracker"
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
      <div className={styles.card} data-onboarding="home.focusCard" style={{ overflow: "hidden" }}>
        {pieces.length > 1 && (
          <div className={styles.tabs}>
            {pieces.map((p, i) => (
              <button key={p.id} type="button" onClick={() => setActive(i)} className={`${styles.tab} ${active === i ? styles.tabOn : ""}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                {p.badge === "mastered" ? <Trophy size={13} color="#d9a93c" /> : p.badge === "achieved" ? <Sparkles size={13} color="#d9a93c" /> : null}{p.title}
              </button>
            ))}
          </div>
        )}

        {/* いま練習している曲 = このカードの主役。世界観カラー(青)反転を、外側カードいっぱいの全幅バナーに */}
        <Link href={piece.href} className={styles.piece} style={{ textDecoration: "none", color: "inherit", background: "linear-gradient(135deg,#1f3d78,#2b5bc4)", border: "none", padding: "13px 15px", gap: 12, margin: pieces.length > 1 ? "0 -15px" : "-14px -15px 0", borderRadius: pieces.length > 1 ? 0 : "18px 18px 0 0" }}>
          <div className={styles.thumb} style={{ width: 50, height: 50, fontSize: "var(--fs-title)", background: "rgba(255,255,255,.16)", color: "#fff" }}>{piece.cover ? <img src={piece.cover} alt="" loading="lazy" /> : "♪"}</div>
          <div className={styles.g}>
            <div className={styles.title} style={{ fontSize: piece.title.length <= 8 ? "var(--fs-head)" : piece.title.length <= 13 ? "var(--fs-subhead)" : piece.title.length <= 20 ? "var(--fs-body)" : "var(--fs-caption)", color: "#fff", whiteSpace: "normal", overflow: "visible", textOverflow: "clip", lineHeight: 1.25, wordBreak: "break-word" }}>{piece.title}</div>
            <div className={styles.meta} style={{ fontSize: "var(--fs-body)", color: "#cdd9f2", fontWeight: 700, marginTop: 2 }}>{piece.star != null ? `☆${piece.star} ・ ` : ""}直近 {piece.latest}点</div>
          </div>
          <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "space-between", alignSelf: "stretch", flex: "none", gap: 6 }}>
            <span className={styles.chip} style={{ fontSize: "var(--fs-caption)", background: "#fff", color: "#2b5bc4" }}>{chipLabel}</span>
            <span aria-hidden style={{ fontSize: "var(--fs-subhead)", fontWeight: 900, color: "#fff", lineHeight: 1 }}>→</span>
          </span>
        </Link>

        {/* 🏆 この曲のゴール (達成/マスター。曲詳細と同じ GoalTracker を流用。体験上の重要要素・削除しない)
            見出しは進捗で出し分け (2026-08-16 Tetsuo指定・下の重複見出しはGoalTracker側から削除済) */}
        <div style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-ink)", margin: "14px 0 8px", borderTop: "1px solid #eef1f4", paddingTop: 11, display: "flex", alignItems: "center", gap: 5 }}><Trophy size={13} color="#d9a93c" /> {ach ? goalHeadline(ach) : "ゴール"}</div>
        {ach ? (
          <GoalTracker achv={ach} userId={userId} scoreId={piece.id} />
        ) : (
          <div style={{ fontSize: "var(--fs-body)", color: "var(--text-muted)", padding: "8px 0" }}>読み込み中…</div>
        )}

        {/* 毎日の基礎練 (4教材: ①音階 ②フィンガリング ③④推薦上位2。ホーム/曲詳細で共通) */}
        <div style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-ink)", margin: "16px 0 8px", borderTop: "1px solid #eef1f4", paddingTop: 11, display: "flex", alignItems: "center", gap: 5 }}><Target size={13} color="#2563EB" /> {piece.title}のための基礎練</div>
        {ach ? (
          <DailyLessons lessons={ach.dailyLessons ?? []} userId={userId} />
        ) : (
          <div style={{ fontSize: "var(--fs-body)", color: "var(--text-muted)", padding: "8px 0" }}>読み込み中…</div>
        )}
      </div>
    </div>
  )
}
