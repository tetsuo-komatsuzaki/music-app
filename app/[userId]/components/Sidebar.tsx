"use client"

import styles from "./Sidebar.module.css"
import { useParams, usePathname } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { getUserRole } from "@/app/actions/getUserRole"
import { getTeacherStudentSummary } from "@/app/actions/teacherStudentViews"
import { createBrowserSupabaseClient } from "@/app/_libs/supabaseBrowser"
import { useOnboarding } from "../_onboarding/hooks/useOnboarding"
// 文言/アイコンの世界観統一 (2026-08-09): 絵文字→SVGアイコン(lucide)。currentColorで既存の文字色を継承。
import { Home, Library, Dumbbell, NotebookPen, MessageCircle, Search, Wrench, Settings, LifeBuoy, BookOpen, LogOut, X, Menu, type LucideIcon } from "lucide-react"

type NavItem = { path: string; Icon: LucideIcon; label: string }

const BASE_NAV_ITEMS: NavItem[] = [
  { path: "",         Icon: Home,       label: "ホーム" },
  { path: "scores",   Icon: Library,    label: "マイライブラリー" },
  { path: "practice", Icon: Dumbbell,   label: "練習メニュー" },
  // 学びのレッスンは練習メニュー内のカードから遷移 (2026-07-14 Tetsuo指示でサイドバーから移設)
  { path: "progress", Icon: NotebookPen, label: "成長カルテ" },
  // 「マイページ」は「あなたの課題」を成長記録タブへ移設したため削除。
  // /profile ルート自体は graceful に残置 (bookmark fallback)。
]

const ADMIN_NAV_ITEM: NavItem = { path: "admin/practice", Icon: Wrench, label: "管理" }
// 先生機能 (2026-07-28)。先生の有無で1項目を出し分ける。
const TEACHER_NAV_ITEM: NavItem = { path: "my-teacher", Icon: MessageCircle, label: "先生とのやりとり" }
const FIND_TEACHER_NAV_ITEM: NavItem = { path: "find-teacher", Icon: Search, label: "先生を探す" }

// アカウント系メニュー (S-1 で追加)
const ACCOUNT_NAV_ITEMS: NavItem[] = [
  { path: "settings", Icon: Settings, label: "設定" },
  { path: "support",  Icon: LifeBuoy, label: "サポート" },
]

export default function Sidebar() {
  const params = useParams()
  const pathname = usePathname()
  const userId = params.userId as string
  const [isAdmin, setIsAdmin] = useState(false)
  const [hasTeacher, setHasTeacher] = useState(false)
  const [unread, setUnread] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const { openHelp } = useOnboarding()

  useEffect(() => {
    getUserRole().then(role => {
      setIsAdmin(role === "admin")
    })
    // 先生を登録している生徒だけ「先生とのやりとり」を出す。未読数もバッジ用に取得
    getTeacherStudentSummary().then(s => {
      setHasTeacher(s.hasTeacher)
      setUnread(s.unreadMessages)
    }).catch(() => {})
  }, [userId])

  const navItems = [
    ...BASE_NAV_ITEMS,
    ...(hasTeacher ? [TEACHER_NAV_ITEM] : [FIND_TEACHER_NAV_ITEM]),
    ...(isAdmin ? [ADMIN_NAV_ITEM] : []),
    ...ACCOUNT_NAV_ITEMS,
  ]

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
        data-onboarding="nav.toggle"
        onClick={() => setIsOpen(prev => !prev)}
        aria-label={isOpen ? "メニューを閉じる" : "メニューを開く"}
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={22} strokeWidth={2.2} /> : <Menu size={22} strokeWidth={2.2} />}
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

              // オンボのガイドが指せるよう、ホーム / マイライブラリーに目印を付ける
              const onbKey = item.path === "" ? "nav.home" : item.path === "scores" ? "nav.library" : undefined
              const Icon = item.Icon
              return (
                <Link
                  key={item.path}
                  href={href}
                  onClick={() => setIsOpen(false)}
                  data-onboarding={onbKey}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                >
                  <span className={styles.navIcon}><Icon size={20} strokeWidth={2} /></span>
                  <span>{item.label}</span>
                  {item.path === "my-teacher" && unread > 0 && (
                    <span
                      aria-label={`未読${unread}件`}
                      style={{ marginLeft: "auto", minWidth: 18, height: 18, padding: "0 5px", borderRadius: 999, background: "#e5484d", color: "var(--text-on-accent)", fontSize: "var(--fs-caption)", fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                    >
                      {unread}
                    </span>
                  )}
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
              <span className={styles.navIcon}><BookOpen size={20} strokeWidth={2} /></span>
              <span>使い方</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className={styles.logoutButton}
              aria-label="ログアウト"
            >
              <span className={styles.navIcon}><LogOut size={20} strokeWidth={2} /></span>
              <span>ログアウト</span>
            </button>
          </div>
        </>
      )}
    </aside>
  )
}
