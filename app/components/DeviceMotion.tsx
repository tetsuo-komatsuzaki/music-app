"use client"

// B群の実機適用 (2026-08-21 Tetsuo指示・リバイス4)。原本 uiv2/app.v2.motion.css の .phone 演出。
//   B2 3Dチルト: perspective(1400px) rotateX ±5° rotateY ±7°。離れると 0.5s
//     cubic-bezier(.2,.8,.25,1) で戻る (原本値)。マウス=ホバー追従 / 実機=押している間 指に追従。
//     対象はカード (ds.card / data-anim="block")。
//   B4 ノッチ+ベゼル: 10px の黒ベゼル + 上部中央 104×24 の丸角バー (Dynamic Island 風)。
//     画面全体を端末フレームに見立てる装飾。操作は透過 (pointer-events none)。
import { useEffect } from "react"
import ds from "./ds.module.css"

export function DeviceFrame() {
  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 900, pointerEvents: "none" }}>
      <div style={{ position: "absolute", inset: 0, border: "10px solid #000", borderRadius: 34 }} />
      <div
        style={{
          position: "absolute",
          top: "calc(env(safe-area-inset-top, 0px) + 10px)",
          left: "50%",
          transform: "translateX(-50%)",
          width: 104,
          height: 24,
          background: "#000",
          borderRadius: 999,
        }}
      />
    </div>
  )
}

export default function TiltEffect() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const SELC = `.${ds.card}, [data-anim="block"]`
    let cur: HTMLElement | null = null

    const apply = (el: HTMLElement, e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) return
      const px = (e.clientX - r.left) / r.width - 0.5
      const py = (e.clientY - r.top) / r.height - 0.5
      // 原本: rotateX ±5° ・ rotateY ±7°
      el.style.transition = "transform .1s ease"
      el.style.transform = `perspective(1400px) rotateX(${(-py * 10).toFixed(2)}deg) rotateY(${(px * 14).toFixed(2)}deg)`
    }
    const release = (el: HTMLElement) => {
      el.style.transition = "transform .5s cubic-bezier(.2,.8,.25,1)"
      el.style.transform = ""
      window.setTimeout(() => {
        if (!el.style.transform) el.style.transition = ""
      }, 520)
    }

    const move = (e: PointerEvent) => {
      if (e.pointerType === "mouse") {
        const t = (e.target as HTMLElement | null)?.closest?.(SELC) as HTMLElement | null
        if (t !== cur) {
          if (cur) release(cur)
          cur = t
        }
        if (t) apply(t, e)
      } else if (cur) {
        apply(cur, e)
      }
    }
    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return
      const t = (e.target as HTMLElement | null)?.closest?.(SELC) as HTMLElement | null
      if (t) {
        cur = t
        apply(t, e)
      }
    }
    const up = () => {
      if (cur) {
        release(cur)
        cur = null
      }
    }

    document.addEventListener("pointermove", move, { passive: true })
    document.addEventListener("pointerdown", down, { passive: true })
    document.addEventListener("pointerup", up, { passive: true })
    document.addEventListener("pointercancel", up, { passive: true })
    return () => {
      document.removeEventListener("pointermove", move)
      document.removeEventListener("pointerdown", down)
      document.removeEventListener("pointerup", up)
      document.removeEventListener("pointercancel", up)
      if (cur) release(cur)
    }
  }, [])
  return null
}
