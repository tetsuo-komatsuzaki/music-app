"use client"

// 基礎練の練習前シート (Phase C-basics): 族カードをタップ→調(と奏法)を選んでから教材へ。
// 音階/アルペジオの族(調違いの束)で使う。お手本再生・譜面プレビューは次段。
import { useState } from "react"
import { useRouter } from "next/navigation"
import styles from "../pieces/prePractice.module.css"
import { articulationLabel } from "@/app/_libs/materialVariant"

export type BasicsVariant = {
  id: string
  keyLabel: string
  articulation: string | null
  bestScore: number | null
}
export type BasicsFamily = {
  title: string
  coverImagePath: string | null
  variants: BasicsVariant[]
}

function coverGlyph(category: string) {
  if (category === "arpeggio" || category === "arpeggios") {
    return <><circle cx="6" cy="17" r="2.3" /><circle cx="18" cy="13" r="2.3" /><path d="M8.3 16.3 15.8 13M8 15V8l10-2.4V11" /></>
  }
  return <><path d="M4 15c3 0 3-8 6-8s3 8 6 8" /><path d="M4 19h16" /></>
}

export default function BasicsPreSheet({
  userId, category, family, onClose,
}: {
  userId: string
  category: string
  family: BasicsFamily
  onClose: () => void
}) {
  const router = useRouter()
  const [variantId, setVariantId] = useState(family.variants[0]?.id ?? "")
  const start = () => { if (variantId) router.push(`/${userId}/practice/${category}/${variantId}`) }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.grab} />
        <button className={styles.close} onClick={onClose} aria-label="閉じる">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>

        <div className={styles.hero}>
          <div className={styles.cover} style={{ background: "linear-gradient(150deg,#137d76,#3fb9a6)" }}>
            {family.coverImagePath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={family.coverImagePath} alt="" />
            ) : (
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round">
                {coverGlyph(category)}
              </svg>
            )}
          </div>
          <div className={styles.info}>
            <div className={styles.title}>{family.title}</div>
            <div className={styles.composer}>調を選んで練習</div>
          </div>
        </div>

        <div className={styles.slab}>調を選ぶ</div>
        <div className={styles.difs}>
          {family.variants.map((v) => (
            <button
              key={v.id}
              className={`${styles.dif} ${variantId === v.id ? styles.difOn : ""}`}
              onClick={() => setVariantId(v.id)}
            >
              <span className={styles.difName}>
                {v.keyLabel}
                {v.articulation && <small>{articulationLabel(v.articulation)}</small>}
              </span>
              {v.bestScore != null && <span className={styles.difBest}>ベスト {v.bestScore}</span>}
              <span className={styles.radio} data-on={variantId === v.id} />
            </button>
          ))}
        </div>

        <button className={styles.cta} onClick={start}>練習をはじめる</button>
      </div>
    </div>
  )
}
