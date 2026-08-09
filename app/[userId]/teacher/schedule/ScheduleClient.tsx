"use client"

// 先生: レッスン枠の作成・一覧 (2026-08-01 Phase3)。
import { useState, useTransition } from "react"
import Link from "next/link"
import { Laptop, MapPin } from "lucide-react"
import { useRouter } from "next/navigation"
import { createLessonSlot, cancelLesson } from "@/app/actions/teacherLessons"

type Lesson = {
  id: string; when: string; durationMin: number; online: boolean
  locationNote: string | null; status: "open" | "booked"; studentName: string | null
}

export default function ScheduleClient({ userId, lessons }: { userId: string; lessons: Lesson[] }) {
  const router = useRouter()
  const [start, setStart] = useState("")
  const [dur, setDur] = useState("30")
  const [online, setOnline] = useState(true)
  const [place, setPlace] = useState("")
  const [err, setErr] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const add = () => {
    setErr(null)
    if (!start) { setErr("日時を選んでください"); return }
    startTransition(async () => {
      const r = await createLessonSlot({ startAtIso: new Date(start).toISOString(), durationMin: Number(dur) || 30, online, locationNote: place })
      if (!r.ok) { setErr(r.error); return }
      setStart(""); setPlace("")
      router.refresh()
    })
  }

  const remove = (id: string, booked: boolean) => {
    if (!window.confirm(booked ? "予約済みのレッスンを取り消しますか？" : "この枠を取り消しますか？")) return
    startTransition(async () => { await cancelLesson(id); router.refresh() })
  }

  const inp: React.CSSProperties = { border: "1px solid #dfe3e8", borderRadius: 8, padding: "8px 10px", fontSize: "var(--fs-body)" }
  const card: React.CSSProperties = { background: "#fff", border: "1px solid #eef1f4", borderRadius: 14, padding: "14px 16px", marginBottom: 12, boxShadow: "0 1px 3px rgba(30,45,70,.05)" }

  return (
    <div>
      <Link href={`/${userId}/teacher`} style={{ fontSize: "var(--fs-body)", color: "var(--text-sub)", textDecoration: "none" }}>← 先生ホーム</Link>
      <h1 style={{ fontSize: "var(--fs-head)", fontWeight: 900, margin: "6px 0 2px" }}>レッスン枠</h1>
      <p style={{ fontSize: "var(--fs-body)", color: "var(--text-sub)", margin: "0 0 14px" }}>空き枠を出すと、担当の生徒が予約できます。</p>

      <div style={card}>
        <div style={{ fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-ink)", marginBottom: 8 }}>空き枠を追加</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} style={inp} />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ fontSize: "var(--fs-body)", color: "var(--text-sub)" }}>長さ
              <select value={dur} onChange={(e) => setDur(e.target.value)} style={{ ...inp, marginLeft: 6 }}>
                {[15, 30, 45, 60].map((d) => <option key={d} value={d}>{d}分</option>)}
              </select>
            </label>
            <button type="button" onClick={() => setOnline((v) => !v)} style={{ ...inp, cursor: "pointer", fontWeight: 800, background: online ? "#eef1f4" : "#fff", color: "var(--text-ink)", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
              {online ? <><Laptop size={13} /> オンライン</> : <><MapPin size={13} /> 対面</>}
            </button>
          </div>
          <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder={online ? "ビデオURL等（任意）" : "場所（任意）"} style={inp} maxLength={200} />
          {err && <div style={{ fontSize: "var(--fs-body)", color: "var(--text-error)" }}>{err}</div>}
          <button type="button" onClick={add} disabled={pending}
            style={{ border: "none", borderRadius: 9, padding: 11, fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-on-accent)", background: "#2b3742", cursor: "pointer", opacity: pending ? 0.6 : 1 }}>
            枠を追加
          </button>
        </div>
      </div>

      <div style={{ fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-sub)", margin: "4px 0 8px" }}>これからのレッスン</div>
      {lessons.length === 0 ? (
        <div style={{ ...card, textAlign: "center", color: "var(--text-muted)", fontSize: "var(--fs-body)" }}>まだ枠がありません。</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {lessons.map((l) => (
            <div key={l.id} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-ink)" }}>{l.when}</span>
                <span style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: l.status === "booked" ? "#2e8b57" : "#b7823a", flex: "none" }}>
                  {l.status === "booked" ? `予約済み・${l.studentName ?? ""}` : "空き"}
                </span>
              </div>
              <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-sub)", marginTop: 3 }}>
                {l.durationMin}分 ・ {l.online ? "オンライン" : "対面"}{l.locationNote ? ` ・ ${l.locationNote}` : ""}
              </div>
              <button type="button" onClick={() => remove(l.id, l.status === "booked")}
                style={{ marginTop: 8, border: "1px solid #e2e6ea", background: "#fff", color: "var(--text-error)", borderRadius: 8, padding: "6px 12px", fontSize: "var(--fs-caption)", fontWeight: 800, cursor: "pointer" }}>
                取り消す
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
