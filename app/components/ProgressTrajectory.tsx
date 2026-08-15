// 上達のようす (推移チャート)。2026-08-16 scoreDetail.tsx から独立部品化。
// 演奏履歴を「1演奏ずつのカード」ではなく "推移" で見せる (2026-07-25 Tetsuo確定・案1拡張)。
// 総合スコアの折れ線を主役に、音程/リズムの分解と統計を添える。
// データは performances(pitchAccuracy/timingAccuracy/uploadedAt) のみで算出。区間録音は非算入。
"use client"

import { useState } from "react"

const GOAL_SCORE = 90 // 達成ライン (曲マスター基準・アプリ全体と統一)
const TRAJECTORY_MIN_POINTS = 2 // 推移として見せるのに必要な最小演奏数

export type TrajectoryPerformance = {
  pitchAccuracy?: number | null
  timingAccuracy?: number | null
  uploadedAt: string | Date
  partId?: string | null
  rangeFromNote?: number | null
}

/** 推移表示に使える演奏数 (呼び手が「データ不足」表示を出す判定用) */
export function trajectoryPointCount(performances: TrajectoryPerformance[], partId?: string): number {
  return performances.filter((p) =>
    (partId ? p.partId === partId : p.rangeFromNote == null) &&
    p.pitchAccuracy != null && p.timingAccuracy != null,
  ).length
}

function totalScore(p: TrajectoryPerformance): number {
  return Math.round(((p.pitchAccuracy ?? 0) + (p.timingAccuracy ?? 0)) / 2)
}

type TrajAxis = "total" | "pitch" | "rhythm"
const TRAJ_COLOR: Record<TrajAxis, string> = { total: "#2e8b57", pitch: "#3f74c4", rhythm: "#cc5470" }

