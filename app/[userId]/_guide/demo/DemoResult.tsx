"use client"

// ============================================================
// デモ採点結果 (2026-08-29)。実画面 (scoreDetail 演奏タブ・採点済) の転写。
// 1回目=#5・80点 (音符に色・sheet80)。2回目=#6・95点 (ぜんぶ緑・sheet95+紙吹雪)。
// 採点完了の吹き出し (CelebrationBanner転写) がふりかえりタブを指す。
// ============================================================

import { Pencil, ChevronDown } from "lucide-react"
import { DemoTopBar, DemoScoreTabs, DemoTabBar, DemoConfetti } from "./DemoChrome"

const LEGEND = [
  ["#2e8b57", "正確"],
  ["#3aa08f", "タイミングずれ"],
  ["#e08a2e", "音程ずれ"],
  ["#c0473a", "聞きとれず"],
] as const

export default function DemoResult({
  perfNo, score, sheet, confetti,
}: {
  perfNo: number
  score: number
  sheet: string
  confetti?: boolean
}) {
  return (
    <div style={{ paddingBottom: 120 }}>
      {confetti && <DemoConfetti />}
      <DemoTopBar title="きらきら星" />
      <DemoScoreTabs active="score" bubble />

      {/* Performance 行 */}
      <div data-guide="result-perf-row" style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, background: "rgba(16,26,50,.7)", border: "1px solid rgba(150,175,225,.14)", borderRadius: 12, padding: "11px 14px" }}>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--gold)" }}>Performance #{perfNo} ・ 2026/8/29</span>
        <ChevronDown size={14} color="#e8b23c" />
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "baseline", gap: 2 }}>
          <b style={{ fontSize: 20, fontWeight: 900, color: "var(--gold)", fontVariantNumeric: "tabular-nums" }}>{score}</b>
          <span style={{ fontSize: 11, color: "var(--text-sub)" }}>点</span>
        </span>
        <span style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(150,175,225,.12)", display: "grid", placeItems: "center", color: "var(--text-sub)" }}><Pencil size={13} /></span>
      </div>

      {/* 楽譜 (色つき) */}
      <div style={{ marginTop: 12, background: "var(--card-in, #111c38)", border: "1px solid rgba(150,175,225,.10)", borderRadius: 14, padding: "12px 12px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <b style={{ fontSize: 13, color: "var(--text-ink)" }}>楽譜</b>
          <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-sub)", background: "rgba(150,175,225,.12)", borderRadius: 999, padding: "4px 10px" }}>⤢ ひろげる</span>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={sheet} alt="採点結果つきの楽譜" style={{ width: "100%", borderRadius: 8, marginTop: 9, display: "block" }} />
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-sub)", background: "rgba(150,175,225,.12)", borderRadius: 999, padding: "6px 14px" }}>全部見る ▼</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
        <b style={{ fontSize: 13.5, color: "var(--text-ink)" }}>この曲に出てくる記号</b>
        <span style={{ fontSize: 12, fontWeight: 800, color: "#7aa7ff" }}>▼ 開く ・ 2</span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 11 }}>
        {LEGEND.map(([c, t]) => (
          <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "var(--text-sub)" }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />{t}
          </span>
        ))}
      </div>

      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, fontSize: 12, fontWeight: 800, color: "var(--text-ink)", background: "rgba(150,175,225,.12)", borderRadius: 999, padding: "8px 14px" }}>
        <Pencil size={13} /> 譜面に書き込む
      </span>

      <DemoTabBar active="library" />
    </div>
  )
}
