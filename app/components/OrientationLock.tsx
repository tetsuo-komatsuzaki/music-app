"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { lockPortrait } from "@/app/_libs/arcodaOrientation"

/**
 * アプリ全体を縦に固定する (2026-08-25 Tetsuo「録音のとき以外、画面を横にすることはない」)。
 *
 * アプリは横向きのレイアウトを持たないため、端末を回すと表示が崩れる。
 * 録音中だけ scoreDetail が lockLandscape() を呼んで横にし、終了時に
 * unlockOrientation() で解除する。解除後は再びここが縦へ戻す。
 *
 * - Web版・プラグイン未同梱の殻では NOOP (lockPortrait が false を返す)
 * - 画面遷移のたびに掛け直す。録音画面から戻ったときに縦へ復帰させるため
 * - 録音画面 (scores/[scoreId]) では掛けない。横固定と競合するため
 */
export default function OrientationLock() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === "undefined") return
    // 録音を伴う画面では触らない (横固定を上書きしてしまうため)
    if (/\/scores\/[^/]+/.test(pathname ?? "")) return
    void lockPortrait()
  }, [pathname])

  return null
}
