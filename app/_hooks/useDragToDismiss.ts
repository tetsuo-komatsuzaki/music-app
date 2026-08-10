"use client"

import { useCallback, useRef } from "react"

/**
 * 下スワイプでシートを閉じるフック (Apple Music 風)。
 * - 下方向のドラッグのみ追従 (上方向には動かさない)。
 * - 離した時、下方向の移動量が threshold(既定110px)を超えていれば onDismiss()。
 *   未満なら translateY を 0 に戻す。
 * - シート内スクロールと競合しないよう、ドラッグ開始は
 *   (a) ハンドル/上部などデータ属性 data-drag-handle を持つ要素の上、または
 *   (b) シートの scrollTop <= 0 のとき のみ有効。
 *
 * 返り値の ref を、対象シート要素 (スクロールコンテナ) に付ける。
 */
export function useDragToDismiss(
  onDismiss: () => void,
  opts?: { threshold?: number; handleSelector?: string },
) {
  const threshold = opts?.threshold ?? 110
  const handleSelector = opts?.handleSelector ?? "[data-drag-handle]"

  const ref = useRef<HTMLDivElement | null>(null)
  const startY = useRef(0)
  const dy = useRef(0)
  const dragging = useRef(false)
  const pointerId = useRef<number | null>(null)

  const setTransform = useCallback((y: number) => {
    const el = ref.current
    if (!el) return
    if (y <= 0) {
      el.style.transform = ""
      return
    }
    // わずかに減衰させて指離れの気持ちよさを出す
    el.style.transform = `translateY(${y}px)`
    el.style.opacity = String(Math.max(0.5, 1 - y / 600))
  }, [])

  const reset = useCallback((withTransition: boolean) => {
    const el = ref.current
    if (!el) return
    if (withTransition) {
      el.style.transition = "transform .2s ease, opacity .2s ease"
    }
    el.style.transform = ""
    el.style.opacity = ""
    if (withTransition) {
      const clear = () => {
        el.style.transition = ""
        el.removeEventListener("transitionend", clear)
      }
      el.addEventListener("transitionend", clear)
      // 念のためフォールバック
      window.setTimeout(clear, 260)
    }
  }, [])

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = ref.current
      if (!el) return
      // マウス右クリック等は無視
      if (e.pointerType === "mouse" && e.button !== 0) return
      const target = e.target as HTMLElement
      const onHandle = !!(handleSelector && target.closest(handleSelector))
      // ハンドル上、またはシートが一番上まで来ている時だけドラッグ開始を許可
      if (!onHandle && el.scrollTop > 0) return
      dragging.current = true
      startY.current = e.clientY
      dy.current = 0
      pointerId.current = e.pointerId
      el.style.transition = ""
    },
    [handleSelector],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging.current) return
      const delta = e.clientY - startY.current
      if (delta <= 0) {
        // 上方向へは追従しない (中身スクロールに委ねる)
        dy.current = 0
        setTransform(0)
        return
      }
      // 下方向ドラッグ確定: ポインタをキャプチャして中身スクロールを抑止
      if (pointerId.current != null && e.currentTarget.hasPointerCapture?.(pointerId.current) === false) {
        try { e.currentTarget.setPointerCapture(pointerId.current) } catch {}
      }
      dy.current = delta
      setTransform(delta)
    },
    [setTransform],
  )

  const finish = useCallback(() => {
    if (!dragging.current) return
    dragging.current = false
    const moved = dy.current
    dy.current = 0
    if (pointerId.current != null) {
      try { ref.current?.releasePointerCapture(pointerId.current) } catch {}
      pointerId.current = null
    }
    if (moved > threshold) {
      onDismiss()
      // onDismiss でアンマウントされる想定。残る場合に備えてリセットもしておく。
      reset(false)
    } else {
      reset(true)
    }
  }, [onDismiss, reset, threshold])

  const onPointerUp = useCallback(() => finish(), [finish])
  const onPointerCancel = useCallback(() => finish(), [finish])

  return {
    ref,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
  }
}
