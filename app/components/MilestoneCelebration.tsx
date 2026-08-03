// 祝いオーバーレイ (祝い体験 v2.0 §10)。CELEBRATION_SPEC 駆動・selectCelebrations の結果を描画。
// 振り返り画面を開いた瞬間に発動(サプライズ設計 §2.2)。Error Boundary で包んで使う(呼び手)。
"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { ArcoChan, POSES } from "./ArcoChan"
import KeepsakeCard, { type Keepsake } from "./KeepsakeCard"
import ShareSheet from "./ShareSheet"
import {
  selectCelebrations,
  CELEBRATION_SPEC,
  type MilestoneEvent,
  type Tone,
} from "@/app/_libs/celebration"

const THEME: Record<string, { main: string; grad: string }> = {
  green: { main: "#2e8b57", grad: "linear-gradient(160deg,#eafaf0,#d3f0df)" },
  gold: { main: "#b5651d", grad: "linear-gradient(160deg,#fdf3df,#f7e3b8)" },
  purple: { main: "#6b4fa0", grad: "linear-gradient(160deg,#efeafe,#dcd2f6)" },
  teal: { main: "#2e8b57", grad: "linear-gradient(160deg,#eafaf3,#cfeede)" },
  blue: { main: "#3f74c4", grad: "linear-gradient(160deg,#eef4fc,#dbe8fa)" },
}
const TYPE_EMOJI: Record<string, string> = {
  achieve: "✨", master: "🏆", rank_up: "⭐", material_clear: "🏅", personal_best: "📈",
}
const TIER_LABEL: Record<string, string> = {
  achieve: "達成", master: "マスター", rank_up: "ランクアップ", material_clear: "課題クリア", personal_best: "自己ベスト更新",
}
const CONFETTI_COLORS = ["#ffd35c", "#7fb2f0", "#ff9db0", "#7fd0a3", "#c8a2e0"]

function poseByCat(cat: string) {
  const pool = (POSES as { cat: string }[]).filter((p) => p.cat === cat)
  return (pool[0] ?? POSES[0]) as unknown as Parameters<typeof ArcoChan>[0]["pose"]
}

export type MilestoneCelebrationProps = {
  events: MilestoneEvent[]
  tone: Tone
  subjectName: string
  star: number | null
  dateLabel: string
  onClose: () => void
  onSeeRecords?: () => void
  onNewPieces?: () => void
}

