"use client"

// 先生プロフィール編集フォーム (2026-08-01 Phase2)。
import { useEffect, useRef, useState, useTransition } from "react"
import Link from "next/link"
import { GraduationCap } from "lucide-react"
import { getMyProfile, saveMyProfile, type ProfileData } from "@/app/actions/teacherProfile"
import { uploadTeacherPhoto, removeTeacherPhoto } from "@/app/actions/uploadTeacherPhoto"

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
  // 顔写真アップロード
  const fileRef = useRef<HTMLInputElement>(null)
  const [photoMsg, setPhotoMsg] = useState<string | null>(null)
  const [photoPending, startPhoto] = useTransition()

  const onPhotoPick = (file: File | null) => {
    if (!file) return
    setPhotoMsg(null)
    const fd = new FormData()
    fd.append("file", file)
    startPhoto(async () => {
      const r = await uploadTeacherPhoto(fd)
      if (r.ok) setP((s) => ({ ...s, photoUrl: r.url }))
      else setPhotoMsg(r.error)
    })
  }
  const onPhotoRemove = () => {
    setPhotoMsg(null)
    startPhoto(async () => {
      const r = await removeTeacherPhoto()
      if (r.ok) setP((s) => ({ ...s, photoUrl: "" }))
      else setPhotoMsg(r.error)
    })
  }

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

  const inp: React.CSSProperties = { width: "100%", border: "1px solid #dfe3e8", borderRadius: 9, padding: "9px 12px", fontSize: "var(--fs-body)", marginTop: 5 }
  const lbl: React.CSSProperties = { fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-ink)" }
  const card: React.CSSProperties = { background: "#fff", border: "1px solid #eef1f4", borderRadius: 14, padding: "14px 16px", marginBottom: 12, boxShadow: "0 1px 3px rgba(30,45,70,.05)" }

  if (!loaded) return <div style={{ fontSize: "var(--fs-body)", color: "var(--text-muted)", padding: 20 }}>読み込み中…</div>

  return (
    <div>
      <Link href={`/${userId}/teacher`} style={{ fontSize: "var(--fs-body)", color: "var(--text-sub)", textDecoration: "none" }}>← 先生ホーム</Link>
      <h1 style={{ fontSize: "var(--fs-head)", fontWeight: 900, margin: "6px 0 2px" }}>プロフィール</h1>
      <p style={{ fontSize: "var(--fs-body)", color: "var(--text-sub)", margin: "0 0 14px" }}>「先生を探す」に載る、あなたの紹介です・{teacherName}。</p>

      <div style={card}>
        <div style={lbl}>顔写真</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
          <span style={{ width: 56, height: 56, borderRadius: "50%", flex: "none", overflow: "hidden", background: "#f2f4f7", border: "1px solid #e6e9ee", display: "grid", placeItems: "center" }}>
            {p.photoUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={p.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <GraduationCap size={24} color="#8ba0c4" />}
          </span>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: "none" }}
            onChange={(e) => { onPhotoPick(e.target.files?.[0] ?? null); e.target.value = "" }}
          />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={photoPending}
            style={{ fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-ink)", background: "#fff", border: "1px solid #dfe3e8", borderRadius: 9, padding: "8px 14px", cursor: "pointer", opacity: photoPending ? 0.6 : 1 }}>
            {photoPending ? "アップロード中…" : p.photoUrl ? "写真を変更" : "写真をアップロード"}
          </button>
          {p.photoUrl && !photoPending && (
            <button type="button" onClick={onPhotoRemove}
              style={{ fontSize: "var(--fs-body)", fontWeight: 700, color: "var(--text-error)", background: "none", border: "none", cursor: "pointer" }}>
              削除
            </button>
          )}
        </div>
        {photoMsg && <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-error)", marginTop: 6 }}>{photoMsg}</div>}
        <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", margin: "6px 0 0" }}>JPEG / PNG / WebP・5MBまで。アップロードするとすぐ反映されます。</p>

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
        <div style={lbl}>ジャンル</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {GENRE_PRESETS.map((s) => (
            <Chip key={s} on={p.genres.includes(s)} onClick={() => toggleIn("genres", s)}>{s}</Chip>
          ))}
        </div>
      </div>

      <div style={card}>
        <Toggle label="子どもの指導OK" on={p.forKids} onClick={() => toggle("forKids")} />
        <Toggle label="オンライン対応" on={p.online} onClick={() => toggle("online")} />
        <label style={{ ...lbl, display: "block", marginTop: 12 }}>対応地域・場所
          <input value={p.area} onChange={(e) => setP((s) => ({ ...s, area: e.target.value }))} placeholder="例: 東京23区 / オンライン全国" style={inp} maxLength={200} />
        </label>
        <label style={{ ...lbl, display: "block", marginTop: 12 }}>対応できる曜日・時間帯
          <input value={p.availability} onChange={(e) => setP((s) => ({ ...s, availability: e.target.value }))} placeholder="例: 平日夜・土日午前" style={inp} maxLength={200} />
        </label>
        <label style={{ ...lbl, display: "block", marginTop: 12 }}>演奏サンプル・動画URL
          <input value={p.sampleUrl} onChange={(e) => setP((s) => ({ ...s, sampleUrl: e.target.value }))} placeholder="https://…" style={inp} maxLength={500} inputMode="url" />
        </label>
      </div>

      <div style={{ ...card, borderColor: p.published ? "#cbe8d6" : "#eef1f4" }}>
        <Toggle label="「先生を探す」に掲載する" on={p.published} onClick={() => toggle("published")} />
        <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", margin: "6px 0 0" }}>ONにすると、生徒の「先生を探す」に表示されます。OFFの間は非公開です。</p>
      </div>

      {msg && <div style={{ fontSize: "var(--fs-body)", margin: "0 0 10px", color: msg.ok ? "#2e8b57" : "#c0392b" }}>{msg.text}</div>}
      <button type="button" onClick={save} disabled={pending}
        style={{ width: "100%", border: "none", borderRadius: 12, padding: 13, fontSize: "var(--fs-subhead)", fontWeight: 800, color: "var(--text-on-accent)", background: "#2b3742", cursor: "pointer", opacity: pending ? 0.6 : 1 }}>
        {pending ? "保存中…" : "保存する"}
      </button>
    </div>
  )
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      style={{ fontSize: "var(--fs-body)", fontWeight: 700, borderRadius: 999, padding: "6px 13px", cursor: "pointer",
        border: "1px solid", borderColor: on ? "#2b3742" : "#e2e6ea", background: on ? "#2b3742" : "#fff", color: on ? "#fff" : "#6b7885" }}>
      {children}
    </button>
  )
}

function Toggle({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "transparent", border: "none", padding: "7px 0", cursor: "pointer" }}>
      <span style={{ fontSize: "var(--fs-body)", fontWeight: 700, color: "var(--text-ink)" }}>{label}</span>
      <span style={{ width: 40, height: 23, borderRadius: 999, background: on ? "#2e8b57" : "#d7dce0", position: "relative", flex: "none", transition: "background .15s" }}>
        <span style={{ position: "absolute", top: 2, left: on ? 19 : 2, width: 19, height: 19, borderRadius: "50%", background: "#fff", transition: "left .15s", boxShadow: "0 1px 2px rgba(0,0,0,.2)" }} />
      </span>
    </button>
  )
}
