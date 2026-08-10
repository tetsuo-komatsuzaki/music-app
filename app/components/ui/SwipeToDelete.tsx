"use client"

import { useCallback, useRef, useState } from "react"
import { Trash2 } from "lucide-react"

/**
 * 横スワイプで削除 (Apple Music / iOS のリスト削除風)。
 * - 左方向ドラッグで前面が寄り、REVEAL(既定72px)を超えて離すと削除ボタンが露出。
 * - 露出した削除ボタンのタップで onDelete()。
 * - 縦スクロールを妨げないよう touch-action:pan-y。横移動が縦より優勢な時だけ
 *   横ドラッグを掴む (それ以外は掴まずスクロールに委ねる)。
 *
 * 注意: 横スクロールするコンテナ内で使う場合、pan-y により当該要素上での
 * タッチ横スクロールは無効化される (JS が横方向を占有するため)。
 */
export default function SwipeToDelete({
  children,
  onDelete,
  reveal = 72,
  ariaLabel = "削除",
}: {
  children: React.ReactNode
  onDelete: () => void
  reveal?: number
  ariaLabel?: string
}) {
  const [tx, setTx] = useState(0)
  const [open, setOpen] = useState(false)
  const fgRef = useRef<HTMLDivElement | null>(null)
  const startX = useRef(0)
  const startY = useRef(0)
  const baseTx = useRef(0)
  const axis = useRef<null | "h" | "v">(null)
  const active = useRef(false)
  const withTransition = useRef(true)

  const settle = useCallback((toOpen: boolean) => {
    withTransition.current = true
    setOpen(toOpen)
    setTx(toOpen ? -reveal : 0)
  }, [reveal])

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return
    active.current = true
    axis.current = null
    startX.current = e.clientX
    startY.current = e.clientY
    baseTx.current = open ? -reveal : 0
    withTransition.current = false
  }, [open, reveal])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!active.current) return
    const dx = e.clientX - startX.current
    const dy = e.clientY - startY.current
    if (axis.current == null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
      // 横が縦より優勢な時だけ横ドラッグを掴む
      if (Math.abs(dx) > Math.abs(dy)) {
        axis.current = "h"
        try { e.currentTarget.setPointerCapture(e.pointerId) } catch {}
      } else {
        axis.current = "v"
      }
    }
    if (axis.current !== "h") return
    let next = baseTx.current + dx
    if (next > 0) next = 0
    if (next < -(reveal + 24)) next = -(reveal + 24) // 少しだけ引っ張れる
    withTransition.current = false
    setTx(next)
  }, [reveal])

  const finish = useCallback((e?: React.PointerEvent<HTMLDivElement>) => {
    if (!active.current) return
    active.current = false
    if (e) { try { e.currentTarget.releasePointerCapture(e.pointerId) } catch {} }
    if (axis.current !== "h") return
    axis.current = null
    settle(tx <= -reveal)
  }, [reveal, settle, tx])

  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      {/* 背面: 削除ボタン */}
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDelete() }}
        tabIndex={open ? 0 : -1}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: reveal,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          background: "var(--text-error, #c0392b)",
          color: "#fff",
          cursor: "pointer",
          opacity: open || tx < 0 ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      >
        <Trash2 size={18} />
      </button>
      {/* 前面: 中身 */}
      <div
        ref={fgRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finish}
        onPointerCancel={finish}
        style={{
          transform: `translateX(${tx}px)`,
          transition: withTransition.current ? "transform .2s ease" : "none",
          touchAction: "pan-y",
          background: "var(--background, #fff)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {children}
      </div>
    </div>
  )
}
