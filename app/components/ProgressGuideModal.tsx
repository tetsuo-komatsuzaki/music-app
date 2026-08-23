// app/components/ProgressGuideModal.tsx
//
// 「上達のしくみ」ガイドモーダル。ホームのランクカードから開く。
// 円環サイクル (演奏する → フィードバック → 練習する) を主役に置き、
// 各ステップを1枚のカードで説明。カードごとに「このアプリの強み」を1行添え、
// なぜ上達するのか＝真髄を伝える。締めに「達成→マスター→ランクUP」。
// アルコちゃんがコーチ。絵文字ゼロ・線画・ゴールド/クリームの世界観で統一 (2026-08-09 刷新)。

"use client"

import { ArcoChan, POSES } from "./ArcoChan"
import { Music, MessageSquareText, Target, type LucideIcon } from "lucide-react"

type Props = {
  open: boolean
  onClose: () => void
}

// ゴールド/クリームの世界観 (マスター・ランクの金)
const GOLD = "var(--gold)"
const GOLD_LT = "#e6a94a"
const GOLD_BG = "rgba(232,178,60,.09)"
const GOLD_BD = "rgba(232,178,60,.3)"
const GOLD_INK = "var(--gold)"
const APP_INK = "var(--text-ink)"
const APP_SUB = "var(--text-sub)"

// 円環の3ノード (位置は 250×250 のボックス基準)
const NODES: { Icon: LucideIcon; label: string; left: string; top: string }[] = [
  { Icon: Music, label: "演奏する", left: "50%", top: "12%" },
  { Icon: MessageSquareText, label: "フィードバック", left: "85%", top: "72%" },
  { Icon: Target, label: "練習する", left: "15%", top: "72%" },
]

// 各ステップの説明カード (何が起きるか + このアプリならではの強み)
const STEPS: { Icon: LucideIcon; no: string; title: string; what: string; strength: React.ReactNode }[] = [
  {
    Icon: Music,
    no: "STEP 1",
    title: "演奏する",
    what: "弾きたい曲が、そのまま録音される。",
    strength: (
      <>
        <b>あなたの“いま”の演奏を、何度でも記録</b>できるのが、上達の起点。
      </>
    ),
  },
  {
    Icon: MessageSquareText,
    no: "STEP 2",
    title: "フィードバック",
    what: "アルコちゃんが音程・リズムを評価し、あなたの演奏の強みと弱みを見つける。",
    strength: (
      <>
        独学の一番の壁「演奏のどこが悪いか分からない」を、<b>アルコちゃんが見つけて解いてくれる</b>。先生とつながれば、先生の添削も届く。
      </>
    ),
  },
  {
    Icon: Target,
    no: "STEP 3",
    title: "練習する",
    what: "アルコちゃんが、あなたに合った練習メニューを教えてくれる。",
    strength: (
      <>
        <b>あなたの強み・弱みに根ざした“練習方法”が提案される</b>から、ひとりでも迷わず進める。
      </>
    ),
  },
]

