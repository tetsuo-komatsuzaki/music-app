"use client"

// ============================================================
// デモ画面の共通クローム (2026-08-29)
// 実画面のヘッダ・タブ帯・下タブバー・採点完了の吹き出しを、実装と同じ
// 見た目で提供する (チュートリアル専用・実画面には遷移しない)。
// 吹き出しは CelebrationBanner.tsx の転写。タブ帯は scoreDetail のタブ帯の転写。
// ============================================================

import { Home, Library, BarChart3, Search, Heart, ChevronLeft } from "lucide-react"

export function DemoTopBar({ title }: { title: string }) {
  return (
    <div style={{ padding: "10px 0 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-sub)", fontSize: 12, fontWeight: 700 }}>
        <ChevronLeft size={14} /> ライブラリ
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "var(--text-ink)" }}>{title}</h1>
        <span style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid rgba(200,150,150,.4)", display: "grid", placeItems: "center", color: "#c89696" }}>
          <Heart size={15} />
        </span>
      </div>
    </div>
  )
}

/** scoreDetail のタブ帯 (演奏 / ふりかえり / 練習後カルテ) の転写 */
export function DemoScoreTabs({ active, bubble }: { active: "score" | "review"; bubble?: boolean }) {
  const tab = (on: boolean): React.CSSProperties => ({
    flex: 1, textAlign: "center", padding: "9px 0", fontSize: 12.5, fontWeight: 800,
    color: on ? "var(--gold)" : "var(--text-sub)",
    background: on ? "rgba(20,32,60,.9)" : "transparent",
    border: on ? "1px solid rgba(232,178,60,.45)" : "1px solid transparent",
    borderRadius: 12,
  })
  return (
    <div style={{ position: "relative", marginTop: bubble ? 40 : 12 }}>
      {bubble && <CelebBubble />}
      <div style={{ display: "flex", gap: 4, background: "rgba(10,17,34,.7)", border: "1px solid rgba(150,175,225,.14)", borderRadius: 14, padding: 3 }}>
        <span style={tab(active === "score")}>演奏</span>
        <span data-guide="score-tab-review" style={tab(active === "review")}>ふりかえり</span>
        <span style={tab(false)}>練習後カルテ</span>
      </div>
    </div>
  )
}

/** 採点完了の吹き出し (CelebrationBanner.tsx 転写: ふりかえりタブ中心の真上) */
export function CelebBubble() {
  return (
    <span
      style={{
        position: "absolute", left: "50%", top: -34, transform: "translateX(-50%)", zIndex: 20,
        display: "inline-flex", alignItems: "center", gap: 6,
        background: "#1E3A8A", color: "#fff", border: "none", borderRadius: 999,
        padding: "6px 14px", fontSize: 11.5, fontWeight: 800, whiteSpace: "nowrap",
        boxShadow: "0 3px 10px rgba(20,35,70,.28)", animation: "celebBubbleIn .3s ease",
      }}
    >
      採点できあがったよ！
      <span aria-hidden style={{ position: "absolute", left: "50%", bottom: -4, width: 10, height: 10, background: "#1E3A8A", transform: "translateX(-50%) rotate(45deg)" }} />
      <style>{`@keyframes celebBubbleIn { from { opacity: 0; transform: translateX(-50%) translateY(4px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`}</style>
    </span>
  )
}

/** 下タブバー (ホーム / ライブラリ / カルテ / 先生をさがす) の転写。ホームがガイド対象 */
export function DemoTabBar({ active }: { active?: "home" | "library" }) {
  const item = (on: boolean): React.CSSProperties => ({
    flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
    fontSize: 10, fontWeight: 700, color: on ? "var(--gold)" : "var(--text-sub)",
  })
  return (
    <nav style={{
      position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 900,
      display: "flex", alignItems: "center", padding: "10px 6px calc(12px + env(safe-area-inset-bottom, 0px))",
      background: "rgba(8,13,26,.96)", borderTop: "1px solid rgba(150,175,225,.12)",
      maxWidth: 402, margin: "0 auto",
    }}>
      <span data-guide="tab-home" style={item(active === "home")}><Home size={20} />ホーム</span>
      <span style={item(active === "library")}><Library size={20} />ライブラリ</span>
      <span style={item(false)}><BarChart3 size={20} />カルテ</span>
      <span style={item(false)}><Search size={20} />先生をさがす</span>
    </nav>
  )
}

/** 紙吹雪 (デモ演出・軽量CSS) */
export function DemoConfetti() {
  const pieces = Array.from({ length: 26 })
  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1949, overflow: "hidden" }}>
      {pieces.map((_, i) => (
        <span key={i} style={{
          position: "absolute", top: -12, left: `${(i * 37) % 100}%`,
          width: 7, height: 10, borderRadius: 2,
          background: ["#e8b23c", "#7aa7ff", "#f6ecd4", "#5cc98a"][i % 4],
          animation: `confFall ${2.4 + (i % 5) * 0.35}s ${(i % 7) * 0.18}s linear forwards`,
          transform: `rotate(${(i * 53) % 360}deg)`,
        }} />
      ))}
      <style>{`@keyframes confFall { to { transform: translateY(105vh) rotate(540deg); opacity: .9; } }`}</style>
    </div>
  )
}
