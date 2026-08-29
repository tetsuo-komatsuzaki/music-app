"use client"

// ============================================================
// 弾いたてい (2026-08-29): 3・2・1 カウントダウン→横画面の帯モードデモ。
// カウント中はテンポガイド (カーソル・拍玉) を動かさない (Tetsuo指定)。
// 帯は実画面のレンダリング画像 (public/guide-demo/band_strip.jpg)。
// 約3秒のデモ演奏ののち onDone で採点結果へ。
// ============================================================

import { useEffect, useState } from "react"

export default function DemoRecording({ onDone }: { onDone: () => void }) {
  const [count, setCount] = useState<number | null>(3)

  useEffect(() => {
    let n = 3
    const iv = setInterval(() => {
      n -= 1
      if (n > 0) { setCount(n); return }
      clearInterval(iv)
      setCount(null) // カウント終了 → テンポガイド開始
    }, 650)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    if (count !== null) return
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [count, onDone])

  const go = count === null

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1200, background: "#05070f", display: "flex", flexDirection: "column", alignItems: "stretch", justifyContent: "center" }}>
      {/* 帯モードの上バー */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", fontSize: 12, fontWeight: 800, color: "var(--text-sub)" }}>
        <span style={{ background: "rgba(150,175,225,.14)", borderRadius: 999, padding: "6px 12px" }}>たて画面にもどす</span>
        <span style={{ background: "#b3402f", color: "#fff", borderRadius: 999, padding: "6px 14px" }}>停止</span>
        <span>♪100</span>
      </div>

      {/* 帯 (実画面レンダ) + テンポガイド */}
      <div style={{ position: "relative", margin: "0 10px", borderRadius: 10, overflow: "hidden", background: "#fff" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/guide-demo/band_strip.jpg" alt="" style={{ width: "260%", display: "block", transform: go ? "translateX(-55%)" : "none", transition: go ? "transform 3s linear" : "none" }} />
        {/* 現在位置カーソル (カウント中は停止) */}
        <span style={{ position: "absolute", top: 0, bottom: 0, left: "22%", width: 3, background: "rgba(232,178,60,.9)" }} />
        {/* 拍玉 */}
        <span style={{ position: "absolute", top: "6%", left: "22%", width: 13, height: 13, marginLeft: -5, borderRadius: "50%", background: "#e8b23c", animation: go ? "beatBall .6s ease-in-out infinite alternate" : "none" }} />
        <style>{`@keyframes beatBall { from { transform: translateY(0); } to { transform: translateY(9px); } }`}</style>
      </div>

      <div style={{ position: "absolute", bottom: 18, left: 0, right: 0, textAlign: "center", fontSize: 12, fontWeight: 800, color: "var(--text-sub)" }}>
        録音中 ・ 横画面 (デモ)
      </div>

      {/* カウントダウン */}
      {count !== null && (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "rgba(5,7,15,.55)" }}>
          <b key={count} style={{ fontSize: 110, fontWeight: 900, color: "#f6ecd4", textShadow: "0 0 60px rgba(232,178,60,.5)", animation: "cdPop .55s ease" }}>{count}</b>
          <style>{`@keyframes cdPop { from { transform: scale(1.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
        </div>
      )}
    </div>
  )
}
