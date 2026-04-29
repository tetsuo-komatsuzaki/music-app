"use client"

import styles from "./Header.module.css"
import Image from "next/image"
import { useOnboarding } from "../_onboarding/hooks/useOnboarding"


export default function Header() {
  const { openHelp } = useOnboarding()
  return (
<>
      {/* ===== HEADER ===== */}
      <header className={styles.header}>
        <div className={styles.headerRight}>
          <span className={styles.appName}>Violin Practice</span>
          <button
            type="button"
            className={styles.helpButton}
            onClick={() => openHelp()}
            aria-label="使い方を開く"
          >
            ?
          </button>
          <Image src="/Icon.png" alt="icon" width={40} height={40} />
        </div>
      </header>
      </>
  )
}
