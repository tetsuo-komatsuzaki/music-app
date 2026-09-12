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
import { usePathname, useRouter } from "next/navigation"
import { setReturnToCookie } from "@/app/_libs/returnTo"
import { isAppleBilling } from "@/app/_libs/billingMode"
import { startGuestTry } from "@/app/_libs/guestTryClient"
import { readKnownUser } from "@/app/_libs/knownUser"
import { recordGuestEvent } from "@/app/actions/recordGuestEvent"
import { placeOf } from "@/app/_libs/guestEvents"
import styles from "./GateSheet.module.css"

import type { GateItem } from "./gateText"
export type { GateItem }

export type GateSheetProps = {
  title: string
  items: GateItem[]
  /** 主ボタンの文言 (既定: Apple 課金なら「はじめる」、それ以外は「登録する」) */
  primaryLabel?: string
  /** 閉じたときの振る舞い。"bar" = 細い帯を残して再び開ける (ゲートされた画面用) ／ "hide" = 消す (その場のゲート用) */
  onLater?: () => void
  laterMode?: "bar" | "hide"
  /** 戻り先。省略時は今の URL */
  returnTo?: string
  /** 1 回ためし (2026-09-12): この曲を登録なしで採点させる。主ボタンが「登録なしで 1 回ためす」になり、従が「はじめる」 */
  tryScoreId?: string
  /** 主ボタンの飛び先を差し替える (契約切れの「再開する」→ /start など) */
  primaryHref?: string
  /** 「あとで」を出さない (ハードペイウォール的に使うとき) */
  noLater?: boolean
}

const SIGNUP = "/signUp"
const LOGIN = "/login"
const START = "/start"

export default function GateSheet({ title, items, primaryLabel, onLater, laterMode = "bar", returnTo, tryScoreId, primaryHref, noLater }: GateSheetProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(true)
  const [trying, setTrying] = useState(false)
  const [tryError, setTryError] = useState<string | null>(null)
  const dest = returnTo ?? pathname ?? "/guest"
  // Apple 課金 (2026-09-12): 登録の入口は /start (アルコプラスをはじめる)。Stripe (従来) は /signUp
  const apple = isAppleBilling()
  const startHref = primaryHref ?? (apple ? START : SIGNUP)
  const startLabel = primaryLabel ?? (apple ? "はじめる" : "登録する")

  const onTry = async () => {
    if (!tryScoreId || trying) return
    setTrying(true); setTryError(null)
    void recordGuestEvent("try_start", place, pathname)
    const r = await startGuestTry(tryScoreId)
    if (r.ok) { router.push(r.href); return }
    setTrying(false); setTryError(r.error)
  }
  // 案B (2026-09-06): 端末に記録がある人 (登録済み・未ログイン) は主ボタンをログインに、1 行目も「ログインが必要です」に
  const [known, setKnown] = useState(false)
  useEffect(() => { setKnown(readKnownUser() != null) }, [])
  // 計測 (2026-09-06): シートが出た場所と、そこから進んだか去ったか。場所は URL から決める
  const place = placeOf(pathname ?? "")
  useEffect(() => { void recordGuestEvent("gate_shown", place, pathname) }, [place, pathname])
  const shownTitle = known ? title.replace("登録かログイン", "ログイン") : title

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") later() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const remember = (kind: "gate_signup" | "gate_login") => () => { setReturnToCookie(dest); void recordGuestEvent(kind, place, pathname) }
  const later = () => { setOpen(false); onLater?.(); void recordGuestEvent("gate_later", place, pathname) }
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
        {tryScoreId ? (
          <>
            <button type="button" className={styles.primary} disabled={trying} onClick={() => void onTry()}>{trying ? "準備しています…" : "登録なしで 1 回ためす"}</button>
            {tryError && <div className={styles.row} style={{ marginTop: 8, color: "var(--text-error)" }}>{tryError}</div>}
            <Link href={startHref} className={styles.secondary} onClick={remember("gate_signup")}>{startLabel}</Link>
            <Link href={`${LOGIN}${q}`} className={styles.later} onClick={remember("gate_login")} style={{ textDecoration: "none" }}>ログイン</Link>
          </>
        ) : known ? (
          <>
            <Link href={`${LOGIN}${q}`} className={styles.primary} onClick={remember("gate_login")}>ログイン</Link>
            <Link href={startHref} className={styles.secondary} onClick={remember("gate_signup")}>アカウントがない人は{startLabel}</Link>
          </>
        ) : (
          <>
            <Link href={startHref} className={styles.primary} onClick={remember("gate_signup")}>{startLabel}</Link>
            <Link href={`${LOGIN}${q}`} className={styles.secondary} onClick={remember("gate_login")}>ログイン</Link>
          </>
        )}
        {!noLater && !tryScoreId && <button type="button" className={styles.later} onClick={later}>あとで</button>}
      </div>
    </div>
  )
}
