"use client"

import styles from "./Header.module.css"
import Image from "next/image"
import Link from "next/link"
import { GraduationCap } from "lucide-react"
import { useParams } from "next/navigation"
import { useOnboarding } from "../_onboarding/hooks/useOnboarding"


export default function Header({ role }: { role?: string }) {
  const { openHelp } = useOnboarding()
  const { userId } = useParams<{ userId: string }>()
  return (
<>
      {/* ===== HEADER ===== */}
      <header className={styles.header}>
        <div className={styles.headerRight}>
          <span className={styles.appName}>Arcoda</span>
          {/* 先生アカウントのみ: 先生モードへの切替 (別シェル /teacher へ) */}
          {role === "teacher" && userId && (
            <Link
              href={`/${userId}/teacher`}
              style={{
                fontSize: 11.5, fontWeight: 700, color: "#2b3742", textDecoration: "none",
                background: "#eef1f4", border: "1px solid #e2e6ea", borderRadius: 999, padding: "4px 10px",
                display: "inline-flex", alignItems: "center", gap: 4,
              }}
            >
              <GraduationCap size={13} /> 先生モード
            </Link>
          )}
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
