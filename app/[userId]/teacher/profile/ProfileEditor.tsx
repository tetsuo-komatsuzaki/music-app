"use client"

// 先生プロフィール編集フォーム (2026-08-01 Phase2)。
import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { getMyProfile, saveMyProfile, type ProfileData } from "@/app/actions/teacherProfile"

const SPECIALTY_PRESETS = ["初心者", "子ども", "大人の趣味", "受験・コンクール", "音程", "リズム", "移弦", "ボウイング", "ビブラート", "ポジション移動", "重音"]
const LEVEL_PRESETS = ["初級", "中級", "上級"]
const AGE_PRESETS = ["未就学", "小学生", "中高生", "大人", "シニア"]
const GENRE_PRESETS = ["クラシック", "ポップス", "ジャズ", "その他"]

const EMPTY: ProfileData = {
  headline: "", bio: "", specialties: [], levels: [],
  forKids: false, online: true, priceNote: "", trial: false, sampleUrl: "",
  photoUrl: "", career: "", lessonStyle: "", area: "", availability: "", ages: [], genres: [],
  published: false,
}

export default function ProfileEditor({ userId, teacherName }: { userId: string; teacherName: string }) {
  const [p, setP] = useState<ProfileData>(EMPTY)
  const [loaded, setLoaded] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    getMyProfile().then((r) => { if (r.ok) setP(r.data); setLoaded(true) })
  }, [])

  const toggle = (key: "forKids" | "online" | "trial" | "published") => setP((s) => ({ ...s, [key]: !s[key] }))
  const toggleIn = (key: "specialties" | "levels" | "ages" | "genres", v: string) =>
    setP((s) => ({ ...s, [key]: s[key].includes(v) ? s[key].filter((x) => x !== v) : [...s[key], v] }))

  const save = () => {
    setMsg(null)
    startTransition(async () => {
      const r = await saveMyProfile(p)
      setMsg(r.ok ? { ok: true, text: "保存しました" } : { ok: false, text: r.error })
    })
  }

  const inp: React.CSSProperties = { width: "100%", border: "1px solid #dfe3e8", borderRadius: 9, padding: "9px 12px", fontSize: 13.5, marginTop: 5 }
  const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 800, color: "#2b3742" }
  const card: React.CSSProperties = { background: "#fff", border: "1px solid #eef1f4", borderRadius: 14, padding: "14px 16px", marginBottom: 12, boxShadow: "0 1px 3px rgba(30,45,70,.05)" }

  if (!loaded) return <div style={{ fontSize: 13, color: "#9aa6b3", padding: 20 }}>読み込み中…</div>

  return (
    <div>
      <Link href={`/${userId}/teacher`} style={{ fontSize: 12, color: "#6b7885", textDecoration: "none" }}>← 先生ホーム</Link>
      <h1 style={{ fontSize: 18, fontWeight: 900, margin: "6px 0 2px" }}>プロフィール</h1>
      <p style={{ fontSize: 12, color: "#6b7885", margin: "0 0 14px" }}>「先生を探す」に載る、あなたの紹介です（{teacherName}）。</p>

      <div style={card}>
        <div style={lbl}>顔写真（画像URL・任意）</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
          <span style={{ width: 56, height: 56, borderRadius: "50%", flex: "none", overflow: "hidden", background: "#f2f4f7", border: "1px solid #e6e9ee", display: "grid", placeItems: "center" }}>
            {p.photoUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={p.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: 22 }}>👩‍🏫</span>}
          </span>
          <input value={p.photoUrl} onChange={(e) => setP((s) => ({ ...s, photoUrl: e.target.value }))} placeholder="https://…（画像のURL）" style={{ ...inp, marginTop: 0, flex: 1 }} maxLength={500} inputMode="url" />
        </div>

        <label style={{ ...lbl, display: "block", marginTop: 14 }}>一言キャッチ
          <input value={p.headline} onChange={(e) => setP((s) => ({ ...s, headline: e.target.value }))} placeholder="例: 移弦とリズムが得意。初心者歓迎！" style={inp} maxLength={60} />
        </label>
        <label style={{ ...lbl, display: "block", marginTop: 12 }}>自己紹介
          <textarea value={p.bio} onChange={(e) => setP((s) => ({ ...s, bio: e.target.value }))} rows={4} placeholder="どんな先生か、雰囲気など" style={{ ...inp, resize: "vertical" }} maxLength={1000} />
        </label>
        <label style={{ ...lbl, display: "block", marginTop: 12 }}>経歴・実績
          <textarea value={p.career} onChange={(e) => setP((s) => ({ ...s, career: e.target.value }))} rows={3} placeholder="例: 指導歴10年／○○音大卒／○○コンクール入賞" style={{ ...inp, resize: "vertical" }} maxLength={1000} />
        </label>
        <label style={{ ...lbl, display: "block", marginTop: 12 }}>指導方針・レッスンの流れ
          <textarea value={p.lessonStyle} onChange={(e) => setP((s) => ({ ...s, lessonStyle: e.target.value }))} rows={3} placeholder="例: まず基礎の音階から。録音を一緒に聴いて弱点を確認します" style={{ ...inp, resize: "vertical" }} maxLength={1000} />
        </label>
      </div>

      <div style={card}>
        <div style={lbl}>得意なこと</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {SPECIALTY_PRESETS.map((s) => (
            <Chip key={s} on={p.specialties.includes(s)} onClick={() => toggleIn("specialties", s)}>{s}</Chip>
          ))}
        </div>
        <div style={{ ...lbl, marginTop: 14 }}>対応レベル</div>
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          {LEVEL_PRESETS.map((s) => (
            <Chip key={s} on={p.levels.includes(s)} onClick={() => toggleIn("levels", s)}>{s}</Chip>
          ))}
        </div>
        <div style={{ ...lbl, marginTop: 14 }}>対象年齢</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {AGE_PRESETS.map((s) => (
            <Chip key={s} on={p.ages.includes(s)} onClick={() => toggleIn("ages", s)}>{s}</Chip>
          ))}
        </div>
        <div style={{ ...lbl, marginTop: 14 }}>ジャンル</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {GENRE_PRESETS.map((s) => (
            <Chip key={s} on={p.genres.includes(s)} onClick={() => toggleIn("genres", s)}>{s}</Chip>
          ))}
        </div>
      </div>

      <div style={card}>
        <Toggle label="子どもの指導OK" on={p.forKids} onClick={() => toggle("forKids")} />
        <Toggle label="オンライン対応" on={p.online} onClick={() => toggle("online")} />
        <Toggle label="体験レッスンあり" on={p.trial} onClick={() => toggle("trial")} />
        <label style={{ ...lbl, display: "block", marginTop: 12 }}>対応地域・場所（対面の目安）
          <input value={p.area} onChange={(e) => setP((s) => ({ ...s, area: e.target.value }))} placeholder="例: 東京23区 / オンライン全国" style={inp} maxLength={200} />
        </label>
        <label style={{ ...lbl, display: "block", marginTop: 12 }}>対応できる曜日・時間帯（目安）
          <input value={p.availability} onChange={(e) => setP((s) => ({ ...s, availability: e.target.value }))} placeholder="例: 平日夜・土日午前" style={inp} maxLength={200} />
        </label>
        <label style={{ ...lbl, display: "block", marginTop: 12 }}>料金（自由記入）
          <input value={p.priceNote} onChange={(e) => setP((s) => ({ ...s, priceNote: e.target.value }))} placeholder="例: 30分 2,000円〜 / 体験無料" style={inp} maxLength={200} />
        </label>
        <label style={{ ...lbl, display: "block", marginTop: 12 }}>演奏サンプル・動画URL（任意）
          <input value={p.sampleUrl} onChange={(e) => setP((s) => ({ ...s, sampleUrl: e.target.value }))} placeholder="https://…" style={inp} maxLength={500} inputMode="url" />
        </label>
      </div>

      <div style={{ ...card, borderColor: p.published ? "#cbe8d6" : "#eef1f4" }}>
        <Toggle label="「先生を探す」に掲載する" on={p.published} onClick={() => toggle("published")} />
        <p style={{ fontSize: 11.5, color: "#9aa6b3", margin: "6px 0 0" }}>ONにすると、生徒の「先生を探す」に表示されます。OFFの間は非公開です。</p>
      </div>

      {msg && <div style={{ fontSize: 12.5, margin: "0 0 10px", color: msg.ok ? "#2e8b57" : "#c0392b" }}>{msg.text}</div>}
      <button type="button" onClick={save} disabled={pending}
        style={{ width: "100%", border: "none", borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 800, color: "#fff", background: "#2b3742", cursor: "pointer", opacity: pending ? 0.6 : 1 }}>
        {pending ? "保存中…" : "保存する"}
      </button>
    </div>
  )
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      style={{ fontSize: 12, fontWeight: 700, borderRadius: 999, padding: "6px 13px", cursor: "pointer",
        border: "1px solid", borderColor: on ? "#2b3742" : "#e2e6ea", background: on ? "#2b3742" : "#fff", color: on ? "#fff" : "#6b7885" }}>
      {children}
    </button>
  )
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "transparent", border: "none", padding: "7px 0", cursor: "pointer" }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#2b3742" }}>{label}</span>
      <span style={{ width: 40, height: 23, borderRadius: 999, background: on ? "#2e8b57" : "#d7dce0", position: "relative", flex: "none", transition: "background .15s" }}>
        <span style={{ position: "absolute", top: 2, left: on ? 19 : 2, width: 19, height: 19, borderRadius: "50%", background: "#fff", transition: "left .15s", boxShadow: "0 1px 2px rgba(0,0,0,.2)" }} />
      </span>
    </button>
  )
}
