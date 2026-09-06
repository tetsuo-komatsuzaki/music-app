"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import styles from "./MyRankCard.module.css"
import ds from "./ds.module.css"
import RankEmblem from "./RankEmblem"
import GalleryShelves, { type GalleryCoin, type GalleryTreasure } from "@/app/[userId]/_gallery/GalleryShelves"
import { rankName, type RankCardData } from "@/app/_libs/rankCard"

export default function MyRankCard(props: RankCardData & {
  flashAt?: number
  /** ギャラリー3棚 (報酬体系点灯時のみ・軌跡シートを差し替える) */
  gallery?: { coins: GalleryCoin[]; treasures: GalleryTreasure[] } | null
  /** カルテへの導線 (2026-09-06 Tetsuo確定 案3): 記録の分析 と わざの詳細 をランクカードの足元に */
  links?: { analysis: string; skill: string } | null
}) {
  const { currentStar, required, achievedCount, flashAt, gallery, links } = props
  // タップで即ギャラリーのシートを開く (2026-08-31 Tetsuo確定・演奏の軌跡ビュー廃止)
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // 達成コインの着地フラッシュ (2026-08-30 案A): コイン吸い込みと同時に金の発光+ゲージ+1
  const [flashing, setFlashing] = useState(false)
  useEffect(() => {
    if (!flashAt) return
    setFlashing(true)
    const t = setTimeout(() => setFlashing(false), 750)
    return () => clearTimeout(t)
  }, [flashAt])

  // モーダル表示中は背景スクロールを止める
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [open])

  const remaining = Math.max(0, required - achievedCount)

  const barPct = Math.round((achievedCount / Math.max(1, required)) * 100)

  // 宝物カウント (ギャラリーの3分類と同じ: コイン/称号/賞状。カードはアルバムへ移籍)
  const titleCount = gallery?.treasures.filter((t) => t.kind === "title").length ?? 0
  const honorCount = gallery?.treasures.filter((t) => t.kind === "cert").length ?? 0

  return (
    <div className={styles.root}>
      {/* マイランクカード 案3+質感A+透かし特大 (2026-08-31 Tetsuo確定・モック rankcard-5plans) */}
      <div
        role="button"
        tabIndex={0}
        data-onboarding="home.rankCard"
        data-guide="home-rank-card"
        className={`${ds.card} pressable ${styles.faceA}`}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(true) } }}
        style={{ cursor: "pointer", animation: flashing ? "rankFlash .7s ease" : undefined }}
      >
        <i className={styles.wm} aria-hidden />
        <div className={styles.faceInner}>
          <div className={ds.lab}>MY RANK</div>
          <div style={{ display: "flex", alignItems: "center", gap: 13, marginTop: 10 }}>
            <RankEmblem star={currentStar} size="52px" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 900, whiteSpace: "nowrap", letterSpacing: "-0.01em", color: "var(--text-ink)" }}>
                {rankName(currentStar)}
              </div>
              <div style={{ marginTop: 4 }}>
                <span className={`${ds.pill} ${ds.mute}`} style={{ fontSize: 11, color: "var(--text-ink)", padding: "2px 8px" }}>
                  Lv.<b>{currentStar}</b>
                </span>
              </div>
            </div>
          </div>
          {gallery != null && (
            <div className={styles.statRow}>
              <div className={styles.stat}><div className={styles.statN}>{gallery.coins.length}</div><div className={styles.statL}>コイン</div></div>
              <div className={styles.stat}><div className={styles.statN}>{titleCount}</div><div className={styles.statL}>称号</div></div>
              <div className={styles.stat}><div className={styles.statN}>{honorCount}</div><div className={styles.statL}>賞状</div></div>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "baseline", gap: 7, fontSize: 11, color: "var(--text-sub)", marginTop: 13 }}>
            <span>{currentStar >= 10 ? "ランク" : "つぎのランクまで"}</span>
            <span style={{ color: "var(--gold)", fontWeight: 800 }}>{currentStar >= 10 ? "最高ランク到達" : `あと${remaining}曲`}</span>
          </div>
          <div className={`${ds.bar} ${ds.gold}`} data-anim="bar" style={{ marginTop: 7, ["--w" as string]: `${currentStar >= 10 ? 100 : barPct}%` }}>
            <i style={{ width: `${currentStar >= 10 ? 100 : barPct}%`, transition: "width .5s ease" }} />
          </div>
          {/* カルテへの導線 (2026-09-06 Tetsuo確定 案3)。カード本体はギャラリーを開くので、ここだけ伝播を止める */}
          {links && (
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
              <Link href={links.analysis} className={`${ds.pill} ${ds.ink}`} style={{ textDecoration: "none" }} data-guide="home-rank-analysis">記録の分析 →</Link>
              <Link href={links.skill} className={`${ds.pill} ${ds.ink}`} style={{ textDecoration: "none" }} data-guide="home-rank-skill">わざの詳細 →</Link>
            </div>
          )}
          {/* コイン着地の金フラッシュ (モック aFlash の移植)。
              ？上達のしくみは使い方ページへ移籍 (2026-08-31 Tetsuo指示) */}
          <style>{`@keyframes rankFlash { 30% { box-shadow: 0 0 0 3px rgba(232,178,60,.8), 0 0 30px rgba(232,178,60,.5); } 100% { box-shadow: 0 0 0 3px rgba(232,178,60,0); } }`}</style>
        </div>
      </div>

      {/* ボトムシート: ギャラリー直行 (2026-08-31 Tetsuo確定: 演奏の軌跡ビュー廃止・
          ✕ボタンなし=背景タップか下スワイプ相当の背景操作で閉じる) */}
      {mounted && open && gallery != null && createPortal(
        <div className={styles.modal} onClick={() => setOpen(false)}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.grab} />
            <div className={styles.sheetbody}>
              <GalleryShelves coins={gallery.coins} required={required} treasures={gallery.treasures} />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