export default function MilestoneCelebration(props: MilestoneCelebrationProps) {
  const { events, tone, subjectName, star, dateLabel, onClose, onSeeRecords, onNewPieces } = props
  const [mounted, setMounted] = useState(false)
  const [reduced, setReduced] = useState(false)
  const [step, setStep] = useState(0)
  const [shareOpen, setShareOpen] = useState(false)
  useEffect(() => setMounted(true), [])
  useEffect(() => {
    setReduced(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [])

  const sel = useMemo(() => selectCelebrations(events), [events])
  // 表示するイベント列: [本体] または [本体, rank_up(2段目)]
  const sequence = useMemo(() => {
    if (!sel.primary) return []
    return sel.secondary ? [sel.primary, sel.secondary] : [sel.primary]
  }, [sel])

  if (!mounted || sequence.length === 0) return null
  const ev = sequence[Math.min(step, sequence.length - 1)]
  const spec = CELEBRATION_SPEC[ev.type]
  if (!spec) return null
  const theme = THEME[spec.theme] ?? THEME.green
  const copy = spec.copy[tone]
  const emoji = TYPE_EMOJI[ev.type] ?? "🎉"
  const isLast = step >= sequence.length - 1

  const keepsake: Keepsake | null = spec.keepsake
    ? { pieceName: subjectName, star, tierLabel: TIER_LABEL[ev.type] ?? "達成", dateLabel, themeHex: theme.main, emoji }
    : null

  const advance = () => {
    if (isLast) onClose()
    else setStep((s) => s + 1)
  }

  const confetti = reduced ? null : (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {Array.from({ length: 34 }).map((_, i) => (
        <i
          key={i}
          style={{
            position: "absolute", top: -14, left: `${(i * 97) % 100}%`,
            width: 8, height: 12, borderRadius: 2,
            background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animation: `mc-fall ${2.4 + (i % 5) * 0.4}s linear ${(i % 7) * 0.18}s infinite`,
          }}
        />
      ))}
    </div>
  )

  return createPortal(
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(10,15,25,.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <style>{`
        @keyframes mc-fall { 0%{transform:translateY(-20px) rotate(0);opacity:0} 8%{opacity:1} 100%{transform:translateY(560px) rotate(540deg);opacity:1} }
        @keyframes mc-hop { 0%,100%{transform:translateY(0)} 30%{transform:translateY(-14px)} 60%{transform:translateY(0)} }
        @keyframes mc-pop { 0%{transform:scale(.7);opacity:0} 100%{transform:scale(1);opacity:1} }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position: "relative", width: "100%", maxWidth: 360, borderRadius: 22, overflow: "hidden", padding: "28px 18px 18px", textAlign: "center", background: theme.grad, boxShadow: "0 14px 40px rgba(0,0,0,.35)", minHeight: 420, display: "flex", flexDirection: "column" }}
      >
        {confetti}
        <div style={{ position: "relative", width: 96, height: 96, margin: "2px auto 6px", animation: reduced ? undefined : "mc-hop 1.1s ease-in-out infinite" }}>
          <ArcoChan pose={poseByCat(spec.arcoPose)} />
        </div>
        <div style={{ position: "relative", fontSize: 11, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: theme.main, marginBottom: 2 }}>
          {emoji} {TIER_LABEL[ev.type]}
        </div>
        <div style={{ position: "relative", fontSize: 22, fontWeight: 900, color: theme.main, marginBottom: 4, animation: reduced ? undefined : "mc-pop .5s cubic-bezier(.2,1.4,.4,1)" }}>
          {copy.title}
        </div>
        <div style={{ position: "relative", fontSize: 12.5, color: "#4a5766", marginBottom: 14, opacity: 0.95 }}>{copy.sub}</div>
        {sel.absorbedBest && step === 0 && (
          <div style={{ position: "relative", fontSize: 11.5, fontWeight: 800, color: "#3f74c4", background: "#eef4fc", borderRadius: 999, padding: "4px 10px", display: "inline-block", margin: "0 auto 12px" }}>
            📈 自己ベストも更新！
          </div>
        )}

        {keepsake && (
          <div style={{ position: "relative", marginBottom: 12 }}>
            <KeepsakeCard keepsake={keepsake} />
          </div>
        )}

        <div style={{ position: "relative", marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          {/* シェア: rank_up はいつでも / master は subject の scoreId があるとき */}
          {(ev.type === "rank_up" || (ev.type === "master" && ev.subject?.id)) && (
            <button type="button" onClick={() => setShareOpen(true)} style={ghostBtn}>📤 シェアする</button>
          )}
          {isLast && ev.type === "rank_up" && onNewPieces && (
            <button type="button" onClick={onNewPieces} style={ghostBtn}>新しい曲を見る</button>
          )}
          {isLast && onSeeRecords && ev.type !== "rank_up" && (
            <button type="button" onClick={onSeeRecords} style={ghostBtn}>記録を見る</button>
          )}
          <button type="button" onClick={advance} style={{ ...primaryBtn, background: theme.main }}>
            {isLast ? "つづける" : "つぎへ"}
          </button>
        </div>

        {shareOpen && (
          <ShareSheet
            kind={ev.type === "rank_up" ? "rank_up" : "master"}
            refId={ev.type === "master" ? ev.subject?.id : undefined}
            onClose={() => setShareOpen(false)}
          />
        )}
      </div>
    </div>,
    document.body,
  )
}

const primaryBtn: React.CSSProperties = { border: "none", borderRadius: 12, padding: 12, fontSize: 12.5, fontWeight: 800, color: "#fff", cursor: "pointer" }
const ghostBtn: React.CSSProperties = { border: "none", borderRadius: 12, padding: 11, fontSize: 12.5, fontWeight: 800, background: "rgba(255,255,255,.85)", color: "#55616e", cursor: "pointer" }
