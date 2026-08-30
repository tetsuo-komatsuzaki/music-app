"use client"

// ============================================================
// ギャラリー3棚 (骨組み・2026-08-30)。旧「演奏の軌跡」シートの後継の中身。
// 骨組みでは券面は仮置き (コインのみ実デザイン=Coin部品)。
// 点灯までどの本番画面からも参照しない (ダーク)。改名と差し替えは点灯コミットで。
// 棚: コイン (達成コイン+ゲージ) / カード (クエスト・記念・称号) / 栄誉 (メダル・認定証・証明書)。
// ============================================================

import { useState } from "react"
import Coin from "@/app/components/Coin"
import { QUESTS } from "@/app/_libs/treasureCatalog"

export type GalleryCoin = { scoreId: string; title: string; star: number; mastered: boolean }
export type GalleryTreasure = {
  kind: string // card / medal / cert / title / master_card
  sourceId: string
  catalogNo: number | null
  earnedAt: string
}

const QUEST_TITLE = new Map(QUESTS.map((q) => [q.questId, q.title]))

export default function GalleryShelves({
  coins,
  required,
  treasures,
}: {
  coins: GalleryCoin[]
  required: number
  treasures: GalleryTreasure[]
}) {
  const [tab, setTab] = useState<"coin" | "card" | "honor">("coin")
  const cards = treasures.filter((t) => ["card", "master_card", "title"].includes(t.kind))
  const honors = treasures.filter((t) => ["medal", "cert"].includes(t.kind))
  const remaining = Math.max(0, required - coins.length)

  const tabs = [
    { id: "coin" as const, label: `コイン ${coins.length}` },
    { id: "card" as const, label: `カード ${cards.length}` },
    { id: "honor" as const, label: `栄誉 ${honors.length}` },
  ]

  return (
    <div>
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 13 }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={{
              fontSize: 11, fontWeight: 800, padding: "5px 14px", borderRadius: 999, border: "none", cursor: "pointer",
              background: tab === t.id ? "var(--gold)" : "rgba(150,175,225,.08)",
              color: tab === t.id ? "#241a05" : "var(--text-sub)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "coin" && (
        <div style={{ display: "flex", alignItems: "center", overflowX: "auto", padding: "6px 0 8px" }}>
          {coins.map((c, i) => (
            <span key={c.scoreId} title={c.title} style={{ position: "relative", flex: "none", marginLeft: i ? -14 : 0, zIndex: i, filter: c.mastered ? "drop-shadow(0 0 8px rgba(240,205,124,.8))" : undefined }}>
              <Coin size={56} />
            </span>
          ))}
          {Array.from({ length: remaining }).map((_, i) => (
            <span key={`e${i}`} style={{ flex: "none", marginLeft: coins.length + i > 0 ? -14 : 0, zIndex: coins.length + i, width: 56, height: 56, borderRadius: "50%", background: "rgba(150,175,225,.06)", border: "1.5px dashed rgba(150,175,225,.18)" }} />
          ))}
        </div>
      )}

      {tab === "card" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {cards.length === 0 && <p style={{ gridColumn: "1/-1", fontSize: 11.5, color: "var(--text-sub)", textAlign: "center", margin: "14px 0" }}>クエストをクリアするとカードがならぶよ</p>}
          {cards.map((t) => (
            <div key={`${t.kind}:${t.sourceId}`} style={{
              aspectRatio: "3/4.1", borderRadius: 9, padding: 5, boxSizing: "border-box",
              background: "linear-gradient(180deg,#182a4e,#101c38)",
              border: t.kind === "card" ? "1px solid rgba(160,178,205,.5)" : "1px solid rgba(232,178,60,.55)",
              display: "grid", placeItems: "center", textAlign: "center",
              color: "var(--text-sub)", fontSize: 9, fontWeight: 800, lineHeight: 1.5,
            }}>
              {t.kind === "card" && t.catalogNo != null
                ? <>No.{String(t.catalogNo).padStart(3, "0")}<br />{QUEST_TITLE.get(t.sourceId) ?? ""}</>
                : t.kind === "title" ? <>称号<br />★{t.sourceId}</> : <>記念<br />カード</>}
            </div>
          ))}
        </div>
      )}

      {tab === "honor" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {honors.length === 0 && <p style={{ fontSize: 11.5, color: "var(--text-sub)", textAlign: "center", margin: "14px 0" }}>メダルと証明書はここにならぶよ</p>}
          {honors.map((t) => (
            <div key={`${t.kind}:${t.sourceId}`} style={{
              height: 46, borderRadius: 9, display: "flex", alignItems: "center", gap: 10, padding: "0 13px",
              background: t.kind === "cert" ? "linear-gradient(180deg,#f9f4e8,#ede4ce)" : "var(--card-in, #101c38)",
              border: t.kind === "cert" ? "1px solid #b8912e" : "1px solid rgba(232,178,60,.4)",
              color: t.kind === "cert" ? "#5a3f08" : "var(--text-sub)", fontSize: 11, fontWeight: 800,
            }}>
              {t.kind === "medal" ? `メダル ・ カード${t.sourceId}枚の節目` : `証明書 ・ ${t.sourceId}`}
              <span style={{ marginLeft: "auto", fontSize: 9.5, opacity: 0.7 }}>券面は仮置き</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
