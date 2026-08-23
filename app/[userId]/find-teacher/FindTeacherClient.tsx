"use client"

// 先生を探す UI — 確定モック 先生06/07 (build-teacher.py FIND/FIND_EMPTY) の写経 (2026-08-22)。
// AI相性カード=金罫+金lab ・ 先生カード=紺グラデ丸アバター46+得意の金ピル+pill muteチップ ・
// ボタン=「▶ 演奏サンプル」mute /「つながる」金ピル ・ 招待コードは最下部のカード ・
// 0件=◎カード。フィルタ(子どもOK/オンライン)は機能維持でダークチップ化。
import { useMemo, useState, useTransition } from "react"
import { GraduationCap, MapPin, Clock, NotebookPen } from "lucide-react"
import { useRouter } from "next/navigation"
import { connectToTeacher, linkWithInviteCode } from "@/app/actions/teacherActions"
import ds from "@/app/components/ds.module.css"

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

const mutePill: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 800, color: "var(--text-sub)", background: "rgba(150,175,225,.1)", borderRadius: 999, padding: "3px 8px" }
const goldPill: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 800, color: "var(--gold)", background: "rgba(232,178,60,.14)", borderRadius: 999, padding: "4px 11px", border: "none", cursor: "pointer", fontFamily: "inherit", textDecoration: "none" }

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

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 0 60px" }}>
      <h1 className={ds.t} style={{ paddingTop: 6 }}>先生を探す</h1>

      {/* AI相性マッチング (原本: 金罫カード) */}
      {weakAxis && (
        <div className={ds.card} style={{ padding: "14px 15px", borderColor: "rgba(232,178,60,.3)" }}>
          <div className={ds.lab} style={{ color: "var(--gold)" }}>AI相性マッチング</div>
          <div style={{ fontSize: 12.5, marginTop: 7, lineHeight: 1.8, color: "var(--text-ink)" }}>
            いまのあなたは <b style={{ color: "var(--gold)" }}>{weakAxis}</b> が伸びしろ。<br />
            <span style={{ color: "var(--text-sub)" }}>{weakAxis}が得意な先生を上に出しています。</span>
          </div>
        </div>
      )}

      {/* フィルタ (機能維持 ・ ダークチップ) */}
      <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
        <FilterChip on={fKids} onClick={() => setFKids((v) => !v)}>子どもOK</FilterChip>
        <FilterChip on={fOnline} onClick={() => setFOnline((v) => !v)}>オンライン</FilterChip>
      </div>

      {err && <div style={{ fontSize: "var(--fs-body)", color: "#e8a78f", marginTop: 10 }}>{err}</div>}

      {filtered.length === 0 ? (
        /* 原本 先生07: ◎の0件カード */
        <div className={ds.card} style={{ textAlign: "center", padding: "30px 20px" }}>
          <div style={{ fontSize: 26, opacity: 0.5 }} aria-hidden>◎</div>
          <b style={{ fontSize: 14, display: "block", marginTop: 9, color: "var(--text-ink)" }}>
            {teachers.length === 0 ? "いまは先生が見つからないみたい。もう少し待ってね" : "条件に合う先生がいないみたい"}
          </b>
        </div>
      ) : (
        filtered.map((t) => (
          <div key={t.teacherId} className={ds.card}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
              <span style={{ width: 46, height: 46, borderRadius: "50%", flex: "none", display: "grid", placeItems: "center", overflow: "hidden", background: "linear-gradient(150deg,#2a3f6b,#1b2b4c)", color: "#7fa4e8", fontSize: 16, fontWeight: 900 }}>
                {t.photoUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={t.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : t.name.slice(0, 1)}
              </span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                  <b style={{ fontSize: 14.5, color: "var(--text-ink)" }}>{t.name}</b>
                  {t.matchWeak && weakAxis ? (
                    <span style={{ ...goldPill, fontSize: 9.5, padding: "2px 8px", flex: "none", cursor: "default" }}>{weakAxis}が得意</span>
                  ) : (
                    <span style={{ ...mutePill, fontSize: 9.5, padding: "2px 8px", flex: "none", fontVariantNumeric: "tabular-nums" }}>相性 {t.match}%</span>
                  )}
                </span>
                {t.headline && <span style={{ display: "block", fontSize: "var(--fs-body)", color: "var(--text-ink)", marginTop: 3 }}>{t.headline}</span>}
                {(t.specialties.length > 0 || t.genres.length > 0) && (
                  <span style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}>
                    {[...t.specialties, ...t.genres].slice(0, 4).map((s) => (
                      <span key={s} style={mutePill}>{s}</span>
                    ))}
                  </span>
                )}
                <span style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 5 }}>
                  {t.forKids && <span style={{ ...mutePill, fontSize: 9.5, padding: "2px 7px" }}>子どもOK</span>}
                  {t.online && <span style={{ ...mutePill, fontSize: 9.5, padding: "2px 7px" }}>オンライン</span>}
                  {t.area && <span style={{ ...mutePill, fontSize: 9.5, padding: "2px 7px" }}><MapPin size={10} /> {t.area}</span>}
                  {t.availability && <span style={{ ...mutePill, fontSize: 9.5, padding: "2px 7px" }}><Clock size={10} /> {t.availability}</span>}
                </span>
              </span>
            </div>

            {t.bio && <div style={{ fontSize: "var(--fs-body)", color: "var(--text-sub)", marginTop: 9, lineHeight: 1.6 }}>{t.bio}</div>}
            {t.career && <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-sub)", marginTop: 6, lineHeight: 1.5, display: "flex", gap: 5 }}><GraduationCap size={13} style={{ flex: "none", marginTop: 2 }} /> <span>{t.career}</span></div>}
            {t.lessonStyle && <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-sub)", marginTop: 4, lineHeight: 1.5, display: "flex", gap: 5 }}><NotebookPen size={13} style={{ flex: "none", marginTop: 2 }} /> <span>{t.lessonStyle}</span></div>}

            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              {t.sampleUrl && (
                <a href={t.sampleUrl} target="_blank" rel="noopener noreferrer" className="pressable"
                  style={{ ...mutePill, fontSize: 11, padding: "4px 11px", color: "var(--text-ink)", textDecoration: "none" }}>▶ 演奏サンプル</a>
              )}
              <button type="button" onClick={() => connect(t)} disabled={pending && busyId === t.teacherId} className="pressable"
                style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12.5, fontWeight: 900, color: "#201604", background: "linear-gradient(180deg,#e8b23c,#d2992c)", borderRadius: 999, padding: "8px 18px", border: "none", cursor: "pointer", fontFamily: "inherit", opacity: pending && busyId === t.teacherId ? 0.6 : 1 }}>
                つながる
              </button>
            </div>
          </div>
        ))
      )}

      {/* 招待コード (原本: 最下部のカード) */}
      <div className={ds.card} style={{ padding: "13px 15px" }}>
        <div style={{ fontSize: 11.5, color: "var(--text-sub)", lineHeight: 1.8 }}>先生から招待コードをもらっている場合</div>
        <div style={{ display: "flex", gap: 8, marginTop: 9 }}>
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="コードを入力" maxLength={12}
            style={{ flex: 1, minWidth: 0, background: "var(--card-in)", border: "1px solid rgba(150,175,225,.08)", borderRadius: 14, padding: "11px 13px", fontSize: 13, color: "var(--text-ink)", letterSpacing: ".14em", fontVariantNumeric: "tabular-nums" }} />
          <button type="button" onClick={useCode} disabled={pending || code.trim().length < 4} className="pressable"
            style={{ ...goldPill, opacity: pending || code.trim().length < 4 ? 0.5 : 1 }}>つながる</button>
        </div>
        {codeMsg && <div style={{ fontSize: "var(--fs-body)", color: "#e8a78f", marginTop: 7 }}>{codeMsg}</div>}
      </div>
    </div>
  )
}

function FilterChip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="pressable"
      style={{ fontSize: 11.5, fontWeight: 800, fontFamily: "inherit", borderRadius: 999, padding: "6px 13px", cursor: "pointer",
        border: `1px solid ${on ? "rgba(232,178,60,.34)" : "transparent"}`,
        background: on ? "rgba(232,178,60,.16)" : "rgba(150,175,225,.07)",
        color: on ? "var(--gold)" : "var(--text-sub)" }}>
      {children}
    </button>
  )
}
