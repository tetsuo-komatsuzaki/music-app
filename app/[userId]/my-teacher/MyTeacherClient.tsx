"use client"

// 先生とのやりとり UI (2026-07-28)。タブ: すべて/宿題/添削/レッスン。
// 自由チャットの「メッセージ」タブは廃止 (2026-08-09)。先生コメントは演奏・曲に紐づく形へ一本化し、
// お祝い・演奏コメントは「すべて」タイムラインに集約表示する。
import { useState, useTransition } from "react"
import { GraduationCap, Calendar, History, MessageCircle, PartyPopper, NotebookPen, Pin, Upload, ClipboardList, UserRound, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { unlinkTeacher } from "@/app/actions/teacherActions"
import { bookLesson, cancelMyBooking } from "@/app/actions/teacherLessons"
import AssignmentSubmit from "@/app/components/AssignmentSubmit"
import { goalLabel, dueInfo, DUE_COLOR, goalResult } from "@/app/_libs/assignmentGoal"

type TimelineEv = { when: string; kind: "hw" | "comment"; text: string; href?: string | null; icon?: string }

const TIMELINE_ICON: Record<string, LucideIcon> = {
  pin: Pin, message: MessageCircle, upload: Upload, you: UserRound, clipboard: ClipboardList, party: PartyPopper,
}
type Homework = {
  id: string; title: string; detail: string; comment: string | null
  dueDate: string | null; goalType: string | null; targetScore: number | null
  achieved: boolean; mastered: boolean
  done: boolean; submitted: boolean; submittedScore: number | null; date: string; href: string
}
type Feedback = { scoreId: string; title: string; date: string }
/** 先生からの練習後カルテ (演奏への返し・2026-08-11) */
type KarteItem = { when: string; title: string; href: string; body: string }
type LessonDTO = { id: string; when: string; durationMin: number; online: boolean; locationNote: string | null }
type Lessons = { open: LessonDTO[]; booked: LessonDTO[] }

const ACCENT = "#4f63c6"
const INK = "#26303a"
const SUB = "#6b7885"

export default function MyTeacherClient({
  userId, teacherName, since, timeline, homework, karteItems = [], feedbacks, lessons, nextLessonLabel,
}: {
  userId: string
  teacherName: string
  since: string
  timeline: TimelineEv[]
  homework: Homework[]
  karteItems?: KarteItem[]
  feedbacks: Feedback[]
  lessons: Lessons
  nextLessonLabel: string | null
}) {
  const [tab, setTab] = useState<"all" | "hw" | "karte" | "review">("all")
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const doUnlink = () => {
    if (!window.confirm(`${teacherName} 先生との、つながりを解除しますか？\n（また「設定 > 先生とつながる」からつなぎ直せます）`)) return
    startTransition(async () => {
      await unlinkTeacher()
      router.push(`/${userId}`)
      router.refresh()
    })
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "16px 14px 60px" }}>
      <h1 style={{ fontSize: "var(--fs-head)", fontWeight: 900, margin: "0 0 12px" }}>先生とのやりとり</h1>

      {/* 先生カード */}
      <div style={card()}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 40, height: 40, borderRadius: "50%", background: "#eafaf0", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><GraduationCap size={22} color="#2e8b57" /></span>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: "block", fontSize: "var(--fs-subhead)", fontWeight: 800, color: INK }}>{teacherName} 先生</span>
            <span style={{ display: "block", fontSize: "var(--fs-caption)", color: SUB }}>つながって {since} から</span>
          </span>
        </div>
        {nextLessonLabel && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #f1f3f5", fontSize: "var(--fs-body)", color: INK }}>
<span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Calendar size={13} /> 次回レッスン：<b>{nextLessonLabel}</b></span>
          </div>
        )}
      </div>

      {/* タブ */}
      <div style={{ display: "flex", gap: 3, background: "#fff", border: "1px solid #eef1f4", borderRadius: 10, padding: 3, margin: "12px 0" }}>
        {([["all", "すべて"], ["hw", "宿題"], ["karte", "練習後カルテ"], ["review", "添削"]] as const).map(([k, label]) => (
          <button key={k} type="button" onClick={() => setTab(k)}
            style={{ flex: 1, border: "none", background: tab === k ? ACCENT : "transparent", color: tab === k ? "#fff" : SUB, borderRadius: 8, padding: "7px 0", fontSize: "var(--fs-caption)", fontWeight: 800, cursor: "pointer" }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "all" && <AllTab timeline={timeline} />}
      {tab === "hw" && <HwTab homework={homework} />}
      {tab === "karte" && <KarteTab items={karteItems} />}
      {tab === "review" && <ReviewTab userId={userId} feedbacks={feedbacks} />}

      {/* 解約 */}
      <div style={{ ...card(), marginTop: 18 }}>
        <button type="button" onClick={doUnlink} disabled={pending}
          style={{ width: "100%", border: "1px solid #e2e6ea", background: "#fff", color: "var(--text-error)", borderRadius: 10, padding: 11, fontSize: "var(--fs-body)", fontWeight: 800, cursor: "pointer", opacity: pending ? 0.6 : 1 }}>
          先生を解約する
        </button>
      </div>
    </div>
  )
}

function AllTab({ timeline }: { timeline: TimelineEv[] }) {
  if (timeline.length === 0) return <Empty note="まだやりとりはありません。先生からの宿題やコメントがここに並びます。" />
  return (
    <div style={card()}>
      <div style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-muted)", marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}><History size={13} /> これまでのやりとり</div>
      <div style={{ position: "relative", paddingLeft: 16, display: "flex", flexDirection: "column", gap: 11 }}>
        <span style={{ position: "absolute", left: 4, top: 4, bottom: 4, width: 2, background: "#e7eaee" }} />
        {timeline.map((e, i) => (
          <div key={i} style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: -16, top: 3, width: 9, height: 9, borderRadius: "50%", background: e.kind === "hw" ? "#2e8b57" : ACCENT, border: "2px solid #fff" }} />
            <div style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)", fontWeight: 700 }}>{e.when}</div>
            {(() => {
              const Ic = e.icon ? TIMELINE_ICON[e.icon] : null
              const body = <span style={{ display: "inline-flex", alignItems: "flex-start", gap: 5 }}>{Ic && <Ic size={13} style={{ flex: "none", marginTop: 2 }} />} <span>{e.text}</span></span>
              return e.href ? (
                <Link href={e.href} style={{ fontSize: "var(--fs-body)", color: INK, textDecoration: "none" }}>{body} <span style={{ color: ACCENT, fontWeight: 800 }}>›</span></Link>
              ) : (
                <div style={{ fontSize: "var(--fs-body)", color: INK }}>{body}</div>
              )
            })()}
          </div>
        ))}
      </div>
    </div>
  )
}

