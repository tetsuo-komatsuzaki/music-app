"use client"

// 「表現の習得状況」詳細 (2026-08-11)。わざの習得状況(SkillsLevelClient)と同型。
// 全15表現を4系統に分け、系統タブ + アクティブ系統の横スクロールレールで表示。
// 各表現を1枚の紙カードに: 日本語名 + イタリア語 + NEW + 認定★(0=未開拓) /
// 認定した曲 / この表現に挑戦する曲リンク。
// 点灯 = 認定(★>0)。絵文字は使わず lucide / 記号(★☆) のみ。
import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Search } from "lucide-react"
import type { ExprMapData, ExprNode } from "@/app/_libs/growthKarte"

// ── ペーパートークン (progressPage v3 / SkillsLevelClient と同じ) ──
const INK = "#1c2b4d"
const SUB = "#7f8ea9"
const ACC = "#2b5bc4"
const BAD = "#d0453a"
const tnum: React.CSSProperties = { fontVariantNumeric: "tabular-nums" }
const kicker: React.CSSProperties = { fontSize: 9, fontWeight: 900, letterSpacing: ".24em", color: "#7f97c4" }

// 表現の分類 (progressPage の EXPR_CATEGORIES と同一。id は moodTags の tagId と一致)
const EXPR_CATEGORIES: { label: string; ids: string[] }[] = [
  { label: "やさしい・歌う", ids: ["mood_dolce", "mood_cantabile", "mood_amoroso", "mood_delicato", "mood_tranquillo"] },
  { label: "華やか・軽快", ids: ["mood_brillante", "mood_grazioso", "mood_leggiero", "mood_giocoso"] },
  { label: "力強い・堂々", ids: ["mood_energico", "mood_appassionato", "mood_maestoso", "mood_nobile"] },
  { label: "表情・幻想", ids: ["mood_espressivo", "mood_misterioso"] },
]

type Song = { id: string; title: string; star: number | null }

export default function ExpressionLevelClient({ userId, exprMap, unlocked, backHref, backLabel = "カルテにもどる", hideSongLinks = false }: {
  userId: string
  exprMap: ExprMapData
  unlocked: boolean
  /** 先生ビュー用 (2026-08-11) */
  backHref?: string; backLabel?: string; hideSongLinks?: boolean
}) {
  // 先生未連携: トップのティーザーと同等の導線
  if (!unlocked) {
    return (
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "18px 14px 60px", fontFamily: "inherit", color: INK }}>
        <Link href={backHref ?? `/${userId}/progress`}
          style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 800, color: SUB, textDecoration: "none" }}>
          <ArrowLeft size={13} /> {backLabel}
        </Link>
        <div style={{
          marginTop: 12, background: "#f2f7fd", border: "1px solid #dbe7f6",
          borderRadius: 18, padding: "24px 18px", textAlign: "center",
        }}>
          <div style={kicker}>ESPRESSIONE</div>
          <div style={{ fontSize: 15, fontWeight: 900, marginTop: 1 }}>表現の習得状況</div>
          <div style={{ fontSize: 12, color: SUB, margin: "8px 0 14px", lineHeight: 1.7 }}>
            「優しく」「歌うように」— きみの表現を先生が認定してくれる場所。<br />
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

  const { nodes, songsByTag } = exprMap
  const litCount = nodes.filter((n) => n.star > 0).length
  const byId = new Map(nodes.map((n) => [n.tagId, n]))
  // 系統内は「認定ずみ(★降順) → 未開拓」。空系統は非表示 (実質は常に全4系統)。
  const sections = EXPR_CATEGORIES.map((c) => ({
    label: c.label,
    items: c.ids
      .map((id) => byId.get(id))
      .filter((n): n is ExprNode => !!n)
      .sort((a, b) => (b.star > 0 ? 1 : 0) - (a.star > 0 ? 1 : 0) || b.star - a.star),
  })).filter((s) => s.items.length > 0)

  return <ExpressionTabs userId={userId} litCount={litCount} sections={sections} songsByTag={songsByTag} backHref={backHref} backLabel={backLabel} hideSongLinks={hideSongLinks} />
}

