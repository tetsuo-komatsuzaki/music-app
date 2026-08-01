"use client"

// 先生とのやりとり UI (2026-07-28)。タブ: すべて/宿題/添削/メッセージ。
// Phase 1: すべて(これまでのやりとり)・宿題は実データ。添削・メッセージは準備中(Phase 1.5)。
import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { unlinkTeacher, sendMessage } from "@/app/actions/teacherActions"
import { bookLesson, cancelMyBooking } from "@/app/actions/teacherLessons"
import AssignmentSubmit from "@/app/components/AssignmentSubmit"
import { goalLabel, dueInfo, DUE_COLOR, goalResult } from "@/app/_libs/assignmentGoal"

type TimelineEv = { when: string; kind: "hw" | "comment"; text: string; href?: string | null }
type Homework = {
  id: string; title: string; detail: string; comment: string | null
  dueDate: string | null; goalType: string | null; targetScore: number | null
  achieved: boolean; mastered: boolean
  done: boolean; submitted: boolean; submittedScore: number | null; date: string; href: string
}
type Msg = { id: string; fromTeacher: boolean; body: string; time: string; perf?: { title: string; href: string } | null }
type Feedback = { scoreId: string; title: string; date: string }
type LessonDTO = { id: string; when: string; durationMin: number; online: boolean; locationNote: string | null }
type Lessons = { open: LessonDTO[]; booked: LessonDTO[] }

const ACCENT = "#4f63c6"
const INK = "#26303a"
const SUB = "#6b7885"

