"use client"

// 生徒ホームの「先生から」カード (案3・2026-08-01)。
// 1行ヘッダー＋宿題アコーディオン(既定で閉じる)。色は控えめ(グレー基調)。
// 「できたら✓」は廃止(完了は曲/教材側の提出で行う)。タップで対象へ遷移。
import { useState } from "react"
import Link from "next/link"
import { moodTagLabel } from "@/app/_libs/moodTags"
import { useParams } from "next/navigation"
import { goalLabel, dueInfo, goalResult } from "@/app/_libs/assignmentGoal"

export type StudentAssignment = {
  id: string
  /** 対象が曲(score)か、曲以外(基礎練・教材)か */
  kind: "score" | "practice"
  teacherName: string
  title: string
  reps: number | null
  targetTempo: number | null
  comment: string | null
  href: string
  dueDate: string | null
  goalType: string | null
  targetScore: number | null
  /** 意識する表現 (統一雰囲気タグID・任意) */
  moodTagId?: string | null
  achieved: boolean
  mastered: boolean
}

export type TeacherHomeSummary = {
  teacherName: string | null
  unreadMessages: number
  feedbackCount: number
  /** 未読のお祝いメッセージがある (🎉 で目立たせる・2026-08-02) */
  unreadCelebration?: boolean
  /** 直近7日の先生の所見(癖)件数 (既読概念が無いため期間で新着扱い・2026-08-02) */
  recentObservations?: number
}

// 期限チップの控えめな色 (近い/過ぎた時だけ弱く色づけ)
const DUE_CALM = {
  overdue: { fg: "#b0524c", bg: "#f7ebea", bd: "#eed6d3" },
  soon: { fg: "#a9762f", bg: "#f7f1e6", bd: "#ecdfc8" },
  normal: { fg: "#5a636e", bg: "#f2f4f7", bd: "#e6e9ee" },
}
const chip: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 800,
  borderRadius: 8, padding: "4px 9px", whiteSpace: "nowrap", lineHeight: 1,
}
const softChip: React.CSSProperties = { ...chip, color: "#5a636e", background: "#f2f4f7", border: "1px solid #e6e9ee" }
const badge: React.CSSProperties = {
  fontSize: 11, fontWeight: 800, color: "#5a636e", background: "#f2f4f7",
  border: "1px solid #e6e9ee", borderRadius: 999, padding: "2px 9px",
}

