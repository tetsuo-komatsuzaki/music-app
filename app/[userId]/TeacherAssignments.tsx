"use client"

// 生徒ホームの「先生から」セクション (2026-07-28)。未完了の宿題を出し、タップで既存の練習へ。
// 将来: 次回レッスン/提出物などのセクションをこの下に足す。
import { useState, useTransition } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { markAssignmentDone } from "@/app/actions/teacherActions"

export type StudentAssignment = {
  id: string
  /** 対象が曲(score)か、曲以外(基礎練・教材)か */
  kind: "score" | "practice"
  teacherName: string
  title: string
  detail: string
  comment: string | null
  href: string
}

export type TeacherHomeSummary = {
  teacherName: string | null
  unreadMessages: number
  feedbackCount: number
}

export default function TeacherAssignments({
  assignments,
  summary,
}: {
  assignments: StudentAssignment[]
  summary?: TeacherHomeSummary
}) {
  const router = useRouter()
  const { userId } = useParams<{ userId: string }>()
  const [pending, startTransition] = useTransition()
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set())

  const hasChips = !!summary && (summary.unreadMessages > 0 || summary.feedbackCount > 0)
  if (!assignments.length && !hasChips) return null

  const markDone = (id: string) => {
    setDoneIds((s) => new Set(s).add(id))
    startTransition(async () => {
      await markAssignmentDone(id)
      router.refresh()
    })
  }

  // 曲 / 曲以外(基礎練・教材) で分けて表示
  const songs = assignments.filter((a) => a.kind === "score")
  const others = assignments.filter((a) => a.kind === "practice")
  const showLabels = songs.length > 0 && others.length > 0
  const groupLabel = { fontSize: 11, fontWeight: 800 as const, color: "#9aa6b3", margin: "0 2px 6px" }

  const card = (a: StudentAssignment) => (
    <div key={a.id} style={{ border: "1px solid #eef1f4", borderRadius: 12, padding: "10px 12px", opacity: doneIds.has(a.id) ? 0.5 : 1 }}>
      <Link href={a.href} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: "#2b3742" }}>📌 {a.title}</div>
        {a.detail && <div style={{ fontSize: 12, color: "#6b7885", marginTop: 2 }}>{a.detail}</div>}
        {a.comment && <div style={{ fontSize: 12.5, color: "#2b3742", marginTop: 4 }}>💬 {a.comment}</div>}
      </Link>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <span style={{ fontSize: 10.5, color: "#b3bcc6" }}>{a.teacherName} 先生</span>
        <button
          type="button"
          onClick={() => markDone(a.id)}
          disabled={pending || doneIds.has(a.id)}
          style={{ fontSize: 11, fontWeight: 700, color: "#2e8b57", background: "#eafaf0", border: "1px solid #cbe8d6", borderRadius: 999, padding: "4px 12px", cursor: "pointer" }}
        >
          {doneIds.has(a.id) ? "できた！" : "できたら✓"}
        </button>
      </div>
    </div>
  )

  return (
    <section style={{ background: "#fff", border: "1px solid #eef1f4", borderRadius: 16, padding: "14px 16px", margin: "0 0 14px", boxShadow: "0 1px 3px rgba(30,45,70,.05)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: "#2b3742" }}>👩‍🏫 先生から</span>
        <Link href={`/${userId}/my-teacher`} style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: "#4a6cf7", textDecoration: "none" }}>
          やりとりを見る →
        </Link>
      </div>

      {/* 未読メッセージ・添削の件数チップ (E) */}
      {hasChips && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: assignments.length ? 10 : 0 }}>
          {summary!.unreadMessages > 0 && (
            <Link href={`/${userId}/my-teacher`} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 800, color: "#b23", background: "#fdecec", border: "1px solid #f6cdcd", borderRadius: 999, padding: "5px 11px", textDecoration: "none" }}>
              💬 未読メッセージ {summary!.unreadMessages}
            </Link>
          )}
          {summary!.feedbackCount > 0 && (
            <Link href={`/${userId}/my-teacher`} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 800, color: "#3b56d4", background: "#eef1fe", border: "1px solid #d6ddff", borderRadius: 999, padding: "5px 11px", textDecoration: "none" }}>
              ✍️ 添削 {summary!.feedbackCount}
            </Link>
          )}
        </div>
      )}

      {songs.length > 0 && (
        <div style={{ marginBottom: others.length ? 12 : 0 }}>
          {showLabels && <div style={groupLabel}>🎼 曲</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{songs.map(card)}</div>
        </div>
      )}
      {others.length > 0 && (
        <div>
          {showLabels && <div style={groupLabel}>🎵 基礎練・教材</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{others.map(card)}</div>
        </div>
      )}
    </section>
  )
}
