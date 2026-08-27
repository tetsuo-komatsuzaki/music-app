"use client"

// B群の実機適用 (2026-08-21 Tetsuo指示・リバイス4)。原本 uiv2/app.v2.motion.css の .phone 演出。
//   B2 3Dチルト: perspective(1400px) rotateX ±5° rotateY ±7°。離れると 0.5s
//     cubic-bezier(.2,.8,.25,1) で戻る (原本値)。マウス=ホバー追従 / 実機=押している間 指に追従。
//     対象はカード (ds.card / data-anim="block")。
//   B4 ノッチ+ベゼル: 10px の黒ベゼル + 上部中央 104×24 の丸角バー (Dynamic Island 風)。
//     画面全体を端末フレームに見立てる装飾。操作は透過 (pointer-events none)。
import { useEffect } from "react"
import ds from "./ds.module.css"

/* 2026-08-28: DeviceFrame (黒いベゼル + ノッチの絵) を削除。
   モックの端末枠を再現する部品だったが、実機の画面の上にもう一台ぶんの
   スマホの縁とノッチを描いてしまい、四隅が黒く欠けていた。使用箇所なし。 */

export default function TiltEffect() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    // リバイス8: チルトはカードのみ。ボタン類の押下は E3' (上品な押下) が担当
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

    // 原本どおりの「ホバー追従」。実機 (ホバー無し) は「指が触れている間」をホバーとみなし、
    // 指の下にあるカードを常に追従させる (押した最初のカード固定にしない・2026-08-21 修正)。
    // タッチ中の pointermove は target が捕捉要素に固定されるため elementFromPoint で引き直す
    let touching = false
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && !touching) return
      const under = document.elementFromPoint(e.clientX, e.clientY)
      let t = (under as HTMLElement | null)?.closest?.(SELC) as HTMLElement | null
      // 横レール内は対象外 (長押しドラッグで上下に傾いて見える事故の防止 2026-08-21)
      if (t?.closest("[data-no-tilt]")) t = null
      if (t !== cur) {
        if (cur) release(cur)
        cur = t
      }
      if (t) apply(t, e)
    }
    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return
      touching = true
      move(e)
    }
    const up = () => {
      touching = false
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