export default function MyTeacherClient({
  userId, teacherName, since, timeline, homework, messages, feedbacks, lessons, nextLessonLabel,
}: {
  userId: string
  teacherName: string
  since: string
  timeline: TimelineEv[]
  homework: Homework[]
  messages: Msg[]
  feedbacks: Feedback[]
  lessons: Lessons
  nextLessonLabel: string | null
}) {
  const [tab, setTab] = useState<"all" | "hw" | "review" | "msg" | "lesson">("all")
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
      <h1 style={{ fontSize: 18, fontWeight: 900, margin: "0 0 12px" }}>先生とのやりとり</h1>

      {/* 先生カード */}
      <div style={card()}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 40, height: 40, borderRadius: "50%", background: "#eafaf0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flex: "none" }}>👩‍🏫</span>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 14.5, fontWeight: 800, color: INK }}>{teacherName} 先生</span>
            <span style={{ display: "block", fontSize: 11.5, color: SUB }}>つながって {since} から</span>
          </span>
        </div>
        {nextLessonLabel && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #f1f3f5", fontSize: 12.5, color: INK }}>
            📅 次回レッスン：<b>{nextLessonLabel}</b>
          </div>
        )}
      </div>

      {/* タブ */}
      <div style={{ display: "flex", gap: 3, background: "#fff", border: "1px solid #eef1f4", borderRadius: 10, padding: 3, margin: "12px 0" }}>
        {([["all", "すべて"], ["hw", "宿題"], ["review", "添削"], ["msg", "メッセージ"], ["lesson", "レッスン"]] as const).map(([k, label]) => (
          <button key={k} type="button" onClick={() => setTab(k)}
            style={{ flex: 1, border: "none", background: tab === k ? ACCENT : "transparent", color: tab === k ? "#fff" : SUB, borderRadius: 8, padding: "7px 0", fontSize: 10.5, fontWeight: 800, cursor: "pointer" }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "all" && <AllTab timeline={timeline} />}
      {tab === "hw" && <HwTab homework={homework} />}
      {tab === "review" && <ReviewTab userId={userId} feedbacks={feedbacks} />}
      {tab === "msg" && <MsgTab teacherName={teacherName} messages={messages} />}
      {tab === "lesson" && <LessonTab lessons={lessons} />}

      {/* 解約 */}
      <div style={{ ...card(), marginTop: 18 }}>
        <button type="button" onClick={doUnlink} disabled={pending}
          style={{ width: "100%", border: "1px solid #e2e6ea", background: "#fff", color: "#c0473a", borderRadius: 10, padding: 11, fontSize: 12.5, fontWeight: 800, cursor: "pointer", opacity: pending ? 0.6 : 1 }}>
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
      <div style={{ fontSize: 11, fontWeight: 800, color: "#9aa6b3", marginBottom: 10 }}>🕐 これまでのやりとり</div>
      <div style={{ position: "relative", paddingLeft: 16, display: "flex", flexDirection: "column", gap: 11 }}>
        <span style={{ position: "absolute", left: 4, top: 4, bottom: 4, width: 2, background: "#e7eaee" }} />
        {timeline.map((e, i) => (
          <div key={i} style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: -16, top: 3, width: 9, height: 9, borderRadius: "50%", background: e.kind === "hw" ? "#2e8b57" : ACCENT, border: "2px solid #fff" }} />
            <div style={{ fontSize: 10, color: "#9aa6b3", fontWeight: 700 }}>{e.when}</div>
            {e.href ? (
              <Link href={e.href} style={{ fontSize: 12.5, color: INK, textDecoration: "none" }}>{e.text} <span style={{ color: ACCENT, fontWeight: 800 }}>›</span></Link>
            ) : (
              <div style={{ fontSize: 12.5, color: INK }}>{e.text}</div>
            )}
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
        <span style={{ fontSize: 13.5, fontWeight: 800, color: INK }}>{h.title}</span>
        {h.submitted ? (
          <span style={{ fontSize: 11, fontWeight: 800, color: "#2e8b57", flex: "none" }}>提出済{h.submittedScore != null ? ` ${h.submittedScore}点` : ""}</span>
        ) : (
          <span style={{ fontSize: 11, fontWeight: 700, color: "#b7823a", flex: "none" }}>未提出</span>
        )}
      </div>
      {(di || goal || showGr) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 5 }}>
          {di && (() => {
            const c = DUE_COLOR[di.state]
            return (
              <span style={{ fontSize: 10.5, fontWeight: 800, color: c.fg, background: c.bg, border: `1px solid ${c.border}`, borderRadius: 999, padding: "2px 8px" }}>
                期限 {di.label}{di.state === "overdue" ? "（過ぎています）" : di.state === "soon" ? "（もうすぐ）" : ""}
              </span>
            )
          })()}
          {goal && (
            <span style={{ fontSize: 10.5, fontWeight: 800, color: "#3b56d4", background: "#eef1fe", border: "1px solid #d6ddff", borderRadius: 999, padding: "2px 8px" }}>{goal}</span>
          )}
          {showGr && gr && (
            <span style={{ fontSize: 10.5, fontWeight: 800, color: gr.met ? "#2e8b57" : "#9aa6b3", background: gr.met ? "#e9f7ef" : "#f1f4f8", border: `1px solid ${gr.met ? "#cbe8d6" : "#e2e6ea"}`, borderRadius: 999, padding: "2px 8px" }}>{gr.label}</span>
          )}
        </div>
      )}
      <div style={{ fontSize: 12, color: SUB, marginTop: 5 }}>{h.detail || "（詳細指定なし）"}</div>
      {h.comment && <div style={{ fontSize: 12.5, color: INK, marginTop: 4 }}>💬 {h.comment}</div>}
      {!h.submitted && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 9 }}>
          <Link href={h.href} style={{ textAlign: "center", background: "#f7f8fa", color: SUB, border: "1px solid #e7eaee", fontSize: 12, fontWeight: 800, borderRadius: 9, padding: "8px 0", textDecoration: "none" }}>録音する</Link>
          <AssignmentSubmit assignmentId={h.id} goalType={h.goalType} targetScore={h.targetScore} onDone={() => router.refresh()} />
        </div>
      )}
      {h.submitted && (
        <div style={{ marginTop: 9 }}>
          <Link href={h.href} style={{ display: "inline-block", background: "#f7f8fa", color: SUB, border: "1px solid #e7eaee", fontSize: 12, fontWeight: 800, borderRadius: 9, padding: "8px 16px", textDecoration: "none" }}>もう一度練習する →</Link>
        </div>
      )}
    </div>
  )
}

