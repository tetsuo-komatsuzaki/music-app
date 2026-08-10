"use client"

// 生徒ホームの「先生から」= 受信箱 (2026-08-10 再設計)。
// 畳まず直接表示: 宿題=手紙カード / 添削・お祝い=届いたカード / やりとり・所見=参照リンク。
// 並び=重要度(宿題→添削→お祝い→リンク)。タップで対象へ。連絡ゼロなら非表示。
import { useState } from "react"
import { GraduationCap, PartyPopper, ClipboardList, Calendar, MessageCircle, PenLine, Target, Palette, ChevronRight } from "lucide-react"
import Link from "next/link"
import { moodTagGoalText } from "@/app/_libs/moodTags"
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
  /** 未読のお祝いメッセージがある (2026-08-02) */
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
  display: "inline-flex", alignItems: "center", gap: 5, fontSize: "var(--fs-caption)", fontWeight: 800,
  borderRadius: 8, padding: "4px 9px", whiteSpace: "nowrap", lineHeight: 1,
}
const goalChip: React.CSSProperties = { ...chip, color: "#1f3d78", background: "#eaf0fc" }
const softChip: React.CSSProperties = { ...chip, color: "var(--text-body)", background: "#f2f4f7", border: "1px solid #e6e9ee" }
const exprChip: React.CSSProperties = { ...chip, color: "#c0891f", background: "#f9f0d8", border: "1px solid #ecd8a4" }

