"use client"
/**
 * 登録済みだがログインしていない人のホーム (2026-09-06 Tetsuo確定)。
 * 見本ではなく、その人がログイン中に見ていたホームを、端末に残した写し (snapshot) でそのまま描く。
 * 上に「ログアウト中」の帯とログインボタンを置く。写しの中のリンクは /guest/... に向くので、
 * ログインが要る先は各ページのゲート (シート) で止まる。写しが無い (古い端末など) ときは名前だけのあいさつ。
 */
import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import ds from "@/app/components/ds.module.css"
import HomeClient from "@/app/[userId]/home"
import { readKnownUser, type KnownUser } from "@/app/_libs/knownUser"
import { setReturnToCookie } from "@/app/_libs/returnTo"
import { GUEST_ID } from "@/app/_libs/viewer"
import styles from "./guestHome.module.css"

const LOGIN = `/login?returnTo=${encodeURIComponent(`/${GUEST_ID}`)}`

type HomeProps = React.ComponentProps<typeof HomeClient>

// 写しの中のリンクは本人の /<uuid>/... で作られているので、/guest/... に付け替える。
// ログインが要る先は各ページのゲートで止まり、ログイン後は元の本人ページに戻る (returnTo)
const UUID_PREFIX = /^\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=\/|$)/i
function toGuestLinks<T>(v: T): T {
  if (typeof v === "string") return v.replace(UUID_PREFIX, `/${GUEST_ID}`) as T
  if (Array.isArray(v)) return v.map(toGuestLinks) as T
  if (v && typeof v === "object") {
    const o: Record<string, unknown> = {}
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) o[k] = toGuestLinks(x)
    return o as T
  }
  return v
}

export default function ReturningHome() {
  // 初期値を localStorage から同期的に読む (描画後の setState を避ける)。SSR 中は null
  const [known] = useState<KnownUser | null>(() => (typeof window === "undefined" ? null : readKnownUser()))
  const [mounted, setMounted] = useState(false)
  const sp = useSearchParams()
  const [toast, setToast] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 0)
    return () => window.clearTimeout(t)
  }, [])
  useEffect(() => {
    if (sp?.get("loggedOut") !== "1") return
    const on = window.setTimeout(() => setToast(true), 0)
    const off = window.setTimeout(() => setToast(false), 2800)
    return () => { window.clearTimeout(on); window.clearTimeout(off) }
  }, [sp])

  if (!mounted || !known) return null
  const remember = () => setReturnToCookie(`/${GUEST_ID}`)
  const snapshot = known.snapshot ? toGuestLinks(known.snapshot as unknown as HomeProps) : null

  return (
    <div data-returning-home>
      {toast && <div className={styles.toast} role="status">ログアウトしました</div>}
      <div className={styles.loggedOutBar}>
        <div className={styles.loggedOutText}>
          <b>ログアウト中</b>
          <span>{known.name ? `${known.name}さんの前回の画面です` : "前回の画面です"}。ログインすると続きから練習できます</span>
        </div>
        <Link href={LOGIN} className={styles.loggedOutBtn} onClick={remember}>ログイン</Link>
      </div>
      {snapshot ? (
        <HomeClient {...snapshot} />
      ) : (
        <div className={ds.card}>
          <div className={ds.lab}>前回の画面</div>
          <div className={ds.row} style={{ marginTop: 8 }}>
            <div className={ds.rowMain}><b>ログインすると戻ります</b><span>この端末にはまだ画面の写しがありません</span></div>
          </div>
        </div>
      )}
    </div>
  )
}