export default function TeacherAssignments({
  assignments,
  summary,
}: {
  assignments: StudentAssignment[]
  summary?: TeacherHomeSummary
}) {
  const { userId } = useParams<{ userId: string }>()
  const [open, setOpen] = useState(false)

  const unread = summary?.unreadMessages ?? 0
  const feedback = summary?.feedbackCount ?? 0
  const recentObs = summary?.recentObservations ?? 0
  const hwCount = assignments.length
  // 宿題も未読も添削も所見も無ければ出さない
  if (hwCount === 0 && unread === 0 && feedback === 0 && recentObs === 0) return null

  // 畳んでいても分かるよう、最も近い(=最短の締め切り)期限をヘッダーに出す
  const dueDates = assignments.map((a) => a.dueDate).filter((d): d is string => !!d)
  const nearestDue = dueDates.length
    ? dueDates.reduce((a, b) => (new Date(a).getTime() <= new Date(b).getTime() ? a : b))
    : null
  const headerDue = nearestDue ? dueInfo(nearestDue) : null

  return (
    <section style={{ background: "#fff", border: "1px solid #eef1f4", borderRadius: 16, padding: "12px 14px", margin: "0 0 14px", boxShadow: "0 1px 3px rgba(30,45,70,.04)" }}>
      {/* 1行ヘッダー = アコーディオンのトグル */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit", textAlign: "left" }}
      >
        <span style={{ fontSize: 12.5, fontWeight: 800, color: "#2b3742" }}>👩‍🏫 先生から</span>
        {summary?.unreadCelebration && (
          <span style={{ ...chip, color: "#8a5a10", background: "linear-gradient(135deg,#fdf3df,#fdeef2)", border: "1px solid #eecfa0" }}>🎉 お祝いが届いてるよ！</span>
        )}
        {hwCount > 0 && <span style={badge}>宿題{hwCount}</span>}
        {unread > 0 && <span style={badge}>未読{unread}</span>}
        {recentObs > 0 && <span style={{ ...chip, color: "#4a5bd0", background: "#eef0fc", border: "1px solid #d7dcf6" }}>📋 新しい所見</span>}
        {headerDue && (() => {
          const c = DUE_CALM[headerDue.state]
          return (
            <span style={{ ...chip, color: c.fg, background: c.bg, border: `1px solid ${c.bd}` }}>
              📅 {headerDue.label}{headerDue.state === "overdue" ? "（過ぎています）" : headerDue.state === "soon" ? "（もうすぐ）" : ""}
            </span>
          )
        })()}
        <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 800, color: "#9aa6b3" }}>{open ? "▲ 閉じる" : "▼ 開く"}</span>
      </button>

      {open && (
        <>
          {/* メッセージ / 添削 への導線 */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
            <Link href={`/${userId}/my-teacher`} style={{ fontSize: 11.5, fontWeight: 800, color: "#5b6b9e", textDecoration: "none" }}>💬 メッセージ{unread > 0 ? `（${unread}）` : ""}</Link>
            <span style={{ color: "#dfe3e8" }}>|</span>
            <Link href={`/${userId}/my-teacher`} style={{ fontSize: 11.5, fontWeight: 800, color: "#5b6b9e", textDecoration: "none" }}>✍️ 添削{feedback > 0 ? `（${feedback}）` : ""}</Link>
            {recentObs > 0 && (
              <>
                <span style={{ color: "#dfe3e8" }}>|</span>
                <Link href={`/${userId}/progress`} style={{ fontSize: 11.5, fontWeight: 800, color: "#4a5bd0", textDecoration: "none" }}>📋 先生の所見 → 癖マップ</Link>
              </>
            )}
          </div>

          {/* 宿題リスト (タップで対象へ) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
            {assignments.map((a) => {
              const di = dueInfo(a.dueDate)
              const goal = goalLabel(a.goalType, a.targetScore)
              const gr = goalResult(a.goalType, { achieved: a.achieved, mastered: a.mastered })
              const metLabel = gr && a.goalType !== "score" && gr.met ? gr.label : null
              return (
                <Link key={a.id} href={a.href} style={{ display: "block", border: "1px solid #eef1f4", borderRadius: 10, padding: "9px 11px", textDecoration: "none", color: "inherit" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#2b3742" }}>
                    {a.title}
                    <span style={{ fontSize: 10, color: "#aab2bb", fontWeight: 700, marginLeft: 6 }}>{a.kind === "score" ? "曲" : "基礎練"}</span>
                  </div>
                  {(goal || di || metLabel) && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                      {goal && <span style={softChip}>🎯 {goal}{a.reps ? ` ・ ${a.reps}回` : ""}</span>}
                      {a.targetTempo && <span style={softChip}>♩={a.targetTempo}</span>}
                      {di && (() => {
                        const c = DUE_CALM[di.state]
                        return <span style={{ ...chip, color: c.fg, background: c.bg, border: `1px solid ${c.bd}` }}>📅 {di.label}{di.state === "overdue" ? "（過ぎています）" : di.state === "soon" ? "（もうすぐ）" : ""}</span>
                      })()}
                      {metLabel && <span style={{ ...chip, color: "#2e8b57", background: "#eaf5ee", border: "1px solid #cfe6d8" }}>{metLabel}</span>}
                    </div>
                  )}
                  {a.moodTagId && (
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: "#8a5a1f", background: "#fdf3d8", border: "1px solid #eed9a0", borderRadius: 999, padding: "3px 10px", display: "inline-block", marginTop: 6 }}>
                      🎨 「{moodTagLabel(a.moodTagId)}」を意識してみよう
                    </div>
                  )}
                  {a.comment && <div style={{ fontSize: 12, color: "#4a4650", marginTop: 6, lineHeight: 1.5 }}>💬 {a.comment}</div>}
                  <div style={{ fontSize: 10.5, color: "#aab2bb", marginTop: 7 }}>{a.teacherName} 先生</div>
                </Link>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}