export default function TeacherAssignments({
  assignments,
  summary,
}: {
  assignments: StudentAssignment[]
  summary?: TeacherHomeSummary
}) {
  const { userId } = useParams<{ userId: string }>()
  const [showAll, setShowAll] = useState(false)

  const unread = summary?.unreadMessages ?? 0
  const feedback = summary?.feedbackCount ?? 0
  const recentObs = summary?.recentObservations ?? 0
  const celebration = !!summary?.unreadCelebration
  const hwCount = assignments.length
  // 連絡が何も無ければ出さない
  if (hwCount === 0 && unread === 0 && feedback === 0 && recentObs === 0 && !celebration) return null

  // 宿題は最新2件を直接表示、それ以上は「ほか◯件」で展開
  const VISIBLE = 2
  const visible = showAll ? assignments : assignments.slice(0, VISIBLE)
  const hiddenCount = assignments.length - visible.length

  // 宿題 = 手紙カード
  const letter = (a: StudentAssignment) => {
    const di = dueInfo(a.dueDate)
    const goal = goalLabel(a.goalType, a.targetScore)
    const gr = goalResult(a.goalType, { achieved: a.achieved, mastered: a.mastered })
    const metLabel = gr && a.goalType !== "score" && gr.met ? gr.label : null
    const initial = (a.teacherName ?? "先").trim().charAt(0) || "先"
    return (
      <Link
        key={a.id}
        href={a.href}
        style={{
          display: "block", background: "#fbf8f1", border: "1px solid #ece3d0", borderRadius: 14,
          overflow: "hidden", textDecoration: "none", color: "inherit", boxShadow: "0 1px 3px rgba(30,45,70,.05)",
        }}
      >
        {/* 封筒の口 */}
        <div style={{ height: 7, background: "repeating-linear-gradient(135deg,#d6547a 0 13px,#e57a97 13px 26px)", opacity: 0.85 }} />
        <div style={{ padding: "12px 13px 13px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ flex: "none", width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#d6547a,#e57a97)", color: "#fff", fontWeight: 900, fontSize: "var(--fs-body)", display: "grid", placeItems: "center" }}>{initial}</span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontSize: "var(--fs-caption)", color: "var(--text-muted)", fontWeight: 700, lineHeight: 1.1 }}>先生から</span>
              <span style={{ display: "block", fontSize: "var(--fs-body)", color: "var(--text-ink)", fontWeight: 900 }}>{a.teacherName} 先生</span>
            </span>
            <span style={{ marginLeft: "auto", flex: "none", fontSize: "var(--fs-caption)", fontWeight: 900, color: "#d6547a", border: "1px solid #d6547a", borderRadius: 999, padding: "2px 8px" }}>宿題</span>
          </div>

          <div style={{ fontSize: "var(--fs-subhead)", fontWeight: 900, color: "var(--text-ink)", marginTop: 10, lineHeight: 1.25 }}>
            {a.title}
            <span style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)", fontWeight: 700, marginLeft: 6 }}>{a.kind === "score" ? "曲" : "基礎練"}</span>
          </div>

          {a.comment && (
            <div style={{ fontSize: "var(--fs-body)", color: "var(--text-body)", marginTop: 8, padding: "8px 11px", background: "rgba(214,84,122,.06)", borderLeft: "3px solid #d6547a", borderRadius: "0 8px 8px 0", lineHeight: 1.5 }}>
              {a.comment}
            </div>
          )}

          {(goal || a.targetTempo || a.moodTagId || di || metLabel) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {goal && <span style={{ ...goalChip, display: "inline-flex", alignItems: "center", gap: 4 }}><Target size={12} /> {goal}{a.reps ? ` ・ ${a.reps}回` : ""}</span>}
              {a.targetTempo && <span style={softChip}>♩={a.targetTempo}</span>}
              {a.moodTagId && <span style={{ ...exprChip, display: "inline-flex", alignItems: "center", gap: 4 }}><Palette size={12} /> {moodTagGoalText(a.moodTagId)}</span>}
              {di && (() => {
                const c = DUE_CALM[di.state]
                return <span style={{ ...chip, color: c.fg, background: c.bg, border: `1px solid ${c.bd}`, display: "inline-flex", alignItems: "center", gap: 4 }}><Calendar size={12} /> {di.label}{di.state === "overdue" ? "（過ぎています）" : di.state === "soon" ? "（もうすぐ）" : ""}</span>
              })()}
              {metLabel && <span style={{ ...chip, color: "var(--text-good)", background: "#eaf5ee", border: "1px solid #cfe6d8" }}>{metLabel}</span>}
            </div>
          )}
        </div>
      </Link>
    )
  }

  // 添削・お祝い = 届いたカード (件数/有無のみのため汎用文)
  const noticeCard = (opts: { href: string; icon: React.ReactNode; iconBg: string; iconFg: string; title: string; sub: string; accent?: boolean }) => (
    <Link href={opts.href} style={{
      display: "flex", alignItems: "center", gap: 11, textDecoration: "none", color: "inherit",
      background: opts.accent ? "linear-gradient(135deg,#f9f0d8,#fdeef2)" : "#fff",
      border: `1px solid ${opts.accent ? "#ecd8a4" : "#eef1f4"}`, borderRadius: 13, padding: "11px 13px",
      boxShadow: "0 1px 3px rgba(30,45,70,.05)",
    }}>
      <span style={{ flex: "none", width: 38, height: 38, borderRadius: 11, background: opts.iconBg, color: opts.iconFg, display: "grid", placeItems: "center" }}>{opts.icon}</span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ display: "block", fontSize: "var(--fs-body)", fontWeight: 900, color: opts.accent ? "#c0891f" : "var(--text-ink)" }}>{opts.title}</span>
        <span style={{ display: "block", fontSize: "var(--fs-caption)", color: "var(--text-sub)", fontWeight: 700, marginTop: 1 }}>{opts.sub}</span>
      </span>
      <ChevronRight size={17} style={{ flex: "none", color: "var(--text-muted)" }} />
    </Link>
  )

  return (
    <section style={{ margin: "0 0 14px" }}>
      {/* 見出し */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "0 4px 9px", fontSize: "var(--fs-body)", fontWeight: 900, color: "var(--text-ink)" }}>
        <GraduationCap size={16} /> 先生から
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {/* 宿題 (手紙カード) */}
        {visible.map(letter)}
        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            style={{ border: "1px dashed #e0dcd0", background: "transparent", borderRadius: 11, padding: "9px 0", fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-sub)", cursor: "pointer" }}
          >
            ほか {hiddenCount} 件の宿題をみる
          </button>
        )}

        {/* 添削 (届いたカード) */}
        {feedback > 0 && noticeCard({
          href: `/${userId}/my-teacher`,
          icon: <PenLine size={19} />, iconBg: "#e2f5f4", iconFg: "#0e9c9c",
          title: `先生が添削してくれたよ（${feedback}件）`, sub: "きみの演奏へのコメントを見よう",
        })}

        {/* お祝い (届いたカード) */}
        {celebration && noticeCard({
          href: `/${userId}/my-teacher`,
          icon: <PartyPopper size={19} />, iconBg: "#fff", iconFg: "#c0891f",
          title: "先生からお祝いが届いたよ！", sub: "メッセージを見てみよう", accent: true,
        })}

        {/* 参照リンク (やりとり / 所見) */}
        {(unread > 0 || recentObs > 0) && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "2px 4px" }}>
            {unread > 0 && (
              <Link href={`/${userId}/my-teacher`} style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-sub)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                <MessageCircle size={14} /> やりとり（{unread}）
              </Link>
            )}
            {unread > 0 && recentObs > 0 && <span style={{ color: "var(--text-muted)" }}>|</span>}
            {recentObs > 0 && (
              <Link href={`/${userId}/progress`} style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-link)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                <ClipboardList size={14} /> 先生の所見 → 癖マップ
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
