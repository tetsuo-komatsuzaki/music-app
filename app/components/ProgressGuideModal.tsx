// app/components/ProgressGuideModal.tsx
//
// 「上達のしくみ」ガイドモーダル。ホームのランクカードから開く。
// 内容はコーチガイド(_onboarding/content/coachMarks.ts)の体験に一致させる (2026-07-28 刷新)。
// 軸: 「弾いて、どこが苦手か目で見てわかる。だから直せる、だから上達する」。
// アルコちゃん + 現行配色で、採点ルールの羅列ではなく"体験の流れ"を伝える。

"use client"

import { ArcoChan, POSES } from "./ArcoChan"

type Props = {
  open: boolean
  onClose: () => void
}

const INK = "#2b3742"
const SUB = "#6b7885"
const ACCENT = "#2e8b57"
const ACCENT_SOFT = "#eafaf0"

// 体験の流れ (コーチガイドの軸をそのまま)
const STEPS: { emoji: string; title: string; desc: string }[] = [
  { emoji: "🎵", title: "弾きたい曲を選ぶ", desc: "やさしい☆から。むずかしければパートごとに分けてもOK。" },
  { emoji: "🎤", title: "一度、通して弾く", desc: "ゆっくりからで大丈夫。完璧じゃなくていい。" },
  { emoji: "🌈", title: "アルコが分析してくれる", desc: "音符ひとつずつ色がついて、どこが苦手か“目で見て”わかる。" },
  { emoji: "🎯", title: "苦手に効く練習が届く", desc: "音階・運指・ボウイングなど目的別。知らない技法は「学びのレッスン」で基礎から。" },
  { emoji: "🔁", title: "練習したら、また曲へ", desc: "弾く → わかる → 直す。この行き来でうまくなっていく。" },
  { emoji: "✅", title: "達成 → 🏆 マスター", desc: "通しで弾ききれたら「達成」。音程とリズムの平均が90点以上で「マスター」。" },
  { emoji: "⭐️", title: "★アップ → ランクアップ", desc: "同じ★の曲を10曲マスターすると次のレベルへ。もっとむずかしい曲に挑戦できる。" },
]

const TERMS: { term: string; desc: string }[] = [
  { term: "達成", desc: "その曲を通しで弾ききれた印。" },
  { term: "マスター🏆", desc: "その曲の音程×リズムの平均が90点以上。" },
  { term: "★（レベル）", desc: "曲のむずかしさ。同じ★を10曲マスターで次へ。" },
  { term: "ランク", desc: "★に応じた称号（初級者→中級者→上級者→マスター）。" },
]

export default function ProgressGuideModal({ open, onClose }: Props) {
  if (!open) return null
  const pose = POSES.find((p) => p.cat === "説明") ?? POSES[0]

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(15,20,30,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 1000,
      }}
      role="dialog"
      aria-modal="true"
      aria-label="上達のしくみ"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 20, maxWidth: 460, width: "100%",
          maxHeight: "88vh", overflowY: "auto", boxShadow: "0 14px 40px rgba(0,0,0,0.28)",
        }}
      >
        {/* ヘッダー: アルコ + タイトル */}
        <div style={{ position: "relative", padding: "20px 18px 14px", textAlign: "center", background: ACCENT_SOFT, borderRadius: "20px 20px 0 0" }}>
          <button
            type="button" onClick={onClose} aria-label="閉じる"
            style={{ position: "absolute", top: 12, right: 12, border: "none", background: "transparent", fontSize: 22, lineHeight: 1, cursor: "pointer", color: "#9aa6b3" }}
          >
            ×
          </button>
          <div style={{ width: 72, height: 72, margin: "0 auto 6px" }}>
            <ArcoChan pose={pose as unknown as Parameters<typeof ArcoChan>[0]["pose"]} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: INK }}>上達のしくみ</h2>
          <p style={{ fontSize: 13, fontWeight: 700, color: ACCENT, margin: "6px 0 0", lineHeight: 1.5 }}>
            弾いて、どこが苦手か“目で見て”わかる。<br />だから直せる、だから上達する。
          </p>
        </div>

        <div style={{ padding: "16px 18px 20px" }}>
          {/* 体験の流れ */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
                <span style={{ flex: "0 0 auto", width: 26, height: 26, borderRadius: "50%", background: ACCENT, color: "#fff", fontSize: 12.5, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                  {i + 1}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14.5, fontWeight: 800, color: INK }}>
                    {s.emoji} {s.title}
                  </span>
                  <span style={{ display: "block", fontSize: 12.5, color: SUB, lineHeight: 1.55, marginTop: 2 }}>
                    {s.desc}
                  </span>
                </span>
              </div>
            ))}
          </div>

          {/* 締めの一言 */}
          <div style={{ background: ACCENT_SOFT, border: `1px solid #cbe8d6`, borderRadius: 12, padding: "11px 14px", textAlign: "center", fontSize: 13.5, fontWeight: 800, color: ACCENT, marginBottom: 20 }}>
            わかるから直せる。直せるから、上達する。
          </div>

          {/* ことば */}
          <h3 style={{ fontSize: 12, fontWeight: 800, margin: "0 0 8px", color: SUB }}>ことばの意味</h3>
          <dl style={{ margin: 0 }}>
            {TERMS.map((t) => (
              <div key={t.term} style={{ marginBottom: 8 }}>
                <dt style={{ fontSize: 13, fontWeight: 800, color: INK }}>{t.term}</dt>
                <dd style={{ fontSize: 12.5, color: SUB, margin: "2px 0 0", lineHeight: 1.5 }}>{t.desc}</dd>
              </div>
            ))}
          </dl>

          <button
            type="button" onClick={onClose}
            style={{ marginTop: 16, width: "100%", padding: "11px 0", borderRadius: 12, border: "none", background: INK, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer" }}
          >
            とじる
          </button>
        </div>
      </div>
    </div>
  )
}
