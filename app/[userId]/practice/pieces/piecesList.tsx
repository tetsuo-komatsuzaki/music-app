"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import styles from "../practice.module.css"
import { SONG_GENRES } from "@/app/_libs/songGenre"
import PrePracticeSheet, { type SheetVariant } from "./PrePracticeSheet"
import OnboardingTrigger from "../../_onboarding/OnboardingTrigger"

type PieceVariant = SheetVariant & { badge: "mastered" | "achieved" | null }

export type Piece = {
  /** グループID (カード key) */
  groupId: string
  title: string
  composer: string | null
  /** 代表☆ (変種の最小 star) */
  star: number | null
  /** 代表バッジ (変種の最上位) */
  badge?: "mastered" | "achieved" | null
  /** 代表ベスト (変種の最大) */
  bestScore?: number | null
  coverImagePath?: string | null
  genre?: string | null
  /** 配下の変種 (難易度別)。練習前シートで選択 */
  variants: PieceVariant[]
}

// カバー: coverImagePath があれば写真、無ければ 曲=ブルー系のプレースホルダ。右上は 👑/✓ バッジ。
function Cover({ badge, cover }: { badge?: "mastered" | "achieved" | null; cover?: string | null }) {
  return (
    <div className={styles.matCover}>
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" loading="lazy" />
      ) : (
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round">
          <path d="M9 18V6l9-2v12" />
          <circle cx="6.5" cy="18" r="2.5" />
          <circle cx="15.5" cy="16" r="2.5" />
        </svg>
      )}
      {badge === "mastered" && <span className={styles.matCrown} aria-label="マスター">👑</span>}
      {badge === "achieved" && (
        <span className={styles.matCrown} aria-label="達成">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
        </span>
      )}
    </div>
  )
}

// ☆タブ内をジャンル別レールに区分 (順序=SONG_GENRES、未分類は「その他」末尾)
function groupByGenre(pieces: Piece[]): { label: string; pieces: Piece[] }[] {
  const map = new Map<string, Piece[]>()
  for (const p of pieces) {
    const g = p.genre ?? "__none"
    if (!map.has(g)) map.set(g, [])
    map.get(g)!.push(p)
  }
  const groups: { label: string; pieces: Piece[] }[] = []
  for (const g of SONG_GENRES) if (map.has(g.id)) groups.push({ label: g.label, pieces: map.get(g.id)! })
  if (map.has("__none")) groups.push({ label: "その他", pieces: map.get("__none")! })
  return groups
}

export default function PiecesList({
  userId,
  pieces,
}: {
  userId: string
  pieces: Piece[]
}) {
  const router = useRouter()
  const [sheet, setSheet] = useState<Piece | null>(null)

  const tabs = Array.from(
    new Set(pieces.map(p => p.star).filter((s): s is number => s != null)),
  ).sort((a, b) => a - b)
  const [active, setActive] = useState<number | null>(tabs.length ? tabs[0] : null)

  const filtered = pieces
    .filter(p => p.star === active)
    .sort((a, b) => a.title.localeCompare(b.title, "ja"))
  const genreGroups = groupByGenre(filtered)

  // 常にシートを開き、難易度・パートのフルラダーを見せる (2026-07-18)。
  // 変種の無い曲(旧データ)のみ直接遷移のフォールバック。
  const handleTap = (p: Piece) => {
    if (p.variants.length > 0) setSheet(p)
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>練習曲</h1>

      {tabs.length === 0 ? (
        <p className={styles.cardContextEmpty}>公開されている練習曲はまだありません。</p>
      ) : (
        <>
          <div className={styles.starTabs} data-onboarding="pieces.starTabs">
            {tabs.map(t => (
              <button
                key={t}
                type="button"
                className={`${styles.starTab} ${active === t ? styles.starTabActive : ""}`}
                onClick={() => setActive(t)}
              >
                ☆{t}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className={styles.cardContextEmpty}>この難易度の練習曲はありません。</p>
          ) : (
            genreGroups.map((grp, idx) => (
              <section key={grp.label || idx} className={styles.railSection}>
                <h3 className={styles.railLabel}>{grp.label}</h3>
                <div className={styles.itemRail}>
                  {grp.pieces.map(piece => (
                    <button
                      key={piece.groupId}
                      type="button"
                      className={styles.railCard}
                      onClick={() => handleTap(piece)}
                    >
                      <Cover badge={piece.badge} cover={piece.coverImagePath} />
                      <div className={styles.railCardTitle}>{piece.title}</div>
                      {piece.composer && <div className={styles.railSub}>{piece.composer}</div>}
                      {piece.bestScore != null && (
                        <div className={styles.railBest}>ベスト {piece.bestScore}</div>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            ))
          )}
        </>
      )}

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
    </div>
  )
}
