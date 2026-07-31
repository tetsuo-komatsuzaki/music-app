"use client"

// 生徒カルテ UI (2026-07-28)。タブ = 概要 / 宿題。将来タブ(診断/添削)はここに足すだけ。
import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createAssignment, sendMessageToStudent } from "@/app/actions/teacherActions"

type Target = { id: string; title: string }
type Briefing = {
  practiceCount7d: number
  recent5: { title: string; avg: number; date: string }[]
  achievements: { title: string; mastered: boolean }[]
}
type AssignmentRow = {
  id: string
  targetTitle: string
  targetMeasures: string | null
  reps: number | null
  targetTempo: number | null
  comment: string | null
  done: boolean
  submitted: boolean
  submittedScore: number | null
  createdAt: string
}

type Msg = { id: string; fromTeacher: boolean; body: string; time: string }
type WorkItem = { title: string; cat: string; avg: number }
type WeakSlot = { name: string; tree: "音程" | "リズム"; miss: number; target: number }
type Recording = { id: string; title: string; cat: string; pitch: number; timing: number; avg: number; date: string; audioUrl: string | null; weak: WeakSlot[] }

export default function StudentKarte({
  userId, studentId, studentName, briefing, scoreTargets, itemTargets, working, recordings, assignments, messages,
}: {
  userId: string
  studentId: string
  studentName: string
  briefing: Briefing
  scoreTargets: Target[]
  itemTargets: Target[]
  working: WorkItem[]
  recordings: Recording[]
  assignments: AssignmentRow[]
  messages: Msg[]
}) {
  const [tab, setTab] = useState<"overview" | "practice" | "homework" | "review" | "message">("overview")
  return (
    <div>
      <Link href={`/${userId}/teacher`} style={{ fontSize: 12, color: "#6b7885", textDecoration: "none" }}>← 生徒一覧</Link>
      <h1 style={{ fontSize: 18, fontWeight: 900, margin: "6px 0 10px" }}>{studentName}</h1>

      <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
        {([["overview", "概要"], ["practice", "練習"], ["homework", "宿題"], ["review", "添削"], ["message", "メッセージ"]] as const).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            style={{
              flex: 1, border: "1px solid", borderColor: tab === k ? "#2b3742" : "#e2e6ea",
              background: tab === k ? "#2b3742" : "#fff", color: tab === k ? "#fff" : "#6b7885",
              borderRadius: 10, padding: "8px 0", fontSize: 10.5, fontWeight: 800, cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && <Overview b={briefing} />}
      {tab === "practice" && <PracticeTab working={working} recordings={recordings} />}
      {tab === "homework" && (
        <Homework studentId={studentId} scoreTargets={scoreTargets} itemTargets={itemTargets} assignments={assignments} />
      )}
      {tab === "review" && <FeedbackTab userId={userId} studentId={studentId} scoreTargets={scoreTargets} />}
      {tab === "message" && <Messages studentId={studentId} studentName={studentName} messages={messages} />}
    </div>
  )
}

function FeedbackTab({ userId, studentId, scoreTargets }: { userId: string; studentId: string; scoreTargets: Target[] }) {
  return (
    <Card>
      <div style={{ fontSize: 12, fontWeight: 800, color: "#6b7885", marginBottom: 4 }}>譜面に添削する</div>
      <p style={{ fontSize: 12, color: "#9aa6b3", margin: "0 0 10px" }}>曲を選ぶと、譜面にハイライトやメモを書き込めます（生徒に届きます）。</p>
      {scoreTargets.length === 0 ? (
        <div style={{ fontSize: 12.5, color: "#9aa6b3" }}>この生徒はまだ曲の演奏がありません。</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {scoreTargets.map((s) => (
            <Link key={s.id} href={`/${userId}/teacher/students/${studentId}/annotate/${s.id}`}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, textDecoration: "none", color: "inherit", border: "1px solid #eef1f4", borderRadius: 10, padding: "10px 12px" }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#2b3742", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</span>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: "#4f63c6", flex: "none" }}>添削する →</span>
            </Link>
          ))}
        </div>
      )}
    </Card>
  )
}

function PracticeTab({ working, recordings }: { working: WorkItem[]; recordings: Recording[] }) {
  const scoreColor = (n: number) => (n >= 90 ? "#2e8b57" : n >= 70 ? "#b7823a" : "#c0473a")
  return (
    <>
      <Card>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#6b7885", marginBottom: 8 }}>取り組んでいる曲・教材</div>
        {working.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "#9aa6b3" }}>まだ録音がありません。</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {working.map((w, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, fontSize: 13 }}>
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "#6b7885", background: "#f7f8fa", border: "1px solid #eef1f4", borderRadius: 999, padding: "1px 7px", marginRight: 6 }}>{w.cat}</span>
                  <b style={{ color: "#2b3742" }}>{w.title}</b>
                </span>
                <span style={{ fontSize: 12, fontWeight: 800, color: scoreColor(w.avg), flex: "none" }}>{w.avg}点</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#6b7885", marginBottom: 8 }}>直近の録音（分析結果つき）</div>
        {recordings.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "#9aa6b3" }}>まだ録音がありません。</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recordings.map((r) => (
              <div key={r.id} style={{ border: "1px solid #eef1f4", borderRadius: 10, padding: "9px 11px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <span style={{ fontSize: 9.5, fontWeight: 800, color: "#6b7885", background: "#f7f8fa", border: "1px solid #eef1f4", borderRadius: 999, padding: "1px 6px", marginRight: 5 }}>{r.cat}</span>
                    <b style={{ fontSize: 13, color: "#2b3742" }}>{r.title}</b>
                  </span>
                  <span style={{ fontSize: 11, color: "#9aa6b3", flex: "none" }}>{r.date}</span>
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 11.5, marginTop: 5 }}>
                  <span style={{ color: "#6b7885" }}>音程 <b style={{ color: scoreColor(r.pitch) }}>{r.pitch}</b></span>
                  <span style={{ color: "#6b7885" }}>リズム <b style={{ color: scoreColor(r.timing) }}>{r.timing}</b></span>
                  <span style={{ color: "#6b7885" }}>平均 <b style={{ color: scoreColor(r.avg) }}>{r.avg}</b></span>
                </div>
                {r.weak.length > 0 && (
                  <div style={{ marginTop: 7, display: "flex", flexDirection: "column", gap: 3 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#9aa6b3" }}>崩れやすかった所</div>
                    {r.weak.map((w, i) => (
                      <div key={i} style={{ fontSize: 11.5, color: "#4a5766" }}>
                        <span style={{ fontSize: 9.5, fontWeight: 800, color: w.tree === "音程" ? "#c0473a" : "#b7823a", background: w.tree === "音程" ? "#fbecea" : "#fbf1e2", borderRadius: 999, padding: "1px 6px", marginRight: 5 }}>{w.tree}</span>
                        🎯 {w.name}（{w.target}音中{w.miss}ミス）
                      </div>
                    ))}
                  </div>
                )}
                {r.audioUrl ? (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <audio controls preload="none" src={r.audioUrl} style={{ width: "100%", height: 34, marginTop: 8 }} />
                ) : (
                  <div style={{ fontSize: 11, color: "#b3bcc6", marginTop: 6 }}>音声を読み込めませんでした</div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  )
}

function Messages({ studentId, studentName, messages }: { studentId: string; studentName: string; messages: Msg[] }) {
  const router = useRouter()
  const [text, setText] = useState("")
  const [err, setErr] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const send = () => {
    const body = text.trim()
    if (!body) return
    setErr(null)
    startTransition(async () => {
      const r = await sendMessageToStudent(studentId, body)
      if (!r.ok) { setErr(r.error); return }
      setText("")
      router.refresh()
    })
  }

  return (
    <Card>
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 12, maxHeight: 380, overflowY: "auto" }}>
        {messages.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "#9aa6b3", textAlign: "center", padding: "12px 0" }}>
            {studentName} さんとのメッセージはまだありません。
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} style={{
              maxWidth: "84%", alignSelf: m.fromTeacher ? "flex-end" : "flex-start",
              background: m.fromTeacher ? "#2b3742" : "#fff", color: m.fromTeacher ? "#fff" : "#2b3742",
              border: m.fromTeacher ? "none" : "1px solid #e7eaee", borderRadius: 12,
              borderBottomRightRadius: m.fromTeacher ? 3 : 12, borderBottomLeftRadius: m.fromTeacher ? 12 : 3,
              padding: "7px 11px", fontSize: 12.5, lineHeight: 1.45,
            }}>
              {m.body}
              <div style={{ fontSize: 9.5, opacity: 0.7, marginTop: 3, textAlign: "right" }}>{m.time}</div>
            </div>
          ))
        )}
      </div>
      <div style={{ display: "flex", gap: 7 }}>
        <input value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) send() }}
          placeholder={`${studentName} さんへ返信…`}
          style={{ flex: 1, border: "1px solid #dfe3e8", borderRadius: 9, padding: "9px 12px", fontSize: 13 }} />
        <button type="button" onClick={send} disabled={pending || !text.trim()}
          style={{ border: "none", borderRadius: 9, padding: "0 16px", fontSize: 12.5, fontWeight: 800, color: "#fff", background: "#2b3742", cursor: "pointer", opacity: pending || !text.trim() ? 0.5 : 1 }}>
          送る
        </button>
      </div>
      {err && <div style={{ fontSize: 11.5, color: "#c0392b", marginTop: 6 }}>{err}</div>}
    </Card>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #eef1f4", borderRadius: 14, padding: "14px 16px", marginBottom: 12 }}>
      {children}
    </div>
  )
}