/* ═ 系統タブ + アクティブ系統の横スクロールレール ═ */
function ExpressionTabs({ userId, litCount, sections, songsByTag, backHref, backLabel, hideSongLinks }: {
  userId: string
  litCount: number
  sections: { label: string; items: ExprNode[] }[]
  songsByTag: Record<string, Song[]>
  backHref?: string; backLabel?: string; hideSongLinks?: boolean
}) {
  const [activeTab, setActiveTab] = useState(sections[0]?.label ?? "")
  const active = sections.find((s) => s.label === activeTab) ?? sections[0]

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "18px 14px 60px", fontFamily: "inherit", color: INK }}>
      {/* ヘッダ */}
      <Link href={backHref ?? `/${userId}/progress`}
        style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 800, color: SUB, textDecoration: "none" }}>
        <ArrowLeft size={13} /> {backLabel}
      </Link>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
        <div style={kicker}>ESPRESSIONE</div>
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 900, margin: "1px 0 0" }}>
        表現の習得状況
        <span style={{ fontSize: 11, fontWeight: 800, color: SUB, marginLeft: 8 }}>15の表現 ・ {litCount}つ認定</span>
      </h1>

      {/* 系統タブ (横スクロール・非空系統のみ) */}
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
                background: on ? "#1f3d78" : "#fff",
                border: `1px solid ${on ? "#1f3d78" : "#e0e9f6"}`,
              }}>
              {s.label}
              <span style={{
                fontSize: 9.5, fontWeight: 900, borderRadius: 999, padding: "0 6px", ...tnum,
                color: on ? "#fff" : SUB,
                background: on ? "rgba(255,255,255,.22)" : "#dfe9f8",
              }}>{s.items.filter((n) => n.star > 0).length}/{s.items.length}</span>
            </button>
          )
        })}
      </div>

      {/* アクティブ系統のカード (横スクロールレール) */}
      {active && (
        <div style={{
          display: "flex", gap: 12, overflowX: "auto", scrollSnapType: "x mandatory",
          scrollbarWidth: "thin",
          margin: "14px -14px 0", padding: "2px 14px 6px",
        }}>
          {active.items.map((n) => <ExprCard key={n.tagId} userId={userId} n={n} songs={hideSongLinks ? [] : (songsByTag[n.tagId] ?? [])} />)}
        </div>
      )}
    </div>
  )
}

/* ═ 表現カード ═ */
function ExprCard({ userId, n, songs }: { userId: string; n: ExprNode; songs: Song[] }) {
  const lit = n.star > 0
  const latest = n.history[n.history.length - 1]
  const jp = n.label.replace(/$/, "")
  const it = (n.label.match(/$/)?.[1] ?? "").toUpperCase()
  const stars = Math.max(0, Math.min(5, n.star))

  const card: React.CSSProperties = {
    flex: "none", width: 168, scrollSnapAlign: "start",
    borderRadius: 15, padding: "14px 14px", boxSizing: "border-box",
    background: lit ? "#eef5ff" : "#fff",
    border: `1px solid ${lit ? "#b9d4f2" : "#e0e9f6"}`,
    ...(lit ? {} : { opacity: 0.82 }),
  }

  return (
    <div style={card}>
      {/* 名前 + NEW */}
      <div style={{ fontSize: 13, fontWeight: 900, lineHeight: 1.3 }}>
        {jp}
        {n.isNew && (
          <span style={{ fontSize: 8, fontWeight: 900, color: "#fff", background: BAD, borderRadius: 999, padding: "1px 6px", marginLeft: 5, verticalAlign: 2 }}>NEW</span>
        )}
      </div>
      {it && <div style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: ".1em", color: SUB, marginTop: 1 }}>{it}</div>}

      {/* 認定★ */}
      <div style={{ fontSize: 21, fontWeight: 900, marginTop: 7, letterSpacing: 1, color: lit ? "#c9820e" : "#b8c6dd" }}>
        {lit
          ? <>{"★".repeat(stars)}<span style={{ color: "#dbe7f6" }}>{"★".repeat(5 - stars)}</span></>
          : "☆☆☆☆☆"}
      </div>

      {/* 状態 / 認定した曲 */}
      <div style={{ fontSize: 10, fontWeight: 800, color: SUB, marginTop: 5, lineHeight: 1.5 }}>
        {lit ? `${latest?.title ?? "曲"}で認定` : "これから出会う表現"}
      </div>

      {/* この表現に挑戦する曲 */}
      {songs.length > 0 && (
        <div style={{ marginTop: 11, borderTop: "1px solid rgba(150,130,90,.18)", paddingTop: 9 }}>
          <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: ".08em", color: "#7f97c4" }}>この表現の曲</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 5 }}>
            {songs.slice(0, 3).map((s) => (
              <Link key={s.id} href={`/${userId}/scores/${s.id}`}
                style={{ fontSize: 10.5, fontWeight: 800, color: ACC, textDecoration: "none", lineHeight: 1.4, display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</span>
                {s.star != null && <span style={{ ...tnum, flex: "none", fontSize: 9, color: SUB }}>★{s.star}</span>}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
