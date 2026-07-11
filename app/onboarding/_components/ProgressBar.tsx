"use client"

// ProgressBar (C1) — 固定7セグメント制【確定 2026-07-11】
// Q2 / ラダー / Q3 / Q4 / Q5 / Q6 / ゴール = 各 1/7。
// ラダーは何画面通過しても「ラダー」1セグメント内で按分(0..1)。
// これによりバーが戻る・進まないの違和感を排除する (v0.4 §A)。

import styles from "../onboarding.module.css"

export const PROGRESS_SEGMENTS = [
  "Q2",
  "ladder",
  "Q3",
  "Q4",
  "Q5",
  "Q6",
  "goal",
] as const

export type ProgressSegKey = (typeof PROGRESS_SEGMENTS)[number]
export type ProgressState = Record<ProgressSegKey, number> // 各 0..1

export const EMPTY_PROGRESS: ProgressState = {
  Q2: 0, ladder: 0, Q3: 0, Q4: 0, Q5: 0, Q6: 0, goal: 0,
}

export function progressRatio(seg: ProgressState): number {
  return (
    PROGRESS_SEGMENTS.reduce((a, k) => a + Math.min(1, Math.max(0, seg[k])), 0) /
    PROGRESS_SEGMENTS.length
  )
}

export default function ProgressBar({ seg }: { seg: ProgressState }) {
  const pct = progressRatio(seg) * 100
  return (
    <div className={styles.pbar}>
      <div className={styles.pfill} style={{ width: `${pct}%` }} />
    </div>
  )
}