function Overview({ b }: { b: Briefing }) {
  return (
    <>
      <Card>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#6b7885", marginBottom: 6 }}>レッスン前ブリーフィング</div>
        <div style={{ fontSize: 14, color: "#2b3742" }}>
          直近7日の練習：<b>{b.practiceCount7d}</b> 回
        </div>
      </Card>

      <Card>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#6b7885", marginBottom: 8 }}>直近の演奏</div>
        {b.recent5.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "#9aa6b3" }}>まだ評価済みの演奏がありません。</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {b.recent5.map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "#2b3742", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</span>
                <span style={{ color: "#6b7885", flex: "none", marginLeft: 8 }}>{r.avg}点 ・ {r.date}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#6b7885", marginBottom: 8 }}>達成・マスター</div>
        {b.achievements.length === 0 ? (
          <div style={{ fontSize: 12.5, color: "#9aa6b3" }}>まだ達成した曲はありません。</div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {b.achievements.map((a, i) => (
              <span key={i} style={{ fontSize: 12, fontWeight: 700, color: a.mastered ? "#b5651d" : "#2e8b57", background: a.mastered ? "#fdf3df" : "#eafaf0", border: "1px solid", borderColor: a.mastered ? "#eecfa0" : "#cbe8d6", borderRadius: 999, padding: "3px 10px" }}>
                {a.mastered ? "🏆" : "✨"} {a.title}
              </span>
            ))}
          </div>
        )}
      </Card>
    </>
  )
}

