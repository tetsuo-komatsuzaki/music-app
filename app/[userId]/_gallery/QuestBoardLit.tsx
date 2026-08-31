"use client"

// ============================================================
// アルコのクエスト ボード (点灯版・2026-08-31)。旧 _guide/QuestBoard の後継。
// 表示対象 = カタログの「はじまりの旅」18件 (home:true)。進行は UserQuestClear。
// 折り畳みが既定 (2026-08-29 Tetsuo指示)。達成行タップでカードプレビュー
// (券面はカードv3ファミリーのミニ表現)。未達成行は表示のみ。
// ============================================================

import { useState } from "react"
import ds from "@/app/components/ds.module.css"
import { QUESTS } from "@/app/_libs/treasureCatalog"

const HOME_QUESTS = QUESTS.filter((q) => q.home)

export default function QuestBoardLit({ cleared }: { cleared: string[] }) {
  const [openCard, setOpenCard] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const clearedSet = new Set(cleared)
  const doneCount = HOME_QUESTS.filter((q) => clearedSet.has(q.questId)).length

  // 2026-08-31 Tetsuo指示: 全部クリアしたらボードごとトップから消す (カードはアルバムに残る)
  if (doneCount >= HOME_QUESTS.length) return null

  return (
    <div className={ds.card} data-guide="home-quest-board" style={{ padding: "14px 15px" }}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
      >
        <span className={ds.lab} style={{ flex: 1 }}>アルコのクエスト</span>
        <span style={{ fontSize: 11.5, fontWeight: 900, color: "var(--gold)", fontVariantNumeric: "tabular-nums" }}>{doneCount}/{HOME_QUESTS.length}</span>
        <span aria-hidden style={{ fontSize: 11, fontWeight: 900, color: "var(--text-sub)", transform: expanded ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▼</span>
      </button>
      {expanded && <>
        <div style={{ marginTop: 8 }}>
          {HOME_QUESTS.map((q, i) => {
            const done = clearedSet.has(q.questId)
            return (
              <button
                key={q.questId}
                type="button"
                onClick={() => { if (done) setOpenCard(openCard === q.questId ? null : q.questId) }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                  background: "transparent", border: "none", cursor: done ? "pointer" : "default",
                  padding: "10px 2px", borderTop: i === 0 ? "none" : "1px solid rgba(150,175,225,.10)",
                }}
              >
                <span style={{
                  width: 22, height: 22, borderRadius: "50%", flex: "none",
                  display: "grid", placeItems: "center", fontSize: 12, fontWeight: 900,
                  background: done ? "#e9b23d" : "rgba(150,175,225,.10)",
                  border: done ? "none" : "1.5px solid rgba(150,175,225,.25)",
                  color: done ? "#332d2f" : "transparent",
                }}>✓</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ display: "block", fontSize: 13, fontWeight: 800, color: done ? "var(--text-sub)" : "var(--text-ink)", textDecoration: done ? "line-through" : "none", textDecorationColor: "rgba(150,175,225,.5)" }}>{q.title}</b>
                  <span style={{ display: "block", fontSize: 10.5, color: "var(--text-sub)", marginTop: 1 }}>{q.sub}</span>
                </span>
                <span style={{
                  flex: "none", fontSize: 10, fontWeight: 900, borderRadius: 999, padding: "4px 9px",
                  background: done ? "rgba(232,178,60,.16)" : "rgba(150,175,225,.08)",
                  border: done ? "1px solid rgba(232,178,60,.45)" : "1px solid rgba(150,175,225,.16)",
                  color: done ? "var(--gold)" : "var(--text-sub)",
                }}>
                  {done ? `カードNo.${String(q.no).padStart(3, "0")}` : "カード"}
                </span>
              </button>
            )
          })}
        </div>
      </>}

      {/* 獲得済みカードのプレビュー (カードv3ファミリーのクリーム+金縁) */}
      {openCard && (() => {
        const q = HOME_QUESTS.find((x) => x.questId === openCard)!
        return (
          <div onClick={() => setOpenCard(null)} style={{ position: "fixed", inset: 0, zIndex: 1400, background: "rgba(6,10,22,.62)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <div style={{
              width: "min(250px, 68vw)", aspectRatio: "3/4.1", borderRadius: 18, padding: "20px 16px",
              background: "linear-gradient(172deg,#faf4e4 0%,#f3ead2 55%,#eadfc2 100%)",
              border: "2px solid #c99a35", boxShadow: "0 0 60px rgba(232,178,60,.3), 0 18px 40px rgba(0,0,0,.5)",
              display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
            }}>
              <span style={{ alignSelf: "flex-start", fontSize: 10, fontWeight: 800, letterSpacing: ".14em", color: "#8a6a1a" }}>No.{String(q.no).padStart(3, "0")}</span>
              <span style={{ width: 96, height: 96, borderRadius: "50%", overflow: "hidden", marginTop: 14, border: "2px solid #c99a35" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/arco/05B.jpg" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </span>
              <b style={{ fontSize: 16, fontWeight: 900, color: "#503a10", marginTop: 16, lineHeight: 1.5 }}>{q.title}</b>
              <span style={{ fontSize: 11, color: "#7a5c22", marginTop: 6 }}>{q.sub}</span>
              <span style={{ marginTop: "auto", fontSize: 9.5, letterSpacing: ".22em", color: "#a5761c", fontWeight: 800 }}>ARCODA CARD</span>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
