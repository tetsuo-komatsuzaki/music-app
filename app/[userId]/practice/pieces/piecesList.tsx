"use client"

import Link from "next/link"
import { useState } from "react"
import styles from "../practice.module.css"

export type Piece = {
  id: string
  title: string
  composer: string | null
  star: number | null
  /** C-6b: 達成/マスターの2段バッジ */
  badge?: "mastered" | "achieved" | null
  /** 自己ベストスコア(0-100)。無ければ null */
  bestScore?: number | null
}

// カバー: 曲=ブルー系のプレースホルダ。将来 coverImagePath で写真に差し替え。
// 右上は 👑(マスター) / ✓(達成) のみ (☆は難易度タブで代替)。
function Cover({ badge }: { badge?: "mastered" | "achieved" | null }) {
  return (
    <div className={styles.matCover}>
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round">
        <path d="M9 18V6l9-2v12" />
        <circle cx="6.5" cy="18" r="2.5" />
        <circle cx="15.5" cy="16" r="2.5" />
      </svg>
      {badge === "mastered" && <span className={styles.matCrown} aria-label="マスター">👑</span>}
      {badge === "achieved" && (
        <span className={styles.matCrown} aria-label="達成">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
        </span>
      )}
    </div>
  )
}

export default function PiecesList({
  userId,
  pieces,
}: {
  userId: string
  pieces: Piece[]
}) {
  // 出現する☆を昇順にタブ化 (star 未設定の曲はタブを設けない)。
  const tabs = Array.from(
    new Set(pieces.map(p => p.star).filter((s): s is number => s != null)),
  ).sort((a, b) => a - b)

  const [active, setActive] = useState<number | null>(tabs.length ? tabs[0] : null)

  const filtered = pieces
    .filter(p => p.star === active)
    .sort((a, b) => a.title.localeCompare(b.title, "ja"))

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>練習曲</h1>

      {tabs.length === 0 ? (
        <p className={styles.cardContextEmpty}>
          公開されている練習曲はまだありません。
        </p>
      ) : (
        <>
          {/* ☆ごとの横並びタブ (難易度フィルタ) */}
          <div className={styles.starTabs}>
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
            <div className={styles.matList}>
              {filtered.map(piece => (
                <Link
                  key={piece.id}
                  href={`/${userId}/scores/${piece.id}`}
                  className={styles.matRow}
                >
                  <Cover badge={piece.badge} />
                  <div className={styles.matInfo}>
                    <div className={styles.matTitle}>{piece.title}</div>
                    {piece.composer && (
                      <div className={styles.matComposer}>{piece.composer}</div>
                    )}
                    {/* 練習曲は一言説明なし(①作曲者のみ)。ベストスコアは有る時だけ */}
                    {piece.bestScore != null && (
                      <div className={styles.matBest}>ベスト {piece.bestScore}</div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
