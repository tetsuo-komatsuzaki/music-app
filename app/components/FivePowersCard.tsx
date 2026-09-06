"use client"
// 5 つの力のカード (2026-09-06 Tetsuo確定): レーダー (いま = 金の実線 ・ 相手 = 青の破線) と 棒グラフ を切り替える。
// 下に結論の 1 行と、結論の「下がった力 / いちばん低い力」の教材への導線。
// 測れない軸は両方 0 に落とし、軸名の横に「録音なし」(Tetsuo: 主語は いまの自分 との比較)。
import { useState } from "react"
import Link from "next/link"
import ds from "@/app/components/ds.module.css"
import { POWER_KEYS, POWER_LABEL, POWER_PRACTICE, SCALE_LABEL, type PowersComparison, type PowerKey } from "@/app/_libs/fivePowersCore"

const GOLD = "#e8b23c", BLUE = "#7aa7ff"
function fillColor(p: number) { return p >= 85 ? "#2e7d5b" : p >= 70 ? "#d97b2e" : "#b44b4b" }
function inkColor(p: number) { return p >= 85 ? "#a8c97f" : p >= 70 ? "#e0b25c" : "#e8a78f" }

function Radar({ cmp }: { cmp: PowersComparison }) {
  const cx = 110, cy = 110, R = 76, n = POWER_KEYS.length
  const pt = (i: number, r: number): [number, number] => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / n; return [cx + r * Math.cos(a), cy + r * Math.sin(a)] }
  const poly = (vals: Record<PowerKey, number>) => POWER_KEYS.map((k, i) => pt(i, (R * vals[k]) / 100).join(",")).join(" ")
  const { now, past, missing } = cmp.chart
  return (
    <svg viewBox="0 0 220 220" style={{ width: "100%", maxWidth: 240, height: 220, display: "block", margin: "2px auto 0" }} aria-hidden>
      {[0.33, 0.66, 1].map((k) => <polygon key={k} points={POWER_KEYS.map((_, i) => pt(i, R * k).join(",")).join(" ")} fill="none" stroke="rgba(150,175,225,.18)" />)}
      {POWER_KEYS.map((k, i) => { const [x, y] = pt(i, R); return <line key={k} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(150,175,225,.18)" /> })}
      {past && <polygon points={poly(past)} fill={BLUE} fillOpacity={0.10} stroke={BLUE} strokeWidth={2} strokeDasharray="4 3" />}
      <polygon points={poly(now)} fill={GOLD} fillOpacity={0.22} stroke={GOLD} strokeWidth={2} />
      {POWER_KEYS.map((k, i) => {
        const [lx, ly] = pt(i, R + 19)
        const [px, py] = pt(i, (R * now[k]) / 100)
        const miss = missing.includes(k)
        const d = past ? now[k] - past[k] : null
        return (
          <g key={k}>
            <text x={lx} y={ly - 5} textAnchor="middle" fontSize={10} fontWeight={800} fill={miss ? "#5e7099" : "#8fa0c4"}>{POWER_LABEL[k]}</text>
            {miss
              ? <text x={lx} y={ly + 8} textAnchor="middle" fontSize={8.5} fontWeight={800} fill="#5e7099">録音なし</text>
              : d != null && <text x={lx} y={ly + 8} textAnchor="middle" fontSize={9} fontWeight={900} fill={d >= 0 ? "#a8c97f" : "#e8a78f"}>{d >= 0 ? `+${d}` : d}</text>}
            <circle cx={px} cy={py} r={3} fill={GOLD} />
          </g>
        )
      })}
    </svg>
  )
}

function Bars({ cmp }: { cmp: PowersComparison }) {
  const L = SCALE_LABEL[cmp.scale]
  const { now, past, missing } = cmp.chart
  const cell: React.CSSProperties = { height: 9, borderRadius: 5, background: "rgba(150,175,225,.12)", overflow: "hidden" }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "72px 1fr 1fr 34px", gap: "7px 8px", alignItems: "center", marginTop: 10, fontSize: 11 }}>
      <span />
      <span style={{ fontSize: 9.5, color: "var(--text-sub)", fontWeight: 800 }}>{L.past}</span>
      <span style={{ fontSize: 9.5, color: "var(--gold)", fontWeight: 800 }}>{L.now}</span>
      <span />
      {POWER_KEYS.map((k) => {
        const miss = missing.includes(k)
        const d = past ? now[k] - past[k] : null
        return (
          <div key={k} style={{ display: "contents" }}>
            <span style={{ fontWeight: 800, color: miss ? "var(--text-muted)" : "var(--text-ink)" }}>{POWER_LABEL[k]}</span>
            <div style={cell}>{past && <i style={{ display: "block", height: "100%", width: `${past[k]}%`, background: "#3d5da8" }} />}</div>
            <div style={cell}><i style={{ display: "block", height: "100%", width: `${now[k]}%`, background: fillColor(now[k]) }} /></div>
            <b style={{ fontSize: 10, fontWeight: 900, textAlign: "right", fontVariantNumeric: "tabular-nums", color: miss ? "var(--text-muted)" : d == null ? inkColor(now[k]) : d >= 0 ? "#a8c97f" : "#e8a78f" }}>
              {miss ? "なし" : d == null ? `${now[k]}%` : d >= 0 ? `+${d}` : d}
            </b>
          </div>
        )
      })}
    </div>
  )
}

