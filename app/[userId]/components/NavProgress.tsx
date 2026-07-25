"use client"

// 画面遷移が起きたことをユーザーに知らせる、画面上部の細い進捗バー。
// ルート遷移中は各 loading.tsx が本文側の待ちを見せるが、同一ルート内のクエリ切替
// (例: ?tab=review) では何も出ないため、URL の変化を検知して常に短いバーを出す。
// クリック → バーが即出て、着地でスッと消える。

import { useEffect, useRef, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

export default function NavProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const key = pathname + "?" + searchParams.toString()

  const [phase, setPhase] = useState<"idle" | "run" | "done">("idle")
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    // 新しい URL に着地 → 一気に満たして、少ししてフェードアウト
    setPhase("run")
    const t1 = setTimeout(() => setPhase("done"), 420)
    const t2 = setTimeout(() => setPhase("idle"), 720)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [key])

  const width = phase === "run" ? "85%" : phase === "done" ? "100%" : "0%"
  const opacity = phase === "idle" ? 0 : 1

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 3000,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          height: "100%",
          width,
          opacity,
          background: "linear-gradient(90deg,#2563EB,#3B82F6)",
          boxShadow: "0 0 8px rgba(59,130,246,0.6)",
          transition: "width 0.4s ease, opacity 0.3s ease",
        }}
      />
    </div>
  )
}
