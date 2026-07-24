"use client"

// 練習前シート (Phase C / 2026-07-18更新): 難易度・パートを常時フル表示。
// 教材の無い難易度/パートはグレー(選択不可)で「準備中」を明示。曲が増えれば自動で有効化。
// お手本再生・譜面プレビューは次段 (アセット未整備)。
import { useState } from "react"
import { useRouter } from "next/navigation"
import styles from "./prePractice.module.css"
import { DIFFICULTIES } from "@/app/_libs/materialVariant"
import SheetPreview from "./SheetPreview"
import SheetSkills from "./SheetSkills"
import OnboardingTrigger from "../../_onboarding/OnboardingTrigger"

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

const DIFF_DOT: Record<string, string> = { BEGINNER: "#2e9e6b", INTERMEDIATE: "#e0a02f", ADVANCED: "#e0812f" }

export default function PrePracticeSheet({
  userId, group, onClose, basePath = "/scores", enablePreview = false, previewKind = "score",
}: {
  userId: string
  group: SheetGroup
  onClose: () => void
  /** 遷移先ベース。曲=/scores(既定)、エチュード=/practice/etude */
  basePath?: string
  /** 譜面プレビュー+お手本再生を出す。難易度連動で選択変種を表示 */
  enablePreview?: boolean
  /** プレビュー取得元。曲=score(既定)、エチュード=practice */
  previewKind?: "score" | "practice"
}) {
  const router = useRouter()
  // 難易度 → 変種 (教材の有無)
  const byDiff = new Map<string, SheetVariant>()
  for (const v of group.variants) byDiff.set(v.difficulty ?? "BEGINNER", v)
  const firstAvail = DIFFICULTIES.find((d) => byDiff.has(d.id))?.id ?? "BEGINNER"

  const [diff, setDiff] = useState(firstAvail)
  const variant = byDiff.get(diff)
  const sections = variant?.sections ?? []
  const [rangeIdx, setRangeIdx] = useState(-1) // -1 = 全部演奏する

  const start = () => {
    if (!variant) return
    const q = new URLSearchParams()
    if (rangeIdx >= 0 && sections[rangeIdx]) {
      q.set("from", String(sections[rangeIdx].startMeasure))
      q.set("to", String(sections[rangeIdx].endMeasure))
    }
    const qs = q.toString()
    router.push(`/${userId}${basePath}/${variant.id}${qs ? `?${qs}` : ""}`)
  }

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

        {/* 譜面プレビュー + お手本再生 (選択中の難易度変種で出し分け) */}
        {enablePreview && variant && <SheetPreview key={variant.id} scoreId={variant.id} kind={previewKind} />}

        {/* この曲に必要な技術 (未習得表示) */}
        {variant && (
          <div data-onboarding="prePractice.skills">
            <SheetSkills key={`sk-${variant.id}`} userId={userId} kind={previewKind} id={variant.id} />
          </div>
        )}

        {/* 難易度・パート: 画面ガイドはこの2つをまとめて指す */}
        <div data-onboarding="prePractice.choose">
        <div className={styles.slab}>難易度を選ぶ</div>
        <div className={styles.difs}>
          {DIFFICULTIES.map((d) => {
            const v = byDiff.get(d.id)
            const avail = !!v
            return (
              <button
                key={d.id}
                type="button"
                disabled={!avail}
                className={`${styles.dif} ${diff === d.id ? styles.difOn : ""} ${!avail ? styles.difDisabled : ""}`}
                onClick={() => { if (avail) { setDiff(d.id); setRangeIdx(-1) } }}
              >
                <span className={styles.dot} style={{ background: DIFF_DOT[d.id] }} />
                <span className={styles.difName}>{d.label}</span>
                {avail && v!.star != null && <span className={styles.difStar}>☆{v!.star}</span>}
                {avail
                  ? (v!.bestScore != null && <span className={styles.difBest}>ベスト {v!.bestScore}</span>)
                  : <span className={styles.soon}>準備中</span>}
                {avail && <span className={styles.radio} data-on={diff === d.id} />}
              </button>
            )
          })}
        </div>

        {/* パート: 全部演奏する(現行スコア) + 分割は教材が入れば有効 */}
        <div className={styles.slab}>パートを選ぶ</div>
        <div className={styles.difs}>
          <button
            type="button"
            className={`${styles.dif} ${rangeIdx === -1 ? styles.difOn : ""}`}
            onClick={() => setRangeIdx(-1)}
          >
            <span className={styles.difName}>全部演奏する</span>
            <span className={styles.radio} data-on={rangeIdx === -1} />
          </button>
          {sections.length > 0 ? (
            sections.map((s, i) => (
              <button
                key={i}
                type="button"
                className={`${styles.dif} ${rangeIdx === i ? styles.difOn : ""}`}
                onClick={() => setRangeIdx(i)}
              >
                <span className={styles.difName}>{s.name}<small>{s.startMeasure}〜{s.endMeasure}小節</small></span>
                <span className={styles.radio} data-on={rangeIdx === i} />
              </button>
            ))
          ) : (
            <button type="button" disabled className={`${styles.dif} ${styles.difDisabled}`}>
              <span className={styles.difName}>パート別に練習</span>
              <span className={styles.soon}>準備中</span>
            </button>
          )}
        </div>

        </div>

        <button className={styles.cta} onClick={start} data-onboarding="prePractice.start">練習をはじめる</button>

        {/* シート自体が開いたときに出るガイド (z-index: シート1000 < マーク1901) */}
        <OnboardingTrigger pageKey="prePractice" />
      </div>
    </div>
  )
}
