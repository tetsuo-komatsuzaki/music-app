"use client"

import styles from "./Sidebar.module.css"
import { useParams, usePathname } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { getUserRole } from "@/app/actions/getUserRole"
import { createBrowserSupabaseClient } from "@/app/_libs/supabaseBrowser"
import { useOnboarding } from "../_onboarding/hooks/useOnboarding"

const BASE_NAV_ITEMS = [
  { path: "",         icon: "🏠", label: "ホーム" },
  { path: "scores",   icon: "🎵", label: "スコア一覧" },
  { path: "practice", icon: "📈", label: "練習メニュー" },
  { path: "progress", icon: "📊", label: "成長記録" },
]

const ADMIN_NAV_ITEM = { path: "admin/practice", icon: "⚙️", label: "管理" }

// アカウント系メニュー (S-1 で追加)
// 注: admin が ⚙️ を使っているため、設定は 🛠️ に変更して衝突回避
const ACCOUNT_NAV_ITEMS = [
  { path: "settings", icon: "🛠️", label: "設定" },
  { path: "support",  icon: "❓",  label: "サポート" },
]

export default function Sidebar() {
  const params = useParams()
  const pathname = usePathname()
  const userId = params.userId as string
  const [isAdmin, setIsAdmin] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const { openHelp } = useOnboarding()

  useEffect(() => {
    getUserRole().then(role => {
      setIsAdmin(role === "admin")
    })
  }, [userId])

  const navItems = isAdmin
    ? [...BASE_NAV_ITEMS, ADMIN_NAV_ITEM, ...ACCOUNT_NAV_ITEMS]
    : [...BASE_NAV_ITEMS, ...ACCOUNT_NAV_ITEMS]

  const handleLogout = async () => {
    // 録音中チェック (Recorder が window.__arcodaIsRecording を更新する)
    if (typeof window !== "undefined" && (window as { __arcodaIsRecording?: boolean }).__arcodaIsRecording === true) {
      const proceed = window.confirm("録音中です。ログアウトすると録音内容が失われます。続けますか?")
      if (!proceed) return
    }
    setIsOpen(false)
    const supabase = createBrowserSupabaseClient()
    const { error } = await supabase.auth.signOut({ scope: "local" })
    if (error) console.error("ログアウト失敗:", error)
    // hard redirect でクライアント状態を完全クリア
    window.location.href = "/login"
  }

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}>
      <button
        type="button"
        className={styles.toggleButton}
        onClick={() => setIsOpen(prev => !prev)}
        aria-label={isOpen ? "メニューを閉じる" : "メニューを開く"}
        aria-expanded={isOpen}
      >
        {isOpen ? "✕" : "☰"}
      </button>

      {isOpen && (
        <>
          <nav className={styles.nav}>
            {navItems.map(item => {
              const href = item.path === "" ? `/${userId}` : `/${userId}/${item.path}`
              const isActive =
                item.path === ""
                  ? pathname === `/${userId}` || pathname === `/${userId}/`
                  : pathname === href || pathname.startsWith(`${href}/`)

              return (
                <Link
                  key={item.path}
                  href={href}
                  onClick={() => setIsOpen(false)}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className={styles.bottomArea}>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                openHelp()
              }}
              className={styles.helpEntryButton}
              aria-label="使い方"
            >
              <span className={styles.navIcon}>📖</span>
              <span>使い方</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className={styles.logoutButton}
              aria-label="ログアウト"
            >
              <span className={styles.navIcon}>🚪</span>
              <span>ログアウト</span>
            </button>
          </div>
        </>
      )}
    </aside>
  )
}
