"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import styles from "./MyRankCard.module.css"
import ds from "./ds.module.css"
import Coin from "./Coin"
import RankEmblem from "./RankEmblem"
import GalleryShelves, { type GalleryCoin, type GalleryTreasure } from "@/app/[userId]/_gallery/GalleryShelves"
import {
  rankName, shortDate,
  type RankCardData,
} from "@/app/_libs/rankCard"

export default function MyRankCard(props: RankCardData & {
  onGuide?: () => void
  flashAt?: number
  /** ギャラリー3棚 (報酬体系点灯時のみ・軌跡シートを差し替える) */
  gallery?: { coins: GalleryCoin[]; treasures: GalleryTreasure[] } | null
}) {
  const { currentStar, required, achievedCount, stamps, onGuide, flashAt, gallery } = props
  const [open, setOpen] = useState(false)
  const [openStamp, setOpenStamp] = useState<number | null>(null)
  // ギャラリーはシートの差し替えではなく入口ボタンから開く別ビュー (2026-08-31)
  const [showGallery, setShowGallery] = useState(false)
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
  const nextStar = currentStar + 1

  const barPct = Math.round((achievedCount / Math.max(1, required)) * 100)

  // 宝物カウント (棚のタブと同じ数え方: カード=card+title / 栄誉=cert)
  const cardCount = gallery?.treasures.filter((t) => ["card", "title"].includes(t.kind)).length ?? 0
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
              <div className={styles.stat}><div className={styles.statN}>{cardCount}</div><div className={styles.statL}>カード</div></div>
              <div className={styles.stat}><div className={styles.statN}>{honorCount}</div><div className={styles.statL}>栄誉</div></div>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-sub)", marginTop: 13 }}>
            <span>{currentStar >= 10 ? "ランク" : "つぎのランクまで"}</span>
            <span style={{ color: "var(--gold)", fontWeight: 800 }}>{currentStar >= 10 ? "最高ランク到達" : `★${nextStar}をあと${remaining}曲`}</span>
          </div>
          <div className={`${ds.bar} ${ds.gold}`} data-anim="bar" style={{ marginTop: 7, ["--w" as string]: `${currentStar >= 10 ? 100 : barPct}%` }}>
            <i style={{ width: `${currentStar >= 10 ? 100 : barPct}%`, transition: "width .5s ease" }} />
          </div>
          {/* コイン着地の金フラッシュ (モック aFlash の移植) */}
          <style>{`@keyframes rankFlash { 30% { box-shadow: 0 0 0 3px rgba(232,178,60,.8), 0 0 30px rgba(232,178,60,.5); } 100% { box-shadow: 0 0 0 3px rgba(232,178,60,0); } }`}</style>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 9 }}>
            {onGuide ? (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onGuide() }}
                aria-label="上達のしくみを見る"
                style={{ background: "none", border: "none", padding: 0, fontSize: 10.5, fontWeight: 800, color: "var(--gold)", cursor: "pointer" }}
              >
                ？上達のしくみ
              </button>
            ) : <span />}
            {gallery != null && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setOpen(true); setShowGallery(true) }}
                aria-label="宝物の棚をひらく"
                style={{ background: "none", border: "none", padding: 0, fontSize: 10.5, fontWeight: 800, color: "#f5d98c", cursor: "pointer" }}
              >
                宝物の棚 →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ボトムシート: 演奏の軌跡 */}
      {mounted && open && createPortal(
        <div className={styles.modal} onClick={() => { setOpen(false); setOpenStamp(null); setShowGallery(false) }}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.grab} />
            <button type="button" className={styles.close} aria-label="閉じる" onClick={() => { setOpen(false); setOpenStamp(null); setShowGallery(false) }}>✕</button>
            {/* 2026-08-31 本番指摘: ランクカードのシートは演奏の軌跡のまま。
                ギャラリーは差し替えではなく入口ボタンから開く別ビューにする */}
            {showGallery && gallery != null ? (
              <div className={styles.sheetbody}>
                <button
                  type="button"
                  onClick={() => setShowGallery(false)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", padding: "2px 2px 10px", fontSize: 11.5, fontWeight: 800, color: "var(--text-sub)", cursor: "pointer" }}
                >
                  ‹ 演奏の軌跡へもどる
                </button>
                <GalleryShelves coins={gallery.coins} required={required} treasures={gallery.treasures} />
              </div>
            ) : (<>
            <div className={styles.sheetttl}>演奏の軌跡</div>
            {/* モック trace1 (home-06 コインの列) の写経 */}
            <div className={styles.sheetbody}>

              {gallery != null && (
                <button
                  type="button"
                  className="pressable"
                  onClick={() => setShowGallery(true)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    marginBottom: 12, padding: "11px 12px", cursor: "pointer",
                    background: "linear-gradient(180deg,#1b2544,#101a34)", border: "1px solid rgba(212,168,72,.45)",
                    borderRadius: 12, fontSize: 12.5, fontWeight: 900, color: "#f5d98c", letterSpacing: ".08em",
                  }}
                >
                  宝物の棚をひらく →
                </button>
              )}

              <div className={ds.card}>
                <div className={ds.lab}>達成した曲</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginTop: 6 }}>
                  <div className={ds.bigN} style={{ fontSize: 52, lineHeight: 1 }}><span data-anim="count">{achievedCount}</span></div>
                  <div style={{ paddingBottom: 9, fontSize: 12, color: "var(--text-sub)", fontWeight: 800 }}>/ {required}曲</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", marginTop: 16, overflowX: "auto", padding: "6px 0 8px" }}>
                  {stamps.map((s, i) => (
                    <button
                      key={s.scoreId}
                      type="button"
                      aria-label={s.title}
                      onClick={() => setOpenStamp(openStamp === i ? null : i)}
                      style={{ position: "relative", flex: "none", marginLeft: i ? -14 : 0, zIndex: i, border: "none", background: "transparent", padding: 0, cursor: "pointer" }}
                    >
                      {/* 達成コイン統一デザイン (2026-08-30 Q8: 点数刻印なし・アルコ彫刻) */}
                      <span className={styles.coinPop} style={{ display: "block", width: 56, height: 56, animationDelay: `${0.5 + i * 0.12}s` }}>
                        <Coin size={56} star={currentStar} master={stamps[i]?.mastered} />
                      </span>
                    </button>
                  ))}
                  {Array.from({ length: remaining }).map((_, i) => (
                    <span
                      key={`e${i}`}
                      style={{
                        flex: "none", marginLeft: -14, zIndex: stamps.length + i, width: 56, height: 56,
                        borderRadius: "50%", background: "rgba(150,175,225,.06)", border: "1.5px dashed rgba(150,175,225,.18)",
                      }}
                    />
                  ))}
                </div>
                {openStamp != null && stamps[openStamp] && (
                  <div style={{ background: "var(--card-in)", borderRadius: 12, padding: "10px 12px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <b style={{ fontSize: 12.5, color: "var(--text-ink)" }}>{stamps[openStamp].title}</b>
                      <span style={{ display: "block", fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>
                        {shortDate(stamps[openStamp].achievedAt)} に達成
                      </span>
                    </div>
                    <Link href={stamps[openStamp].href} className={`${ds.pill} ${ds.mute}`} style={{ fontSize: 11, color: "var(--text-ink)", flex: "none", textDecoration: "none" }}>
                      この曲の詳細へ →
                    </Link>
                  </div>
                )}
                <div className={`${ds.bar} ${ds.gold}`} data-anim="bar" style={{ marginTop: 6, ["--w" as string]: `${barPct}%` }}>
                  <i style={{ width: `${barPct}%` }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7, fontSize: 10.5, fontWeight: 800 }}>
                  <span style={{ color: "var(--gold)" }}>☆{currentStar}</span>
                  <span style={{ color: "var(--text-sub)" }}>☆{nextStar} まであと{remaining}曲</span>
                </div>
              </div>

              <div className={ds.card} style={{ padding: "13px 15px" }}>
              </div>

            </div>
            </>)}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
