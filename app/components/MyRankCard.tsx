"use client"

import { useEffect, useState, type CSSProperties } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { Trophy } from "lucide-react"
import styles from "./MyRankCard.module.css"
import ds from "./ds.module.css"
import { ArcoChan, POSES } from "./ArcoChan"
import {
  rankName, perfRank, stampComment, cheerForCount, shortDate, cardTier,
  type RankCardData,
} from "@/app/_libs/rankCard"

type SlotKind = "done" | "now" | "empty" | "goal"
const TILTS = ["-6deg", "5deg", "-4deg", "6deg", "-5deg", "4deg", "-7deg", "6deg", "-4deg", "5deg"]
// ホームの日替わりアルコと同じモーション付きイラストで統一 (2026-07-20)。
const POSE_EMBLEM = POSES.find((p) => p.cat === "指差し") ?? POSES[0]
const POSE_JOY = POSES.find((p) => p.cat === "喜び") ?? POSES[0]

export default function MyRankCard(props: RankCardData & { onGuide?: () => void }) {
  const { currentStar, required, achievedCount, stamps, onGuide } = props
  const [open, setOpen] = useState(false)
  const [openStamp, setOpenStamp] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // モーダル表示中は背景スクロールを止める
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [open])

  const remaining = Math.max(0, required - achievedCount)
  const nextStar = currentStar + 1

  // 10スロット構築
  const slots = Array.from({ length: required }, (_, i) => {
    let kind: SlotKind
    if (i < stamps.length) kind = "done"
    else if (i === required - 1) kind = "goal"
    else if (i === stamps.length) kind = "now"
    else kind = "empty"
    return { i, kind }
  })
  const row1 = slots.slice(0, Math.ceil(required / 2))
  const row2 = slots.slice(Math.ceil(required / 2))

  function renderSlot(s: { i: number; kind: SlotKind }) {
    const stamp = s.kind === "done" ? stamps[s.i] : null
    const rank = stamp ? perfRank(stamp.best) : null
    return (
      <div
        key={s.i}
        className={`${styles.slot} ${openStamp === s.i ? styles.slotOpen : ""}`}
        onClick={stamp ? () => setOpenStamp(openStamp === s.i ? null : s.i) : undefined}
      >
        {s.kind === "done" && (
          <div className={`${styles.stamp} ${styles.done}`} style={{ "--tilt": TILTS[s.i], "--d": `${s.i * 0.5}s` } as CSSProperties}>♪</div>
        )}
        {s.kind === "now" && (
          <div className={`${styles.stamp} ${styles.now}`}>♪<span className={styles.nring} /></div>
        )}
        {s.kind === "empty" && <div className={`${styles.stamp} ${styles.empty}`}>{s.i + 1}</div>}
        {s.kind === "goal" && (
          <div className={`${styles.stamp} ${styles.goal}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0, lineHeight: 1 }}>
            <Trophy size={15} color="#b58a1e" />
            <span style={{ fontSize: 8.5, fontWeight: 900, color: "#b58a1e" }}>☆{nextStar}</span>
          </div>
        )}

        {s.kind === "done" && stamp ? (
          <div className={styles.slabel}>
            {stamp.title.length > 6 ? stamp.title.slice(0, 6) + "…" : stamp.title}
            <br />
            {rank && <span className={`${styles.rk} ${styles[rank]}`}>{rank.toUpperCase()} {stamp.best}</span>}
          </div>
        ) : s.kind === "now" ? (
          <div className={`${styles.slabel} ${styles.slabelNow}`} />
        ) : s.kind === "goal" ? (
          <div className={styles.slabel} />
        ) : (
          <div className={`${styles.slabel} ${styles.slabelMuted}`}>？</div>
        )}

        {s.kind === "done" && stamp && openStamp === s.i && (
          <div className={styles.memory} onClick={(e) => e.stopPropagation()}>
            <div className={styles.mf}><ArcoChan pose={POSE_JOY} /></div>
            <div className={styles.mbody}>
              <div className={styles.mtop}>{stamp.title} <span className={styles.mdate}>{shortDate(stamp.achievedAt)}</span></div>
              <div className={styles.mscore}>
                ベスト <b>{stamp.best ?? "—"}</b>点 {rank && <span className={`${styles.rk} ${styles[rank]}`}>{rank.toUpperCase()}</span>}
              </div>
              <div className={styles.mc}>{stampComment(rank)}</div>
              <Link className={styles.mlink} href={stamp.href}>この曲の詳細へ →</Link>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={styles.root}>
      {/* マイランクカード 案D2 (モック parts-10 のDOMそのまま。★でティアが変わる) */}
      <div
        role="button"
        tabIndex={0}
        data-onboarding="home.rankCard"
        className={`${ds.card} ${styles[cardTier(currentStar)]} pressable`}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(true) } }}
        style={{ cursor: "pointer" }}
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
          <div style={{ width: 76, height: 76, borderRadius: 18, flex: "none", marginLeft: 8, overflow: "hidden" }}>
            <ArcoChan pose={POSE_EMBLEM} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-sub)", marginTop: 14 }}>
          <span>つぎのランクまで</span>
          <span style={{ color: "var(--gold)", fontWeight: 800 }}>★{nextStar}をあと{remaining}曲</span>
        </div>
        <div className={`${ds.bar} ${ds.gold}`} style={{ marginTop: 7 }}>
          <i style={{ width: `${Math.round((achievedCount / Math.max(1, required)) * 100)}%` }} />
        </div>
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
          <span style={{ fontSize: 10.5, color: "var(--text-muted)" }}>タップで演奏の軌跡 ▸</span>
        </div>
      </div>

      {/* ボトムシート: 演奏の軌跡 */}
      {mounted && open && createPortal(
        <div className={styles.modal} onClick={() => { setOpen(false); setOpenStamp(null) }}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.grab} />
            <button type="button" className={styles.close} aria-label="閉じる" onClick={() => { setOpen(false); setOpenStamp(null) }}>✕</button>
            <div className={styles.sheetttl}>演奏の軌跡</div>
            <div className={styles.sheetbody}>

              <div className={styles.rankhead}>
                <div className={styles.rankbig}><span className={styles.from}>☆{currentStar}</span> → <span className={styles.to}>☆{nextStar}</span></div>
                <div className={styles.r}>
                  <div className={styles.need}>まで あと <b>{remaining}曲</b></div>
                  <div className={styles.pips}>
                    {slots.map((s, i) => (
                      <span key={i} className={`${styles.pip} ${i < achievedCount ? styles.on : i === achievedCount ? styles.cur : ""}`} />
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.board}>
                <div className={styles.rrow}>{row1.map(renderSlot)}</div>
                <div className={`${styles.rrow} ${styles.rrowRev}`}>{row2.map(renderSlot)}</div>
              </div>

              <div className={styles.cheer}>
                <div className={styles.av}><ArcoChan pose={POSE_JOY} /></div>
                <div className={styles.bwrap}>
                  <div className={styles.bubble}>{cheerForCount(achievedCount, required)}</div>
                </div>
              </div>

            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
