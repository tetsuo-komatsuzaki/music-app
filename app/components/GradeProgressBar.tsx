// app/components/GradeProgressBar.tsx
//
// v1.6 §1-2 / §2-7 / Phase 4-2 (2026-05-16) —
// masteredSongCountAtCurrentStar / 10 の単一進捗バー + ヒント文。
//
// 仕様書 §2-7 引用:
//   「ユーザーの現在の★が n のとき、★ n の曲を 10 曲習得した瞬間に★(n+1)に昇格」
//
// Q1=a-3 確定: ★10 (Master) 到達後はプログレスバー非表示。代わりに masterReachedAt を表示。

"use client"

import styles from "./GradeProgressBar.module.css"

type Props = {
  /** 現在の★で完全習得した曲数 (0-10) */
  current: number
  /** ★昇格に必要な曲数 (定数 10) */
  target: number
  /** Q5=c: GradeProgressBar 直下に小さく表示するヒント文 */
  hintText?: string
  /** Q1=a-3: ★10 到達後は非表示 (代わりに Master 表示) */
  isMaster?: boolean
  /** Q1=a-2: Master 達成日 (ISO string)。isMaster=true の時に表示 */
  masterReachedAt?: string | null
}

function formatJpDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export default function GradeProgressBar({
  current,
  target,
  hintText,
  isMaster,
  masterReachedAt,
}: Props) {
  // Q1=a-3: Master 到達後はバー非表示 (達成日のみ)
  if (isMaster) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.masterRow}>
          <span className={styles.masterIcon} aria-hidden="true">🏆</span>
          <span className={styles.masterText}>
            {masterReachedAt
              ? `Master 達成: ${formatJpDate(masterReachedAt)}`
              : "Master 達成"}
          </span>
        </div>
        {hintText && <div className={styles.hint}>{hintText}</div>}
      </div>
    )
  }

  if (target <= 0) {
    return null
  }
  const percent = Math.min(100, Math.max(0, (current / target) * 100))
  const remaining = Math.max(0, target - current)

  return (
    <div className={styles.wrapper}>
      <div className={styles.barRow}>
        <div
          className={styles.bar}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemax={target}
          aria-valuemin={0}
          aria-label="★昇格進捗"
        >
          <div className={styles.fill} style={{ width: `${percent}%` }} />
        </div>
        <span className={styles.count}>
          {current}/{target}
        </span>
      </div>
      {remaining > 0 && (
        <div className={styles.remaining}>
          次の★まで残り {remaining} 曲
        </div>
      )}
      {hintText && <div className={styles.hint}>{hintText}</div>}
    </div>
  )
}
