"use client"

// 先生モードの別シェル (2026-07-28)。生徒アプリの Header/Sidebar を使わず、独立した簡易クロム。
// 将来の先生メニュー(予約/添削/売上)はこのシェルのナビに足す。各画面のback導線は各ページ側。
import { ReactNode } from "react"
import Link from "next/link"
import { GraduationCap } from "lucide-react"
import { useParams } from "next/navigation"

export default function TeacherShell({ children }: { children: ReactNode }) {
  const { userId } = useParams<{ userId: string }>()
  return (
    <div style={{ minHeight: "100dvh", background: "#f6f7f9" }}>
      <header
        style={{
          position: "sticky", top: 0, zIndex: 20, display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 8, padding: "10px 14px",
          background: "#2b3742", color: "var(--text-on-accent)",
        }}
      >
        <span style={{ fontSize: "var(--fs-body)", fontWeight: 800, letterSpacing: ".02em", display: "inline-flex", alignItems: "center", gap: 5 }}><GraduationCap size={15} /> 先生モード</span>
        <Link
          href={`/${userId}`}
          style={{
            fontSize: "var(--fs-body)", fontWeight: 700, color: "var(--text-on-accent)", textDecoration: "none",
            background: "rgba(255,255,255,.14)", borderRadius: 999, padding: "5px 12px",
          }}
        >
          ← 生徒モードへ
        </Link>
      </header>
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "14px 14px 60px" }}>{children}</main>
    </div>
  )
}