function Homework({
  studentId, scoreTargets, itemTargets, assignments,
}: {
  studentId: string
  scoreTargets: Target[]
  itemTargets: Target[]
  assignments: AssignmentRow[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [kind, setKind] = useState<"score" | "item">("score")
  const [targetId, setTargetId] = useState("")
  const [measures, setMeasures] = useState("")
  const [reps, setReps] = useState("")
  const [tempo, setTempo] = useState("")
  const [comment, setComment] = useState("")
  const [err, setErr] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const targets = kind === "score" ? scoreTargets : itemTargets

  const submit = () => {
    setErr(null)
    if (!targetId) { setErr("対象の曲/教材を選んでください"); return }
    startTransition(async () => {
      const r = await createAssignment({
        studentId,
        scoreId: kind === "score" ? targetId : null,
        practiceItemId: kind === "item" ? targetId : null,
        targetMeasures: measures || null,
        reps: reps ? Number(reps) : null,
        targetTempo: tempo ? Number(tempo) : null,
        comment: comment || null,
      })
      if (!r.ok) { setErr(r.error); return }
      setOpen(false); setTargetId(""); setMeasures(""); setReps(""); setTempo(""); setComment("")
      router.refresh()
    })
  }

  const inp: React.CSSProperties = { width: "100%", border: "1px solid #dfe3e8", borderRadius: 8, padding: "8px 10px", fontSize: 13, marginTop: 4 }
  const lbl: React.CSSProperties = { fontSize: 11.5, fontWeight: 700, color: "#6b7885" }

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{ width: "100%", border: "1px dashed #b7c0ca", background: "#fff", color: "#2b3742", borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 800, cursor: "pointer", marginBottom: 14 }}
        >
          ＋ 宿題を出す
        </button>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #eef1f4", borderRadius: 14, padding: 16, marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {([["score", "曲"], ["item", "教材"]] as const).map(([k, label]) => (
              <button key={k} type="button" onClick={() => { setKind(k); setTargetId("") }}
                style={{ flex: 1, border: "1px solid", borderColor: kind === k ? "#2b3742" : "#e2e6ea", background: kind === k ? "#2b3742" : "#fff", color: kind === k ? "#fff" : "#6b7885", borderRadius: 8, padding: "6px 0", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                {label}
              </button>
            ))}
          </div>

          <label style={lbl}>対象（生徒が最近取り組んだ{kind === "score" ? "曲" : "教材"}）
            <select value={targetId} onChange={(e) => setTargetId(e.target.value)} style={inp}>
              <option value="">選択してください</option>
              {targets.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </label>
          {targets.length === 0 && (
            <div style={{ fontSize: 11.5, color: "#9aa6b3", marginTop: 4 }}>この生徒はまだ{kind === "score" ? "曲" : "教材"}の演奏記録がありません。</div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <label style={{ ...lbl, flex: 1 }}>対象小節<input value={measures} onChange={(e) => setMeasures(e.target.value)} placeholder="例: 1-4" style={inp} /></label>
            <label style={{ ...lbl, width: 90 }}>回数<input value={reps} onChange={(e) => setReps(e.target.value.replace(/[^0-9]/g, ""))} placeholder="5" style={inp} inputMode="numeric" /></label>
            <label style={{ ...lbl, width: 110 }}>目標♩<input value={tempo} onChange={(e) => setTempo(e.target.value.replace(/[^0-9]/g, ""))} placeholder="80" style={inp} inputMode="numeric" /></label>
          </div>
          <label style={{ ...lbl, display: "block", marginTop: 10 }}>コメント
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="例: 移弦を先に準備しよう" style={{ ...inp, resize: "vertical" }} />
          </label>

          {err && <div style={{ fontSize: 12, color: "#c0392b", marginTop: 8 }}>{err}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button type="button" onClick={() => setOpen(false)} style={{ flex: 1, border: "1px solid #e2e6ea", background: "#fff", color: "#6b7885", borderRadius: 10, padding: 10, fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}>キャンセル</button>
            <button type="button" onClick={submit} disabled={pending} style={{ flex: 2, border: "none", background: "#2b3742", color: "#fff", borderRadius: 10, padding: 10, fontSize: 12.5, fontWeight: 800, cursor: "pointer", opacity: pending ? 0.6 : 1 }}>
              {pending ? "送信中…" : "宿題を出す"}
            </button>
          </div>
        </div>
      )}

      <div style={{ fontSize: 12, fontWeight: 800, color: "#6b7885", margin: "4px 0 8px" }}>これまでの宿題</div>
      {assignments.length === 0 ? (
        <div style={{ fontSize: 12.5, color: "#9aa6b3" }}>まだ宿題はありません。</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {assignments.map((a) => (
            <div key={a.id} style={{ background: "#fff", border: "1px solid #eef1f4", borderRadius: 12, padding: "10px 12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#2b3742" }}>{a.targetTitle}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: a.submitted ? "#2e8b57" : "#b7823a", flex: "none" }}>{a.submitted ? `提出済${a.submittedScore != null ? ` ${a.submittedScore}点` : ""}` : "未提出"}</span>
              </div>
              <div style={{ fontSize: 12, color: "#6b7885", marginTop: 3 }}>
                {[a.targetMeasures && `第${a.targetMeasures}小節`, a.reps && `×${a.reps}`, a.targetTempo && `♩=${a.targetTempo}`].filter(Boolean).join(" ・ ") || "（詳細指定なし）"}
              </div>
              {a.comment && <div style={{ fontSize: 12.5, color: "#2b3742", marginTop: 4 }}>💬 {a.comment}</div>}
              <div style={{ fontSize: 10.5, color: "#b3bcc6", marginTop: 4 }}>{a.createdAt}</div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
