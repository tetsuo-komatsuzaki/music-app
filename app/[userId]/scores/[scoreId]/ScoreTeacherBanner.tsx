"use client"

// スコア詳細の先生バナー (2026-08-01)。
// 先生あり生徒だけに、この曲の「宿題(提出)」を曲の上部に埋め込む。
// 添削は別画面に遷移せず、演奏モードの譜面にインライン表示する(scoreDetail 側)。
import { useEffect, useState } from "react"
import { Target, Repeat, Pin, Calendar } from "lucide-react"
import { getScoreTeacherView, type ScoreTeacherView } from "@/app/actions/teacherStudentViews"
import AssignmentSubmit from "@/app/components/AssignmentSubmit"
import { goalLabel, dueInfo, goalResult } from "@/app/_libs/assignmentGoal"

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
          ? `${goal}${assignment.reps ? ` ・ ${assignment.reps}回` : ""}`
          : assignment.reps
            ? `${assignment.reps}回`
            : null
        const GoalChipIcon = goal ? Target : Repeat
        const di = dueInfo(assignment.dueDate)
        const gr = goalResult(assignment.goalType, { achieved: assignment.achieved, mastered: assignment.mastered })
        const metChip = gr && assignment.goalType !== "score" && gr.met ? gr.label : null
        // ダーク化の期限色 (旧ライトパレットの読み替え)
        const dueDark = {
          overdue: { fg: "#E8A78F", bg: "rgba(232, 138, 111, 0.16)" },
          soon: { fg: "#E0B25C", bg: "rgba(224, 160, 47, 0.16)" },
          normal: { fg: "var(--text-sub)", bg: "rgba(150, 175, 225, 0.12)" },
        } as const
        const chip = { fontSize: "10.5px", fontWeight: 800 as const, borderRadius: 999, padding: "3.5px 10px", display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" as const, lineHeight: 1.1 }
        return (
          <div style={{
            background: "linear-gradient(180deg, var(--card-a), var(--card-b))",
            border: "1px solid var(--line)", borderRadius: 16, padding: "12px 14px",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.06), 0 2px 6px rgba(4,10,28,.35), 0 10px 26px -8px rgba(4,10,28,.5)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 22, height: 22, borderRadius: 7, flex: "none", display: "grid", placeItems: "center", background: "rgba(43,91,196,.24)", color: "#9db8e8" }}><Pin size={12} /></span>
              <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--text-ink)", letterSpacing: ".01em" }}>先生からの宿題</span>
              <span style={{ marginLeft: "auto", fontSize: 10.5, fontWeight: 700, color: "var(--text-muted)" }}>{teacherName} 先生</span>
            </div>

            {(goalChip || di || assignment.targetTempo || metChip) && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 9 }}>
                {goalChip && (
                  <span style={{ ...chip, color: "#9db8e8", background: "rgba(43, 91, 196, 0.2)" }}><GoalChipIcon size={11} /> {goalChip}</span>
                )}
                {di && (
                  <span style={{ ...chip, color: dueDark[di.state].fg, background: dueDark[di.state].bg }}>
                    <Calendar size={11} /> 期限 {di.label}
                  </span>
                )}
                {assignment.targetTempo && (
                  <span style={{ ...chip, color: "var(--text-sub)", background: "rgba(150, 175, 225, 0.12)" }}>♩={assignment.targetTempo}</span>
                )}
                {metChip && (
                  <span style={{ ...chip, color: "#8fd3a8", background: "rgba(127, 196, 148, 0.16)" }}>{metChip}</span>
                )}
              </div>
            )}

            {assignment.comment && (
              <div style={{ fontSize: 11.5, color: "var(--text-sub)", marginTop: 9, lineHeight: 1.6, paddingLeft: 9, borderLeft: "2px solid rgba(150, 175, 225, 0.22)" }}>{assignment.comment}</div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 11, flexWrap: "wrap" }}>
              {assignment.submitted ? (
                <span style={{ fontSize: "var(--fs-body)", fontWeight: 800, color: "#8fd3a8", display: "inline-flex", alignItems: "center", gap: 5 }}>提出ずみ ✓</span>
              ) : (
                <AssignmentSubmit
                  assignmentId={assignment.id}
                  goalType={assignment.goalType}
                  targetScore={assignment.targetScore}
                />
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
