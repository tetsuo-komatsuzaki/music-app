"use client"

// 生徒ホームの「先生から」 — モック 追02 (build-extra.py TEACHER6) の写経 (2026-08-20)。
// カード + 分類チップ (選択=金) + 行 (色つきの点 + 題/補足 + ピル)。
// カルーセルとアコーディオンは廃止 (モックが仕様)。
import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import ds from "@/app/components/ds.module.css"
import { goalLabel, dueInfo } from "@/app/_libs/assignmentGoal"

export type StudentAssignment = {
  id: string
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
  moodTagId?: string | null
  submitted?: boolean
  achieved: boolean
  mastered: boolean
}

export type TeacherHomeSummary = {
  unreadKarte?: number
  unreadPassed?: number
  teacherName: string | null
  unreadMessages: number
  feedbackCount: number
  unreadCelebration?: boolean
  recentObservations?: number
}

type Cat = "宿題" | "合格" | "カルテ" | "お祝い" | "癖"
type Row = {
  cat: Cat
  dot: string
  title: string
  sub: string
  href: string
  pill: string
  pillGold: boolean
}

export default function TeacherAssignments({
  assignments,
  summary,
}: {
  assignments: StudentAssignment[]
  summary?: TeacherHomeSummary
}) {
  const { userId } = useParams<{ userId: string }>()

  const unread = summary?.unreadMessages ?? 0
  const unreadKarte = summary?.unreadKarte ?? 0
  const unreadPassed = summary?.unreadPassed ?? 0
  const recentObs = summary?.recentObservations ?? 0
  const celebration = !!summary?.unreadCelebration
  const teacher = summary?.teacherName ?? "先生"

  // ── 行を組む (モック notif() の形) ──
  const rows: Row[] = []
  for (const a of assignments) {
    const di = dueInfo(a.dueDate)
    const goal = goalLabel(a.goalType, a.targetScore)
    rows.push({
      cat: "宿題",
      dot: "var(--gold)",
      title: goal ? `${a.title}を${goal}` : a.title,
      sub: `${di ? `${di.label} ・ ` : ""}${a.teacherName}先生${a.submitted ? " ・ 提出ずみ" : ""}`,
      href: a.href,
      pill: a.submitted ? "見る" : "出す",
      pillGold: !a.submitted,
    })
  }
  if (unreadPassed > 0)
    rows.push({
      cat: "合格", dot: "var(--green-soft)", title: "宿題に合格したよ！",
      sub: `${unreadPassed}件 ・ ${teacher}`, href: `/${userId}/my-teacher?tab=passed`,
      pill: "合格の履歴を見る", pillGold: false,
    })
  if (unreadKarte > 0)
    rows.push({
      cat: "カルテ", dot: "var(--gold)", title: "練習後カルテが届いたよ",
      sub: `${unreadKarte}件 ・ ${teacher}`, href: `/${userId}/my-teacher?tab=karte`,
      pill: "メッセージを見る", pillGold: false,
    })
  if (celebration)
    rows.push({
      cat: "お祝い", dot: "var(--gold)", title: "お祝いが届いたよ！",
      sub: teacher, href: `/${userId}/my-teacher`,
      pill: "お祝いを見る", pillGold: false,
    })
  if (recentObs > 0)
    rows.push({
      cat: "癖", dot: "#e8a78f", title: "先生が癖を記録したよ",
      sub: teacher, href: `/${userId}/progress`,
      pill: "癖マップで見る", pillGold: false,
    })

  const cats = [...new Set(rows.map((r) => r.cat))]
  const [cat, setCat] = useState<Cat | null>(null)
  const cur = cat && cats.includes(cat) ? cat : cats[0]
  if (rows.length === 0 && unread === 0) return null

  const count = (c: Cat) => rows.filter((r) => r.cat === c).length
  const shown = rows.filter((r) => r.cat === cur)

  return (
    <div className={ds.card} style={{ padding: "12px 14px" }} data-onboarding="home.teacherCard">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className={ds.lab} style={{ flex: "none" }}>先生から</span>
      </div>

      {/* 分類チップ (モック cat_tabs) */}
      {cats.length > 1 && (
        <div style={{ display: "flex", gap: 4, marginTop: 8, overflowX: "auto", paddingBottom: 2 }}>
          {cats.map((c) => {
            const on = c === cur
            const n = count(c)
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                style={{
                  background: on ? "rgba(232,178,60,.16)" : "rgba(150,175,225,.07)",
                  color: on ? "var(--gold)" : "var(--text-sub)",
                  border: on ? "1px solid rgba(232,178,60,.34)" : "1px solid transparent",
                  fontSize: 10.5, fontWeight: 800, borderRadius: 999, padding: "4px 9px",
                  whiteSpace: "nowrap", flex: "none", display: "inline-flex", alignItems: "center",
                  gap: 4, cursor: "pointer", font: "inherit",
                }}
              >
                {c}
                {n > 1 && (
                  <span style={{ fontSize: 9, fontWeight: 900, borderRadius: 999, padding: "0 5px", background: on ? "rgba(255,255,255,.22)" : "rgba(150,175,225,.14)" }}>{n}</span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* 行 (モック notif) */}
      {shown.map((r, i) => (
        <Link
          key={`${r.cat}-${i}`}
          href={r.href}
          className="pressable"
          style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 8, textDecoration: "none", color: "inherit" }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: r.dot, flex: "none" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <b style={{ fontSize: 12.5, display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--text-ink)" }}>{r.title}</b>
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{r.sub}</span>
          </div>
          <span
            className={`${ds.pill} ${r.pillGold ? ds.gold : ds.mute}`}
            style={{ fontSize: 10.5, padding: "3px 10px", flex: "none", ...(r.pillGold ? {} : { color: "var(--text-ink)" }) }}
          >
            {r.pill}
          </span>
        </Link>
      ))}

      {/* 参照リンク: やりとり */}
      {unread > 0 && (
        <div style={{ marginTop: 9 }}>
          <Link
            href={`/${userId}/my-teacher`}
            style={{ fontSize: 11, fontWeight: 800, color: "var(--text-sub)", textDecoration: "none" }}
          >
            やりとり・{unread} →
          </Link>
        </div>
      )}
    </div>
  )
}
