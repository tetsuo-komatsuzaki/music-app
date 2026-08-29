"use client"

// ============================================================
// デモふりかえり (2026-08-29)。実画面 (scoreDetail ふりかえりタブ) の転写。
// 上達のようす: 60→65→68→74→80 (5回)+達成90点ライン+「2回弾くと出るよ」の補足。
// 音程マップ: 実コンポーネント FingerboardPanel+デモヒートマップ (赤=シ・A線)。
// zoomOpen/selCell で拡大モーダル/セル選択の各ステップを再現する。
// ============================================================

import FingerboardPanel from "@/app/components/FingerboardPanel"
import { DemoTopBar, DemoScoreTabs, DemoTabBar } from "./DemoChrome"
import { DEMO_HEATMAP } from "../guideDemoData"

const PTS = [60, 65, 68, 74, 80]

function Graph() {
  const W = 540, H = 210
  const x = (i: number) => 40 + i * ((W - 80) / (PTS.length - 1))
  const y = (v: number) => 34 + (90 - v) * 5.2
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <line x1={16} y1={y(90)} x2={W - 90} y2={y(90)} stroke="#e8b23c" strokeWidth={2} strokeDasharray="6 7" opacity={0.8} />
      <text x={W - 84} y={y(90) + 5} fontSize={15} fill="#e8b23c" fontWeight={800}>達成 90点</text>
      <polyline points={PTS.map((v, i) => `${x(i)},${y(v)}`).join(" ")} fill="none" stroke="#cfc7b2" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      {PTS.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={i === PTS.length - 1 ? 9 : 7} fill={i === PTS.length - 1 ? "#cfc7b2" : "#0f1a33"} stroke="#cfc7b2" strokeWidth={4} />
      ))}
      <text x={22} y={H - 6} fontSize={14} fill="#7c8cae" fontWeight={700}>8/25</text>
      <text x={W - 52} y={H - 6} fontSize={14} fill="#7c8cae" fontWeight={700}>いま</text>
    </svg>
  )
}

export default function DemoReview({
  zoomOpen, selCell,
}: {
  /** 音程マップ拡大モーダルを開いた状態で出す (mapZoom/mapDetail ステップ) */
  zoomOpen?: boolean
  /** 拡大内で選択済みのセル (mapDetail ステップ: "cell-A-02"=シ・A線) */
  selCell?: string
}) {
  return (
    <div style={{ paddingBottom: 120 }}>
      <DemoTopBar title="きらきら星" />
      <DemoScoreTabs active="review" />

      {/* 上達のようす */}
      <div data-guide="review-trajectory" style={{ marginTop: 12, background: "var(--card-in, #111c38)", border: "1px solid rgba(150,175,225,.10)", borderRadius: 14, padding: "13px 14px" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["総合", "音程", "リズム"].map((t, i) => (
            <span key={t} style={{ fontSize: 11.5, fontWeight: 800, padding: "6px 14px", borderRadius: 999, color: i === 0 ? "var(--gold)" : "var(--text-sub)", border: i === 0 ? "1px solid rgba(232,178,60,.5)" : "1px solid rgba(150,175,225,.16)" }}>{t}</span>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginTop: 10 }}>
          <b style={{ fontSize: 34, fontWeight: 900, lineHeight: 1, color: "var(--cream, #f6ecd4)" }}>80</b>
          <span style={{ fontSize: 11.5, fontWeight: 900, color: "#5cc98a", background: "rgba(92,201,138,.12)", borderRadius: 8, padding: "3px 8px" }}>↗ +6</span>
        </div>
        <Graph />
        <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", lineHeight: 1.7 }}>
          グラフの点をタップすると その日の録音と ふりかえりが見られるよ<br />
          <span style={{ color: "#7aa7ff", fontWeight: 800 }}>2回弾くと、このグラフが出るよ</span>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          {[["音程", 83, "#e8a13c"], ["リズム", 77, "#79c7c0"]].map(([t, v, c]) => (
            <div key={String(t)} style={{ flex: 1, background: "rgba(16,26,50,.7)", borderRadius: 12, padding: "10px 12px" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: String(c) }}>{t}</div>
              <b style={{ fontSize: 26, fontWeight: 900, color: String(c) }}>{v}</b>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", marginTop: 12, textAlign: "center" }}>
          {[["80", "自己ベスト"], ["69", "直近5回平均"], ["5", "演奏回数"]].map(([v, t]) => (
            <div key={t} style={{ flex: 1 }}>
              <b style={{ fontSize: 19, fontWeight: 900, color: "var(--text-ink)" }}>{v}</b>
              <div style={{ fontSize: 10, color: "var(--text-sub)", marginTop: 1 }}>{t}</div>
            </div>
          ))}
        </div>
      </div>

      {/* この曲の音程マップ (実コンポーネント+デモデータ) */}
      <div data-guide="review-fingerboard" style={{ marginTop: 14, background: "var(--card-in, #111c38)", border: "1px solid rgba(150,175,225,.10)", borderRadius: 14, padding: "13px 14px" }}>
        <b style={{ fontSize: 13, color: "var(--text-ink)" }}>この曲の音程マップ</b>
        <div style={{ fontSize: 11.5, color: "var(--text-sub)", margin: "6px 0 10px", lineHeight: 1.7 }}>
          えらんだ範囲の演奏 10回分から。色がついた音をタップすると くわしく見られるよ。
        </div>
        <FingerboardPanel
          key={`${zoomOpen ? "z" : "s"}-${selCell ?? "none"}`}
          cells={DEMO_HEATMAP.cells}
          details={DEMO_HEATMAP.details}
          stack
          initialZoom={zoomOpen}
          initialSel={selCell ?? null}
          guideCellId="cell-A-02"
        />
      </div>

      {/* 学びのポイント */}
      <div style={{ marginTop: 14, background: "var(--card-in, #111c38)", border: "1px solid rgba(150,175,225,.10)", borderRadius: 14, padding: "13px 14px" }}>
        <b style={{ fontSize: 13, color: "var(--text-ink)" }}>学びのポイント</b>
        {[["01", "音階", "調にあわせて"], ["02", "フィンガリング", "ポジションにあわせて"]].map(([n, t, sub]) => (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 11 }}>
            <span style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(150,175,225,.1)", display: "grid", placeItems: "center", fontSize: 10.5, fontWeight: 900, color: "var(--text-sub)", flex: "none" }}>{n}</span>
            <div style={{ flex: 1 }}>
              <b style={{ fontSize: 13, color: "var(--text-ink)" }}>{t}</b>
              <div style={{ fontSize: 11, color: "var(--text-sub)" }}>{sub}</div>
            </div>
            <span style={{ color: "var(--gold)", fontWeight: 900 }}>→</span>
          </div>
        ))}
      </div>

      <DemoTabBar active="library" />
    </div>
  )
}
