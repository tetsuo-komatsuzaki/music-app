"use client"

import { useEffect, useState } from "react"

const RESOLVE_TIMEOUT_MS = 5000

export type TargetRectResult = {
  rect: DOMRect | null
  resolved: boolean
}

/**
 * data-onboarding="<targetKey>" な要素を検索し、bbox を追跡する。
 * - 即時に見つかれば ResizeObserver / scroll listener で追跡
 * - 見つからない場合は MutationObserver で出現を待つ
 * - 5 秒タイムアウトで諦め、rect = null + resolved = true (画面中央フォールバック)
 *
 * targetKey が null の場合は { rect: null, resolved: true } をすぐ返す
 */
export function useTargetRect(targetKey: string | null): TargetRectResult {
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [resolved, setResolved] = useState(false)

  useEffect(() => {
    if (targetKey === null) {
      setRect(null)
      setResolved(true)
      return
    }
    if (typeof document === "undefined") return

    setResolved(false)
    setRect(null)

    let cancelled = false
    let resizeObserver: ResizeObserver | null = null
    let mutationObserver: MutationObserver | null = null
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const selector = `[data-onboarding="${targetKey}"]`

    const measure = (el: Element) => {
      if (cancelled) return
      const r = el.getBoundingClientRect()
      setRect(r)
    }

    const onScrollOrResize = () => {
      if (cancelled) return
      const el = document.querySelector(selector)
      if (el) measure(el)
    }

    const tryResolve = (): boolean => {
      const el = document.querySelector(selector)
      if (!el) return false

      // ターゲットを画面中央にスムーススクロール (見切れ防止)
      // smooth scroll の進行に応じて scroll listener が rect を逐次更新するため、
      // spotlight はスクロールに追従する
      try {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
      } catch {
        // 旧ブラウザで options が未対応の場合のフォールバック
        el.scrollIntoView()
      }

      measure(el)
      setResolved(true)

      // ResizeObserver: 要素サイズ変化を追跡
      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => measure(el))
        resizeObserver.observe(el)
      }
      // scroll / resize: 位置変化を追跡 (capture: true で先取り)
      window.addEventListener("scroll", onScrollOrResize, { passive: true, capture: true })
      window.addEventListener("resize", onScrollOrResize, { passive: true })
      return true
    }

    if (tryResolve()) {
      return () => {
        cancelled = true
        resizeObserver?.disconnect()
        window.removeEventListener("scroll", onScrollOrResize, { capture: true } as EventListenerOptions)
        window.removeEventListener("resize", onScrollOrResize)
      }
    }

    // 即解決失敗: MutationObserver で出現を待つ
    if (typeof MutationObserver !== "undefined") {
      mutationObserver = new MutationObserver(() => {
        if (cancelled) return
        if (tryResolve()) {
          mutationObserver?.disconnect()
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }
        }
      })
      mutationObserver.observe(document.body, { childList: true, subtree: true })
    }

    // タイムアウトで諦め (画面中央フォールバック)
    timeoutId = setTimeout(() => {
      if (cancelled) return
      mutationObserver?.disconnect()
      setRect(null)
      setResolved(true)
    }, RESOLVE_TIMEOUT_MS)

    return () => {
      cancelled = true
      mutationObserver?.disconnect()
      resizeObserver?.disconnect()
      if (timeoutId) clearTimeout(timeoutId)
      window.removeEventListener("scroll", onScrollOrResize, { capture: true } as EventListenerOptions)
      window.removeEventListener("resize", onScrollOrResize)
    }
  }, [targetKey])

  return { rect, resolved }
}
