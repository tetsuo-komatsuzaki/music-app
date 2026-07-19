"use client"

import { useState } from "react"
import styles from "./FavoriteButton.module.css"

export default function FavoriteButton({
  scoreId, practiceItemId, initialOn, size = "md",
}: {
  scoreId?: string
  practiceItemId?: string
  initialOn: boolean
  size?: "sm" | "md"
}) {
  const [on, setOn] = useState(initialOn)
  const [busy, setBusy] = useState(false)

  async function toggle() {
    if (busy) return
    const next = !on
    setOn(next)
    setBusy(true)
    try {
      const r = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scoreId, practiceItemId, on: next }),
      })
      if (!r.ok) setOn(!next) // 失敗時ロールバック
    } catch {
      setOn(!next)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "お気に入りから外す" : "お気に入りに追加"}
      className={`${styles.btn} ${size === "sm" ? styles.sm : ""} ${on ? styles.on : ""}`}
    >
      {on ? "♥" : "♡"}
    </button>
  )
}
