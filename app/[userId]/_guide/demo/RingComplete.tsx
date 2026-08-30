"use client"

// ============================================================
// リング完成モーション+達成カード (2026-08-29 Tetsuo確定演出)。
// ホーム (前提状態) の上で、本物の弾けるリング ([data-guide="home-ring"]・
// conic-gradient の --p 変数) を 2/3→100% に実物のまま満了させ、
// 中央カウンタを 3/3 に切り替え→紙吹雪+達成カード出現→「うけとる」で進む。
// 太さ・位置は実要素そのものなのでズレない。
// ============================================================

import { useEffect, useState } from "react"
import { ArcoChan, POSES } from "@/app/components/ArcoChan"
import { DemoConfetti } from "./DemoChrome"
import { markGoalRowDone } from "../../_coin/CoinCelebration"

export default function RingComplete({ onReceive }: { onReceive: () => void }) {
  // fill=リング満了アニメ中 → ready=ユーザーの達成確認待ち (タップで進む) → card=達成カード
  const [phase, setPhase] = useState<"fill" | "ready" | "card">("fill")

  useEffect(() => {
    // 実物のリング (conic-gradient) を rAF で満了させる。
    // リングは achievement 読込後に現れるため、出現を待ってから動かす
    // (先に探すと空振りして即カードが出る・2026-08-29 実機指摘の修正)
    let raf = 0
    let waited = 0
    const animate = (ring: HTMLElement) => {
      ring.scrollIntoView({ block: "center" })
      const t0 = performance.now()
      const DUR = 1100
      const from = 66.7
      const tick = (t: number) => {
        const k = Math.min(1, (t - t0) / DUR)
        const eased = 1 - (1 - k) * (1 - k)
        const p = from + (100 - from) * eased
        ring.style.setProperty("--p", `${p}%`)
        ring.style.background = `conic-gradient(var(--gold) ${p}%, rgba(150,175,225,.14) 0)`
        if (k < 1) { raf = requestAnimationFrame(tick) } else {
          // 中央カウンタを 3/3 へ (デモ演出・実装ではデータ更新で同じ見た目になる)
          const num = ring.querySelector("b")
          if (num) num.innerHTML = '3<span style="font-size:12px;font-weight:800;color:var(--text-sub)">/3</span>'
          // 満了と同時に「通して弾く」行✓+チップ達成 (2026-08-30 Tetsuo指定・コイン演出と同一規則)
          markGoalRowDone(ring, "run")
          // リング完成をユーザーが確認してから (タップで) 達成カードへ (2026-08-29 Tetsuo指定)
          setTimeout(() => setPhase("ready"), 350)
        }
      }
      raf = requestAnimationFrame(tick)
    }
    const finder = setInterval(() => {
      waited += 150
      const scope = document.querySelector<HTMLElement>("[data-guide-tutorial]") ?? document
      const rings = scope.querySelectorAll<HTMLElement>('[data-guide="home-ring"]')
      const ring = rings.length ? rings[rings.length - 1] : null
      if (ring) {
        clearInterval(finder)
        setTimeout(() => animate(ring), 500)
      } else if (waited > 8000) {
        // 万一リングが出ないときも先へ進める (カードは出す)
        clearInterval(finder)
        setPhase("card")
      }
    }, 150)
    return () => { clearInterval(finder); cancelAnimationFrame(raf) }
  }, [])

  const pose = POSES.find((p) => p.id === "06B") ?? POSES[0]

  return (
    <>
      {phase === "ready" && (
        <div
          onClick={() => setPhase("card")}
          style={{ position: "fixed", inset: 0, zIndex: 1948, cursor: "pointer", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: "calc(200px + env(safe-area-inset-bottom, 0px))" }}
        >
          <span style={{
            background: "linear-gradient(135deg, #d9a93c, #f0cd7c)", color: "#241a05",
            borderRadius: 999, padding: "10px 26px", fontSize: 13, fontWeight: 900, letterSpacing: "0.04em",
            animation: "ringChipPulse 1.6s ease-in-out infinite",
          }}>つづける</span>
          <style>{`@keyframes ringChipPulse { 0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(232,178,60,.5); } 50% { transform: scale(1.07); box-shadow: 0 0 0 8px rgba(232,178,60,0); } }`}</style>
        </div>
      )}
      {phase === "card" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1953, background: "rgba(6,10,22,.62)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 15, animation: "achvIn .45s ease" }}>
          <DemoConfetti />
          {/* カードv3ファミリー (クリーム+金縁)。カタログNo.001=はじめての1周 (2026-08-31 整合) */}
          <div style={{ width: "min(280px, 74vw)", background: "linear-gradient(172deg,#faf4e4 0%,#f3ead2 55%,#eadfc2 100%)", border: "2px solid #c99a35", borderRadius: 18, padding: "22px 18px 18px", textAlign: "center", boxShadow: "0 0 60px rgba(232,178,60,.3), 0 18px 40px rgba(0,0,0,.5)" }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".14em", color: "#8a6a1a", textAlign: "left" }}>No.001</div>
            <div style={{ width: 110, height: 110, margin: "10px auto 0", borderRadius: "50%", overflow: "hidden", background: "#f2efe7", border: "2px solid #c99a35" }}>
              <ArcoChan pose={pose} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#503a10", marginTop: 14 }}>はじめての1周</div>
            <div style={{ fontSize: 11.5, color: "#7a5c22", marginTop: 6 }}>成長サイクルを回した</div>
            <div style={{ fontSize: 9.5, letterSpacing: "0.22em", color: "#a5761c", fontWeight: 800, marginTop: 10 }}>ARCODA CARD</div>
          </div>
          <button type="button" onClick={onReceive} style={{ background: "#2b5bc4", color: "#fff", border: "none", borderRadius: 999, padding: "13px 44px", fontSize: 14, fontWeight: 900, cursor: "pointer" }}>
            うけとる
          </button>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--text-sub)" }}>シェアして自慢する</span>
          <style>{`@keyframes achvIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </div>
      )}
    </>
  )
}
