"use client"

// 成長カルテ トップの「成長カーブ」章 (2026-09-02 Tetsuo確定)。
//
// カルテのトップに置くのはこれだけ。指板・ポジション移動・速い指の切り替え・奏法べつは
// 記録の分析ページの担当で、トップには持ち込まない (同じ絵を2画面に出さない)。
// 線と点の作りは記録の分析の成長カーブと同じ (日別平均・金点=自己ベスト更新日)。
import Link from "next/link"
import ds from "@/app/components/ds.module.css"

export type CurvePoint = { day: string; score: number; best: boolean }

export default function GrowthCurveChapter({
  curve, current, numbersHref,
}: {
  curve: CurvePoint[]
  /** いまの平均 (直近5回) と期間はじめからの伸び。null=採点が足りない */
  current: { avg: number; delta: number | null } | null
  /** 記録の分析への導線 */
  numbersHref: string
}) {
  const W = 360, H = 104, pad = 10
  const svg = (() => {
    if (curve.length < 2) return null
    const vals = curve.map((c) => c.score)
    const min = Math.min(...vals) - 4
    const max = Math.max(...vals) + 4
    const pts = curve.map((c, i) => [
      pad + (i * (W - 2 * pad)) / (curve.length - 1),
      H - pad - ((c.score - min) / Math.max(1, max - min)) * (H - 2 * pad),
    ] as const)
    const line = "M " + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ")
    const area = `${line} L ${W - pad} ${H - 2} L ${pad} ${H - 2} Z`
    return (
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} aria-hidden style={{ display: "block" }}>
        <defs>
          <linearGradient id="gcAg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(122,167,255,.28)" />
            <stop offset="1" stopColor="rgba(122,167,255,0)" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#gcAg)" />
        <path d={line} fill="none" stroke="#7aa7ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {curve.map((c, i) => (
          <circle key={c.day} cx={pts[i][0]} cy={pts[i][1]} r={c.best ? 3.6 : 2.2}
            fill={c.best ? "var(--gold, #d9a93c)" : "#7aa7ff"} />
        ))}
      </svg>
    )
  })()

  return (
    <div style={{ padding: "18px 16px 16px" }}>
      <div style={{ fontSize: 9.5, fontWeight: 900, letterSpacing: ".16em", color: "var(--text-muted)" }}>CURVE</div>
      <div style={{ fontSize: 15, fontWeight: 900, margin: "1px 0 9px" }}>成長カーブ</div>

      {current && (
        <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: ".08em" }}>いまの平均</span>
          <b style={{ fontSize: 26, fontWeight: 900, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{current.avg}</b>
          {current.delta != null && (
            <span style={{
              marginLeft: "auto", fontSize: 12, fontWeight: 900, padding: "3px 10px", borderRadius: 999,
              fontVariantNumeric: "tabular-nums",
              color: current.delta >= 0 ? "var(--gold, #d9a93c)" : "#e08e64",
              background: current.delta >= 0 ? "rgba(217,169,60,.15)" : "rgba(224,142,100,.14)",
              border: `1px solid ${current.delta >= 0 ? "rgba(217,169,60,.4)" : "rgba(224,142,100,.42)"}`,
            }}>
              {current.delta >= 0 ? `+${current.delta}` : current.delta}
            </span>
          )}
        </div>
      )}

      {svg == null ? (
        <div style={{ fontSize: 12, color: "var(--text-sub)", lineHeight: 1.8 }}>
          2日ぶん録音がたまると 線がのびていくよ
        </div>
      ) : (
        <>
          <div className={ds.card} style={{ padding: "10px 8px 6px" }}>{svg}</div>
          <div style={{ fontSize: 9.5, color: "var(--text-muted)", fontWeight: 800, marginTop: 5 }}>
            金の点 = 自己ベスト更新 ・ 点は録音した日の平均
          </div>
        </>
      )}

      <Link href={numbersHref} className="pressable" style={{
        display: "block", marginTop: 10, textAlign: "center", fontSize: 12, fontWeight: 700,
        color: "#a8c2ff", textDecoration: "none", padding: "8px",
        border: "1px solid rgba(150,175,225,.16)", borderRadius: 9,
      }}>
        記録の分析へ
      </Link>
    </div>
  )
}
