"use client"

// 「わざのレベル」詳細 (案7=カード+推移)。カルテv3のペーパートークンに準拠。
// 全15わざを「安定度あり→習得ずみデータ待ち→挑戦できる→ロック」順(同順内★昇順)で並べ、
// 各わざを1枚の紙カードに: 大きな安定度% / 状態ラベル / NEW / 今週差 /
// スパークライン(series) / 音程・リズム2本バー(pitchPct・rhythmPct) / くわしく・練習リンク。
// 絵文字は使わず lucide / インラインSVG のみ。
import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Search } from "lucide-react"
import type { SkillMapData, SkillNode } from "@/app/_libs/growthKarte"

// ── ペーパートークン (progressPage v3 と同じ) ──
const INK = "#241f14"
const SUB = "#9a8c74"
const ACC = "#3555d4"
const GOOD = "#0f8a4f"
const BAD = "#d0453a"
const GOLD = "#b58a1e"
const WARN = "#c9752e"
const tnum: React.CSSProperties = { fontVariantNumeric: "tabular-nums" }

const kicker: React.CSSProperties = { fontSize: 9, fontWeight: 900, letterSpacing: ".24em", color: "#b99b45" }

// わざの分類セクション (id は SKILL_DEFS の id = SkillNode.id と一致)
const SKILL_CATEGORIES: { label: string; ids: string[] }[] = [
  { label: "弓（ボーイング）", ids: ["slur", "staccato", "portato", "bow_staccato", "tremolo", "spiccato", "ricochet", "pizzicato"] },
  { label: "フィンガリング（左手）", ids: ["position", "double"] },
  { label: "装飾", ids: ["trill", "mordent", "glissando"] },
  { label: "音色・特殊", ids: ["vibrato", "harmonic"] },
]

export default function SkillsLevelClient({ userId, skillMap }: { userId: string; skillMap: SkillMapData | null }) {
  // 先生未連携: トップのティーザーと同等の導線
  if (!skillMap) {
    return (
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "18px 14px 60px", fontFamily: "inherit", color: INK }}>
        <Link href={`/${userId}/progress`}
          style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 800, color: SUB, textDecoration: "none" }}>
          <ArrowLeft size={13} /> カルテにもどる
        </Link>
        <div style={{
          marginTop: 12, background: "linear-gradient(165deg,#fffdf6,#faf4e4)", border: "1px solid #eee6d0",
          borderRadius: 18, padding: "24px 18px", textAlign: "center",
        }}>
          <div style={kicker}>SKILLS</div>
          <div style={{ fontSize: 15, fontWeight: 900, marginTop: 1 }}>わざの習得状況</div>
          <div style={{ fontSize: 12, color: SUB, margin: "8px 0 14px", lineHeight: 1.7 }}>
            スラーやビブラートなど「わざ」の習得と安定が一目でわかるレベル表。<br />
            先生が気づいた癖を体の場所で見られる「からだの癖」も。<br />
            <b>先生とつながると開放</b>されます。
          </div>
          <Link href={`/${userId}/find-teacher`}
            style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 800, color: "#fff", background: ACC, borderRadius: 9, padding: "9px 18px", textDecoration: "none" }}>
            <Search size={14} /> 先生を探す →
          </Link>
        </div>
      </div>
    )
  }

  const { nodes, currentStar } = skillMap
  // 並び (progressPage の order と同じ): 実測あり → 習得ずみ(データ待ち) → 挑戦できる → まだ先
  const order = (n: SkillNode) =>
    n.pct != null ? 0 : n.state === "acquired_nodata" ? 1 : n.state === "ready" ? 2 : 3
  const byId = new Map(nodes.map((n) => [n.id, n]))
  // 分類ごとにグループ化。各分類内は従来の並び (order → star 昇順)。空分類は非表示。
  const sections = SKILL_CATEGORIES.map((c) => ({
    label: c.label,
    items: c.ids
      .map((id) => byId.get(id))
      .filter((n): n is SkillNode => !!n)
      .sort((a, b) => order(a) - order(b) || a.star - b.star),
  })).filter((s) => s.items.length > 0)

  return <SkillsTabs userId={userId} currentStar={currentStar} sections={sections} />
}

/* ═ 分類タブ + アクティブ分類の横スクロールレール ═ */
function SkillsTabs({ userId, currentStar, sections }: {
  userId: string
  currentStar: number
  sections: { label: string; items: SkillNode[] }[]
}) {
  const [activeTab, setActiveTab] = useState(sections[0]?.label ?? "")
  const active = sections.find((s) => s.label === activeTab) ?? sections[0]

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "18px 14px 60px", fontFamily: "inherit", color: INK }}>
      {/* ヘッダ */}
      <Link href={`/${userId}/progress`}
        style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 800, color: SUB, textDecoration: "none" }}>
        <ArrowLeft size={13} /> カルテにもどる
      </Link>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
        <div style={kicker}>SKILLS</div>
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 900, margin: "1px 0 0" }}>
        わざの習得状況
        <span style={{ fontSize: 11, fontWeight: 800, color: SUB, marginLeft: 8 }}>いまの★{currentStar}</span>
      </h1>

      {/* 分類タブ (横スクロール・非空分類のみ) */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", margin: "16px -14px 0", padding: "0 14px" }}>
        {sections.map((s) => {
          const on = s.label === active?.label
          return (
            <button key={s.label} type="button" onClick={() => setActiveTab(s.label)}
              style={{
                flex: "none", display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 12, fontWeight: 900, cursor: "pointer",
                borderRadius: 999, padding: "7px 14px", whiteSpace: "nowrap",
                color: on ? "#fff" : INK,
                background: on ? INK : "rgba(255,255,255,.8)",
                border: `1px solid ${on ? INK : "#efe5cc"}`,
              }}>
              {s.label}
              <span style={{
                fontSize: 9.5, fontWeight: 900, borderRadius: 999, padding: "0 6px", ...tnum,
                color: on ? "#fff" : SUB,
                background: on ? "rgba(255,255,255,.22)" : "rgba(150,130,90,.14)",
              }}>{s.items.length}</span>
            </button>
          )
        })}
      </div>

      {/* アクティブ分類のカード (横スクロールレール) */}
      {active && (
        <div style={{
          display: "flex", gap: 12, overflowX: "auto", scrollSnapType: "x mandatory",
          scrollbarWidth: "none", touchAction: "pan-y",
          margin: "14px -14px 0", padding: "2px 14px 6px",
        }}>
          {active.items.map((n) => <SkillCard key={n.id} userId={userId} n={n} />)}
        </div>
      )}
    </div>
  )
}

