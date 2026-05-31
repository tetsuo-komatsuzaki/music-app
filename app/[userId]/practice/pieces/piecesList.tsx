"use client"

import Link from "next/link"
import { useState } from "react"
import styles from "../practice.module.css"

export type Piece = {
  id: string
  title: string
  composer: string | null
  star: number | null
}

export default function PiecesList({
  userId,
  pieces,
}: {
  userId: string
  pieces: Piece[]
}) {
  // ☆順ソート (デフォルト: 低い順)。クリックで昇順/降順を切り替え。
  const [desc, setDesc] = useState(false)
  const sorted = [...pieces].sort((a, b) => {
    // star 未設定は常に末尾
    const sa = a.star ?? (desc ? -Infinity : Infinity)
    const sb = b.star ?? (desc ? -Infinity : Infinity)
    if (sa !== sb) return desc ? sb - sa : sa - sb
    return a.title.localeCompare(b.title, "ja")
  })

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>練習曲</h1>

      <div className={styles.sortRow}>
        <button
          type="button"
          className={styles.sortToggle}
          onClick={() => setDesc(d => !d)}
          aria-label="難易度でソート"
        >
          ☆ {desc ? "高い順" : "低い順"}（クリックで切替）
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className={styles.cardContextEmpty}>
          公開されている練習曲はまだありません。
        </p>
      ) : (
        <div className={styles.cardContextList}>
          {sorted.map(piece => (
            <Link
              key={piece.id}
              href={`/${userId}/scores/${piece.id}`}
              className={styles.cardContextItem}
            >
              <div className={styles.cardContextItemTitle}>
                {piece.title}
                {piece.star != null && ` ☆${piece.star}`}
              </div>
              {piece.composer && (
                <div className={styles.cardContextItemComposer}>
                  {piece.composer}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
