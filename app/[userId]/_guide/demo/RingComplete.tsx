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

export default function RingComplete({ onReceive }: { onReceive: () => void }) {
  const [phase, setPhase] = useState<"fill" | "card">("fill")

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
          setTimeout(() => setPhase("card"), 500)
        }
      }
      raf = requestAnimationFrame(tick)
    }
    const finder = setInterval(() => {
      waited += 150
      const ring = document.querySelector<HTMLElement>('[data-guide="home-ring"]')
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
      {phase === "card" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1953, background: "rgba(6,10,22,.62)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 15, animation: "achvIn .45s ease" }}>
          <DemoConfetti />
          <div style={{ width: "min(310px, 78vw)", background: "linear-gradient(180deg,#182a4e,#101c38)", border: "1.5px solid rgba(232,178,60,.55)", borderRadius: 20, padding: "26px 20px 20px", textAlign: "center", boxShadow: "0 0 60px rgba(232,178,60,.25)" }}>
            <div style={{ width: 120, height: 120, margin: "0 auto", borderRadius: "50%", overflow: "hidden", background: "#f2efe7" }}>
              <ArcoChan pose={pose} />
            </div>
            <div style={{ fontSize: 19, fontWeight: 900, color: "var(--cream, #f6ecd4)", marginTop: 14 }}>きらきら星 ・ 達成</div>
            <div style={{ fontSize: 11.5, color: "var(--text-sub)", marginTop: 6 }}>80→95点 ・ 2026.08.29</div>
            <div style={{ fontSize: 10, letterSpacing: "0.22em", color: "var(--gold)", fontWeight: 800, marginTop: 10 }}>CARD No.001</div>
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