/* ═ 案7カード ═ */
function SkillCard({ userId, n }: { userId: string; n: SkillNode }) {
  const lit = n.state === "stable" || n.state === "wobble" || n.state === "acquired_nodata"
  const locked = n.state === "locked"
  const hasPct = n.pct != null

  const card: React.CSSProperties = {
    flex: "none", width: 158, scrollSnapAlign: "start",
    borderRadius: 15, padding: "14px 14px", boxSizing: "border-box",
    background: lit ? "linear-gradient(155deg,#fffdf4,#fdf2d2)" : "rgba(255,255,255,.8)",
    border: `1px solid ${lit ? "#e3c96a" : "#efe5cc"}`,
    ...(locked ? { opacity: 0.6, filter: "saturate(.5)" } : {}),
  }

  const stateLabel =
    n.state === "stable" ? "安定"
    : n.state === "wobble" ? "ゆらぎ中 ・ 練習しどき"
    : n.state === "acquired_nodata" ? "習得ずみ ・ データ集め中"
    : n.state === "ready" ? "つぎに挑戦できる"
    : `★${n.star} で出会う`

  const pctColor = n.state === "wobble" ? WARN : GOOD

  return (
    <div style={card}>
      {/* 名前 + NEW */}
      <div style={{ fontSize: 13, fontWeight: 900, lineHeight: 1.3 }}>
        {n.label}
        {n.isNew && (
          <span style={{ fontSize: 8, fontWeight: 900, color: "#fff", background: BAD, borderRadius: 999, padding: "1px 6px", marginLeft: 5, verticalAlign: 2 }}>NEW</span>
        )}
      </div>

      {/* 大きな安定度% */}
      <div style={{ marginTop: 6 }}>
        {hasPct ? (
          <div style={{ ...tnum, fontSize: 32, fontWeight: 900, lineHeight: 1, color: pctColor }}>
            {n.pct}<span style={{ fontSize: 14 }}>%</span>
          </div>
        ) : (
          <div style={{ fontSize: 30, fontWeight: 900, color: "#c0b598", lineHeight: 1 }}>—</div>
        )}
      </div>

      {/* 状態ラベル + 今週差 */}
      <div style={{ fontSize: 10, fontWeight: 800, color: SUB, marginTop: 5, lineHeight: 1.4 }}>{stateLabel}</div>
      {n.weekDelta != null && n.weekDelta !== 0 && (
        <div style={{ fontSize: 10, fontWeight: 800, color: n.weekDelta > 0 ? GOOD : WARN, marginTop: 2 }}>
          先週より {n.weekDelta > 0 ? `+${n.weekDelta}` : n.weekDelta}
        </div>
      )}

      {/* スパークライン (推移) */}
      {n.series.length >= 2 && (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2.5, height: 28, marginTop: 10 }} aria-hidden>
          {n.series.slice(-8).map((v, i, arr) => (
            <span key={i} style={{
              flex: 1, height: `${Math.max(12, v)}%`, borderRadius: "2px 2px 0 0",
              background: i === arr.length - 1 ? "#c9a227" : "linear-gradient(180deg,#e3c96a,#d8b34e)",
            }} />
          ))}
        </div>
      )}

      {/* 音程 / リズムの2本バー */}
      {hasPct && (n.pitchPct != null || n.rhythmPct != null) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
          {n.pitchPct != null && <MiniBar label="音程" pct={n.pitchPct} />}
          {n.rhythmPct != null && <MiniBar label="リズム" pct={n.rhythmPct} />}
        </div>
      )}

      {/* 下段リンク */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", marginTop: 12 }}>
        <Link href={`/${userId}/progress/skill/${n.id}`} style={{ fontSize: 10.5, fontWeight: 800, color: ACC, textDecoration: "none" }}>くわしく →</Link>
        {n.practiceHref && <Link href={n.practiceHref} style={{ fontSize: 10.5, fontWeight: 800, color: WARN, textDecoration: "none" }}>練習する →</Link>}
      </div>
    </div>
  )
}

/* ═ 音程 / リズムの1本バー ═ */
function MiniBar({ label, pct }: { label: string; pct: number }) {
  const color = pct < 70 ? WARN : GOOD
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ flex: "none", width: 34, fontSize: 9.5, fontWeight: 800, color: SUB }}>{label}</span>
      <div style={{ flex: 1, height: 7, borderRadius: 999, background: "rgba(150,130,90,.16)", overflow: "hidden" }}>
        <div style={{ width: `${Math.max(4, Math.min(100, pct))}%`, height: "100%", borderRadius: 999, background: color }} />
      </div>
      <span style={{ ...tnum, flex: "none", width: 30, textAlign: "right", fontSize: 10, fontWeight: 900, color }}>{pct}</span>
    </div>
  )
}