export default function FivePowersCard({ cmp, practiceBase }: { cmp: PowersComparison; practiceBase: string | null }) {
  const [view, setView] = useState<"radar" | "bars">("radar")
  const L = SCALE_LABEL[cmp.scale]
  const target = cmp.conclusion.weakest
  const btn = (on: boolean): React.CSSProperties => ({
    font: "inherit", fontSize: 10.5, fontWeight: 800, padding: "4px 10px", borderRadius: 999, border: "none", cursor: "pointer",
    background: on ? "var(--accent)" : "transparent", color: on ? "#fff" : "var(--text-sub)",
  })
  return (
    <div className={`${ds.card} naCockpit`} style={{ padding: "13px 15px" }} data-guide="numbers-five-powers">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div className={ds.lab}>きみの 5 つの力</div>
        <div style={{ marginLeft: "auto", display: "inline-flex", gap: 2, background: "var(--card-in)", border: "1px solid var(--line)", borderRadius: 999, padding: 2 }} role="tablist" aria-label="表示の切り替え">
          <button type="button" role="tab" aria-selected={view === "radar"} style={btn(view === "radar")} onClick={() => setView("radar")}>レーダー</button>
          <button type="button" role="tab" aria-selected={view === "bars"} style={btn(view === "bars")} onClick={() => setView("bars")}>棒グラフ</button>
        </div>
      </div>
      {view === "radar" ? (
        <>
          <Radar cmp={cmp} />
          <div style={{ display: "flex", gap: 12, justifyContent: "center", fontSize: 10, color: "var(--text-sub)" }}>
            <span><i style={{ display: "inline-block", width: 14, height: 3, background: BLUE, opacity: 0.7, verticalAlign: "middle", marginRight: 4, borderRadius: 2 }} />{cmp.chart.past ? L.past : `${L.past}は録音なし`}</span>
            <span><i style={{ display: "inline-block", width: 14, height: 3, background: GOLD, verticalAlign: "middle", marginRight: 4, borderRadius: 2 }} />{L.now}</span>
          </div>
        </>
      ) : <Bars cmp={cmp} />}
      <div style={{ fontSize: 11.5, color: "var(--text-ink)", marginTop: 12, background: "var(--card-in)", borderRadius: 10, padding: "9px 11px", lineHeight: 1.6 }}>
        {cmp.conclusion.text}
      </div>
      {practiceBase && target && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <Link href={`${practiceBase}${POWER_PRACTICE[target]}`} className="naGo pressable">{POWER_LABEL[target]}の教材へ ・ {cmp.chart.past && cmp.chart.now[target] < cmp.chart.past[target] ? "いちばん下がった力" : "いちばん低い力"}</Link>
        </div>
      )}
      <div style={{ fontSize: 9.5, color: "var(--text-muted)", fontWeight: 800, marginTop: 6 }}>
        音ごとの記録から ・ {L.now} {cmp.now.perfCount} 回{cmp.past ? ` ・ ${L.past} ${cmp.past.perfCount} 回` : ""} ・ 測れない力は 0 として描くよ
      </div>
    </div>
  )
}