/** 数値系列を viewBox 内の polyline points 文字列にする */
function seriesPoints(values: number[], w: number, h: number, pad: number, minV: number, maxV: number): string {
  const n = values.length
  const span = maxV - minV || 1
  return values
    .map((v, i) => {
      const x = n === 1 ? w / 2 : pad + (i / (n - 1)) * (w - 2 * pad)
      const y = h - pad - ((v - minV) / span) * (h - 2 * pad)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")
}

function TrajStat({ v, l }: { v: string; l: string }) {
  return (
    <div style={{ flex: 1, background: "#f7f9fc", borderRadius: 11, padding: "9px 4px", textAlign: "center" }}>
      <div style={{ fontSize: "var(--fs-subhead)", fontWeight: 800, color: "var(--text-ink)", fontVariantNumeric: "tabular-nums" }}>{v}</div>
      <div style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)", fontWeight: 700, marginTop: 2 }}>{l}</div>
    </div>
  )
}

/** 音程/リズムのミニ推移カード */
export default function ProgressTrajectory({
  performances,
  partId,
  title,
  className,
}: {
  performances: TrajectoryPerformance[]
  /** 指定時: そのパート(partId一致の区間録音)だけの推移。未指定: 通し(区間非算入)。 */
  partId?: string
  title?: string
  /** 呼び手のカードスタイル。未指定は標準カード見た目 */
  className?: string
}) {
  const [axis, setAxis] = useState<TrajAxis>("total")

  // partId指定=そのパートの区間録音のみ / 未指定=通し演奏のみ(区間非算入)。いずれも評価済み・古い順。
  const evaluated = performances
    .filter((p) =>
      (partId ? p.partId === partId : p.rangeFromNote == null) &&
      p.pitchAccuracy != null &&
      p.timingAccuracy != null,
    )
    .slice()
    .sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime())

  if (evaluated.length < TRAJECTORY_MIN_POINTS) return null

  const totals = evaluated.map((p) => totalScore(p))
  const pitches = evaluated.map((p) => Math.round(p.pitchAccuracy!))
  const timings = evaluated.map((p) => Math.round(p.timingAccuracy!))
  const series = axis === "total" ? totals : axis === "pitch" ? pitches : timings
  const color = TRAJ_COLOR[axis]

  // 表示中の軸(総合/音程/リズム)に合わせて、数値・伸び・統計も切り替える
  const latest = series[series.length - 1]
  // 直近5回の伸び: 最新 − (5回前 or 最初)
  const baseIdx = Math.max(0, series.length - 5)
  const delta = latest - series[baseIdx]
  const best = Math.max(...series)
  const recent5 = series.slice(-5)
  const recentAvg = Math.round(recent5.reduce((s, v) => s + v, 0) / recent5.length)

  // チャート座標 (viewBox 265x110, pad 10)。下限は 50 か 最低点-5 の低い方。
  const W = 265, H = 110, PAD = 10
  const minV = Math.max(0, Math.min(50, Math.min(...series) - 5))
  const maxV = 100
  const pts = seriesPoints(series, W, H, PAD, minV, maxV)
  const goalY = H - PAD - ((GOAL_SCORE - minV) / (maxV - minV)) * (H - 2 * PAD)
  const lastPt = pts.split(" ").pop()!.split(",")

  const seg = (key: TrajAxis, label: string) => (
    <button
      type="button"
      onClick={() => setAxis(key)}
      style={{
        flex: 1, border: "none", background: axis === key ? "#fff" : "transparent",
        fontSize: "var(--fs-caption)", fontWeight: 800, color: axis === key ? TRAJ_COLOR[key] : "#8b97a3",
        padding: "6px 0", borderRadius: 8, cursor: "pointer",
        boxShadow: axis === key ? "0 1px 2px rgba(30,45,70,.08)" : "none",
      }}
    >
      {label}
    </button>
  )

  return (
    <div
      className={className}
      style={className ? undefined : { background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,.08)", padding: 20 }}
    >
      <h3 style={{ margin: "0 0 14px", fontSize: "var(--fs-subhead)", fontWeight: 800 }}>{title ?? "上達のようす"}</h3>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginBottom: 12 }}>
        <div>
          <div>
            <span style={{ fontSize: "var(--fs-display)", fontWeight: 800, lineHeight: .95, color, fontVariantNumeric: "tabular-nums" }}>{latest}</span>
            <span style={{ fontSize: "var(--fs-subhead)", fontWeight: 700, color }}>点</span>
          </div>
        </div>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4, fontSize: "var(--fs-body)", fontWeight: 800,
          color: delta >= 0 ? "#2e8b57" : "#cc5470", background: delta >= 0 ? "#e9f7ef" : "#fdeef0",
          borderRadius: 999, padding: "4px 10px", marginBottom: 4,
        }}>
          {delta >= 0 ? "▲" : "▼"} {delta >= 0 ? "+" : ""}{delta}
          <span style={{ color: "var(--text-muted)", fontWeight: 700 }}>直近{recent5.length}回</span>
        </span>
      </div>

      <div style={{ display: "flex", gap: 4, background: "#f1f4f8", borderRadius: 10, padding: 3, marginBottom: 10 }}>
        {seg("total", "総合")}
        {seg("pitch", "音程")}
        {seg("rhythm", "リズム")}
      </div>

      <div style={{ position: "relative" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="120" preserveAspectRatio="none">
          {goalY > PAD && goalY < H - PAD && (
            <line x1={PAD - 2} y1={goalY} x2={W - PAD + 2} y2={goalY} stroke="#e7c9a0" strokeWidth="1.2" strokeDasharray="4 4" />
          )}
          {axis === "total" && (
            <path d={`M${pts} L${lastPt[0]},${H} L${PAD},${H} Z`} fill="#e9f7ef" />
          )}
          <polyline points={pts} fill="none" stroke={color} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={lastPt[0]} cy={lastPt[1]} r="4.4" fill={color} stroke="#fff" strokeWidth="2" />
        </svg>
        {goalY > PAD && goalY < H - PAD && (
          <span style={{ position: "absolute", right: 2, top: Math.max(0, goalY * (120 / H) - 14), fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-master)" }}>
            達成 {GOAL_SCORE}点
          </span>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-label)", color: "var(--text-muted)", marginTop: 2 }}>
        <span>{new Date(evaluated[0].uploadedAt).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}</span>
        <span>いま</span>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <TrajStat v={String(best)} l="自己ベスト" />
        <TrajStat v={String(recentAvg)} l={`直近${recent5.length}回平均`} />
        <TrajStat v={String(evaluated.length)} l="演奏回数" />
      </div>

    </div>
  )
}
