// 上達のようす (推移チャート)。2026-08-16 scoreDetail.tsx から独立部品化。
// 演奏履歴を「1演奏ずつのカード」ではなく "推移" で見せる (2026-07-25 Tetsuo確定・案1拡張)。
// 見た目 = 確定モック TRAJ_CARD (scratchpad/build-score.py 294-321) の写経 (2026-08-20)。
//   カード=DS card / 大数字40px cream+グロー / 伸びチップ緑・下げは桃 /
//   折れ線=クリーム2.6px+節点r3.4(地#16294f) / 格子 rgba(150,175,225,.10) /
//   達成ライン=金1.1px破線4 4 op.5 / 音程・リズムのinset2枚 (#E0872B / #7FC4C4)。
// 機能は従来どおり維持 (総合/音程/リズムの切替・自己ベスト等の統計・達成ライン・日付)。
// データは performances(pitchAccuracy/timingAccuracy/uploadedAt) のみで算出。区間録音は非算入。
"use client"

import { useState } from "react"
import ds from "./ds.module.css"

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
// モック TRAJ_CARD の軸色: 総合=クリーム / 音程=#E0872B / リズム=#7FC4C4
const TRAJ_COLOR: Record<TrajAxis, string> = { total: "#fff3dc", pitch: "#e0872b", rhythm: "#7fc4c4" }

/** 数値系列を viewBox 内の座標列にする */
function seriesXY(values: number[], w: number, h: number, pad: number, minV: number, maxV: number): [number, number][] {
  const n = values.length
  const span = maxV - minV || 1
  return values.map((v, i) => {
    const x = n === 1 ? w / 2 : pad + (i / (n - 1)) * (w - 2 * pad)
    const y = h - pad - ((v - minV) / span) * (h - 2 * pad)
    return [Math.round(x * 10) / 10, Math.round(y * 10) / 10]
  })
}

function TrajStat({ v, l }: { v: string; l: string }) {
  return (
    <div style={{ flex: 1, background: "var(--card-in)", borderRadius: 11, padding: "9px 4px", textAlign: "center" }}>
      <div style={{ fontSize: "var(--fs-subhead)", fontWeight: 800, color: "var(--cream)", fontVariantNumeric: "tabular-nums" }}>{v}</div>
      <div style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)", fontWeight: 700, marginTop: 2 }}>{l}</div>
    </div>
  )
}

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
  /** 呼び手のカードスタイル。未指定は DS カード */
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

  // チャート座標 (モック viewBox 310x120)。下限は 50 か 最低点-5 の低い方。
  const W = 310, H = 120, PAD = 10
  const minV = Math.max(0, Math.min(50, Math.min(...series) - 5))
  const maxV = 100
  const xy = seriesXY(series, W, H, PAD, minV, maxV)
  const line = "M" + xy.map(([x, y]) => `${x} ${y}`).join(" L")
  const goalY = H - PAD - ((GOAL_SCORE - minV) / (maxV - minV)) * (H - 2 * PAD)

  const up = delta >= 0

  const seg = (key: TrajAxis, label: string) => (
    <button
      type="button"
      onClick={() => setAxis(key)}
      style={{
        flex: 1, border: "none", fontSize: "var(--fs-caption)", fontWeight: 800,
        background: axis === key ? "linear-gradient(180deg,#22355e,#182747)" : "transparent",
        color: axis === key ? TRAJ_COLOR[key] : "var(--text-sub)",
        boxShadow: axis === key ? "inset 0 0 0 1px rgba(232,178,60,.28)" : "none",
        padding: "6px 0", borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
      }}
    >
      {label}
    </button>
  )

  return (
    <div className={className ?? ds.card} data-anim={className ? "block" : undefined} style={{ marginTop: 0 }}>
      {/* モック: lab + 直近nピル */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className={ds.lab}>{title ?? "上達のようす"}</div>
        <span className={`${ds.pill} ${ds.mute}`} style={{ fontSize: 10.5 }}>直近{recent5.length}回</span>
      </div>

      {/* モック: bigN 40px + 伸びチップ */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginTop: 4 }}>
        <div className={ds.bigN} style={{ fontSize: 40, lineHeight: 1 }}><span data-anim="count">{latest}</span></div>
        <span
          style={{
            display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 8,
            fontSize: 11, fontWeight: 800, borderRadius: 999, padding: "3px 10px",
            background: up ? "rgba(168,201,127,.16)" : "rgba(232,155,168,.16)",
            color: up ? "var(--green-soft)" : "var(--pink-soft)",
            border: up ? "1px solid rgba(168,201,127,.3)" : "1px solid rgba(232,155,168,.3)",
          }}
        >
          {up ? "▲" : "▼"} {up ? "+" : ""}{delta}
        </span>
      </div>

      {/* 軸の切替 (機能維持・DSセグの意匠) */}
      <div style={{ display: "flex", gap: 4, background: "#0e1830", border: "1px solid rgba(150,175,225,.1)", borderRadius: 10, padding: 3, marginTop: 10 }}>
        {seg("total", "総合")}
        {seg("pitch", "音程")}
        {seg("rhythm", "リズム")}
      </div>

      {/* モック: 格子 + 金の達成破線 + クリーム折れ線 + 節点 */}
      <div style={{ position: "relative" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="118" style={{ marginTop: 8 }} preserveAspectRatio="none">
          <g stroke="rgba(150,175,225,.10)" strokeWidth="1">
            <line x1="8" y1="30" x2={W - 8} y2="30" />
            <line x1="8" y1="70" x2={W - 8} y2="70" />
            <line x1="8" y1="110" x2={W - 8} y2="110" />
          </g>
          {goalY > PAD && goalY < H - PAD && (
            <line x1="8" y1={goalY} x2={W - 8} y2={goalY} stroke="#E8B23C" strokeWidth="1.1" strokeDasharray="4 4" opacity=".5" />
          )}
          <path d={line} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          <g stroke={color} strokeWidth="2" fill="#16294f">
            {xy.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.4" />)}
          </g>
        </svg>
        {goalY > PAD && goalY < H - PAD && (
          <span style={{ position: "absolute", right: 2, top: Math.max(0, (goalY / H) * 118 - 14), fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--gold)" }}>
            達成 {GOAL_SCORE}点
          </span>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--fs-label)", color: "var(--text-muted)", marginTop: 2 }}>
        <span>{new Date(evaluated[0].uploadedAt).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}</span>
        <span>いま</span>
      </div>

      {/* モック: 音程/リズムの inset 2枚 (最新値) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
        <div style={{ background: "var(--card-in)", borderRadius: 12, padding: "10px 12px" }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#e0872b" }}>音程</span>
          <div className={ds.bigN} style={{ fontSize: 22, marginTop: 2 }}><span data-anim="count">{pitches[pitches.length - 1]}</span></div>
        </div>
        <div style={{ background: "var(--card-in)", borderRadius: 12, padding: "10px 12px" }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#7fc4c4" }}>リズム</span>
          <div className={ds.bigN} style={{ fontSize: 22, marginTop: 2 }}><span data-anim="count">{timings[timings.length - 1]}</span></div>
        </div>
      </div>

      {/* 統計 (機能維持・insetの意匠) */}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <TrajStat v={String(best)} l="自己ベスト" />
        <TrajStat v={String(recentAvg)} l={`直近${recent5.length}回平均`} />
        <TrajStat v={String(evaluated.length)} l="演奏回数" />
      </div>
    </div>
  )
}
