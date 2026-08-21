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
        <select
          className={styles.sheetSelect}
          value={diff}
          onChange={(e) => { setDiff(e.target.value as (typeof DIFFICULTIES)[number]["id"]); setRangeIdx(-1) }}
        >
          {DIFFICULTIES.map((d) => {
            const v = byDiff.get(d.id)
            const suffix = v
              ? `${v.star != null ? ` ・ ☆${v.star}` : ""}${v.bestScore != null ? ` ・ ベスト ${v.bestScore}` : ""}`
              : " ・ 準備中"
            return (
              <option key={d.id} value={d.id} disabled={!v}>
                {d.label}{suffix}
              </option>
            )
          })}
        </select>

        {/* パート: 全部演奏する(現行スコア) + 分割は教材が入れば有効 */}
        <div className={styles.slab}>パートを選ぶ</div>
        <select
          className={styles.sheetSelect}
          value={rangeIdx}
          onChange={(e) => setRangeIdx(Number(e.target.value))}
          disabled={sections.length === 0}
        >
          <option value={-1}>全部演奏する</option>
          {sections.length > 0 ? (
            sections.map((s, i) => (
              <option key={i} value={i}>
                {s.name} ・ {s.startMeasure}〜{s.endMeasure}小節
              </option>
            ))
          ) : (
            <option disabled value="soon">パート別に練習 ・ 準備中</option>
          )}
        </select>

        </div>

        <button className={styles.cta} onClick={start} data-onboarding="prePractice.start">練習をはじめる</button>

        {/* シート自体が開いたときに出るガイド (z-index: シート1000 < マーク1901) */}
        <OnboardingTrigger pageKey="prePractice" />
      </div>
    </div>
  )
}
