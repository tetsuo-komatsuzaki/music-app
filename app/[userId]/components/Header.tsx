"use client"

import styles from "./Header.module.css"
import Image from "next/image"


export default function Header() {
  return (
<>
      {/* ===== HEADER ===== */}
      <header className={styles.header}>
        <div className={styles.headerRight}>
          <span className={styles.appName}>Violin Practice</span>
          <Image src="/Icon.png" alt="icon" width={40} height={40} />
        </div>
      </header>
      </>
  )
}
