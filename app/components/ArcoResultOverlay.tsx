"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { ArcoChan, POSES } from "./ArcoChan"
import { sendScoringFeedback } from "@/app/actions/scoringFeedback"
import ShareSheet from "./ShareSheet"
import { createListenRequest } from "@/app/actions/listenRequests"
import styles from "./ArcoResultOverlay.module.css"

type Ach = {
  lessons: { total: number; cleared: number; nextLessonId?: string | null }
  etude: { required: boolean; id?: string; title?: string; achieved?: boolean }
  cleanRuns: { count: number; required: number }
  master: { recentAvg: number | null; threshold: number; scoredCount: number; requiredCount: number }
  achieved: boolean
  mastered: boolean
}
type Diag = {
  verdict: "perfect" | "no_specific" | "weakness" | "unavailable"
  slots: { subtaskName: string; tree: "pitch" | "rhythm"; materials: { id: string; title: string; category: string }[]; noStock: boolean }[]
}
type GrowthLine = { label: string; from: number; to: number }

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
  const [shareOpen, setShareOpen] = useState(false)
  const [growth, setGrowth] = useState<GrowthLine | null>(null)
  const [strengthCount, setStrengthCount] = useState(0)
  const [hasTeacher, setHasTeacher] = useState(false)
  const [listenState, setListenState] = useState<"idle" | "sending" | "done" | "error">("idle")
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
      fetch(`/api/performances/${perf.id}/growth-line`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([a, d, g]) => { if (!aborted) { setAch(a); setDiag(d); setGrowth(g?.line ?? null); setStrengthCount(g?.strengthCount ?? 0); setHasTeacher(!!g?.hasTeacher) } })
    return () => { aborted = true }
  }, [scoreId, perf.id])

  const pitch = perf.pitchAccuracy ?? 0
  const timing = perf.timingAccuracy ?? 0
  const overall = Math.round((pitch + timing) / 2)
  const pose = pickPose(overall)
  const avg = ach?.master?.recentAvg != null ? Math.round(ach.master.recentAvg) : null

  // 条件チップ (点数以外の達成条件。案2: ゲージ+チップ構成 2026-08-02)。
  // 未クリアで行き先があるチップはタップでそのまま飛べる (行き止まり解消)
  const chips: { done: boolean; label: string; href?: string | null }[] = []
  if (ach) {
    chips.push({ done: ach.cleanRuns.count >= ach.cleanRuns.required, label: `通し ${ach.cleanRuns.count}/${ach.cleanRuns.required}` })
    if (ach.etude.required) chips.push({
      done: !!ach.etude.achieved,
      label: ach.etude.achieved ? "エチュード ✓" : "エチュード 未",
      href: ach.etude.id ? `/${userId}/practice/etude/${ach.etude.id}?from=${scoreId}` : null,
    })
    if (ach.lessons.total > 0) chips.push({
      done: ach.lessons.cleared >= ach.lessons.total,
      label: `レッスン ${ach.lessons.cleared}/${ach.lessons.total}`,
      href: ach.lessons.nextLessonId ? `/${userId}/lessons/${ach.lessons.nextLessonId}` : `/${userId}/lessons`,
    })
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

        {/* 🌱 成長1行 (案3・編み込み): この演奏で伸びたわざを直近30日比で1つだけ。無い日は出さない */}
        {growth && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            margin: "8px 2px 0", padding: "7px 10px", borderRadius: 10,
            background: "#f2faf5", border: "1px solid #cfe6d8",
            fontSize: 12, fontWeight: 800, color: "#2e8b57",
          }}>
            🌱 {growth.label}が伸びてる！ 安定度 {growth.from}%
            <span style={{ fontSize: 11, color: "#7aa98c" }}>→</span>
            <b style={{ fontSize: 14 }}>{growth.to}%</b>
            <Link href={`/${userId}/progress`} onClick={onClose}
              style={{ marginLeft: 4, fontSize: 10, fontWeight: 800, color: "#4a5bd0", textDecoration: "underline" }}>
              カルテで見る
            </Link>
          </div>
        )}

        {/* 💪 先生の強みリンク (案5・2026-08-03): 入口だけ置き、詳細はカルテの表現セクションへ */}
        {strengthCount > 0 && (
          <div style={{ margin: "6px 4px 0", fontSize: 11.5, fontWeight: 800 }}>
            <Link href={`/${userId}/progress`} onClick={onClose} style={{ color: "#4a5bd0", textDecoration: "underline" }}>
              🎨 先生が認定したきみの表現（{strengthCount}個）を見る →
            </Link>
          </div>
        )}

        {/* 🏆 マスターまで (案2: 点数ゲージ+90点ライン+条件チップ・2026-08-02確定) */}
        <div className={styles.sec}>
          <div className={styles.secH}>🏆 マスターまで</div>
          {!ach ? (
            <div className={styles.muted}>集計してるよ…</div>
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
                    !c.done && c.href ? (
                      <Link key={c.label} href={c.href} onClick={onClose}
                        style={{ fontSize: 10, fontWeight: 800, borderRadius: 999, padding: "3px 9px", border: "1px solid #d7dcf6", color: "#4a5bd0", background: "#eef0fc", textDecoration: "none" }}>
                        {c.label} →
                      </Link>
                    ) : (
                      <span key={c.label} style={{ fontSize: 10, fontWeight: 800, borderRadius: 999, padding: "3px 9px", border: `1px solid ${c.done ? "#cfe6d8" : "#eef1f4"}`, color: c.done ? "#2e8b57" : "#8a9099", background: c.done ? "#f2faf5" : "transparent" }}>
                        {c.label}
                      </span>
                    )
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
            <div className={styles.muted}>見ているよ…</div>
          ) : recSlots.length === 0 ? (
            <div className={styles.muted}>
              {diag.verdict === "perfect" ? "完璧！大きな弱点はなし🎉"
                : diag.verdict === "no_specific" ? "大きな弱点はなし。この調子！"
                : diag.verdict === "unavailable" ? "今回は見きれなかったよ"
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

        {/* 採点の正直な注記 + その場フィードバック (2026-08-03) */}
        <ScoringFeedbackNote performanceId={perf.id} kind="score" />

        <div className={styles.actions}>
          {onGoReview && <button type="button" className={styles.ghost} onClick={onGoReview}>ふりかえりで詳しく</button>}
          <button type="button" className={styles.ghost} onClick={() => setShareOpen(true)}>📤 シェア</button>
          {/* 👂 先生に聴いてもらう (2026-08-06 案1簡素版): ワンタップ送信・シート無し */}
          {hasTeacher && (
            <button type="button" className={styles.ghost} disabled={listenState === "sending" || listenState === "done"}
              onClick={async () => {
                setListenState("sending")
                const r = await createListenRequest(perf.id)
                setListenState(r.ok ? "done" : "error")
              }}>
              {listenState === "done" ? "✓ 先生に届けたよ" : listenState === "sending" ? "送信中…" : listenState === "error" ? "👂 もう一度" : "👂 先生に聴いてもらう"}
            </button>
          )}
          <button type="button" className={styles.primary} onClick={onClose}>とじる</button>
        </div>

        {/* シェア: マスター済みなら🏆マスターカード、通常は🎵きょうの演奏カード */}
        {shareOpen && (
          <ShareSheet
            kind={ach?.mastered ? "master" : "daily"}
            refId={ach?.mastered ? scoreId : perf.id}
            onClose={() => setShareOpen(false)}
          />
        )}
      </div>
    </div>,
    document.body,
  )
}

/** 「採点は勉強中」の正直な注記 + ワンタップで運営へ届くフィードバック */
export function ScoringFeedbackNote({ performanceId, kind }: { performanceId: string; kind: "score" | "practice" }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState("")
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle")

  const send = async () => {
    if (!text.trim()) return
    setState("sending")
    const r = await sendScoringFeedback({ performanceId, kind, message: text })
    setState(r.ok ? "done" : "error")
  }

  return (
    <div style={{ margin: "10px 2px 0", fontSize: 10.5, color: "#9aa6b3", lineHeight: 1.7 }}>
      🔧 アルコの採点は、これからどんどん正確になっていくよ。
      {state === "done" ? (
        <span style={{ color: "#2e8b57", fontWeight: 800 }}> フィードバックありがとう！べんきょうします🎻</span>
      ) : (
        <>
          「この点数、おかしいな？」と思ったら{" "}
          <button type="button" onClick={() => setOpen((v) => !v)}
            style={{ font: "inherit", fontWeight: 800, color: "#4a5bd0", background: "none", border: "none", padding: 0, cursor: "pointer", textDecoration: "underline" }}>
            教えてね
          </button>
          {open && (
            <span style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="例: 本当はもっと弾けていたと思う" maxLength={1000}
                style={{ flex: 1, minWidth: 0, fontSize: 11.5, border: "1px solid #dfe3e8", borderRadius: 8, padding: "7px 10px" }} />
              <button type="button" onClick={send} disabled={state === "sending" || !text.trim()}
                style={{ flex: "none", fontSize: 11, fontWeight: 800, color: "#fff", background: "#4a5bd0", border: "none", borderRadius: 8, padding: "7px 12px", cursor: "pointer", opacity: state === "sending" ? 0.6 : 1 }}>
                {state === "sending" ? "送信中…" : "おくる"}
              </button>
            </span>
          )}
          {state === "error" && <span style={{ color: "#c0473a" }}> 送信できなかった…もう一度ためしてね</span>}
        </>
      )}
    </div>
  )
}
