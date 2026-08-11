"use client"

// アルコの週間サマリー (2026-08-11 Tetsuo承認モック準拠・まとめの今週ストリップを置き換え)。
// へんかマップ = 週次差分専用の指板 (悪化=赤/改善=緑・2段階)。行タップ⇔セル黒枠が連動。
import { useMemo, useState } from "react"
import Link from "next/link"
import {
  STRINGS, type ViolinString, N_END, H_OPEN, Y_END, colX, cellPolygon, cellId, yOf,
} from "@/app/_libs/fingerboard/geometry"
import type { WeeklySummaryData } from "@/app/_libs/weeklySummary"

const rot = (p: readonly (readonly [number, number])[]) => p.map(([x, y]) => [y, -x] as const)
const pts = (p: readonly (readonly [number, number])[]) => p.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ")

const WORSE = ["#f0b3ac", "#e26a5d"]
const BETTER = ["#b9dfc7", "#4ca877"]

export default function WeeklySummaryCard({ data, karteTabHref }: { data: WeeklySummaryData; karteTabHref: string }) {
  const [sel, setSel] = useState<string | null>(data.changes[0]?.cellId ?? null)
  const byCell = useMemo(() => new Map(data.changes.map((c) => [c.cellId, c])), [data.changes])
  const selRow = sel ? byCell.get(sel) : null

  const svg = useMemo(() => {
    const nodes: React.ReactNode[] = []
    for (let n = 0; n <= N_END; n++) {
      STRINGS.forEach((s, si) => {
        const id = cellId(s, n)
        const c = byCell.get(id)
        const lv = c ? (Math.abs(c.delta) >= 30 ? 1 : 0) : 0
        const fill = c ? (c.delta < 0 ? WORSE[lv] : BETTER[lv]) : n === 0 ? "#f4f4f4" : "#ffffff"
        nodes.push(
          <polygon key={id} points={pts(rot(cellPolygon(si, n)))} fill={fill}
            stroke={sel === id ? "#111" : "#c9cdd4"} strokeWidth={sel === id ? 1.1 : 0.3}
            onClick={c ? () => setSel(id) : undefined} style={c ? { cursor: "pointer" } : undefined} />,
        )
      })
    }
    const edge = rot([[colX(0, 0), 0], [colX(0, 4), 0], [colX(Y_END, 4), Y_END], [colX(Y_END, 0), Y_END]] as const)
    return (
      <svg viewBox="-24 -27 300 58" role="img" aria-label="音のへんかマップ" style={{ width: "100%", height: "auto", fontFamily: "sans-serif", display: "block" }}>
        <g>{nodes}</g>
        <polygon points={pts(edge)} fill="none" stroke="#333" strokeWidth={0.8} pointerEvents="none" />
        <line x1={0} y1={-colX(0, 0)} x2={0} y2={-colX(0, 4)} stroke="#111" strokeWidth={1.6} pointerEvents="none" />
        {STRINGS.map((s, si) => (
          <text key={s} x={-H_OPEN - 4} y={-(colX(-H_OPEN, si) + colX(-H_OPEN, si + 1)) / 2 + 2.2} fontSize={6.5} textAnchor="middle" fill="#333">{s}</text>
        ))}
        {([[1, "1st"], [5, "3rd"], [8, "5th"]] as const).map(([n, lab]) => (
          <text key={lab} x={yOf(n)} y={26.5} fontSize={4.5} textAnchor="middle" fill="#98a0ab">{lab}</text>
        ))}
      </svg>
    )
  }, [byCell, sel])

  const rl: React.CSSProperties = { fontSize: "var(--fs-label)", fontWeight: 900, color: "var(--text-muted)", width: 76, flex: "none" }
  const rowS: React.CSSProperties = { display: "flex", alignItems: "center", gap: 9, padding: "7px 0" }
  const deltaBadge = (d: number): React.CSSProperties => ({
    flex: "none", fontSize: "var(--fs-label)", fontWeight: 900, borderRadius: 5, padding: "0 5px",
    color: d < 0 ? "#bb3a2e" : "#158253", background: d < 0 ? "#fdeceb" : "#e9f8f0",
  })

  return (
    <div style={{ background: "#fff", border: "1px solid #dbe2f0", borderRadius: 14, overflow: "hidden", marginBottom: 4 }}>
      <div style={{ background: "linear-gradient(135deg,#22346b,#31498f)", color: "#fff", padding: "9px 13px", display: "flex", alignItems: "baseline", gap: 8 }}>
        <b style={{ fontSize: "var(--fs-caption)", fontWeight: 900 }}>アルコの週間サマリー</b>
        <span style={{ fontSize: "var(--fs-label)", color: "#aabbe0" }}>{data.rangeLabel}・先週とくらべて</span>
      </div>
      <div style={{ padding: "9px 13px 12px" }}>

        {/* 練習のリズム */}
        <div style={rowS}>
          <span style={rl}>練習のリズム</span>
          <span style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "#26324c", minWidth: 0 }}>
            {data.count === 0 ? "今週はまだ練習なし" : <>
              <b>{data.practicedDays}日・{data.count}回</b>
              {Math.abs(data.count - data.prevCount) >= 2 && (
                <span style={{ fontWeight: 900, color: data.count > data.prevCount ? "#158253" : "#bb3a2e" }}>
                  ・先週より{data.count > data.prevCount ? "+" : ""}{data.count - data.prevCount}回
                </span>
              )}
              <span style={{ display: "inline-flex", gap: 3, marginLeft: 7, verticalAlign: "-2px" }}>
                {data.days.map((on, i) => (
                  <span key={i} style={{ width: 11, height: 11, borderRadius: 3, background: on ? "#2f66c4" : "#e8edf5", display: "inline-block" }} />
                ))}
              </span>
            </>}
          </span>
        </div>

        {/* 練習した曲・基礎練の回数 (2026-08-11 追加指示) */}
        {data.perTarget.length > 0 && (
          <div style={{ ...rowS, borderTop: "1px dashed #edf0f5", alignItems: "flex-start" }}>
            <span style={{ ...rl, paddingTop: 2 }}>練習したもの</span>
            <span style={{ display: "flex", flexWrap: "wrap", gap: 5, minWidth: 0 }}>
              {data.perTarget.map((t, i) => (
                <span key={i} style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: "#33405a", background: "#f4f7fb", border: "1px solid #e3e9f2", borderRadius: 999, padding: "2px 9px" }}>
                  {t.cat !== "曲" && <span style={{ color: "var(--text-muted)", fontWeight: 900, marginRight: 3 }}>{t.cat}</span>}
                  {t.title} <b style={{ fontVariantNumeric: "tabular-nums" }}>×{t.count}</b>
                </span>
              ))}
            </span>
          </div>
        )}

        {/* あたらしいこと */}
        {data.newThings.map((t, i) => (
          <div key={i} style={{ ...rowS, borderTop: "1px dashed #edf0f5" }}>
            <span style={rl}>あたらしいこと</span>
            <span style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "#26324c" }}>{t}</span>
          </div>
        ))}

        {/* 音のへんか */}
        <div style={{ borderTop: "1px dashed #edf0f5", paddingTop: 7 }}>
          <span style={{ ...rl, display: "block", marginBottom: 4 }}>音のへんか</span>
          {data.changes.length === 0 ? (
            <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>
              先週とくらべて大きな変化なし・順調です{data.count === 0 ? "" : "。両方の週で5回以上ひいた音をくらべています"}
            </div>
          ) : (
            <>
              <div style={{ background: "#fbfdff", border: "1px solid #dce6f2", borderRadius: 10, padding: "6px 8px" }}>{svg}</div>
              <div style={{ display: "flex", gap: 12, fontSize: "var(--fs-label)", color: "var(--text-muted)", marginTop: 4 }}>
                <span><i style={{ display: "inline-block", width: 9, height: 9, borderRadius: 2, background: "#e26a5d", marginRight: 3, verticalAlign: "-1px" }} />先週より崩れた</span>
                <span><i style={{ display: "inline-block", width: 9, height: 9, borderRadius: 2, background: "#4ca877", marginRight: 3, verticalAlign: "-1px" }} />先週より良くなった</span>
              </div>
              <div style={{ marginTop: 6 }}>
                {data.changes.map((c) => (
                  <div key={c.cellId} onClick={() => setSel(c.cellId)}
                    style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "var(--fs-caption)", padding: "4px 4px", borderRadius: 7, cursor: "pointer",
                      background: sel === c.cellId ? "#f0f4fb" : "transparent", outline: sel === c.cellId ? "1px solid #ccd8f0" : "none" }}>
                    <b style={{ flex: "none" }}>{c.label}</b>
                    <span style={{ flex: 1, minWidth: 40, height: 7, borderRadius: 3, background: "#e8edf5", overflow: "hidden", position: "relative" }}>
                      <span style={{ position: "absolute", top: 0, bottom: 0, borderRadius: 3,
                        left: `${Math.min(c.prevPct, c.nowPct)}%`, width: `${Math.abs(c.delta)}%`,
                        background: c.delta < 0 ? (Math.abs(c.delta) >= 30 ? "#e26a5d" : "#f0b3ac") : (Math.abs(c.delta) >= 30 ? "#4ca877" : "#b9dfc7") }} />
                    </span>
                    <span style={{ flex: "none", fontWeight: 900, fontVariantNumeric: "tabular-nums", fontSize: "var(--fs-label)" }}>
                      {c.prevPct}%→<span style={{ color: c.delta < 0 ? "#bb3a2e" : "#158253" }}>{c.nowPct}%</span>
                    </span>
                    <span style={deltaBadge(c.delta)}>{c.delta < 0 ? "▼" : "▲"}{Math.abs(c.delta)}</span>
                  </div>
                ))}
              </div>
              {selRow && (
                <div style={{ background: "#f7fafd", border: "1px solid #dce6f2", borderRadius: 9, padding: "8px 11px", fontSize: "var(--fs-label)", marginTop: 6, lineHeight: 1.7 }}>
                  <b style={{ fontSize: "var(--fs-caption)" }}>{selRow.label}</b>・先週 {selRow.prevN}回中{selRow.prevMiss}回ずれ → 今週 {selRow.nowN}回中{selRow.nowMiss}回ずれ
                  {selRow.worstTrans && <><br />今週は{selRow.worstTrans}</>}
                  <br /><Link href={karteTabHref} style={{ color: "#2f66c4", fontWeight: 900, textDecoration: "none" }}>音程マップでくわしく →</Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
