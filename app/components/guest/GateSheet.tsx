"use client"
/**
 * GateSheet — ゲストに登録かログインを促すシート (2026-09-06 Tetsuo確定)。
 *
 * 出る場所: 押した先の画面 (曲の詳細 ・ 教材の詳細 ・ 成長カルテ ・ 先生とのやりとり) の上、
 * またはその場 (ライブラリのアップロード ・ レッスンの行)。1 部品を全ゲート箇所で共用し、
 * 1 行目 (title) と「得られること」(items) だけ場所ごとに差し替える。
 *
 * ボタン: 無料で登録 (主・紺) ／ ログイン (従) ／ あとで (閉じる)。
 * 登録・ログインへ向かう前に returnTo cookie を置き、済んだら止められた場所へ戻す。
 */
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { setReturnToCookie } from "@/app/_libs/returnTo"
import { readKnownUser } from "@/app/_libs/knownUser"
import styles from "./GateSheet.module.css"

import type { GateItem } from "./gateText"
export type { GateItem }

export type GateSheetProps = {
  title: string
  items: GateItem[]
  /** 主ボタンの文言 (既定: 無料で登録する) */
  primaryLabel?: string
  /** 閉じたときの振る舞い。"bar" = 細い帯を残して再び開ける (ゲートされた画面用) ／ "hide" = 消す (その場のゲート用) */
  onLater?: () => void
  laterMode?: "bar" | "hide"
  /** 戻り先。省略時は今の URL */
  returnTo?: string
}

const SIGNUP = "/signUp"
const LOGIN = "/login"

export default function GateSheet({ title, items, primaryLabel = "無料で登録する", onLater, laterMode = "bar", returnTo }: GateSheetProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(true)
  const dest = returnTo ?? pathname ?? "/guest"
  // 案B (2026-09-06): 端末に記録がある人 (登録済み・未ログイン) は主ボタンをログインに、1 行目も「ログインが必要です」に
  const [known, setKnown] = useState(false)
  useEffect(() => { setKnown(readKnownUser() != null) }, [])
  const shownTitle = known ? title.replace("登録かログイン", "ログイン") : title

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") later() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const remember = () => setReturnToCookie(dest)
  const later = () => { setOpen(false); onLater?.() }
  const q = `?returnTo=${encodeURIComponent(dest)}`

  if (!open) {
    if (laterMode === "hide") return null
    return (
      <div className={styles.bar}>
        <button type="button" className={styles.barBtn} onClick={() => setOpen(true)}>
          <span>+</span>登録かログインで続ける
        </button>
      </div>
    )
  }
  return (
    <div className={styles.veil} role="dialog" aria-modal="true" aria-label={title} onClick={later}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.handle} />
        <div className={styles.eyebrow}>ARCODA</div>
        <b className={styles.title}>{shownTitle}</b>
        <div className={styles.list}>
          {items.map((it) => (
            <div key={it.title} className={styles.row}>
              <span className={styles.plus}>+</span>
              <span><b>{it.title}</b> ・ {it.detail}</span>
            </div>
          ))}
        </div>
        {known ? (
          <>
            <Link href={`${LOGIN}${q}`} className={styles.primary} onClick={remember}>ログイン</Link>
            <Link href={`${SIGNUP}${q}`} className={styles.secondary} onClick={remember}>アカウントがない人は無料で登録</Link>
          </>
        ) : (
          <>
            <Link href={`${SIGNUP}${q}`} className={styles.primary} onClick={remember}>{primaryLabel}</Link>
            <Link href={`${LOGIN}${q}`} className={styles.secondary} onClick={remember}>ログイン</Link>
          </>
        )}
        <button type="button" className={styles.later} onClick={later}>あとで</button>
      </div>
    </div>
  )
}
