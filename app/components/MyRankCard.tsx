"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import styles from "./MyRankCard.module.css"
import ds from "./ds.module.css"
import ArcoMotion from "./ArcoMotion"
import Coin from "./Coin"
import {
  rankName, shortDate,
  type RankCardData,
} from "@/app/_libs/rankCard"

export default function MyRankCard(props: RankCardData & { onGuide?: () => void; flashAt?: number }) {
  const { currentStar, required, achievedCount, stamps, onGuide, flashAt } = props
  const [open, setOpen] = useState(false)
  const [openStamp, setOpenStamp] = useState<number | null>(null)
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

  return (
    <div className={styles.root}>
      {/* マイランクカード 案D2 (モック parts-10 のDOMそのまま。★でティアが変わる) */}
      <div
        role="button"
        tabIndex={0}
        data-onboarding="home.rankCard"
        data-guide="home-rank-card"
        className={`${ds.card} pressable`}
        onClick={() => {
          setOpen(true)
          // 報酬体系: ギャラリー閲覧クエスト (No.084・シートが3棚ギャラリーに差し替わる)
          void import("@/app/actions/questEvents").then((m) => m.recordQuestEvent("gallery_open"))
        }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(true) } }}
        style={{ cursor: "pointer", animation: flashing ? "rankFlash .7s ease" : undefined }}
      >
        <div className={ds.lab}>MY RANK</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 900, whiteSpace: "nowrap", letterSpacing: "-0.01em", color: "var(--text-ink)" }}>
              {rankName(currentStar)}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 7 }}>
              <div className={ds.stars}>
                {"★ ".repeat(Math.min(currentStar, 5)).trim()}
                <s>{" ★".repeat(Math.max(0, 5 - currentStar))}</s>
              </div>
              <span className={`${ds.pill} ${ds.mute}`} style={{ fontSize: 11, color: "var(--text-ink)", padding: "2px 8px" }}>
                Lv.<b>{currentStar}</b>
              </span>
            </div>
          </div>
          {/* 金縁メダリオンのアルコ (2026-08-23 Tetsuo指示: 挨拶横から移設 ・ 01C ループ動画) */}
          <div style={{ width: 72, height: 72, flex: "none", marginLeft: 10, borderRadius: "50%", boxShadow: "0 0 0 3px #e8ca84, 0 0 0 7px rgba(11,18,32,.9), 0 0 0 8px #bca160, 0 8px 22px rgba(0,0,0,.45)" }}>
            <ArcoMotion kit="01C" label="相棒のアルコ" />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-sub)", marginTop: 14 }}>
          <span>つぎのランクまで</span>
          <span style={{ color: "var(--gold)", fontWeight: 800 }}>★{nextStar}をあと{remaining}曲</span>
        </div>
        <div className={`${ds.bar} ${ds.gold}`} data-anim="bar" style={{ marginTop: 7, ["--w" as string]: `${Math.round((achievedCount / Math.max(1, required)) * 100)}%` }}>
          <i style={{ width: `${Math.round((achievedCount / Math.max(1, required)) * 100)}%`, transition: "width .5s ease" }} />
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
        </div>
      </div>

      {/* ボトムシート: 演奏の軌跡 */}
      {mounted && open && createPortal(
        <div className={styles.modal} onClick={() => { setOpen(false); setOpenStamp(null) }}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.grab} />
            <button type="button" className={styles.close} aria-label="閉じる" onClick={() => { setOpen(false); setOpenStamp(null) }}>✕</button>
            <div className={styles.sheetttl}>演奏の軌跡</div>
            {/* モック trace1 (home-06 コインの列) の写経 */}
            <div className={styles.sheetbody}>

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
                        <Coin size={56} />
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
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
