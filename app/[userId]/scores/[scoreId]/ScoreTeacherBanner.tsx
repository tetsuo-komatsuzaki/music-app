"use client"

// スコア詳細の先生バナー (2026-08-01)。
// 先生あり生徒だけに、この曲の「宿題(提出)」を曲の上部に埋め込む。
// 添削は別画面に遷移せず、演奏モードの譜面にインライン表示する(scoreDetail 側)。
import { useEffect, useState } from "react"
import { getScoreTeacherView, type ScoreTeacherView } from "@/app/actions/teacherStudentViews"
import AssignmentSubmit from "@/app/components/AssignmentSubmit"
import { goalLabel, dueInfo, DUE_COLOR, goalResult } from "@/app/_libs/assignmentGoal"

export default function ScoreTeacherBanner({ scoreId }: { scoreId: string; userId: string }) {
  const [view, setView] = useState<ScoreTeacherView | null>(null)

  useEffect(() => {
    let cancelled = false
    getScoreTeacherView(scoreId)
      .then((v) => { if (!cancelled) setView(v) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [scoreId])

  if (!view || !view.hasTeacher) return null
  const { assignment, teacherName } = view
  if (!assignment) return null

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "0 0 12px" }}>
      {assignment && (() => {
        // 案A: 左アクセントバー。目標に回数を統合、達成/マスターは達成時のみチップ表示。
        const goal = goalLabel(assignment.goalType, assignment.targetScore)
        const goalChip = goal
          ? `🎯 ${goal}${assignment.reps ? ` ・ ${assignment.reps}回` : ""}`
          : assignment.reps
            ? `🔁 ${assignment.reps}回`
            : null
        const di = dueInfo(assignment.dueDate)
        const gr = goalResult(assignment.goalType, { achieved: assignment.achieved, mastered: assignment.mastered })
        const metChip = gr && assignment.goalType !== "score" && gr.met ? gr.label : null
        const chip = { fontSize: 11, fontWeight: 800 as const, borderRadius: 8, padding: "4px 9px", display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" as const, lineHeight: 1 }
        return (
          <div style={{ display: "flex", background: "#fff", border: "1px solid #eceef2", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 3px rgba(20,25,40,.04)" }}>
            <div style={{ width: 4, background: "#c98a2a", flex: "none" }} aria-hidden />
            <div style={{ flex: 1, minWidth: 0, padding: "13px 15px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: "#8a5a10" }}>📌 先生からの宿題</span>
                <span style={{ marginLeft: "auto", fontSize: 10.5, fontWeight: 700, color: "#b0a184" }}>{teacherName} 先生</span>
              </div>

              {(goalChip || di || assignment.targetTempo || metChip) && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 }}>
                  {goalChip && (
                    <span style={{ ...chip, color: "#4a5bd0", background: "#eef0fc", border: "1px solid #d7dcf6" }}>{goalChip}</span>
                  )}
                  {di && (
                    <span style={{ ...chip, color: DUE_COLOR[di.state].fg, background: DUE_COLOR[di.state].bg, border: `1px solid ${DUE_COLOR[di.state].border}` }}>
                      📅 期限 {di.label}{di.state === "overdue" ? "（過ぎています）" : di.state === "soon" ? "（もうすぐ）" : ""}
                    </span>
                  )}
                  {assignment.targetTempo && (
                    <span style={{ ...chip, color: "#6b7885", background: "#f1f4f8", border: "1px solid #e2e6ea" }}>♩={assignment.targetTempo}</span>
                  )}
                  {metChip && (
                    <span style={{ ...chip, color: "#2e8b57", background: "#e9f7ef", border: "1px solid #cbe8d6" }}>{metChip}</span>
                  )}
                </div>
              )}

              {assignment.comment && (
                <div style={{ fontSize: 12.5, color: "#4a4650", marginTop: 8, lineHeight: 1.55 }}>💬 {assignment.comment}</div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                {assignment.submitted ? (
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#2e8b57" }}>提出ずみ ✓</span>
                ) : (
                  <AssignmentSubmit
                    assignmentId={assignment.id}
                    goalType={assignment.goalType}
                    targetScore={assignment.targetScore}
                  />
                )}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
