"use client"

// スコア詳細の先生バナー (2026-08-01)。
// 先生あり生徒だけに、この曲の「宿題(提出)」と「添削(見る)」を曲の上部に埋め込む。
// データは getScoreTeacherView、提出は既存 submitAssignment を流用。
import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { getScoreTeacherView, type ScoreTeacherView } from "@/app/actions/teacherStudentViews"
import { submitAssignment } from "@/app/actions/teacherActions"
import { goalLabel, dueInfo, DUE_COLOR } from "@/app/_libs/assignmentGoal"

export default function ScoreTeacherBanner({ scoreId, userId }: { scoreId: string; userId: string }) {
  const [view, setView] = useState<ScoreTeacherView | null>(null)
  const [submitMsg, setSubmitMsg] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    getScoreTeacherView(scoreId)
      .then((v) => { if (!cancelled) setView(v) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [scoreId])

  if (!view || !view.hasTeacher) return null
  const { assignment, hasFeedback, teacherName } = view
  if (!assignment && !hasFeedback) return null

  const doSubmit = () => {
    if (!assignment) return
    setSubmitMsg(null)
    startTransition(async () => {
      const res = await submitAssignment(assignment.id)
      if (res.ok) {
        setSubmitted(true)
        const passed =
          assignment.goalType === "score" && assignment.targetScore != null && res.score != null
            ? res.score >= assignment.targetScore
            : null
        const base = res.score != null ? `提出しました！（${res.score}点）` : "提出しました！"
        setSubmitMsg(base + (passed === true ? " 合格🎉" : passed === false ? " 合格ラインまであと少し" : ""))
      } else {
        setSubmitMsg(res.error)
      }
    })
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "0 0 12px" }}>
      {assignment && (
        <div style={{ background: "#fff", border: "1px solid #ecdcb6", borderLeft: "4px solid #e0a02f", borderRadius: 12, padding: "12px 14px", boxShadow: "0 1px 2px rgba(120,80,10,.05)" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#8a5a10" }}>📌 先生からの宿題</div>
          {(dueInfo(assignment.dueDate) || goalLabel(assignment.goalType, assignment.targetScore)) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 5 }}>
              {(() => {
                const di = dueInfo(assignment.dueDate)
                if (!di) return null
                const c = DUE_COLOR[di.state]
                return (
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: c.fg, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 999, padding: "2px 8px" }}>
                    期限 {di.label}{di.state === "overdue" ? "（過ぎています）" : di.state === "soon" ? "（もうすぐ）" : ""}
                  </span>
                )
              })()}
              {goalLabel(assignment.goalType, assignment.targetScore) && (
                <span style={{ fontSize: 10.5, fontWeight: 800, color: "#3b56d4", background: "#eef1fe", border: "1px solid #d6ddff", borderRadius: 999, padding: "2px 8px" }}>
                  {goalLabel(assignment.goalType, assignment.targetScore)}
                </span>
              )}
            </div>
          )}
          {assignment.detail && (
            <div style={{ fontSize: 12.5, color: "#6b7885", marginTop: 5 }}>{assignment.detail}</div>
          )}
          {assignment.comment && (
            <div style={{ fontSize: 13, color: "#2b3742", marginTop: 5 }}>💬 {assignment.comment}</div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
            {assignment.submitted || submitted ? (
              <span style={{ fontSize: 12, fontWeight: 800, color: "#2e8b57" }}>提出ずみ ✓</span>
            ) : (
              <button
                type="button"
                onClick={doSubmit}
                disabled={pending}
                style={{ fontSize: 12.5, fontWeight: 800, color: "#fff", background: "#e0a02f", border: "none", borderRadius: 9, padding: "8px 16px", cursor: "pointer" }}
              >
                {pending ? "提出中…" : "この曲を先生に提出"}
              </button>
            )}
            <span style={{ fontSize: 11, color: "#b3937a" }}>{teacherName} 先生</span>
          </div>
          {submitMsg && (
            <div style={{ fontSize: 12, color: submitted ? "#2e8b57" : "#cc5470", marginTop: 6 }}>{submitMsg}</div>
          )}
        </div>
      )}

      {hasFeedback && (
        <Link
          href={`/${userId}/my-teacher/review/${scoreId}`}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #d6ddff", borderLeft: "4px solid #4a6cf7", borderRadius: 12, padding: "12px 14px", textDecoration: "none", color: "inherit" }}
        >
          <span style={{ fontSize: 12.5, fontWeight: 800, color: "#3b56d4" }}>✍️ 先生の添削があります</span>
          <span style={{ marginLeft: "auto", fontSize: 12.5, fontWeight: 800, color: "#4a6cf7" }}>見る →</span>
        </Link>
      )}
    </div>
  )
}
