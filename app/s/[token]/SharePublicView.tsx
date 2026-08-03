"use client"

// シェア公開ページの描画 (2026-08-03)。確定モックのカードを実データで再現し、
// お祝い系=図形紙吹雪が降り続ける / 報告系=音符が五線譜の上を流れる (A-1)。
// 文字はカード幅比例 (cqw) — どの画面幅でも1200×630と同比率で崩れない。
import Link from "next/link"
import { ArcoChan, POSES } from "@/app/components/ArcoChan"
import {
  type ShareKind, type SharePayload, isCelebrationKind, titleFontPx, SHARE_KIND_META,
} from "@/app/_libs/shareCard"

const POSE_ID: Record<ShareKind, string> = {
  master: "02A", rank_up: "02B", weekly: "02C", daily: "01A",
}
const POSE_NOTE: Record<ShareKind, string> = {
  master: "やったね！のポーズ", rank_up: "やったね！のポーズ",
  weekly: "お疲れさま！のポーズ", daily: "いいね！のポーズ",
}

const CONFETTI = [
  { left: "6%", w: 1.72, h: 2.34, c: "#e8c96a", dur: 5, delay: 0 },
  { left: "20%", w: 1.25, h: 1.25, c: "#7a8ce0", dur: 6.5, delay: 0.8, round: true },
  { left: "33%", w: 1.41, h: 2.03, c: "#e59fb2", dur: 5.6, delay: 1.7 },
  { left: "46%", w: 1.25, h: 1.72, c: "#8fce9f", dur: 7, delay: 0.4 },
  { left: "58%", w: 1.09, h: 1.09, c: "#e8c96a", dur: 6, delay: 2.2, round: true },
  { left: "70%", w: 1.56, h: 2.19, c: "#e59fb2", dur: 5.2, delay: 1.2 },
  { left: "82%", w: 1.88, h: 2.5, c: "#e8c96a", dur: 6.8, delay: 0.1 },
  { left: "92%", w: 1.25, h: 1.25, c: "#7a8ce0", dur: 5.9, delay: 1.9, round: true },
  { left: "12%", w: 1.25, h: 1.88, c: "#8fce9f", dur: 7.4, delay: 2.8 },
  { left: "64%", w: 1.41, h: 1.88, c: "#7a8ce0", dur: 6.2, delay: 3.4 },
]

const NOTES = [
  { top: "14%", fs: 4.1, dur: 14, delay: 0, ch: "♪" },
  { top: "24%", fs: 3.1, dur: 17, delay: -4, ch: "♫" },
  { top: "10%", fs: 3.4, dur: 15, delay: -8, ch: "♩" },
  { top: "20%", fs: 3.75, dur: 19, delay: -12, ch: "♪" },
  { top: "28%", fs: 2.8, dur: 16, delay: -6, ch: "♪" },
]

function Stat({ value, unit, label, color }: { value: string; unit?: string; label: string; color: string }) {
  return (
    <div>
      <div style={{ fontSize: "3.75cqw", fontWeight: 900, color, fontVariantNumeric: "tabular-nums" }}>
        {value}{unit && <span style={{ fontSize: "1.88cqw" }}>{unit}</span>}
      </div>
      <div style={{ fontSize: "1.41cqw", fontWeight: 800, color: "#9a8c74", whiteSpace: "nowrap" }}>{label}</div>
    </div>
  )
}

