"use client"

// ============================================================
// アルコのクエスト ボード (2026-08-29 実装・チュートリアル完了後のホームに表示)
// 達成ごとにアルコカードを1枚ゲット。行タップで該当機能へ (本番接続時に href を配線)。
// 進行は本番ではDB (localStorage 禁止)。ここでは進行を props で受ける表示部品。
// 配色ルール: 構造/操作=ネイビー一族・金=成果 (獲得カード/達成数) のみ。
// ============================================================

import { useState } from "react"
import { ArcoChan, POSES } from "@/app/components/ArcoChan"
import ds from "@/app/components/ds.module.css"
import { QUESTS, type QuestProgress } from "./quests"

export default function QuestBoard({ progress }: { progress: QuestProgress }) {
  const [openCard, setOpenCard] = useState<string | null>(null)
  // 折り畳みが既定 (2026-08-29 Tetsuo指示)。ヘッダタップで開閉
  const [expanded, setExpanded] = useState(false)
  const doneCount = QUESTS.filter((q) => progress[q.id]).length

  return (
    <div className={ds.card} data-guide="home-quest-board" style={{ padding: expanded ? "14px 15px" : "14px 15px 15px" }}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
      >
        <span className={ds.lab} style={{ flex: 1 }}>アルコのクエスト</span>
        <span style={{ fontSize: 11.5, fontWeight: 900, color: "var(--gold)", fontVariantNumeric: "tabular-nums" }}>{doneCount}/{QUESTS.length}</span>
        <span aria-hidden style={{ fontSize: 11, fontWeight: 900, color: "var(--text-sub)", transform: expanded ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▼</span>
      </button>
      {expanded && <>
      <div style={{ fontSize: 11, color: "var(--text-sub)", marginTop: 6, lineHeight: 1.7 }}>
        自分のペースでいい。
      </div>

      <div style={{ marginTop: 10 }}>
        {QUESTS.map((q, i) => {
          const done = !!progress[q.id]
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => { if (done) setOpenCard(openCard === q.id ? null : q.id) }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                background: "transparent", border: "none", cursor: "pointer",
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
                {done ? `カードNo.${String(q.cardNo).padStart(3, "0")}` : "カード"}
              </span>
            </button>
          )
        })}
      </div>
      </>}

      {/* 獲得済みカードのプレビュー (達成カードと同じ意匠) */}
      {openCard && (() => {
        const q = QUESTS.find((x) => x.id === openCard)!
        const pose = POSES.find((p) => p.id === q.pose) ?? POSES[0]
        return (
          <div onClick={() => setOpenCard(null)} style={{ position: "fixed", inset: 0, zIndex: 1400, background: "rgba(6,10,22,.62)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "min(300px, 76vw)", background: "linear-gradient(180deg,#182a4e,#101c38)", border: "1.5px solid rgba(232,178,60,.55)", borderRadius: 20, padding: "24px 20px 18px", textAlign: "center", boxShadow: "0 0 60px rgba(232,178,60,.25)" }}>
              <div style={{ width: 110, height: 110, margin: "0 auto", borderRadius: "50%", overflow: "hidden", background: "#f2efe7" }}>
                <ArcoChan pose={pose} />
              </div>
              <div style={{ fontSize: 17, fontWeight: 900, color: "var(--cream, #f6ecd4)", marginTop: 13 }}>{q.title}</div>
              <div style={{ fontSize: 11, color: "var(--text-sub)", marginTop: 5 }}>{q.sub}</div>
              <div style={{ fontSize: 10, letterSpacing: "0.22em", color: "var(--gold)", fontWeight: 800, marginTop: 9 }}>CARD No.{String(q.cardNo).padStart(3, "0")}</div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
