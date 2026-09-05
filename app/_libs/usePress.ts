"use client"
/**
 * usePress — 「押して離したら必ず動く」ボタンのハンドラ (2026-09-05 Tetsuo指摘: 採点ボタンの反応が悪い)。
 *
 * iOS Safari / WKWebView は指を置いたまま 0.5 秒ほど経つと、そのタッチを「長押し」と判断して
 * タッチ列を打ち切る (touchcancel / pointercancel)。その後に指を離しても touchend も click も来ない。
 * CSS (globals.css) で文字選択とプレビューは止めたが、打ち切り自体は止まらなかった。
 *
 * 対策 (2段):
 *  1. touchstart を passive:false で受けて preventDefault する。これで iOS の長押しジェスチャが始まらず、
 *     タッチ列が最後まで届く (touchend で動かす)。
 *  2. それでも打ち切られた (touchcancel) ときは、指が動いていなければ「押して離した」とみなして動かす。
 *  - 指が 12px 以上動いたら取り消し (スクロールのつもり)
 *  - タッチで動かした直後の click は二重発火しないよう無視する
 *  - 同じボタンを 250ms 以内に2度動かさない (連打・二重タップの誤爆を防ぐ)
 *  - マウス・キーボード・支援技術・テストの element.click() は onClick 経路でそのまま動く
 *
 * ref はコールバック ref。ボタンが後から現れる (録音後に出る採点ボタンなど) 場合でも、
 * その DOM が付いた瞬間にリスナーを付ける。useEffect 1回きりでは付け損ねる (2026-09-05 の欠陥)。
 */
import { useCallback, useEffect, useRef } from "react"
import type { MouseEvent as ReactMouseEvent } from "react"

const MOVE_TOLERANCE_PX = 12
const CLICK_SUPPRESS_MS = 700
const REPEAT_GUARD_MS = 250

export function usePress<T extends HTMLElement = HTMLButtonElement>(onPress: () => void) {
  const onPressRef = useRef(onPress)
  useEffect(() => { onPressRef.current = onPress }, [onPress])
  const firedAt = useRef(0)
  const detach = useRef<(() => void) | null>(null)

  const fire = useCallback((el: HTMLElement) => {
    if ((el as unknown as { disabled?: boolean }).disabled) return
    const now = Date.now()
    if (now - firedAt.current < REPEAT_GUARD_MS) return
    firedAt.current = now
    onPressRef.current()
  }, [])

  const ref = useCallback((el: T | null) => {
    detach.current?.()
    detach.current = null
    if (!el) return
    let start: { x: number; y: number } | null = null
    let moved = false

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0]
      if (!t) return
      // 長押しジェスチャ (選択・コールアウト) を始めさせない。合成 click も止まるので touchend 側で動かす。
      if (e.cancelable) e.preventDefault()
      start = { x: t.clientX, y: t.clientY }
      moved = false
    }
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0]
      if (!start || !t) return
      if (Math.hypot(t.clientX - start.x, t.clientY - start.y) > MOVE_TOLERANCE_PX) moved = true
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (!start) return
      const t = e.changedTouches[0]
      if (t && Math.hypot(t.clientX - start.x, t.clientY - start.y) > MOVE_TOLERANCE_PX) moved = true
      start = null
      if (e.cancelable) e.preventDefault()
      if (!moved) fire(el)
    }
    const onTouchCancel = () => {
      // OS がタッチ列を打ち切った。動いていなければ「押して離した」とみなす (長押しでも動く)。
      if (!start) return
      start = null
      if (!moved) fire(el)
    }
    const onContextMenu = (e: Event) => e.preventDefault()

    el.addEventListener("touchstart", onTouchStart, { passive: false })
    el.addEventListener("touchmove", onTouchMove, { passive: true })
    el.addEventListener("touchend", onTouchEnd, { passive: false })
    el.addEventListener("touchcancel", onTouchCancel)
    el.addEventListener("contextmenu", onContextMenu)
    detach.current = () => {
      el.removeEventListener("touchstart", onTouchStart)
      el.removeEventListener("touchmove", onTouchMove)
      el.removeEventListener("touchend", onTouchEnd)
      el.removeEventListener("touchcancel", onTouchCancel)
      el.removeEventListener("contextmenu", onContextMenu)
    }
  }, [fire])

  const onClick = useCallback((e: ReactMouseEvent<T>) => {
    if (Date.now() - firedAt.current < CLICK_SUPPRESS_MS) { e.preventDefault(); return }
    fire(e.currentTarget)
  }, [fire])

  return { ref, onClick }
}
