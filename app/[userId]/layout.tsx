"use client"

import styles from "./layout.module.css"
import { ReactNode } from "react"
import { useParams, usePathname } from "next/navigation"
import Sidebar from "./components/Sidebar"
import Header from "./components/Header"

export default function UserLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.body}>
        <Sidebar />
        {/* ===== PAGE CONTENT ===== */}
        <main className={styles.main}>
          {children}
        </main>
        </div>
     </div>
  )
}