export default function SharePublicView({
  kind, payload: p, displayName,
}: {
  kind: ShareKind
  payload: SharePayload
  displayName: string | null
  token: string
}) {
  const celebration = isCelebrationKind(kind)
  const meta = SHARE_KIND_META[kind]
  const poses = POSES as { id: string }[]
  const pose = poses.find((x) => x.id === POSE_ID[kind]) ?? poses[0]

  const eyebrow =
    kind === "weekly" ? `${meta.eyebrow} ・ ${p.period ?? ""}` :
    kind === "daily" ? `${meta.eyebrow} ・ ${p.date ?? ""}` : meta.eyebrow
  const headline =
    kind === "master" || kind === "daily" ? (p.title ?? "") :
    kind === "weekly" ? "今週も頑張ったね！" : "つぎのステージへ！"
  const headlineCqw =
    kind === "master" || kind === "daily" ? `${(titleFontPx(headline, 594) / 100).toFixed(2)}cqw` : "4.69cqw"
  const footer = `${displayName ? `${displayName} ・ ` : ""}アルコ ・ arcodaviolin.com`

  return (
    <div style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 18, padding: "24px 14px",
      background: "linear-gradient(170deg,#f6f2e8,#efe8d8)",
      fontFamily: '"Hiragino Sans","Yu Gothic UI",system-ui,sans-serif',
    }}>
      <style>{`
        @keyframes shareConfFall { 0%{ top:-8%; transform:rotate(0deg) } 100%{ top:108%; transform:rotate(340deg) } }
        @keyframes shareNoteFlow { 0%{ left:106% } 100%{ left:-8% } }
        @media (prefers-reduced-motion: reduce){ .share-anim{ animation: none !important } }
      `}</style>

      {/* ── カード ── */}
      <div style={{
        width: "min(94vw, 640px)", aspectRatio: "1200/630", containerType: "inline-size",
        position: "relative", borderRadius: 16, overflow: "hidden",
        background: "linear-gradient(150deg,#fffdf6,#fdf6e6)", boxShadow: "0 6px 24px rgba(60,45,15,.18)",
      }}>
        {/* 背景装飾 */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
          {celebration ? (
            CONFETTI.map((f, i) => (
              <span key={i} className="share-anim" style={{
                position: "absolute", top: "-8%", left: f.left,
                width: `${f.w}cqw`, height: `${f.h}cqw`, background: f.c,
                borderRadius: f.round ? "50%" : "0.31cqw",
                animation: `shareConfFall ${f.dur}s linear ${f.delay}s infinite`,
              }} />
            ))
          ) : (
            <>
              <svg viewBox="0 0 1200 630" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
                <g stroke="#e3d5ac" strokeWidth="2" fill="none" opacity=".55">
                  <path d="M-20,120 C300,90 700,150 1220,100" />
                  <path d="M-20,150 C300,120 700,180 1220,130" />
                  <path d="M-20,180 C300,150 700,210 1220,160" />
                  <path d="M-20,210 C300,180 700,240 1220,190" />
                  <path d="M-20,240 C300,210 700,270 1220,220" />
                </g>
              </svg>
              {NOTES.map((n, i) => (
                <span key={i} className="share-anim" style={{
                  position: "absolute", top: n.top, left: "106%", fontSize: `${n.fs}cqw`, color: "#d8c48e",
                  animation: `shareNoteFlow ${n.dur}s linear ${n.delay}s infinite`,
                }}>{n.ch}</span>
              ))}
            </>
          )}
        </div>

        {/* 本文 */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", padding: "0 8%", gap: "5%", zIndex: 1 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "1.88cqw", fontWeight: 900, color: "#a98b2f", letterSpacing: ".14em", whiteSpace: "nowrap" }}>{eyebrow}</div>
            <div style={{ fontSize: headlineCqw, fontWeight: 900, color: "#1a2028", margin: "0.31cqw 0 1.88cqw", lineHeight: 1.25 }}>{headline}</div>
            {kind === "rank_up" ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "1.88cqw" }}>
                  <span style={{ fontSize: "3.75cqw", color: "#c9bfa8" }}>{"★".repeat(Math.max(1, p.fromStar ?? 1))}</span>
                  <span style={{ fontSize: "2.34cqw", fontWeight: 900, color: "#b8a982" }}>→</span>
                  <span style={{ fontSize: "5.31cqw", color: "#e3a51f", textShadow: "0 0 2.19cqw #f5df9e" }}>{"★".repeat(Math.max(1, p.star ?? 2))}</span>
                </div>
                <div style={{ fontSize: "1.88cqw", fontWeight: 800, color: "#8a7c62", marginTop: "0.94cqw" }}>レベルが 1つ 上がったよ</div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "3.44cqw" }}>
                {kind === "master" && <>
                  <Stat value={`★${p.star ?? 1}`} label="レベル" color="#a97b1f" />
                  <Stat value={String(p.attempts ?? 1)} unit="回" label="挑戦した回数" color="#0f8a4f" />
                </>}
                {kind === "weekly" && <>
                  <Stat value={String(p.days ?? 0)} unit="日" label="練習した日数" color="#a97b1f" />
                  <Stat value={String(p.recs ?? 0)} unit="回" label="録音した回数" color="#0f8a4f" />
                  <Stat value={String(p.skills ?? 0)} unit="個" label="伸びたわざ" color="#4f63c8" />
                </>}
                {kind === "daily" && <>
                  <Stat value={String(p.pitch ?? 0)} unit="点" label="音程" color="#a97b1f" />
                  <Stat value={String(p.timing ?? 0)} unit="点" label="リズム" color="#0f8a4f" />
                  {p.bestDelta != null
                    ? <Stat value={`+${p.bestDelta}`} label="自己ベスト更新" color="#4f63c8" />
                    : <Stat value={String(p.attempts ?? 1)} unit="回目" label="挑戦" color="#4f63c8" />}
                </>}
              </div>
            )}
            <div style={{ fontSize: "1.72cqw", fontWeight: 800, color: "#9a8c74", marginTop: "2.19cqw" }}>{footer}</div>
          </div>
          <div style={{ flex: "none", textAlign: "center", position: "relative", width: "22cqw" }}>
            <div style={{ position: "absolute", inset: "-2.81cqw", borderRadius: "50%", background: "radial-gradient(circle,#f5df9e66 0%,transparent 68%)" }} />
            <div style={{ position: "relative", width: "100%", aspectRatio: "290/275" }}>
              <ArcoChan pose={pose} />
            </div>
            <div style={{ position: "relative", fontSize: "1.56cqw", fontWeight: 800, color: "#c9a227", marginTop: "0.62cqw" }}>{POSE_NOTE[kind]}</div>
          </div>
        </div>
      </div>

      {/* ── アプリへの導線 ── */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: "#8a7c62", marginBottom: 10 }}>
          アルコは、AIの先生といっしょに上達するバイオリン練習アプリです🎻
        </div>
        <Link href="/" style={{
          display: "inline-block", fontSize: 14, fontWeight: 900, color: "#fff",
          background: "linear-gradient(135deg,#c9a227,#a97b1f)", borderRadius: 999,
          padding: "12px 28px", textDecoration: "none", boxShadow: "0 3px 10px rgba(160,120,30,.35)",
        }}>
          アルコをはじめる
        </Link>
      </div>
    </div>
  )
}
