"use client"

// 練習前シート: そのスコアを弾くのに必要な技術タグを表示。未習得は明示 + レッスンへ誘導 (2026-07-18)。
import { useEffect, useState } from "react"
import Link from "next/link"
import { getRequiredSkills, type SkillChip } from "@/app/actions/getRequiredSkills"
import styles from "./prePractice.module.css"

export default function SheetSkills({
  userId, kind, id,
}: {
  userId: string
  kind: "score" | "practice"
  id: string
}) {
  const [skills, setSkills] = useState<SkillChip[] | null>(null)

  useEffect(() => {
    let cancelled = false
    setSkills(null)
    getRequiredSkills(kind, id).then((s) => { if (!cancelled) setSkills(s) }).catch(() => {})
    return () => { cancelled = true }
  }, [kind, id])

  // 取得中も枠だけは出す (画面ガイドのアンカーが消えると、対象なしでマークが
  // 画面中央にフォールバックしてしまうため)。
  if (!skills) {
    return (
      <div className={styles.skillsWrap}>
        <div className={styles.skillsLab}>この曲に必要な技術</div>
        <div className={styles.skillsNone}>確認しています…</div>
      </div>
    )
  }
  // 技術が不要な曲は「不要」と明示 (機能が動作していると分かるように)
  if (skills.length === 0) {
    return (
      <div className={styles.skillsWrap}>
        <div className={styles.skillsLab}>この曲に必要な技術</div>
        <div className={styles.skillsNone}>特別な技術なしで弾けます</div>
      </div>
    )
  }
  const unlearned = skills.filter((s) => !s.acquired).length

  return (
    <div className={styles.skillsWrap}>
      <div className={styles.skillsLab}>
        この曲に必要な技術
        {unlearned > 0 && <span className={styles.skillsWarn}>未習得 {unlearned}</span>}
      </div>
      <div className={styles.skillsChips}>
        {skills.map((s, i) => {
          const cls = `${styles.skillChip} ${s.acquired ? "" : styles.skillUnlearned}`
          const inner = (
            <>
              {!s.acquired && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 8v5M12 16.5v.5" /><circle cx="12" cy="12" r="9" /></svg>
              )}
              <span>{s.label}</span>
              {!s.acquired && <span className={styles.skillBadge}>未習得</span>}
            </>
          )
          return s.lessonId ? (
            <Link key={i} href={`/${userId}/lessons/${s.lessonId}`} className={cls}>{inner}</Link>
          ) : (
            <span key={i} className={cls}>{inner}</span>
          )
        })}
      </div>
    </div>
  )
}
