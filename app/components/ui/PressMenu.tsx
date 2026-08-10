"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import type { LucideIcon } from "lucide-react"

export type PressMenuItem = {
  label: string
  icon?: LucideIcon
  danger?: boolean
  onSelect: () => void
}

/**
 * 長押しで開く小さなアクションメニュー (Apple Music 風)。
 * - anchor(ポインタ座標)付近に表示し、画面端でクランプ。
 * - 外側タップ / 項目選択 / Esc で閉じる。
 * - lucide アイコン対応・絵文字なし。
 */
export default function PressMenu({
  anchor,
  items,
  onClose,
}: {
  anchor: { x: number; y: number }
  items: PressMenuItem[]
  onClose: () => void
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  if (!mounted) return null

  const MENU_W = 184
  const pad = 8
  const vw = typeof window !== "undefined" ? window.innerWidth : 360
  const vh = typeof window !== "undefined" ? window.innerHeight : 640
  const estH = items.length * 44 + 8
  let left = anchor.x - MENU_W / 2
  left = Math.max(pad, Math.min(left, vw - MENU_W - pad))
  let top = anchor.y + 6
  if (top + estH > vh - pad) top = Math.max(pad, anchor.y - estH - 6)

  return createPortal(
    <div
      onClick={onClose}
      onPointerDown={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: "fixed", inset: 0, zIndex: 1200 }}
    >
      <div
        role="menu"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          top,
          left,
          width: MENU_W,
          background: "var(--background, #fff)",
          borderRadius: 14,
          boxShadow: "0 12px 40px rgba(0,0,0,.24)",
          border: "1px solid rgba(0,0,0,.08)",
          overflow: "hidden",
          padding: 4,
          animation: "pressMenuIn .14s ease both",
        }}
      >
        <style>{`@keyframes pressMenuIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:none}}`}</style>
        {items.map((it, i) => {
          const Icon = it.icon
          return (
            <button
              key={i}
              type="button"
              role="menuitem"
              onClick={() => { onClose(); it.onSelect() }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: "11px 12px",
                borderRadius: 10,
                fontSize: "var(--fs-body)",
                fontWeight: 700,
                textAlign: "left",
                color: it.danger ? "var(--text-error)" : "var(--text-ink)",
              }}
            >
              {Icon && <Icon size={16} style={{ flex: "none" }} />}
              <span style={{ flex: 1 }}>{it.label}</span>
            </button>
          )
        })}
      </div>
    </div>,
    document.body,
  )
}
