"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { ArcoChan, POSES } from "./ArcoChan"
import styles from "./ArcoResultOverlay.module.css"

type Ach = {
  lessons: { total: number; cleared: number }
  etude: { required: boolean; achieved?: boolean }
  cleanRuns: { count: number; required: number }
  master: { recentAvg: number | null; threshold: number }
  achieved: boolean
  mastered: boolean
}
type Diag = {
  verdict: "perfect" | "no_specific" | "weakness" | "unavailable"
  slots: { subtaskName: string; tree: "pitch" | "rhythm"; materials: { id: string; title: string; category: string }[]; noStock: boolean }[]
}

// 点数帯でアルコのポーズ(気分)を選ぶ
function pickPose(score: number) {
  let cats: string[]
  if (score >= 90) cats = ["称賛", "喜び"]
  else if (score >= 75) cats = ["励まし", "喜び"]
  else if (score >= 60) cats = ["励まし", "見守り"]
  else cats = ["見守り", "しょんぼり"]
  const pool = (POSES as { cat: string }[]).filter((p) => cats.includes(p.cat))
  return pool[score % pool.length] ?? POSES[0]
}

function headline(score: number, mastered: boolean): string {
  if (mastered) return "この曲、マスター達成〜！🎉"
  if (score >= 90) return "すごい！演奏マスター級だね✨"
  if (score >= 75) return "いい演奏！あと少しで完璧🎵"
  if (score >= 60) return "その調子！ここを直すともっと良くなるよ"
  return "だいじょうぶ、いっしょに練習していこう"
}

function rankOf(score: number): string {
  return score >= 90 ? "S" : score >= 75 ? "A" : score >= 60 ? "B" : "C"
}

export default function ArcoResultOverlay({
  scoreId, userId, perf, onClose, onGoReview,
}: {
  scoreId: string
  userId: string
  perf: { id: string; pitchAccuracy: number | null; timingAccuracy: number | null }
  onClose: () => void
  onGoReview?: () => void
}) {
  const [mounted, setMounted] = useState(false)
  const [ach, setAch] = useState<Ach | null>(null)
  const [diag, setDiag] = useState<Diag | null>(null)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    let aborted = false
    Promise.all([
      fetch(`/api/scores/${scoreId}/achievement-status`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(`/api/performances/${perf.id}/diagnosis`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([a, d]) => { if (!aborted) { setAch(a); setDiag(d) } })
    return () => { aborted = true }
  }, [scoreId, perf.id])

  const pitch = perf.pitchAccuracy ?? 0
  const timing = perf.timingAccuracy ?? 0
  const overall = Math.round((pitch + timing) / 2)
  const pose = pickPose(overall)
  const avg = ach?.master?.recentAvg != null ? Math.round(ach.master.recentAvg) : null

  // 課題の評価行
  const taskRows: { done: boolean; label: string; note: string }[] = []
  if (ach) {
    taskRows.push({ done: avg != null && avg >= 90, label: "演奏マスター", note: avg != null ? (avg >= 90 ? "達成" : `あと ${90 - avg}点`) : "—" })
    taskRows.push({ done: ach.cleanRuns.count >= ach.cleanRuns.required, label: "通しで演奏成功", note: `${ach.cleanRuns.count}/${ach.cleanRuns.required}` })
    if (ach.etude.required) taskRows.push({ done: !!ach.etude.achieved, label: "エチュード", note: ach.etude.achieved ? "済" : "未" })
    if (ach.lessons.total > 0) taskRows.push({ done: ach.lessons.cleared >= ach.lessons.total, label: "学びレッスン", note: `${ach.lessons.cleared}/${ach.lessons.total}` })
  }

  // おすすめ練習 (診断 窓①)
  const recSlots = (diag?.verdict === "weakness" ? diag.slots : []).filter((s) => !s.noStock && s.materials.length > 0).slice(0, 2)

  if (!mounted) return null

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.close} aria-label="閉じる" onClick={onClose}>✕</button>

        {/* アルコ + 見出し */}
        <div className={styles.hero}>
          <div className={styles.arco}><ArcoChan pose={pose} /></div>
          <div className={styles.bubble}>{headline(overall, !!ach?.mastered)}</div>
        </div>

        {/* 採点結果 */}
        <div className={styles.scoreCard}>
          <div className={styles.big}><span className={styles.bigNum}>{overall}</span><span className={styles.bigUnit}>点</span><span className={`${styles.rank} ${styles["r" + rankOf(overall)]}`}>{rankOf(overall)}</span></div>
          <div className={styles.subs}>
            <div className={styles.sub}><span>音程</span><b>{Math.round(pitch)}</b></div>
            <div className={styles.sub}><span>リズム</span><b>{Math.round(timing)}</b></div>
          </div>
        </div>

        {/* 課題の評価 */}
        <div className={styles.sec}>
          <div className={styles.secH}>課題の評価</div>
          {ach ? (
            <div className={styles.tasks}>
              {taskRows.map((t) => (
                <div key={t.label} className={`${styles.task} ${t.done ? styles.taskDone : ""}`}>
                  <span className={styles.tk}>{t.done ? "✓" : ""}</span>
                  <span className={styles.tl}>{t.label}</span>
                  <span className={styles.tn}>{t.note}</span>
                </div>
              ))}
            </div>
          ) : <div className={styles.muted}>集計中…</div>}
        </div>

        {/* おすすめ練習 */}
        <div className={styles.sec}>
          <div className={styles.secH}>おすすめ練習</div>
          {diag == null ? (
            <div className={styles.muted}>診断中…</div>
          ) : recSlots.length === 0 ? (
            <div className={styles.muted}>
              {diag.verdict === "perfect" ? "完璧！大きな弱点はなし🎉"
                : diag.verdict === "no_specific" ? "大きな弱点はなし。この調子！"
                : diag.verdict === "unavailable" ? "この演奏は診断対象外でした"
                : "今回のおすすめ教材は準備中です"}
            </div>
          ) : (
            <div className={styles.recs}>
              {recSlots.map((s) => {
                const m = s.materials[0]
                return (
                  <Link key={s.subtaskName} href={`/${userId}/practice/${m.category}/${m.id}`} className={styles.rec} onClick={onClose}>
                    <span className={`${styles.recTag} ${s.tree === "pitch" ? styles.tagPitch : styles.tagRhythm}`}>{s.tree === "pitch" ? "音程" : "リズム"}</span>
                    <span className={styles.recBody}><span className={styles.recSub}>{s.subtaskName}</span><span className={styles.recMat}>{m.title}</span></span>
                    <span className={styles.recGo}>→</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          {onGoReview && <button type="button" className={styles.ghost} onClick={onGoReview}>ふりかえりで詳しく</button>}
          <button type="button" className={styles.primary} onClick={onClose}>とじる</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
