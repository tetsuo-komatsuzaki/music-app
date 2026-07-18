"use client"

// 練習前シート (Phase C): 曲カードをタップ→難易度/練習範囲を選んでから詳細(録音)へ。
// データ駆動: 変種が1つ&sections無しなら呼び出し側が直接遷移するので、ここは「選ぶ余地がある」時のみ開く。
// お手本再生・譜面プレビューはアセット未整備のため次段 (設計: 見本Artifact)。
import { useState } from "react"
import { useRouter } from "next/navigation"
import styles from "./prePractice.module.css"
import { difficultyLabel } from "@/app/_libs/materialVariant"

export type SheetSection = { name: string; startMeasure: number; endMeasure: number }
export type SheetVariant = {
  id: string
  star: number | null
  difficulty: string | null
  sections: SheetSection[]
  bestScore: number | null
}
export type SheetGroup = {
  title: string
  composer: string | null
  genre: string | null
  coverImagePath: string | null
  variants: SheetVariant[]
}

const DIFF_ORDER = ["BEGINNER", "INTERMEDIATE", "ADVANCED"]
const DIFF_DOT: Record<string, string> = { BEGINNER: "#2e9e6b", INTERMEDIATE: "#e0a02f", ADVANCED: "#e0812f" }

export default function PrePracticeSheet({
  userId, group, onClose,
}: {
  userId: string
  group: SheetGroup
  onClose: () => void
}) {
  const router = useRouter()
  // 難易度で並べた変種 (未設定は末尾)
  const variants = [...group.variants].sort(
    (a, b) => (DIFF_ORDER.indexOf(a.difficulty ?? "") + 1 || 99) - (DIFF_ORDER.indexOf(b.difficulty ?? "") + 1 || 99),
  )
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "")
  const variant = variants.find((v) => v.id === variantId) ?? variants[0]
  const sections = variant?.sections ?? []
  const [rangeIdx, setRangeIdx] = useState(-1) // -1 = 全部

  const start = () => {
    if (!variant) return
    const q = new URLSearchParams()
    if (rangeIdx >= 0 && sections[rangeIdx]) {
      q.set("from", String(sections[rangeIdx].startMeasure))
      q.set("to", String(sections[rangeIdx].endMeasure))
    }
    const qs = q.toString()
    router.push(`/${userId}/scores/${variant.id}${qs ? `?${qs}` : ""}`)
  }

  const showDifficulty = variants.length > 1
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.grab} />
        <button className={styles.close} onClick={onClose} aria-label="閉じる">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>

        <div className={styles.hero}>
          <div className={styles.cover}>
            {group.coverImagePath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={group.coverImagePath} alt="" />
            ) : (
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"><path d="M9 18V5l10-2v12" /><circle cx="6.4" cy="18" r="2.6" /><circle cx="16.4" cy="15" r="2.6" /></svg>
            )}
          </div>
          <div className={styles.info}>
            <div className={styles.title}>{group.title}</div>
            {group.composer && <div className={styles.composer}>{group.composer}</div>}
            {variant?.bestScore != null && <div className={styles.best}>ベスト {variant.bestScore}</div>}
          </div>
        </div>

        {showDifficulty && (
          <>
            <div className={styles.slab}>難易度を選ぶ</div>
            <div className={styles.difs}>
              {variants.map((v) => (
                <button
                  key={v.id}
                  className={`${styles.dif} ${variantId === v.id ? styles.difOn : ""}`}
                  onClick={() => { setVariantId(v.id); setRangeIdx(-1) }}
                >
                  <span className={styles.dot} style={{ background: DIFF_DOT[v.difficulty ?? ""] ?? "#b0a9ac" }} />
                  <span className={styles.difName}>{difficultyLabel(v.difficulty) || "標準"}</span>
                  {v.bestScore != null && <span className={styles.difBest}>ベスト {v.bestScore}</span>}
                  <span className={styles.radio} data-on={variantId === v.id} />
                </button>
              ))}
            </div>
          </>
        )}

        {sections.length > 0 && (
          <>
            <div className={styles.slab}>練習範囲を選ぶ</div>
            <div className={styles.difs}>
              <button className={`${styles.dif} ${rangeIdx === -1 ? styles.difOn : ""}`} onClick={() => setRangeIdx(-1)}>
                <span className={styles.difName}>全部弾く</span>
                <span className={styles.radio} data-on={rangeIdx === -1} />
              </button>
              {sections.map((s, i) => (
                <button key={i} className={`${styles.dif} ${rangeIdx === i ? styles.difOn : ""}`} onClick={() => setRangeIdx(i)}>
                  <span className={styles.difName}>{s.name}<small>{s.startMeasure}〜{s.endMeasure}小節</small></span>
                  <span className={styles.radio} data-on={rangeIdx === i} />
                </button>
              ))}
            </div>
          </>
        )}

        <button className={styles.cta} onClick={start}>練習をはじめる</button>
      </div>
    </div>
  )
}
