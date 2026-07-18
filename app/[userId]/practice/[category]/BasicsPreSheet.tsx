"use client"

// 基礎練の練習前シート (Phase C-basics / 2026-07-18更新): 調・奏法を常時フル表示。
// 教材の無い調/奏法はグレー(選択不可)で「準備中」を明示。教材が増えれば自動で有効化。
import { useState } from "react"
import { useRouter } from "next/navigation"
import styles from "../pieces/prePractice.module.css"
import { ARTICULATIONS } from "@/app/_libs/materialVariant"

export type BasicsVariant = {
  id: string
  keyTonic: string
  articulation: string | null
  bestScore: number | null
}
export type BasicsFamily = {
  title: string
  coverImagePath: string | null
  variants: BasicsVariant[]
}

// 調ラダー (長調12調・指導順)。族に無い調はグレー表示。
const KEY_ORDER = ["C", "G", "D", "A", "E", "B", "F#", "Db", "Ab", "Eb", "Bb", "F"]
const TONIC_JA: Record<string, string> = {
  C: "ハ", G: "ト", D: "ニ", A: "イ", E: "ホ", B: "ロ", "F#": "嬰ヘ",
  Db: "変ニ", Ab: "変イ", Eb: "変ホ", Bb: "変ロ", F: "ヘ",
}
const keyJa = (k: string) => `${TONIC_JA[k] ?? k}長調`
// 奏法ラダー: 基本(=既存/レガート相当) + 各奏法
const ART_LADDER = [{ id: "basic", label: "基本" }, ...ARTICULATIONS]

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
  const availKeys = new Set(family.variants.map((v) => v.keyTonic))
  const availArts = new Set(family.variants.map((v) => v.articulation ?? "basic"))
  const firstKey = KEY_ORDER.find((k) => availKeys.has(k)) ?? [...availKeys][0] ?? ""
  const [selKey, setSelKey] = useState(firstKey)
  const [selArt, setSelArt] = useState("basic")

  const variant = family.variants.find(
    (v) => v.keyTonic === selKey && (v.articulation ?? "basic") === selArt,
  ) ?? family.variants.find((v) => v.keyTonic === selKey)

  const start = () => { if (variant) router.push(`/${userId}/practice/${category}/${variant.id}`) }

  // 調ラダー: 族の調 + 未整備の長調をグレーで
  const keyRows = [...KEY_ORDER, ...[...availKeys].filter((k) => !KEY_ORDER.includes(k))]

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
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round">{coverGlyph(category)}</svg>
            )}
          </div>
          <div className={styles.info}>
            <div className={styles.title}>{family.title}</div>
            <div className={styles.composer}>調・奏法を選んで練習</div>
          </div>
        </div>

        {/* 調: 12調を常時表示。族に無い調はグレー */}
        <div className={styles.slab}>調を選ぶ</div>
        <div className={styles.difs}>
          {keyRows.map((k) => {
            const v = family.variants.find((x) => x.keyTonic === k)
            const avail = availKeys.has(k)
            return (
              <button
                key={k}
                type="button"
                disabled={!avail}
                className={`${styles.dif} ${selKey === k ? styles.difOn : ""} ${!avail ? styles.difDisabled : ""}`}
                onClick={() => { if (avail) setSelKey(k) }}
              >
                <span className={styles.difName}>{keyJa(k)}</span>
                {avail
                  ? (v?.bestScore != null && <span className={styles.difBest}>ベスト {v.bestScore}</span>)
                  : <span className={styles.soon}>準備中</span>}
                {avail && <span className={styles.radio} data-on={selKey === k} />}
              </button>
            )
          })}
        </div>

        {/* 奏法バリエーション: 基本 + 各奏法。未整備はグレー */}
        <div className={styles.slab}>奏法バリエーション</div>
        <div className={styles.difs}>
          {ART_LADDER.map((a) => {
            const avail = availArts.has(a.id)
            return (
              <button
                key={a.id}
                type="button"
                disabled={!avail}
                className={`${styles.dif} ${selArt === a.id ? styles.difOn : ""} ${!avail ? styles.difDisabled : ""}`}
                onClick={() => { if (avail) setSelArt(a.id) }}
              >
                <span className={styles.difName}>{a.label}</span>
                {avail ? <span className={styles.radio} data-on={selArt === a.id} /> : <span className={styles.soon}>準備中</span>}
              </button>
            )
          })}
        </div>

        <button className={styles.cta} onClick={start}>練習をはじめる</button>
      </div>
    </div>
  )
}
