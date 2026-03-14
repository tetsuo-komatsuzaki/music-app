"use client"

import styles from "./Sidebar.module.css"
import { useParams, usePathname } from "next/navigation"
import Link from "next/link"

export default function Sidebar() {
  const params = useParams()
  const pathname = usePathname()
  const userId = params.userId as string

  const navItems = [
    { path: "top", icon: "🎼", label: "スコア一覧" },
    { path: "practice", icon: "📈", label: "練習プラン" },
    { path: "share", icon: "🤝", label: "教師と共有" },
    { path: "profile", icon: "👤", label: "プロフィール" },
    { path: "admin/practice", icon: "⚙️", label: "管理" }
  ]

  return (
        <aside className={styles.sidebar}>
          {navItems.map(item => {
            const href = `/${userId}/${item.path}`
            const isActive = pathname === href

            return (
              <Link
                key={item.path}
                href={href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ""
                  }`}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </aside>
  )
}