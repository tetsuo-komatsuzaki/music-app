"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import ArcoMotion from "./ArcoMotion"
import { Palette, Trophy, Share2, Ear } from "lucide-react"
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
          style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", zIndex: 3, width: 40, height: 5, borderRadius: 3, background: "rgba(10,17,32,.35)", cursor: "grab", touchAction: "none" }}
        />
        <button type="button" className={styles.close} aria-label="閉じる" onClick={onClose}>✕</button>

        {/* 水彩ヒーロー (原本 №3): 紙吹雪 + 拍手アルコ 06A */}
        <div className={styles.hero}>
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className={styles.confetti} aria-hidden
              style={{ left: `${4 + (i * 92) / 11}%`, animationDuration: `${4 + (i % 5)}s`, animationDelay: `${(i * 0.45) % 6}s` }} />
          ))}
          <ArcoMotion kit="06A" label="拍手するアルコ" className={styles.heroArco} />
        </div>

        <div className={styles.body}>
        <span className={styles.scorePill}>今日の採点</span>

        {/* 点数行 (原本: 白88px + 点 ・ 右にランクバッジ) */}
        <div className={styles.scoreRow}>
          <div className={styles.big}>
            <span className={styles.bigNum}>{overall}</span>
            <span className={styles.bigUnit}>点</span>
          </div>
          <div className={styles.side}>
            <span className={`${styles.rank} ${styles["r" + rankOf(overall)]}`}>{rankOf(overall)}</span>
          </div>
        </div>

        {/* 内訳メーター (原本: 金グラデ+発光) */}
        <div className={styles.meters}>
          <div className={styles.meter}>
            <div className={styles.meterHead}><span>音程</span><b>{Math.round(pitch)}</b></div>
            <div className={styles.meterTrack}><i className={styles.meterFill} style={{ ["--value" as string]: `${Math.round(pitch)}%` }} /></div>
          </div>
          <div className={styles.meter}>
            <div className={styles.meterHead}><span>リズム</span><b>{Math.round(timing)}</b></div>
            <div className={styles.meterTrack}><i className={styles.meterFill} style={{ ["--value" as string]: `${Math.round(timing)}%` }} /></div>
          </div>
        </div>

        {/* アルコの手紙 (原本: 紙カード)。ほめフィードバックがあればその文、無ければ点数帯の見出し */}
        <div className={styles.letter}>
          <p>{praise?.text ?? headline(overall, !!ach?.mastered)}</p>
          <div className={styles.sign}>―― アルコ</div>
        </div>

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
          <div className={styles.secH} style={{ display: "flex", alignItems: "center", gap: 6 }}><Trophy size={15} color="var(--gold)" /> マスターまで</div>
          {!ach ? (
            <div className={styles.muted}>集計してるよ…</div>
          ) : ach.mastered ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-good)", padding: "6px 0" }}>
              <Trophy size={15} color="var(--gold)" /> この曲はマスター済み！{avg != null ? ` いまの平均 ${avg}点` : ""}
            </div>
          ) : (
            <div>
              <style>{`@keyframes aroHop { 0%,100%{ transform:translate(-50%,0) } 50%{ transform:translate(-50%,-4px) } }`}</style>
              {avg != null ? (
                <>
                  {/* ゲージ: 直近5回平均 vs 90点ライン */}
                  <div style={{ position: "relative", height: 14, borderRadius: 7, background: "rgba(150,175,225,.16)", margin: "26px 4px 6px" }}>
                    <span style={{ position: "absolute", inset: "0 auto 0 0", width: `${Math.min(avg, 100)}%`, borderRadius: 7, background: "linear-gradient(90deg,#7a9be0,#2b5bc4)" }} />
                    <span style={{ position: "absolute", top: -7, bottom: -7, left: "90%", width: 3, borderRadius: 2, background: "var(--gold)" }}>
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
                        style={{ fontSize: "var(--fs-label)", fontWeight: 800, borderRadius: 999, padding: "3px 9px", border: "1px solid transparent", color: "#9db8e8", background: "rgba(43,91,196,.22)", textDecoration: "none" }}>
                        {c.label} →
                      </Link>
                    ) : (
                      <span key={c.label} style={{ fontSize: "var(--fs-label)", fontWeight: 800, borderRadius: 999, padding: "3px 9px", border: `1px solid ${c.done ? "rgba(168,201,127,.35)" : "rgba(150,175,225,.16)"}`, color: c.done ? "#a8c97f" : "var(--text-sub)", background: c.done ? "rgba(168,201,127,.13)" : "transparent" }}>
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
