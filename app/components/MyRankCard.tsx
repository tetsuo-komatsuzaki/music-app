"use client"

import { useEffect, useState, type CSSProperties } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import styles from "./MyRankCard.module.css"
import {
  rankName, perfRank, stampComment, cheerForCount, shortDate, cardTier,
  type RankCardData,
} from "@/app/_libs/rankCard"

// アルコちゃんの顔（symbol の React 版・再利用）
function ArcoFace({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="8 32 184 134" role="img" aria-label="アルコちゃん">
      <path d="M 72.9,52.1 Q 48.4,39.0 20.9,36.8 Q 13.9,35.8 14.9,43.8 Q 19.8,65.6 37.6,87.4 Z" fill="#F2B266" />
      <path d="M 65.8,59.2 Q 51.4,51.1 31.0,49.1 Q 34.8,67.7 44.7,80.3 Z" fill="#A8622E" />
      <path d="M 127.1,52.1 Q 151.6,39.0 179.1,36.8 Q 186.1,35.8 185.1,43.8 Q 180.2,65.6 162.4,87.4 Z" fill="#F2B266" />
      <path d="M 134.2,59.2 Q 148.6,51.1 169.0,49.1 Q 165.2,67.7 155.3,80.3 Z" fill="#A8622E" />
      <ellipse cx="100" cy="103" rx="65" ry="56" fill="#F2B266" />
      <path d="M 62,101 q 8,-3.5 16,-2" stroke="#4A2A18" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 138,101 q -8,-3.5 -16,-2" stroke="#4A2A18" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="70.5" cy="122" r="12" fill="#4A2A18" /><circle cx="129.5" cy="122" r="12" fill="#4A2A18" />
      <circle cx="74.5" cy="118" r="3.6" fill="#FFF" /><circle cx="133.5" cy="118" r="3.6" fill="#FFF" />
      <ellipse cx="51" cy="135" rx="9" ry="5.5" fill="#F79E8D" opacity="0.85" /><ellipse cx="149" cy="135" rx="9" ry="5.5" fill="#F79E8D" opacity="0.85" />
      <path d="M 90,140 q 10,10 20,0" stroke="#5C3A21" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  )
}

type SlotKind = "done" | "now" | "empty" | "goal"
const TILTS = ["-6deg", "5deg", "-4deg", "6deg", "-5deg", "4deg", "-7deg", "6deg", "-4deg", "5deg"]

export default function MyRankCard(props: RankCardData) {
  const { currentStar, required, achievedCount, stamps } = props
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
        {s.kind === "goal" && <div className={`${styles.stamp} ${styles.goal}`}>🏆</div>}

        {s.kind === "done" && stamp ? (
          <div className={styles.slabel}>
            {stamp.title.length > 6 ? stamp.title.slice(0, 6) + "…" : stamp.title}
            <br />
            {rank && <span className={`${styles.rk} ${styles[rank]}`}>{rank.toUpperCase()} {stamp.best}</span>}
          </div>
        ) : s.kind === "now" ? (
          <div className={`${styles.slabel} ${styles.slabelNow}`}>次はここ</div>
        ) : s.kind === "goal" ? (
          <div className={styles.slabel}><b style={{ color: "var(--accent)" }}>{required}曲で☆{nextStar}!</b></div>
        ) : (
          <div className={`${styles.slabel} ${styles.slabelMuted}`}>？</div>
        )}

        {s.kind === "done" && stamp && openStamp === s.i && (
          <div className={styles.memory} onClick={(e) => e.stopPropagation()}>
            <ArcoFace className={styles.mf} />
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
      {/* マイランクカード (★でティアが変わる) */}
      <button type="button" className={`${styles.rankcard} ${styles[cardTier(currentStar)]}`} onClick={() => setOpen(true)}>
        <span className={styles.rcHint}>タップで軌跡 ▸</span>
        <div className={styles.rcEmblem}>
          <ArcoFace />
          <span className={styles.lv}>☆{currentStar}</span>
        </div>
        <div className={styles.rcBody}>
          <div className={styles.rcEyebrow}>My Rank Card</div>
          <div className={styles.rcRank}>☆{currentStar} <small>{rankName(currentStar)}</small></div>
          <div className={styles.rcNeed}>☆{nextStar}まで あと <b>{remaining}曲</b></div>
          <div className={styles.rcPips}>
            {Array.from({ length: required }, (_, i) => (
              <i key={i} className={i < achievedCount ? styles.on : ""} />
            ))}
          </div>
        </div>
      </button>

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
                  <div className={styles.need}>ランクアップまで あと <b>{remaining}曲</b></div>
                  <div className={styles.pips}>
                    {slots.map((s, i) => (
                      <span key={i} className={`${styles.pip} ${i < achievedCount ? styles.on : i === achievedCount ? styles.cur : ""}`} />
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.board}>
                <div className={styles.boardttl}>☆{currentStar} の曲を {required}曲マスターで ☆{nextStar} へ</div>
                <div className={styles.rrow}>{row1.map(renderSlot)}</div>
                <div className={`${styles.rrow} ${styles.rrowRev}`}>{row2.map(renderSlot)}</div>
              </div>

              <div className={styles.cheer}>
                <ArcoFace className={styles.av} />
                <div className={styles.bwrap}>
                  <span className={styles.cheertag}>{achievedCount}曲達成{remaining === 0 ? " 🎉" : ""}</span>
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
