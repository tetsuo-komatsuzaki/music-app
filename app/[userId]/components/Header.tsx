"use client"

// ヘッダー (2026-08-17 ナビ刷新)。
// サイドバー廃止に伴い、右上はアカウントのドロップダウンに集約する。
// 先生モードの切替と使い方はドロップダウンの中へ移設した (ここには置かない)。
import styles from "./Header.module.css"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useIsNativeApp } from "@/app/_hooks/useIsNativeApp"
import AccountMenu from "./AccountMenu"

export default function Header({ role }: { role?: string }) {
  const isNative = useIsNativeApp()
  const { userId } = useParams<{ userId: string }>()
  return (
    <header className={`${styles.header} ${isNative ? styles.headerNative : ""}`}>
      <div className={styles.inner}>
        <Link href={userId ? `/${userId}` : "/"} className={styles.brand}>
          <span className={styles.appName}>Arcoda</span>
        </Link>
        <AccountMenu role={role} />
      </div>
    </header>
  )
}
