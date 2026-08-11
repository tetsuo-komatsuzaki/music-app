"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { ArcoChan, POSES } from "./ArcoChan"
import { Sprout, Palette, Trophy, Share2, Ear } from "lucide-react"
import ShareSheet from "./ShareSheet"
import { createListenRequest } from "@/app/actions/listenRequests"
import { useDragToDismiss } from "@/app/_hooks/useDragToDismiss"
import styles from "./ArcoResultOverlay.module.css"

type Ach = {
  lessons: { total: number; cleared: number; nextLessonId?: string | null }
  etude: { required: boolean; id?: string; title?: string; achieved?: boolean }
  cleanRuns: { count: number; required: number }
  master: { recentAvg: number | null; threshold: number; scoredCount: number; requiredCount: number }
  achieved: boolean
  mastered: boolean
}
import type { Praise } from "@/app/_libs/praiseFeedback"

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
  if (mastered) return "この曲、マスター達成〜！"
  if (score >= 90) return "すごい！演奏マスター級だね"
  if (score >= 75) return "いい演奏！あと少しで完璧"
  if (score >= 60) return "その調子！ここを直すともっと良くなるよ"
  return "だいじょうぶ、いっしょに練習していこう"
}

function rankOf(score: number): string {
  return score >= 90 ? "S" : score >= 75 ? "A" : score >= 60 ? "B" : "C"
}

