"use client"

// わざの習得状況 (技術マップ) — 確定モック karte07 SKILLMAP (build-karte.py + skillcards.py) の
// 写経 (2026-08-22)。ライト紙トークン→ダークへ全面変更:
//   back「‹ カルテにもどる」・ h1 ds.t +「いまの★n」・ 分類タブ=金選択チップ (件数つき) ・
//   カード=grid2 の DSカード (大きな% 30px=状態色 ・ 状態ラベル ・ NEW ・ 今週差 ・ くわしく→) ・
//   脚注カード (%の説明)。原本にないスパークライン/音程リズム2本バーは廃止 (原本が正)。
// 状態色: 安定=#A8C97F / ゆらぎ=#E8A78F / 習得ずみ=金 / 挑戦=#7FA4E8 / まだ先=muted。
import { useState } from "react"
import Link from "next/link"
import type { SkillMapData, SkillNode } from "@/app/_libs/growthKarte"
import ds from "@/app/components/ds.module.css"

const GOOD = "#a8c97f"
const WARN = "#e8a78f"
const tnum: React.CSSProperties = { fontVariantNumeric: "tabular-nums" }

// わざの分類セクション (id は SKILL_DEFS の id = SkillNode.id と一致)
const SKILL_CATEGORIES: { label: string; ids: string[] }[] = [
  { label: "弓", ids: ["slur", "staccato", "portato", "bow_staccato", "tremolo", "spiccato", "ricochet", "pizzicato"] },
  { label: "フィンガリング", ids: ["position", "double"] },
  { label: "装飾", ids: ["trill", "mordent", "glissando"] },
  { label: "音色・特殊", ids: ["vibrato", "harmonic"] },
]

const backStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 7, color: "var(--text-sub)", fontSize: 13, fontWeight: 700, padding: "10px 2px 2px", textDecoration: "none" }

export default function SkillsLevelClient({ userId, skillMap, backHref, backLabel = "カルテにもどる", hideDetailLinks = false }: {
  userId: string; skillMap: SkillMapData | null
  /** 先生ビュー用 (2026-08-11): 戻り先/ラベルの差し替えと、生徒ルートへの詳細リンク非表示 */
  backHref?: string; backLabel?: string; hideDetailLinks?: boolean
}) {
  // 2026-08-11 Tetsuo確定: 先生なしでも全ユーザーに開放 (nullは集計エラー時のみ)
  if (!skillMap) {
    return (
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 0 60px" }}>
        <Link href={backHref ?? `/${userId}/progress`} style={backStyle}>‹ {backLabel}</Link>
        <div className={ds.card} style={{ padding: "24px 18px", textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: "var(--text-ink)" }}>わざの習得状況</div>
          <div style={{ fontSize: 12, color: "var(--text-sub)", margin: "8px 0 4px", lineHeight: 1.7 }}>
            いまは集計を準備中。録音してわざを練習すると、ここに習得状況が表示されます。
          </div>
        </div>
      </div>
    )
  }

  const { nodes, currentStar } = skillMap
  // 並び (progressPage の order と同じ): 実測あり → 習得ずみ(データ待ち) → 挑戦できる → まだ先
  const order = (n: SkillNode) =>
    n.pct != null ? 0 : n.state === "acquired_nodata" ? 1 : n.state === "ready" ? 2 : 3
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const sections = SKILL_CATEGORIES.map((c) => ({
    label: c.label,
    items: c.ids
      .map((id) => byId.get(id))
      .filter((n): n is SkillNode => !!n)
      .sort((a, b) => order(a) - order(b) || a.star - b.star),
  })).filter((s) => s.items.length > 0)

  return <SkillsTabs userId={userId} currentStar={currentStar} sections={sections} backHref={backHref} backLabel={backLabel} hideDetailLinks={hideDetailLinks} />
}

