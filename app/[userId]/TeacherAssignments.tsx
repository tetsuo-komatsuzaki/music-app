"use client"

// 生徒ホームの「先生から」セクション (2026-07-28)。未完了の宿題を出し、タップで既存の練習へ。
// 将来: 次回レッスン/提出物などのセクションをこの下に足す。
import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { markAssignmentDone } from "@/app/actions/teacherActions"

export type StudentAssignment = {
  id: string
  teacherName: string
  title: string
  detail: string
  comment: string | null
  href: string
}

export default function TeacherAssignments({ assignments }: { assignments: StudentAssignment[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set())
  if (!assignments.length) return null

  const markDone = (id: string) => {
    setDoneIds((s) => new Set(s).add(id))
    startTransition(async () => {
      await markAssignmentDone(id)
      router.refresh()
    })
  }

  return (
    <section style={{ background: "#fff", border: "1px solid #eef1f4", borderRadius: 16, padding: "14px 16px", margin: "0 0 14px", boxShadow: "0 1px 3px rgba(30,45,70,.05)" }}>
      <div style={{ fontSize: 12.5, fontWeight: 800, color: "#2b3742", marginBottom: 10 }}>👩‍🏫 先生から</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {assignments.map((a) => (
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
        ))}
      </div>
    </section>
  )
}