function HwTab({ homework }: { homework: Homework[] }) {
  if (homework.length === 0) return <Empty note="いまは宿題がありません。" />
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {homework.map((h) => <HwCard key={h.id} h={h} />)}
    </div>
  )
}

function HwCard({ h }: { h: Homework }) {
  const router = useRouter()
  const di = dueInfo(h.dueDate)
  const goal = goalLabel(h.goalType, h.targetScore)
  const gr = goalResult(h.goalType, { achieved: h.achieved, mastered: h.mastered })
  const showGr = gr && h.goalType !== "score"

  return (
    <div style={card()}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontSize: "var(--fs-body)", fontWeight: 800, color: INK }}>{h.title}</span>
        {h.submitted ? (
          <span style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-good)", flex: "none" }}>提出済{h.submittedScore != null ? ` ${h.submittedScore}点` : ""}</span>
        ) : (
          <span style={{ fontSize: "var(--fs-caption)", fontWeight: 700, color: "var(--text-master)", flex: "none" }}>未提出</span>
        )}
      </div>
      {(di || goal || showGr) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 5 }}>
          {di && (() => {
            const c = DUE_COLOR[di.state]
            return (
              <span style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: c.fg, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 999, padding: "2px 8px" }}>
                期限 {di.label}{di.state === "overdue" ? "（過ぎています）" : di.state === "soon" ? "（もうすぐ）" : ""}
              </span>
            )
          })()}
          {goal && (
            <span style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-link)", background: "#eef1fe", border: "1px solid #d6ddff", borderRadius: 999, padding: "2px 8px" }}>{goal}</span>
          )}
          {showGr && gr && (
            <span style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: gr.met ? "#2e8b57" : "#9aa6b3", background: gr.met ? "#e9f7ef" : "#f1f4f8", border: `1px solid ${gr.met ? "#cbe8d6" : "#e2e6ea"}`, borderRadius: 999, padding: "2px 8px" }}>{gr.label}</span>
          )}
        </div>
      )}
      <div style={{ fontSize: "var(--fs-body)", color: SUB, marginTop: 5 }}>{h.detail || "（詳細指定なし）"}</div>
      {h.comment && <div style={{ fontSize: "var(--fs-body)", color: INK, marginTop: 4, display: "flex", gap: 5 }}><MessageCircle size={13} style={{ flex: "none", marginTop: 2 }} /> <span>{h.comment}</span></div>}
      {!h.submitted && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 9 }}>
          <Link href={h.href} className="pressable" style={{ textAlign: "center", background: ACCENT, color: "var(--text-on-accent)", border: "none", fontSize: "var(--fs-body)", fontWeight: 800, borderRadius: 9, padding: "9px 0", textDecoration: "none" }}>演奏する</Link>
          <AssignmentSubmit assignmentId={h.id} goalType={h.goalType} targetScore={h.targetScore} onDone={() => router.refresh()} />
        </div>
      )}
      {h.submitted && (
        <div style={{ marginTop: 9 }}>
          <Link href={h.href} style={{ display: "inline-block", background: "#f7f8fa", color: SUB, border: "1px solid #e7eaee", fontSize: "var(--fs-body)", fontWeight: 800, borderRadius: 9, padding: "8px 16px", textDecoration: "none" }}>もう一度練習する →</Link>
        </div>
      )}
    </div>
  )
}

