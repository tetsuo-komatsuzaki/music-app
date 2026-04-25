"use client"

import styles from "./Sidebar.module.css"
import { useParams, usePathname } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"
import { getUserRole } from "@/app/actions/getUserRole"

const BASE_NAV_ITEMS = [
  { path: "",         icon: "🏠", label: "ホーム" },
  { path: "scores",   icon: "🎵", label: "スコア一覧" },
  { path: "practice", icon: "📈", label: "練習メニュー" },
  { path: "progress", icon: "📊", label: "成長記録" },
]

const ADMIN_NAV_ITEM = { path: "admin/practice", icon: "⚙️", label: "管理" }

export default function Sidebar() {
  const params = useParams()
  const pathname = usePathname()
  const userId = params.userId as string
  const [isAdmin, setIsAdmin] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    getUserRole().then(role => {
      setIsAdmin(role === "admin")
    })
  }, [userId])

  const navItems = isAdmin ? [...BASE_NAV_ITEMS, ADMIN_NAV_ITEM] : BASE_NAV_ITEMS

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
      )}
    </aside>
  )
}
