"use client"
/**
 * usePress — 「押して離したら必ず動く」ボタンのハンドラ (2026-09-05 Tetsuo指摘: 採点ボタンの反応が悪い)。
 *
 * iOS Safari は指を置いたまま 0.5 秒ほど経つと、そのタップを click として成立させないことがある
 * (長押し扱い)。CSS で文字選択とプレビューは止めた (globals.css) が、それでも長めに押すと反応しない。
 * ここでは click に頼らず、ボタン上で pointerdown → pointerup したら、押していた時間に関係なく動かす。
 *  - 指が 12px 以上動いたら取り消し (スクロールのつもり)
 *  - pointerup で動かした直後の click は二重発火しないよう無視する
 *  - キーボードや支援技術、テストの element.click() は onClick 経路でそのまま動く
 */
import { useCallback, useRef } from "react"
import type { PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent } from "react"

const MOVE_TOLERANCE_PX = 12
const CLICK_SUPPRESS_MS = 700

export function usePress<T extends HTMLElement = HTMLButtonElement>(onPress: () => void) {
  const start = useRef<{ x: number; y: number; id: number } | null>(null)
  const firedAt = useRef(0)

  const onPointerDown = useCallback((e: ReactPointerEvent<T>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
  }, [])

  const onPointerUp = useCallback((e: ReactPointerEvent<T>) => {
    const s = start.current
    start.current = null
    if (!s || s.id !== e.pointerId) return
    if (Math.hypot(e.clientX - s.x, e.clientY - s.y) > MOVE_TOLERANCE_PX) return
    if ((e.currentTarget as unknown as { disabled?: boolean }).disabled) return
    firedAt.current = Date.now()
    onPress()
  }, [onPress])

  const onPointerCancel = useCallback(() => { start.current = null }, [])

  const onClick = useCallback((e: ReactMouseEvent<T>) => {
    if (Date.now() - firedAt.current < CLICK_SUPPRESS_MS) { e.preventDefault(); return }
    onPress()
  }, [onPress])

  return { onPointerDown, onPointerUp, onPointerCancel, onPointerLeave: onPointerCancel, onClick }
}