export default function ProgressGuideModal({ open, onClose }: Props) {
  if (!open) return null
  const pose = POSES.find((p) => p.cat === "説明") ?? POSES[0]

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(15,20,30,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 1000,
      }}
      role="dialog"
      aria-modal="true"
      aria-label="上達のしくみ"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#101c36", borderRadius: 20, maxWidth: 460, width: "100%",
          maxHeight: "88vh", overflowY: "auto", boxShadow: "0 14px 40px rgba(60,40,10,0.28)",
          border: "1px solid rgba(150,175,225,.16)",
        }}
      >
        {/* ヘッダー: アルコ + タイトル */}
        <div style={{ position: "relative", padding: "16px 18px 14px", textAlign: "center", background: "linear-gradient(180deg,rgba(232,178,60,.09),#101c36)", borderBottom: "1px solid rgba(150,175,225,.14)", borderRadius: "20px 20px 0 0" }}>
          <button
            type="button" onClick={onClose} aria-label="閉じる"
            style={{ position: "absolute", top: 12, right: 12, border: "none", background: "transparent", fontSize: "var(--fs-title)", lineHeight: 1, cursor: "pointer", color: "var(--text-muted)" }}
          >
            ×
          </button>
          <div style={{ width: 60, height: 60, margin: "0 auto 4px" }}>
            <ArcoChan pose={pose as unknown as Parameters<typeof ArcoChan>[0]["pose"]} />
          </div>
          <div style={{ fontSize: "var(--fs-label)", letterSpacing: ".2em", fontWeight: 900, color: GOLD_LT }}>HOW IT WORKS</div>
          <h2 style={{ fontSize: "var(--fs-head)", fontWeight: 900, margin: "2px 0 0", color: APP_INK }}>上達のサイクル</h2>
        </div>

        <div style={{ padding: "18px 16px 20px" }}>
          {/* 円環サイクル */}
          <div style={{ position: "relative", width: 250, height: 250, margin: "2px auto 6px" }}>
            <svg viewBox="0 0 250 250" width="250" height="250" style={{ position: "absolute", inset: 0, display: "block" }}>
              <circle cx="125" cy="125" r="92" fill="none" stroke="rgba(150,175,225,.16)" strokeWidth="2.5" strokeDasharray="2.5 10" strokeLinecap="round" />
              <g fill="rgba(232,178,60,.34)">
                <path d="M217 119 l-6 11 12 0 z" transform="rotate(28 217 125)" />
                <path d="M125 217 l-6 -11 12 0 z" transform="rotate(150 125 217)" />
                <path d="M33 119 l-6 11 12 0 z" transform="rotate(272 33 125)" />
              </g>
            </svg>
            {NODES.map((n, i) => (
              <div key={i} style={{ position: "absolute", left: n.left, top: n.top, width: 80, transform: "translate(-50%,-50%)", textAlign: "center" }}>
                <div style={{ position: "relative", width: 50, height: 50, borderRadius: 16, margin: "0 auto 4px", background: "var(--card-in)", border: "1.5px solid rgba(127,164,232,.4)", display: "grid", placeItems: "center", color: "#7fa4e8", boxShadow: "0 3px 10px rgba(4,10,28,.4)" }}>
                  <span style={{ position: "absolute", top: -6, left: -6, width: 19, height: 19, borderRadius: "50%", background: "#2b5bc4", color: "#fff", fontSize: 10, fontWeight: 900, display: "grid", placeItems: "center", boxShadow: "0 1px 3px rgba(4,10,28,.4)" }}>{i + 1}</span>
                  <n.Icon size={24} strokeWidth={1.9} />
                </div>
                <div style={{ fontSize: "var(--fs-caption)", fontWeight: 900, color: APP_INK }}>{n.label}</div>
              </div>
            ))}
            <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", textAlign: "center", width: 96 }}>
              <span style={{ display: "block", fontSize: 9.5, color: APP_SUB, fontWeight: 800, marginBottom: 1 }}>回すほど</span>
              <b style={{ fontSize: "var(--fs-subhead)", fontWeight: 900, color: GOLD_INK, letterSpacing: ".02em" }}>ランクUP</b>
              <span style={{ display: "block", fontSize: 9, color: APP_SUB, fontWeight: 800, marginTop: 1 }}>上手くなる</span>
            </div>
          </div>

          {/* 各ステップ 説明カード */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 11, padding: "12px 13px", border: "1px solid rgba(150,175,225,.14)", borderRadius: 14, background: "var(--card-in)", position: "relative", overflow: "hidden" }}>
                <span aria-hidden style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: "linear-gradient(180deg,#7fa4e8,#2b5bc4)" }} />
                <div style={{ width: 38, height: 38, flex: "none", borderRadius: 11, background: "rgba(43,91,196,.18)", border: "1px solid rgba(127,164,232,.35)", display: "grid", placeItems: "center", color: "#7fa4e8" }}>
                  <s.Icon size={20} strokeWidth={1.9} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
                    <span style={{ fontSize: "var(--fs-label)", fontWeight: 900, color: "#7fa4e8", letterSpacing: ".05em" }}>{s.no}</span>
                    <span style={{ fontSize: "var(--fs-subhead)", fontWeight: 900, color: APP_INK }}>{s.title}</span>
                  </div>
                  <div style={{ fontSize: "var(--fs-caption)", color: APP_SUB, fontWeight: 700, marginTop: 2, lineHeight: 1.55 }}>{s.what}</div>
                  <div style={{ marginTop: 7, display: "flex", gap: 6, alignItems: "flex-start", background: GOLD_BG, borderRadius: 9, padding: "7px 9px" }}>
                    <span style={{ flex: "none", fontSize: 8.5, fontWeight: 900, letterSpacing: ".04em", color: "#fff", background: GOLD, borderRadius: 5, padding: "2px 6px", marginTop: 1 }}>強み</span>
                    <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-sub)", fontWeight: 700, lineHeight: 1.55 }}>{s.strength}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 締め: 積み上がってランクへ */}
          <div style={{ marginTop: 14, textAlign: "center", fontSize: "var(--fs-caption)", fontWeight: 800, color: APP_SUB, background: "linear-gradient(180deg,#101c36,rgba(232,178,60,.09))", border: "1px solid rgba(150,175,225,.14)", borderRadius: 12, padding: 11, lineHeight: 1.7 }}>
            1曲、また1曲。<b style={{ color: GOLD_INK }}>達成</b>と<b style={{ color: GOLD_INK }}>マスター</b>を重ねるほど、<b style={{ color: GOLD_INK }}>あなたのランクは自然と上へ</b>。
          </div>

          <button
            type="button" onClick={onClose}
            style={{ marginTop: 16, width: "100%", padding: "11px 0", borderRadius: 12, border: "none", background: "linear-gradient(180deg,#e8b23c,#d2992c)", color: "#201604", fontSize: "var(--fs-subhead)", fontWeight: 900, cursor: "pointer" }}
          >
            とじる
          </button>
        </div>
      </div>
    </div>
  )
}