/* 先生からの練習後カルテ (演奏への返し)。タップでその演奏の練習後カルテへ */
function KarteTab({ items }: { items: KarteItem[] }) {
  if (items.length === 0) return <Empty note="まだ先生からの練習後カルテはありません。演奏に先生がコメントすると、ここに届きます。" />
  const md = (iso: string) => { const d = new Date(iso); return `${d.getMonth() + 1}/${d.getDate()}` }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((k, i) => (
        <Link key={i} href={k.href} style={{ ...card(), textDecoration: "none", color: INK, display: "block" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <b style={{ fontSize: "var(--fs-body)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k.title}</b>
            <span style={{ marginLeft: "auto", flex: "none", fontSize: "var(--fs-label)", color: SUB, fontWeight: 700 }}>{md(k.when)}</span>
          </div>
          <div style={{ fontSize: "var(--fs-body)", color: "var(--text-body)", lineHeight: 1.6, marginTop: 5, whiteSpace: "pre-wrap" }}>{k.body}</div>
          <div style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: ACCENT, marginTop: 7 }}>この演奏の練習後カルテをひらく →</div>
        </Link>
      ))}
    </div>
  )
}

function ReviewTab({ userId, feedbacks }: { userId: string; feedbacks: Feedback[] }) {
  if (feedbacks.length === 0) return <Empty note="まだ先生からの添削はありません。先生が譜面に書き込むと、ここに届きます。" />
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {feedbacks.map((f) => (
        <Link key={f.scoreId} href={`/${userId}/scores/${f.scoreId}`}
          style={{ ...card(), display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, textDecoration: "none", color: "inherit" }}>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "var(--fs-body)", fontWeight: 800, color: INK, overflow: "hidden" }}><NotebookPen size={14} style={{ flex: "none" }} /> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.title}</span></span>
            <span style={{ display: "block", fontSize: "var(--fs-caption)", color: SUB }}>{f.date} に更新</span>
          </span>
          <span style={{ fontSize: "var(--fs-body)", fontWeight: 800, color: ACCENT, flex: "none" }}>譜面で見る →</span>
        </Link>
      ))}
    </div>
  )
}

function Empty({ note }: { note: string }) {
  return <div style={{ ...card(), textAlign: "center", fontSize: "var(--fs-body)", color: SUB }}>{note}</div>
}

function card(): React.CSSProperties {
  return { background: "#fff", border: "1px solid #eef1f4", borderRadius: 14, padding: "13px 15px", boxShadow: "0 1px 3px rgba(30,45,70,.05)" }
}
