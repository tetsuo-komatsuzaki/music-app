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
  master: { recentAvg: number | null; threshold: number; scoredCount: number; requiredCount: number }
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

  // 条件チップ (点数以外の達成条件。案2: ゲージ+チップ構成 2026-08-02)
  const chips: { done: boolean; label: string }[] = []
  if (ach) {
    chips.push({ done: ach.cleanRuns.count >= ach.cleanRuns.required, label: `通し ${ach.cleanRuns.count}/${ach.cleanRuns.required}` })
    if (ach.etude.required) chips.push({ done: !!ach.etude.achieved, label: ach.etude.achieved ? "エチュード ✓" : "エチュード 未" })
    if (ach.lessons.total > 0) chips.push({ done: ach.lessons.cleared >= ach.lessons.total, label: `レッスン ${ach.lessons.cleared}/${ach.lessons.total}` })
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

        {/* 🏆 マスターまで (案2: 点数ゲージ+90点ライン+条件チップ・2026-08-02確定) */}
        <div className={styles.sec}>
          <div className={styles.secH}>🏆 マスターまで</div>
          {!ach ? (
            <div className={styles.muted}>集計中…</div>
          ) : ach.mastered ? (
            <div style={{ textAlign: "center", fontSize: 13, fontWeight: 800, color: "#2e8b57", padding: "6px 0" }}>
              🏆 この曲はマスター済み！{avg != null ? ` いまの平均 ${avg}点` : ""}
            </div>
          ) : (
            <div>
              <style>{`@keyframes aroHop { 0%,100%{ transform:translate(-50%,0) } 50%{ transform:translate(-50%,-4px) } }`}</style>
              {avg != null ? (
                <>
                  {/* ゲージ: 直近5回平均 vs 90点ライン */}
                  <div style={{ position: "relative", height: 14, borderRadius: 7, background: "#eef0f4", margin: "26px 4px 6px" }}>
                    <span style={{ position: "absolute", inset: "0 auto 0 0", width: `${Math.min(avg, 100)}%`, borderRadius: 7, background: "linear-gradient(90deg,#7a8ce0,#5b6b9e)" }} />
                    <span style={{ position: "absolute", top: -7, bottom: -7, left: "90%", width: 3, borderRadius: 2, background: "#c9a227" }}>
                      <span style={{ position: "absolute", top: -19, right: -4, fontSize: 9, fontWeight: 800, color: "#c9a227", whiteSpace: "nowrap" }}>90点=マスターライン</span>
                    </span>
                    <span style={{ position: "absolute", top: -24, left: `${Math.min(avg, 100)}%`, transform: "translateX(-50%)", fontSize: 10, fontWeight: 900, color: "#5b6b9e", whiteSpace: "nowrap", animation: "aroHop 1.2s ease-in-out infinite" }}>
                      きみ {avg}点
                      <span style={{ display: "block", textAlign: "center", fontSize: 8 }}>▼</span>
                    </span>
                  </div>
                  <div style={{ textAlign: "center", fontSize: 13, fontWeight: 900, marginTop: 10 }}>
                    {avg >= 90
                      ? <>90点ラインを超えてるよ！🎉</>
                      : <>あと <b style={{ color: "#d64541", fontSize: 16 }}>{Math.max(1, Math.ceil(90 - avg))}点</b> で90点ライン！</>}
                  </div>
                  {ach.master.scoredCount < ach.master.requiredCount && (
                    <div style={{ textAlign: "center", fontSize: 10, color: "#9aa6b3", marginTop: 3 }}>
                      ※ 直近{ach.master.requiredCount}回の平均で判定（いま{ach.master.scoredCount}回）
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.muted}>採点済みの演奏がたまると、90点ラインまでの距離が出るよ</div>
              )}
              {chips.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 9, justifyContent: "center" }}>
                  {chips.map((c) => (
                    <span key={c.label} style={{ fontSize: 10, fontWeight: 800, borderRadius: 999, padding: "3px 9px", border: `1px solid ${c.done ? "#cfe6d8" : "#eef1f4"}`, color: c.done ? "#2e8b57" : "#8a9099", background: c.done ? "#f2faf5" : "transparent" }}>
                      {c.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
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
                  <Link key={s.subtaskName} href={`/${userId}/practice/${m.category}/${m.id}?from=${scoreId}`} className={styles.rec} onClick={onClose}>
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