function MsgTab({ teacherName, messages }: { teacherName: string; messages: Msg[] }) {
  const router = useRouter()
  const [text, setText] = useState("")
  const [pending, startTransition] = useTransition()
  const [err, setErr] = useState<string | null>(null)

  const send = () => {
    const body = text.trim()
    if (!body) return
    setErr(null)
    startTransition(async () => {
      const r = await sendMessage(body)
      if (!r.ok) { setErr(r.error); return }
      setText("")
      router.refresh()
    })
  }

  return (
    <div style={card()}>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 12, maxHeight: 360, overflowY: "auto" }}>
        {messages.length === 0 ? (
          <div style={{ fontSize: 12.5, color: SUB, textAlign: "center", padding: "12px 0" }}>
            まだメッセージはありません。{teacherName} 先生に質問してみよう。
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} style={{
              maxWidth: "84%", alignSelf: m.fromTeacher ? "flex-start" : "flex-end",
              background: m.fromTeacher ? "#fff" : ACCENT, color: m.fromTeacher ? INK : "#fff",
              border: m.fromTeacher ? "1px solid #e7eaee" : "none", borderRadius: 12,
              borderBottomLeftRadius: m.fromTeacher ? 3 : 12, borderBottomRightRadius: m.fromTeacher ? 12 : 3,
              padding: "7px 11px", fontSize: 12.5, lineHeight: 1.45,
            }}>
              {m.perf && (
                <Link
                  href={m.perf.href}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 800, textDecoration: "none", marginBottom: 4, padding: "2px 7px", borderRadius: 999, background: m.fromTeacher ? "#eef0fc" : "rgba(255,255,255,.22)", color: m.fromTeacher ? "#5b6b9e" : "#fff" }}
                >
                  🎧 {m.perf.title} の演奏について →
                </Link>
              )}
              <div>{m.body}</div>
              <div style={{ fontSize: 9.5, opacity: 0.7, marginTop: 3, textAlign: "right" }}>{m.time}</div>
            </div>
          ))
        )}
      </div>
      <div style={{ display: "flex", gap: 7 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) send() }}
          placeholder="メッセージを書く…"
          style={{ flex: 1, border: "1px solid #dfe3e8", borderRadius: 9, padding: "9px 12px", fontSize: 13 }}
        />
        <button type="button" onClick={send} disabled={pending || !text.trim()}
          style={{ border: "none", borderRadius: 9, padding: "0 16px", fontSize: 12.5, fontWeight: 800, color: "#fff", background: ACCENT, cursor: "pointer", opacity: pending || !text.trim() ? 0.5 : 1 }}>
          送る
        </button>
      </div>
      {err && <div style={{ fontSize: 11.5, color: "#c0392b", marginTop: 6 }}>{err}</div>}
    </div>
  )
}

function LessonTab({ lessons }: { lessons: Lessons }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [err, setErr] = useState<string | null>(null)

  const book = (id: string) => {
    setErr(null)
    startTransition(async () => {
      const r = await bookLesson(id)
      if (!r.ok) { setErr(r.error); return }
      router.refresh()
    })
  }
  const cancel = (id: string) => {
    if (!window.confirm("このレッスンの予約を取り消しますか？")) return
    startTransition(async () => { await cancelMyBooking(id); router.refresh() })
  }
  const meta = (l: LessonDTO) => `${l.durationMin}分 ・ ${l.online ? "オンライン" : "対面"}${l.locationNote ? ` ・ ${l.locationNote}` : ""}`

  return (
    <>
      <div style={{ ...card(), marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#9aa6b3", marginBottom: 8 }}>予約中のレッスン</div>
        {lessons.booked.length === 0 ? (
          <div style={{ fontSize: 12.5, color: SUB }}>予約中のレッスンはありません。</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {lessons.booked.map((l) => (
              <div key={l.id} style={{ border: "1px solid #cbe8d6", background: "#f4fbf7", borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: INK }}>📅 {l.when}</div>
                <div style={{ fontSize: 11.5, color: SUB, marginTop: 2 }}>{meta(l)}</div>
                <button type="button" onClick={() => cancel(l.id)} disabled={pending}
                  style={{ marginTop: 8, border: "1px solid #e2e6ea", background: "#fff", color: "#c0473a", borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>予約を取り消す</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={card()}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#9aa6b3", marginBottom: 8 }}>予約できる枠</div>
        {err && <div style={{ fontSize: 12, color: "#c0392b", marginBottom: 8 }}>{err}</div>}
        {lessons.open.length === 0 ? (
          <div style={{ fontSize: 12.5, color: SUB }}>いまは空き枠がありません。先生が枠を出すと予約できます。</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {lessons.open.map((l) => (
              <div key={l.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, border: "1px solid #eef1f4", borderRadius: 10, padding: "10px 12px" }}>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 800, color: INK }}>{l.when}</span>
                  <span style={{ display: "block", fontSize: 11, color: SUB }}>{meta(l)}</span>
                </span>
                <button type="button" onClick={() => book(l.id)} disabled={pending}
                  style={{ flex: "none", border: "none", background: ACCENT, color: "#fff", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 800, cursor: "pointer", opacity: pending ? 0.6 : 1 }}>予約する</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
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
            <span style={{ display: "block", fontSize: 13.5, fontWeight: 800, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📝 {f.title}</span>
            <span style={{ display: "block", fontSize: 11, color: SUB }}>{f.date} に更新</span>
          </span>
          <span style={{ fontSize: 12, fontWeight: 800, color: ACCENT, flex: "none" }}>譜面で見る →</span>
        </Link>
      ))}
    </div>
  )
}

function Empty({ note }: { note: string }) {
  return <div style={{ ...card(), textAlign: "center", fontSize: 12.5, color: SUB }}>{note}</div>
}

function card(): React.CSSProperties {
  return { background: "#fff", border: "1px solid #eef1f4", borderRadius: 14, padding: "13px 15px", boxShadow: "0 1px 3px rgba(30,45,70,.05)" }
}
