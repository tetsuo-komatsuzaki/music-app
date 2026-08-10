"use client"

import { useCallback, useRef } from "react"

export type LongPressPos = { x: number; y: number }

type Handlers = {
  onPointerDown: (e: React.PointerEvent) => void
  onPointerMove: (e: React.PointerEvent) => void
  onPointerUp: (e: React.PointerEvent) => void
  onPointerCancel: (e: React.PointerEvent) => void
  onContextMenu: (e: React.MouseEvent) => void
}

/**
 * 長押しフック (Apple Music 風のコンテキストメニュー起動)。
 * - pointerdown から delay(既定470ms)後に onLongPress(payload, pos) を発火。
 * - moveTolerance(既定10px)を超える移動、pointerup/cancel でキャンセル。
 * - contextmenu は preventDefault (長押し中のネイティブメニュー抑止)。
 * - 長押し発火直後の click を抑制するため suppressNextClick() を提供。
 *   カードの onClick 側で `if (suppressNextClick()) return` を先頭に置く。
 *
 * 1 インスタンスで複数要素に対応。各要素には bind(payload) の返す props を展開する。
 */
export function useLongPress<T>(
  onLongPress: (payload: T, pos: LongPressPos) => void,
  opts?: { delay?: number; moveTolerance?: number },
) {
  const delay = opts?.delay ?? 470
  const tol = opts?.moveTolerance ?? 10

  const timer = useRef<number | null>(null)
  const start = useRef<LongPressPos>({ x: 0, y: 0 })
  const suppress = useRef(false)

  const clear = useCallback(() => {
    if (timer.current != null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  const suppressNextClick = useCallback(() => {
    if (suppress.current) {
      suppress.current = false
      return true
    }
    return false
  }, [])

  const bind = useCallback(
    (payload: T): Handlers => ({
      onPointerDown: (e) => {
        // 主ボタン以外 (右クリック等) は無視
        if (e.pointerType === "mouse" && e.button !== 0) return
        clear()
        start.current = { x: e.clientX, y: e.clientY }
        const pos = { x: e.clientX, y: e.clientY }
        timer.current = window.setTimeout(() => {
          timer.current = null
          suppress.current = true
          onLongPress(payload, pos)
        }, delay)
      },
      onPointerMove: (e) => {
        if (timer.current == null) return
        const dx = Math.abs(e.clientX - start.current.x)
        const dy = Math.abs(e.clientY - start.current.y)
        if (dx > tol || dy > tol) clear()
      },
      onPointerUp: () => clear(),
      onPointerCancel: () => clear(),
      onContextMenu: (e) => {
        // 長押し(タッチ)や右クリックのネイティブメニューを抑止
        e.preventDefault()
      },
    }),
    [clear, delay, onLongPress, tol],
  )

  return { bind, suppressNextClick }
}