export default function ArcoResultOverlay({
  scoreId, userId, perf, onClose,
}: {
  scoreId: string
  userId: string
  perf: { id: string; pitchAccuracy: number | null; timingAccuracy: number | null }
  onClose: () => void
}) {
  const [mounted, setMounted] = useState(false)
  const [ach, setAch] = useState<Ach | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [praise, setPraise] = useState<Praise | null>(null)
  const [strengthCount, setStrengthCount] = useState(0)
  const [hasTeacher, setHasTeacher] = useState(false)
  const [listenState, setListenState] = useState<"idle" | "sending" | "done" | "error">("idle")
  // 下スワイプで閉じる (シート上部/ハンドル、または一番上までスクロール時のみ)
  const drag = useDragToDismiss(onClose)
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
      fetch(`/api/performances/${perf.id}/growth-line`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([a, g]) => { if (!aborted) { setAch(a); setPraise(g?.praise ?? null); setStrengthCount(g?.strengthCount ?? 0); setHasTeacher(!!g?.hasTeacher) } })
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
    if (ach.etude.required) chips.push({
      done: !!ach.etude.achieved,
      label: ach.etude.achieved ? "エチュード ✓" : "エチュード 未",
      href: ach.etude.id ? `/${userId}/practice/etude/${ach.etude.id}?from=${scoreId}` : null,
    })
  }

  if (!mounted) return null

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} ref={drag.ref} {...drag.handlers} onClick={(e) => e.stopPropagation()}>
        <div
          data-drag-handle
          aria-hidden
          style={{ width: 40, height: 5, borderRadius: 3, background: "rgba(0,0,0,.14)", margin: "-4px auto 8px", cursor: "grab", touchAction: "none" }}
        />
        <button type="button" className={styles.close} aria-label="閉じる" onClick={onClose}>✕</button>

        {/* アルコ + 見出し */}
        <div className={styles.hero}>
          <div className={styles.arco}><ArcoChan pose={pose} /></div>
          <div className={styles.bubble}>{headline(overall, !!ach?.mastered)}</div>
        </div>

        {/* 採点結果 (案3: 合計を上に、音程/リズムを横棒で) */}
        <div className={styles.scoreCard}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, justifyContent: "center", marginBottom: 12 }}>
            <span className={styles.bigNum}>{overall}</span>
            <span className={styles.bigUnit}>点</span>
            <span className={`${styles.rank} ${styles["r" + rankOf(overall)]}`} style={{ alignSelf: "center", marginLeft: 4 }}>{rankOf(overall)}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 34, flex: "none", fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-sub)" }}>音程</span>
              <span style={{ flex: 1, height: 8, borderRadius: 5, background: "#eef1f5", overflow: "hidden" }}><span style={{ display: "block", height: "100%", width: `${Math.round(pitch)}%`, background: "#2b5bc4", borderRadius: 5 }} /></span>
              <b style={{ width: 26, flex: "none", textAlign: "right", fontSize: "var(--fs-subhead)", fontWeight: 900, color: "#1f3d78", fontVariantNumeric: "tabular-nums" }}>{Math.round(pitch)}</b>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 34, flex: "none", fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-sub)" }}>リズム</span>
              <span style={{ flex: 1, height: 8, borderRadius: 5, background: "#eef1f5", overflow: "hidden" }}><span style={{ display: "block", height: "100%", width: `${Math.round(timing)}%`, background: "#e6a94a", borderRadius: 5 }} /></span>
              <b style={{ width: 26, flex: "none", textAlign: "right", fontSize: "var(--fs-subhead)", fontWeight: 900, color: "#8a5a1f", fontVariantNumeric: "tabular-nums" }}>{Math.round(timing)}</b>
            </div>
          </div>
        </div>

        {/* ほめフィードバック (2026-08-10): 今日よくできたこと1件。苦手突破→伸び→最高。無い日は出さない */}
        {praise && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            margin: "8px 2px 0", padding: "8px 12px", borderRadius: 10,
            background: "#f2faf5", border: "1px solid #cfe6d8",
            fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-good)",
            lineHeight: 1.45, textAlign: "center",
          }}>
            <Sprout size={15} style={{ flex: "none" }} /> {praise.text}
          </div>
        )}

        {/* 💪 先生の強みリンク (案5・2026-08-03): 入口だけ置き、詳細はカルテの表現セクションへ */}
        {strengthCount > 0 && (
          <div style={{ margin: "6px 4px 0", fontSize: "var(--fs-caption)", fontWeight: 800 }}>
            <Link href={`/${userId}/progress`} onClick={onClose} style={{ color: "var(--text-link)", textDecoration: "underline" }}>
              <Palette size={13} style={{ verticalAlign: -2 }} /> 先生が認定したきみの表現・{strengthCount}個を見る →
            </Link>
          </div>
        )}

        {/* 🏆 マスターまで (案2: 点数ゲージ+90点ライン+条件チップ・2026-08-02確定) */}
        <div className={styles.sec}>
          <div className={styles.secH} style={{ display: "flex", alignItems: "center", gap: 6 }}><Trophy size={15} color="#b58a1e" /> マスターまで</div>
          {!ach ? (
            <div className={styles.muted}>集計してるよ…</div>
          ) : ach.mastered ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-good)", padding: "6px 0" }}>
              <Trophy size={15} color="#b58a1e" /> この曲はマスター済み！{avg != null ? ` いまの平均 ${avg}点` : ""}
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
                      <span style={{ position: "absolute", top: -19, right: -4, fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-master)", whiteSpace: "nowrap" }}>90点</span>
                    </span>
                    <span style={{ position: "absolute", top: -24, left: `${Math.min(avg, 100)}%`, transform: "translateX(-50%)", fontSize: "var(--fs-label)", fontWeight: 900, color: "var(--text-sub)", whiteSpace: "nowrap", animation: "aroHop 1.2s ease-in-out infinite" }}>
                      きみ {avg}点
                      <span style={{ display: "block", textAlign: "center", fontSize: "var(--fs-label)" }}>▼</span>
                    </span>
                  </div>
                  <div style={{ textAlign: "center", fontSize: "var(--fs-body)", fontWeight: 900, marginTop: 10 }}>
                    {avg >= 90
                      ? <>90点ラインを超えてるよ！</>
                      : <>あと <b style={{ color: "var(--text-error)", fontSize: "var(--fs-subhead)" }}>{Math.max(1, Math.ceil(90 - avg))}点</b> で90点ライン！</>}
                  </div>
                  {ach.master.scoredCount < ach.master.requiredCount && (
                    <div style={{ textAlign: "center", fontSize: "var(--fs-label)", color: "var(--text-muted)", marginTop: 3 }}>
                      ※ 直近{ach.master.requiredCount}回の平均で判定・いま{ach.master.scoredCount}回
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
                        style={{ fontSize: "var(--fs-label)", fontWeight: 800, borderRadius: 999, padding: "3px 9px", border: "1px solid #d7dcf6", color: "var(--text-link)", background: "#eef0fc", textDecoration: "none" }}>
                        {c.label} →
                      </Link>
                    ) : (
                      <span key={c.label} style={{ fontSize: "var(--fs-label)", fontWeight: 800, borderRadius: 999, padding: "3px 9px", border: `1px solid ${c.done ? "#cfe6d8" : "#eef1f4"}`, color: c.done ? "#2e8b57" : "#8a9099", background: c.done ? "#f2faf5" : "transparent" }}>
                        {c.label}
                      </span>
                    )
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <Link href={`/${userId}/progress`} onClick={onClose} className={styles.ghost} style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>カルテで成長記録をみる</Link>
          <button type="button" className={styles.ghost} onClick={() => setShareOpen(true)}><span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Share2 size={13} /> シェア</span></button>
          {/* 👂 先生に聴いてもらう (2026-08-06 案1簡素版): ワンタップ送信・シート無し */}
          {hasTeacher && (
            <button type="button" className={styles.ghost} disabled={listenState === "sending" || listenState === "done"}
              onClick={async () => {
                setListenState("sending")
                try {
                  const r = await createListenRequest(perf.id)
                  setListenState(r.ok ? "done" : "error")
                } catch {
                  setListenState("error")
                }
              }}>
              {listenState === "done" ? "✓ 先生に届けたよ" : listenState === "sending" ? "送信中…" : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Ear size={13} /> {listenState === "error" ? "もう一度" : "先生に聴いてもらう"}</span>
              )}
            </button>
          )}
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
