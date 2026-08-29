"use client"

// アカウント ドロップダウン (2026-08-17 ナビ要件定義 SECTION 1-3)。
// サイドバー廃止に伴い、設定・サポート・使い方・先生モード・管理・ログアウトをここへ集約する。
// シートやページにはしない。右上のアイコンから吹き出しで開く。
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { User, Settings, GraduationCap, Wrench, BookOpen, LifeBuoy, LogOut } from "lucide-react"
import { createBrowserSupabaseClient } from "@/app/_libs/supabaseBrowser"
import { getUserRole } from "@/app/actions/getUserRole"
import { openHelp } from "../_onboarding/helpBus"
import styles from "./AccountMenu.module.css"

export default function AccountMenu({ role }: { role?: string }) {
  const { userId } = useParams<{ userId: string }>()
  const [open, setOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getUserRole().then((r) => setIsAdmin(r === "admin")).catch(() => {})
  }, [])

  // Escで閉じる。覆いのクリックは覆い側で処理する
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  const base = `/${userId}`
  const close = () => setOpen(false)

  const logout = async () => {
    // 録音中ガードは旧サイドバーの実装を踏襲する (Recorder が window.__arcodaIsRecording を更新)
    if (typeof window !== "undefined" && (window as { __arcodaIsRecording?: boolean }).__arcodaIsRecording === true) {
      const proceed = window.confirm("録音中です。ログアウトすると録音内容が失われます。続けますか?")
      if (!proceed) return
    }
    close()
    const supabase = createBrowserSupabaseClient()
    const { error } = await supabase.auth.signOut({ scope: "local" })
    if (error) console.error("ログアウト失敗:", error)
    // hard redirect でクライアント状態を完全クリア
    window.location.href = "/login"
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="アカウントメニュー"
        data-onboarding="nav.account"
      >
        <User size={21} strokeWidth={2.2} />
      </button>

      {open && (
        <>
          <div className={styles.veil} onClick={close} aria-hidden />
          <div className={styles.menu} role="menu">
            <Link href={`${base}/profile`} className={styles.item} onClick={close} role="menuitem">
              <span className={styles.ic}><User size={17} /></span>
              <span className={styles.body}>
                <span className={styles.label}>プロフィール</span>
              </span>
            </Link>
            <Link href={`${base}/settings`} className={styles.item} onClick={close} role="menuitem">
              <span className={styles.ic}><Settings size={17} /></span>
              <span className={styles.label}>設定</span>
            </Link>
            {role === "teacher" && (
              <Link href={`${base}/teacher`} className={`${styles.item} ${styles.gold}`} onClick={close} role="menuitem">
                <span className={styles.ic}><GraduationCap size={17} /></span>
                <span className={styles.label}>先生モードへ</span>
                <span className={styles.chip}>切替</span>
              </Link>
            )}
            {isAdmin && (
              <Link href={`${base}/admin/practice`} className={`${styles.item} ${styles.gold}`} onClick={close} role="menuitem">
                <span className={styles.ic}><Wrench size={17} /></span>
                <span className={styles.label}>管理</span>
                <span className={styles.chip}>切替</span>
              </Link>
            )}

            <div className={styles.sep} />

            <button type="button" className={styles.item} onClick={() => { close(); openHelp() }} role="menuitem">
              <span className={styles.ic}><BookOpen size={17} /></span>
              <span className={styles.label}>使い方</span>
            </button>
            <Link href={`${base}/support`} className={styles.item} onClick={close} role="menuitem">
              <span className={styles.ic}><LifeBuoy size={17} /></span>
              <span className={styles.label}>サポート</span>
            </Link>

            <div className={styles.sep} />

            <button type="button" className={`${styles.item} ${styles.danger}`} onClick={logout} role="menuitem">
              <span className={styles.ic}><LogOut size={17} /></span>
              <span className={styles.label}>ログアウト</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
