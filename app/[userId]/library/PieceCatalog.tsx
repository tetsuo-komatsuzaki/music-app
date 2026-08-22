"use client"

// ライブラリ曲タブの本体 — 補12/補13 (build-gap5.py) のジャンル別ジャケットレールを
// 曲タブに統合 (2026-08-21 Tetsuo指示: 曲をさがすの別ページ廃止)。
// カード = 132px ・ サムネ58px角丸11 (ジャケット写真 or 紺グラデ♪) + 題12px + ★10px。
// タップで練習前シート (難易度・パートのフルラダー)。
import { useState } from "react"
import { Crown } from "lucide-react"
import ds from "@/app/components/ds.module.css"
import { SONG_GENRES } from "@/app/_libs/songGenre"
import StaggerRail from "@/app/components/StaggerRail"
import PrePracticeSheet from "../practice/pieces/PrePracticeSheet"
import OnboardingTrigger from "../_onboarding/OnboardingTrigger"
import type { CatalogPiece } from "./loadPieceCatalog"


// サムネ (原本: 100%×58 ・ 角丸11 ・ 紺グラデ ・ ♪19px #7FA4E8)。ジャケット写真があれば写真。
// 右上の 👑/✓ は判定バッジ (情報量維持で残置)
function Cover({ badge, cover }: { badge?: "mastered" | "achieved" | null; cover?: string | null }) {
  return (
    <div style={{ position: "relative", width: "100%", height: 58, borderRadius: 11, overflow: "hidden", display: "grid", placeItems: "center", background: "linear-gradient(150deg,#2A3F6B,#1B2B4C)", color: "#7fa4e8", fontSize: 19 }}>
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" loading="lazy" draggable={false} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span aria-hidden>♪</span>
      )}
      {badge === "mastered" && (
        <span style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", display: "grid", placeItems: "center", background: "rgba(10,17,34,.55)" }} aria-label="マスター">
          <Crown size={12} color="var(--gold)" fill="var(--gold)" />
        </span>
      )}
      {badge === "achieved" && (
        <span style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", display: "grid", placeItems: "center", background: "rgba(10,17,34,.55)" }} aria-label="達成">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
        </span>
      )}
    </div>
  )
}

// ジャンル別に区分 (順序=SONG_GENRES、未分類は「その他」末尾)
function groupByGenre(pieces: CatalogPiece[]): { label: string; pieces: CatalogPiece[] }[] {
  const map = new Map<string, CatalogPiece[]>()
  for (const p of pieces) {
    const g = p.genre ?? "__none"
    if (!map.has(g)) map.set(g, [])
    map.get(g)!.push(p)
  }
  const groups: { label: string; pieces: CatalogPiece[] }[] = []
  for (const g of SONG_GENRES) if (map.has(g.id)) groups.push({ label: g.label, pieces: map.get(g.id)! })
  if (map.has("__none")) groups.push({ label: "その他", pieces: map.get("__none")! })
  return groups
}

export default function PieceCatalog({ userId, pieces }: { userId: string; pieces: CatalogPiece[] }) {
  const [sheet, setSheet] = useState<CatalogPiece | null>(null)
  const genreGroups = groupByGenre([...pieces].sort((a, b) => a.title.localeCompare(b.title, "ja")))

  const handleTap = (p: CatalogPiece) => {
    if (p.variants.length > 0) setSheet(p)
  }

  return (
    <>
      {genreGroups.map((grp, idx) => (
        <section key={grp.label || idx} style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 11, fontWeight: 900, color: "var(--text-sub)", letterSpacing: ".06em", margin: "0 2px 9px" }}>{grp.label}</h3>
          <StaggerRail onboarding={idx === 0 ? "pieces.rail" : undefined}>
            {grp.pieces.map(piece => (
              <button
                key={piece.groupId}
                type="button"
                draggable={false}
                onClick={() => handleTap(piece)}
                className={ds.card}
                style={{ margin: 0, flex: "none", width: 132, padding: "11px 12px", textAlign: "left", cursor: "pointer", font: "inherit", color: "inherit" }}
              >
                <Cover badge={piece.badge} cover={piece.coverImagePath} />
                <b style={{ fontSize: 12, display: "block", marginTop: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--text-ink)" }}>{piece.title}</b>
                {piece.star != null && (
                  <div style={{ marginTop: 3 }}>
                    <span className={ds.stars} style={{ fontSize: 10, letterSpacing: "1px" }} aria-label={`★${piece.star}`}>
                      {"★".repeat(Math.min(piece.star, 5))}
                      <s>{"★".repeat(Math.max(0, 5 - piece.star))}</s>
                    </span>
                  </div>
                )}
                {(piece.composer || piece.bestScore != null) && (
                  <div style={{ fontSize: 10, color: "var(--text-sub)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {piece.composer ?? ""}
                    {piece.composer && piece.bestScore != null ? " ・ " : ""}
                    {piece.bestScore != null ? `ベスト ${piece.bestScore}` : ""}
                  </div>
                )}
              </button>
            ))}
          </StaggerRail>
        </section>
      ))}

      <OnboardingTrigger pageKey="pieces" />

      {sheet && (
        <PrePracticeSheet
          userId={userId}
          enablePreview
          group={{
            title: sheet.title,
            composer: sheet.composer,
            genre: sheet.genre ?? null,
            coverImagePath: sheet.coverImagePath ?? null,
            variants: sheet.variants,
          }}
          onClose={() => setSheet(null)}
        />
      )}
    </>
  )
}
