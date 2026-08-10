"use client"

import { useEffect } from "react"

/**
 * 軽い触覚フィードバック (2026-08-11)。
 * 操作要素の pointerdown で navigator.vibrate?.(8) を1回呼ぶ。
 * - Android 等の対応端末のみ振動。iOS Safari は vibrate 未実装 → no-op。
 * - document に capture リスナーを1つだけ張り、クリーンアップする。
 * - SSR 安全 (useEffect 内で window / navigator を参照)。
 */
export default function HapticProvider() {
  useEffect(() => {
    if (typeof window === "undefined") return
    const vibrate = navigator.vibrate?.bind(navigator)
    if (!vibrate) return

    let last = 0
    const onDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null
      if (!t || typeof t.closest !== "function") return
      if (!t.closest("button, [role=button], a.pressable")) return
      const now = e.timeStamp || Date.now()
      if (now - last < 40) return // 重複防止
      last = now
      try { vibrate(8) } catch {}
    }

    document.addEventListener("pointerdown", onDown, { capture: true, passive: true })
    return () => document.removeEventListener("pointerdown", onDown, { capture: true } as EventListenerOptions)
  }, [])

  return null
}