/* ═ 分類タブ (原本 cat_tabs: 金選択チップ) + grid2 カード ═ */
function SkillsTabs({ userId, currentStar, sections, backHref, backLabel, hideDetailLinks }: {
  userId: string
  currentStar: number
  sections: { label: string; items: SkillNode[] }[]
  backHref?: string; backLabel?: string; hideDetailLinks?: boolean
}) {
  const [activeTab, setActiveTab] = useState(sections[0]?.label ?? "")
  const active = sections.find((s) => s.label === activeTab) ?? sections[0]

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 0 60px" }}>
      <Link href={backHref ?? `/${userId}/progress`} style={backStyle}>‹ {backLabel}</Link>
      <div style={{ display: "flex", alignItems: "baseline", gap: 9, padding: "0 2px" }}>
        <h1 className={ds.t} style={{ padding: 0 }}>わざの習得状況</h1>
        <span style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 700 }}>いまの★{currentStar}</span>
      </div>

      {/* 分類タブ (原本: 金選択チップ + 件数) */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", marginTop: 12, paddingBottom: 2 }}>
        {sections.map((s) => {
          const on = s.label === active?.label
          return (
            <button key={s.label} type="button" onClick={() => setActiveTab(s.label)} className="pressable"
              style={{
                flex: "none", display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 11.5, fontWeight: 800, fontFamily: "inherit", cursor: "pointer",
                borderRadius: 999, padding: "6px 13px", whiteSpace: "nowrap",
                color: on ? "var(--gold)" : "var(--text-sub)",
                background: on ? "rgba(232,178,60,.16)" : "rgba(150,175,225,.07)",
                border: `1px solid ${on ? "rgba(232,178,60,.34)" : "transparent"}`,
              }}>
              {s.label}
              <span style={{ fontSize: 9.5, opacity: 0.8, ...tnum }}>{s.items.length}</span>
            </button>
          )
        })}
      </div>

      {/* アクティブ分類のカード (原本: grid2) */}
      {active && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
          {active.items.map((n) => <SkillCard key={n.id} userId={userId} n={n} hideDetailLinks={hideDetailLinks} />)}
        </div>
      )}

      {/* 脚注 (原本) + 5状態ページへの導線 (karte09 ・ 孤立ページ防止で追記) */}
      <div className={ds.card} style={{ padding: "12px 15px" }}>
        <div style={{ fontSize: 10.5, color: "var(--text-muted)", lineHeight: 1.75 }}>
          %は その わざに紐づく個別課題の成功率だよ。<br />判定が8個たまってから出るよ。
        </div>
        {!hideDetailLinks && (
          <div style={{ marginTop: 9, textAlign: "right" }}>
            <Link href={`/${userId}/progress/skills/states`} className="pressable" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 800, color: "var(--text-ink)", background: "rgba(150,175,225,.1)", borderRadius: 999, padding: "4px 11px", textDecoration: "none" }}>
              わざの5つの状態 →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

/* ═ わざカード (原本 skillcards.card) ═ */
function SkillCard({ userId, n, hideDetailLinks }: { userId: string; n: SkillNode; hideDetailLinks?: boolean }) {
  const lit = n.state === "stable" || n.state === "wobble" || n.state === "acquired_nodata"
  const locked = n.state === "locked"

  const [stateLabel, stateColor] =
    n.state === "stable" ? ["安定", GOOD]
    : n.state === "wobble" ? ["ゆらぎ中 ・ 練習しどき", WARN]
    : n.state === "acquired_nodata" ? ["習得ずみ ・ データ集め中", "var(--gold)"]
    : n.state === "ready" ? ["つぎに挑戦できる", "#7fa4e8"]
    : [`★${n.star} で出会う`, "var(--text-muted)"]

  return (
    <div className={ds.card} style={{ margin: 0, padding: "12px 13px", ...(locked ? { opacity: 0.55 } : {}) }}>
      <b style={{ fontSize: 12.5, color: lit ? "var(--text-ink)" : "var(--text-sub)" }}>{n.label}</b>
      {n.isNew && (
        <span style={{ fontSize: 8, fontWeight: 900, color: "#fff", background: "#e8697a", borderRadius: 999, padding: "1px 6px", marginLeft: 5, verticalAlign: 2 }}>NEW</span>
      )}

      {n.pct != null ? (
        <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginTop: 6 }}>
          <span className={ds.bigN} style={{ ...tnum, fontSize: 30, lineHeight: 1, color: stateColor }}><span data-anim="count">{n.pct}</span></span>
          <span style={{ fontSize: 11, color: "var(--text-sub)", fontWeight: 800 }}>%</span>
        </div>
      ) : (
        <div style={{ marginTop: 6 }}>
          <span style={{ fontSize: 26, lineHeight: 1, color: "var(--text-muted)", fontWeight: 900 }}>—</span>
        </div>
      )}

      <div style={{ fontSize: 10, fontWeight: 800, color: stateColor, marginTop: 3 }}>{stateLabel}</div>
      {n.weekDelta != null && n.weekDelta !== 0 && (
        <div style={{ fontSize: 10, fontWeight: 800, marginTop: 2, color: n.weekDelta > 0 ? GOOD : WARN }}>
          今週 {n.weekDelta > 0 ? `+${n.weekDelta}` : n.weekDelta}
        </div>
      )}

      {!hideDetailLinks && lit && (
        <div style={{ marginTop: 8, textAlign: "right" }}>
          <Link href={`/${userId}/progress/skill/${n.id}`} style={{ fontSize: 10.5, color: "#7fa4e8", fontWeight: 800, textDecoration: "none" }}>くわしく →</Link>
        </div>
      )}
    </div>
  )
}
