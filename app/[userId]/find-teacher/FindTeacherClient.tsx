"use client"

// 先生を探す UI (2026-08-01 Phase2)。AI相性でおすすめ→カード一覧→つながる。招待コードも。
import { useMemo, useState, useTransition } from "react"
import { Bot, Mail, GraduationCap, Baby, Laptop, MapPin, Clock, NotebookPen } from "lucide-react"
import { useRouter } from "next/navigation"
import { connectToTeacher, linkWithInviteCode } from "@/app/actions/teacherActions"

type Teacher = {
  teacherId: string
  name: string
  headline: string | null
  bio: string | null
  specialties: string[]
  levels: string[]
  forKids: boolean
  online: boolean
  priceNote: string | null
  trial: boolean
  sampleUrl: string | null
  photoUrl: string | null
  career: string | null
  lessonStyle: string | null
  area: string | null
  availability: string | null
  ages: string[]
  genres: string[]
  match: number
  matchWeak: boolean
}

const ACCENT = "#4f63c6"
const INK = "#26303a"
const SUB = "#6b7885"

export default function FindTeacherClient({
  userId, weakAxis, teachers,
}: {
  userId: string
  weakAxis: "音程" | "リズム" | null
  teachers: Teacher[]
}) {
  const router = useRouter()
  const [fKids, setFKids] = useState(false)
  const [fOnline, setFOnline] = useState(false)
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [codeMsg, setCodeMsg] = useState<string | null>(null)

  const filtered = useMemo(
    () => teachers.filter((t) => (!fKids || t.forKids) && (!fOnline || t.online)),
    [teachers, fKids, fOnline],
  )

  const connect = (t: Teacher) => {
    if (!window.confirm(`${t.name} 先生とつながりますか？\nつながると宿題や添削を受け取れます。`)) return
    setErr(null); setBusyId(t.teacherId)
    startTransition(async () => {
      const r = await connectToTeacher(t.teacherId)
      setBusyId(null)
      if (!r.ok) { setErr(r.error); return }
      router.push(`/${userId}/my-teacher`); router.refresh()
    })
  }

  const useCode = () => {
    setCodeMsg(null)
    startTransition(async () => {
      const r = await linkWithInviteCode(code)
      if (r.ok) { router.push(`/${userId}/my-teacher`); router.refresh() }
      else setCodeMsg(r.error)
    })
  }

  const card: React.CSSProperties = { background: "#fff", border: "1px solid #eef1f4", borderRadius: 14, padding: "14px 15px", boxShadow: "0 1px 3px rgba(30,45,70,.05)" }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "16px 14px 60px" }}>
      <h1 style={{ fontSize: "var(--fs-head)", fontWeight: 900, margin: "0 0 6px" }}>先生を探す</h1>

      {weakAxis && (
        <div style={{ ...card, borderColor: "#d3d9f5", marginBottom: 12 }}>
          <div style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: ACCENT, marginBottom: 3, display: "flex", alignItems: "center", gap: 5 }}><Bot size={14} /> AI相性マッチング</div>
          <div style={{ fontSize: "var(--fs-body)", color: INK }}>いまのあなたは <b>{weakAxis}</b> が伸びしろ。<b>{weakAxis}</b>が得意な先生を上に出しています。</div>
        </div>
      )}

      {/* 招待コード */}
      <div style={{ ...card, marginBottom: 12 }}>
        <div style={{ fontSize: "var(--fs-body)", fontWeight: 800, color: INK, marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}><Mail size={14} /> 先生から招待コードをもらっている場合</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="コード" maxLength={12}
            style={{ flex: 1, border: "1px solid #dfe3e8", borderRadius: 8, padding: "8px 11px", fontSize: "var(--fs-subhead)", letterSpacing: ".1em", fontFamily: "ui-monospace, Menlo, Consolas, monospace" }} />
          <button type="button" onClick={useCode} disabled={pending || code.trim().length < 4}
            style={{ border: "none", borderRadius: 8, padding: "0 16px", fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-on-accent)", background: INK, cursor: "pointer", opacity: pending || code.trim().length < 4 ? 0.5 : 1 }}>つながる</button>
        </div>
        {codeMsg && <div style={{ fontSize: "var(--fs-body)", color: "var(--text-error)", marginTop: 7 }}>{codeMsg}</div>}
      </div>

      {/* フィルタ */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <FilterChip on={fKids} onClick={() => setFKids((v) => !v)}>子どもOK</FilterChip>
        <FilterChip on={fOnline} onClick={() => setFOnline((v) => !v)}>オンライン</FilterChip>
      </div>

      {err && <div style={{ fontSize: "var(--fs-body)", color: "var(--text-error)", marginBottom: 10 }}>{err}</div>}

      {filtered.length === 0 ? (
        <div style={{ ...card, textAlign: "center", color: SUB, fontSize: "var(--fs-body)" }}>
          {teachers.length === 0 ? "いまは先生が見つからないみたい。もう少し待ってね" : "条件に合う先生がいないみたい"}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          {filtered.map((t) => (
            <div key={t.teacherId} style={card}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ width: 42, height: 42, borderRadius: "50%", background: "#eaedfb", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--fs-title)", flex: "none" }}>
                  {t.photoUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={t.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <GraduationCap size={22} color={ACCENT} />}
                </span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <b style={{ fontSize: "var(--fs-subhead)", color: INK }}>{t.name} 先生</b>
                    <span style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: ACCENT, background: "#eaedfb", border: "1px solid #d3d9f5", borderRadius: 999, padding: "1px 8px" }}>相性 {t.match}%</span>
                  </span>
                  {t.headline && <span style={{ display: "block", fontSize: "var(--fs-body)", color: INK, marginTop: 3 }}>{t.headline}</span>}
                </span>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 9, fontSize: "var(--fs-caption)", color: SUB }}>
                {t.genres.length > 0 && <span>ジャンル：{t.genres.join("・")}</span>}
                {t.forKids && <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Baby size={12} /> 子どもOK</span>}
                {t.online && <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Laptop size={12} /> オンライン</span>}
                {t.area && <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><MapPin size={12} /> {t.area}</span>}
                {t.availability && <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Clock size={12} /> {t.availability}</span>}
              </div>

              {t.bio && <div style={{ fontSize: "var(--fs-body)", color: "var(--text-body)", marginTop: 8, lineHeight: 1.55 }}>{t.bio}</div>}
              {t.career && <div style={{ fontSize: "var(--fs-caption)", color: SUB, marginTop: 6, lineHeight: 1.5, display: "flex", gap: 5 }}><GraduationCap size={13} style={{ flex: "none", marginTop: 2 }} /> <span>{t.career}</span></div>}
              {t.lessonStyle && <div style={{ fontSize: "var(--fs-caption)", color: SUB, marginTop: 4, lineHeight: 1.5, display: "flex", gap: 5 }}><NotebookPen size={13} style={{ flex: "none", marginTop: 2 }} /> <span>{t.lessonStyle}</span></div>}

              <div style={{ display: "flex", gap: 7, marginTop: 11 }}>
                {t.sampleUrl && (
                  <a href={t.sampleUrl} target="_blank" rel="noopener noreferrer"
                    style={{ flex: 1, textAlign: "center", background: "#f7f8fa", color: SUB, border: "1px solid #e7eaee", borderRadius: 9, padding: "9px 0", fontSize: "var(--fs-body)", fontWeight: 800, textDecoration: "none" }}>▶ 演奏サンプル</a>
                )}
                <button type="button" onClick={() => connect(t)} disabled={pending && busyId === t.teacherId}
                  style={{ flex: 2, background: ACCENT, color: "var(--text-on-accent)", border: "none", borderRadius: 9, padding: "9px 0", fontSize: "var(--fs-body)", fontWeight: 800, cursor: "pointer", opacity: pending && busyId === t.teacherId ? 0.6 : 1 }}>
                  この先生とつながる
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FilterChip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      style={{ fontSize: "var(--fs-caption)", fontWeight: 700, borderRadius: 999, padding: "6px 13px", cursor: "pointer",
        border: "1px solid", borderColor: on ? "#4f63c6" : "#e2e6ea", background: on ? "#4f63c6" : "#fff", color: on ? "#fff" : "#6b7885" }}>
      {children}
    </button>
  )
}
