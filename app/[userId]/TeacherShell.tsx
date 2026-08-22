"use client"

// 先生モードの別シェル (2026-07-28 / 2026-08-17 ナビ要件定義 1-4)。
// 生徒アプリのボトムタブは使わない。先生の作業は「生徒を選ぶ → カルテを書く」の一本道で、
// タブで行き来する構造ではないため、上部に最小限の切替だけを置き縦の作業領域を確保する。
import { ReactNode } from "react"
import Link from "next/link"
import { GraduationCap, Users, CalendarDays, ArrowLeft } from "lucide-react"
import { useParams, usePathname } from "next/navigation"

export default function TeacherShell({ children }: { children: ReactNode }) {
  const { userId } = useParams<{ userId: string }>()
  const pathname = usePathname() ?? ""
  const base = `/${userId}/teacher`
  const onSchedule = pathname.startsWith(`${base}/schedule`)

  const seg = (active: boolean): React.CSSProperties => ({
    flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
    fontSize: "var(--fs-caption)", fontWeight: 800, textDecoration: "none", borderRadius: 11, padding: "9px 0",
    background: active ? "linear-gradient(180deg,#22355e,#182747)" : "transparent",
    color: active ? "var(--gold)" : "var(--text-sub)",
    boxShadow: active ? "inset 0 0 0 1px rgba(232,178,60,.28)" : "none",
  })

  return (
    <div style={{ minHeight: "100dvh", background: "transparent" }}>
      <header
        style={{
          position: "sticky", top: 0, zIndex: 20, display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 8,
          padding: "calc(10px + env(safe-area-inset-top, 0px)) 14px 10px",
          background: "linear-gradient(135deg,#1f3d78,#2b5bc4)", color: "#fff",
        }}
      >
        <span style={{ fontSize: "var(--fs-body)", fontWeight: 800, letterSpacing: ".02em", display: "inline-flex", alignItems: "center", gap: 5 }}>
          <GraduationCap size={15} /> 先生モード
        </span>
        <Link
          href={`/${userId}`}
          style={{
            fontSize: "var(--fs-caption)", fontWeight: 700, color: "var(--text-on-accent)", textDecoration: "none",
            background: "rgba(255,255,255,.14)", borderRadius: 999, padding: "5px 12px",
            display: "inline-flex", alignItems: "center", gap: 4,
          }}
        >
          <ArrowLeft size={13} /> 生徒にもどる
        </Link>
      </header>

      {/* 生徒一覧 / 予定 の切替 (要件定義 1-4) */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "12px 14px 0" }}>
        <div style={{ display: "flex", gap: 4, background: "#0e1830", border: "1px solid rgba(150,175,225,.1)", borderRadius: 14, padding: 4 }}>
          <Link href={base} style={seg(!onSchedule)}>
            <Users size={15} /> 生徒一覧
          </Link>
          <Link href={`${base}/schedule`} style={seg(onSchedule)}>
            <CalendarDays size={15} /> 予定
          </Link>
        </div>
      </div>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "14px 14px 60px" }}>{children}</main>
    </div>
  )
}
