// 記念カード (祝い体験 v2.0 §10)。canvas で賞状画像を事前生成 → Web Share / ダウンロード。
// 掲載情報: 曲名・★・節目・日付・アルコ絵柄のみ。**ユーザー名は載せない**(§10確定)。
// Webフォント非依存(system font)・音声なし・共有はボタン操作でのみ発火。
"use client"

import { useEffect, useRef, useState } from "react"
import { Gift } from "lucide-react"

export type Keepsake = {
  pieceName: string
  star: number | null
  tierLabel: string // 達成 / マスター / 課題クリア / ランクアップ
  dateLabel: string // 例 2026.07.26
  themeHex: string // カード基調色 (#RRGGBB)
  emoji: string // アルコ代替の絵柄 (✨🏆⭐🏅 等)
}

const CARD_W = 640
const CARD_H = 400

function drawCard(canvas: HTMLCanvasElement, k: Keepsake) {
  canvas.width = CARD_W
  canvas.height = CARD_H
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  // 背景
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, CARD_W, CARD_H)
  ctx.fillStyle = k.themeHex + "22"
  ctx.fillRect(0, 0, CARD_W, CARD_H)
  // 枠
  ctx.strokeStyle = k.themeHex
  ctx.lineWidth = 6
  ctx.strokeRect(16, 16, CARD_W - 32, CARD_H - 32)
  // 絵柄
  ctx.textAlign = "center"
  ctx.font = "72px sans-serif"
  ctx.fillText(k.emoji, CARD_W / 2, 130)
  // 節目
  ctx.fillStyle = k.themeHex
  ctx.font = "bold 34px sans-serif"
  ctx.fillText(k.tierLabel, CARD_W / 2, 200)
  // 曲名
  ctx.fillStyle = "#2b3742"
  ctx.font = "bold 26px sans-serif"
  const name = k.pieceName.length > 18 ? k.pieceName.slice(0, 17) + "…" : k.pieceName
  ctx.fillText(name, CARD_W / 2, 250)
  // ★
  if (k.star != null) {
    ctx.fillStyle = "#94a0ad"
    ctx.font = "18px sans-serif"
    ctx.fillText(`☆${k.star}`, CARD_W / 2, 288)
  }
  // 日付 + ブランド
  ctx.fillStyle = "#b3bcc6"
  ctx.font = "16px sans-serif"
  ctx.fillText(`${k.dateLabel} ・ Arcoda`, CARD_W / 2, CARD_H - 44)
}

export default function KeepsakeCard({ keepsake }: { keepsake: Keepsake }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [blob, setBlob] = useState<Blob | null>(null)

  // §10: オーバーレイ表示時に事前生成 (iOS Safari の user activation 制約対策)。
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    try {
      drawCard(c, keepsake)
      c.toBlob((b) => setBlob(b), "image/png")
    } catch {
      /* 生成失敗時は共有をテキストにフォールバック(R7) */
    }
  }, [keepsake])

  const onShare = async () => {
    const nav = navigator as Navigator & {
      canShare?: (d: ShareData) => boolean
      share?: (d: ShareData) => Promise<void>
    }
    try {
      if (blob && nav.canShare && nav.share) {
        const file = new File([blob], `arcoda-${keepsake.tierLabel}.png`, { type: "image/png" })
        if (nav.canShare({ files: [file] })) {
          await nav.share({ files: [file], title: "Arcoda", text: `${keepsake.pieceName} ${keepsake.tierLabel}！` })
          return
        }
      }
      // フォールバック: 画像ダウンロード / それも不可ならテキスト共有
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `arcoda-${keepsake.tierLabel}.png`
        a.click()
        URL.revokeObjectURL(url)
      } else if (nav.share) {
        await nav.share({ title: "Arcoda", text: `${keepsake.pieceName} ${keepsake.tierLabel}！` })
      }
    } catch {
      /* ユーザーキャンセル等は無視 */
    }
  }

  return (
    <div>
      {/* 表示用の見た目(canvasは共有用に隠す) */}
      <div style={{ position: "relative", background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 6px 18px rgba(30,45,70,.16)", border: `2px solid ${keepsake.themeHex}` }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "var(--fs-display)" }} aria-hidden>{keepsake.emoji}</div>
          <div style={{ fontSize: "var(--fs-head)", fontWeight: 900, color: keepsake.themeHex, marginTop: 2 }}>{keepsake.tierLabel}</div>
          <div style={{ fontSize: "var(--fs-subhead)", fontWeight: 800, color: "var(--text-ink)", marginTop: 4 }}>{keepsake.pieceName}</div>
          <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", marginTop: 6 }}>
            {keepsake.star != null ? `☆${keepsake.star} ・ ` : ""}{keepsake.dateLabel}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onShare}
        style={{ marginTop: 10, width: "100%", border: "none", borderRadius: 12, padding: 11, fontSize: "var(--fs-body)", fontWeight: 800, background: "rgba(255,255,255,.85)", color: "var(--text-body)", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
      >
        <Gift size={15} /> 家族に送る
      </button>
      <canvas ref={canvasRef} style={{ display: "none" }} aria-hidden />
    </div>
  )
}
