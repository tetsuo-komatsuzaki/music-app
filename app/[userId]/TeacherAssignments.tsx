"use client"

// 生徒ホームの「先生から」 — モック 追02 parts-04 案1 の写経を土台に、
// 2026-08-20 Tetsuo指示で2点変更 (モックからの指示逸脱):
//   ・アコーディオン形式。基本は閉じていて、頭の行に件数の要約だけ出す
//   ・0件の分類タブは出さない (通知の場なので)
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

type Cat = "宿題" | "提出ずみ" | "合格" | "カルテ" | "お祝い" | "癖"
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
    // 題はモック hwline の形: 「クロイツェル 2番を90点で」
    const goalPhrase =
      a.goalType === "score" && a.targetScore != null ? `を${a.targetScore}点で`
      : a.goalType === "achieve" ? "を達成まで"
      : a.goalType === "master" ? "をマスターまで"
      : ""
    void goal
    rows.push({
      cat: a.submitted ? "提出ずみ" : "宿題",
      dot: "var(--gold)",
      title: `${a.title}${goalPhrase}`,
      sub: di ? di.label : "",             // parts-04: 日付は題と同じ行にインライン
      href: a.href,
      pill: a.submitted ? "合格まち" : "出す",
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

  // 0件の分類は出さない (通知の場)。順序は宿題まわり→その他
  const ORDER: Cat[] = ["宿題", "提出ずみ", "合格", "カルテ", "お祝い", "癖"]
  const count = (c: Cat) => rows.filter((r) => r.cat === c).length
  const cats = ORDER.filter((c) => count(c) > 0)
  const [cat, setCat] = useState<Cat | null>(null)
  const [open, setOpen] = useState(false)
  const cur = cat && cats.includes(cat) ? cat : cats[0]
  if (rows.length === 0 && unread === 0) return null

  const shown = rows.filter((r) => r.cat === cur)

  return (
    <div className={ds.card} style={{ padding: "12px 14px" }} data-onboarding="home.teacherCard">
      {/* 頭の行 = アコーディオンの取っ手。閉じたまま件数の要約が読める */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          display: "flex", alignItems: "center", gap: 8, width: "100%",
          border: "none", background: "transparent", padding: 0, cursor: "pointer", font: "inherit", textAlign: "left",
        }}
      >
        <span className={ds.lab} style={{ flex: "none" }}>先生から</span>
        <span style={{ flex: 1, display: "flex", gap: 10, justifyContent: "flex-end", overflow: "hidden", whiteSpace: "nowrap" }}>
          {cats.map((c) => (
            <span key={c} style={{ fontSize: 10.5, fontWeight: 800, color: c === "宿題" ? "var(--gold)" : "var(--text-sub)" }}>
              {c} {count(c)}
            </span>
          ))}
        </span>
        <span
          aria-hidden
          style={{
            color: "var(--text-sub)", fontSize: 10, flex: "none",
            transform: open ? "rotate(180deg)" : "none", transition: "transform .4s cubic-bezier(.22,.9,.24,1)",
          }}
        >▼</span>
      </button>

      {/* 中身 (ぬるっと開閉) */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          transition: "grid-template-rows .45s cubic-bezier(.22,.9,.24,1)",
        }}
      >
      <div style={{ overflow: "hidden" }}>
      {/* parts-04 HEAD: 分類タブ (選択=金)。0件は出さない */}
      {cats.length > 1 && (
        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end", overflowX: "auto", marginTop: 10 }}>
          {cats.map((c) => {
            const on = c === cur
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                style={{
                  background: on ? "rgba(232,178,60,.16)" : "transparent",
                  color: on ? "var(--gold)" : "var(--text-sub)",
                  border: on ? "1px solid rgba(232,178,60,.34)" : "1px solid transparent",
                  fontSize: 10.5, fontWeight: 800, borderRadius: 999, padding: "3px 9px",
                  whiteSpace: "nowrap", flex: "none", cursor: "pointer", font: "inherit",
                }}
              >
                {c} {count(c)}
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
          style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 7, textDecoration: "none", color: "inherit" }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: r.dot, flex: "none" }} />
          <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "baseline", gap: 7 }}>
            <b style={{ fontSize: 12.5, color: "var(--text-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.title}</b>
            {r.sub && <span style={{ fontSize: 10, color: "var(--text-muted)", flex: "none" }}>{r.sub}</span>}
          </div>
          {r.pill && (
            <span
              className={r.pillGold ? `${ds.pill} ${ds.gold}` : undefined}
              style={
                r.pillGold
                  ? { fontSize: 10.5, padding: "3px 10px", flex: "none" }
                  : { fontSize: 10.5, padding: "3px 10px", flex: "none", borderRadius: 999, fontWeight: 800,
                      background: "rgba(168,201,127,.14)", color: "var(--green-soft)", border: "1px solid rgba(168,201,127,.3)" }
              }
            >
              {r.pill}
            </span>
          )}
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
      </div>
    </div>
  )
}
