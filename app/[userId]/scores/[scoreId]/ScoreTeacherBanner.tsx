"use client"

// スコア詳細の先生バナー (2026-08-01)。
// 先生あり生徒だけに、この曲の「宿題(提出)」と「添削(見る)」を曲の上部に埋め込む。
// データは getScoreTeacherView、提出は既存 submitAssignment を流用。
import { useEffect, useState } from "react"
import Link from "next/link"
import { getScoreTeacherView, type ScoreTeacherView } from "@/app/actions/teacherStudentViews"
import AssignmentSubmit from "@/app/components/AssignmentSubmit"
import { goalLabel, dueInfo, DUE_COLOR, goalResult } from "@/app/_libs/assignmentGoal"

export default function ScoreTeacherBanner({ scoreId, userId }: { scoreId: string; userId: string }) {
  const [view, setView] = useState<ScoreTeacherView | null>(null)

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
              {(() => {
                // 達成/マスール目標は達成状態で自動判定して結果チップを出す
                const gr = goalResult(assignment.goalType, { achieved: assignment.achieved, mastered: assignment.mastered })
                if (!gr || assignment.goalType === "score") return null
                return (
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: gr.met ? "#2e8b57" : "#9aa6b3", background: gr.met ? "#e9f7ef" : "#f1f4f8", border: `1px solid ${gr.met ? "#cbe8d6" : "#e2e6ea"}`, borderRadius: 999, padding: "2px 8px" }}>
                    {gr.label}
                  </span>
                )
              })()}
            </div>
          )}
          {assignment.detail && (
            <div style={{ fontSize: 12.5, color: "#6b7885", marginTop: 5 }}>{assignment.detail}</div>
          )}
          {assignment.comment && (
            <div style={{ fontSize: 13, color: "#2b3742", marginTop: 5 }}>💬 {assignment.comment}</div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
            {assignment.submitted ? (
              <span style={{ fontSize: 12, fontWeight: 800, color: "#2e8b57" }}>提出ずみ ✓</span>
            ) : (
              <AssignmentSubmit
                assignmentId={assignment.id}
                goalType={assignment.goalType}
                targetScore={assignment.targetScore}
              />
            )}
            <span style={{ fontSize: 11, color: "#b3937a" }}>{teacherName} 先生</span>
          </div>
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
