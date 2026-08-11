"use client"

// 練習後カルテ1枚 (先生が書く場)。録音+分析を見て、コメント・癖を返す。2026-08-11 v3第2段②。
import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, MessageCircle, Check } from "lucide-react"
import { sendMessageToStudent } from "@/app/actions/teacherActions"
import { createObservation } from "@/app/actions/teacherObservations"
import { saveMaterialNote } from "@/app/actions/teacherMaterialNotes"
import { OBSERVATION_CATALOG, OBSERVATION_SEVERITIES } from "@/app/_libs/observationCatalog"

type WeakSlot = { name: string; tree: "音程" | "リズム"; miss: number; target: number }
type MaterialRow = { itemId: string; label: string; category: string; star: number | null; point: string }
const scoreColor = (n: number) => (n >= 90 ? "#2e8b57" : n >= 70 ? "#b7823a" : "#c0473a")

export default function KarteDetailClient(props: {
  backHref: string; studentId: string; perfId: string; kind: "score" | "practice"
  title: string; cat: string; star: number | null; date: string
  pitch: number; timing: number; avg: number; weak: WeakSlot[]
  audioUrl: string | null; aiTags: { id: string; label: string }[]
  materials?: MaterialRow[]
}) {
  const { backHref, studentId, perfId, kind, title, cat, star, date, pitch, timing, avg, weak, audioUrl, aiTags, materials = [] } = props
  const router = useRouter()

  // コメント
  const [comment, setComment] = useState("")
  const [commentDone, setCommentDone] = useState(false)
  const [sendingC, startC] = useTransition()
  const sendComment = () => {
    const t = comment.trim(); if (!t) return
    startC(async () => {
      const r = await sendMessageToStudent(studentId, t, perfId, kind)
      if (r.ok) { setCommentDone(true); setComment("") }
    })
  }

  // 癖
  const [tags, setTags] = useState<Set<string>>(new Set())
  const [severity, setSeverity] = useState<"mild" | "focus">("mild")
  const [kuseComment, setKuseComment] = useState("")
  const [kuseDone, setKuseDone] = useState(false)
  const [savingK, startK] = useTransition()
  const toggle = (id: string) => setTags((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const saveKuse = () => {
    if (tags.size === 0 && !kuseComment.trim()) return
    startK(async () => {
      const r = await createObservation({ studentId, tagIds: [...tags], severity, comment: kuseComment.trim() || null })
      if (r.ok) { setKuseDone(true); setTags(new Set()); setKuseComment(""); router.refresh() }
    })
  }

  const card: React.CSSProperties = { background: "#fff", border: "1px solid #e6e9ef", borderRadius: 14, padding: "13px 15px", marginBottom: 11 }
  const lab: React.CSSProperties = { fontSize: "var(--fs-caption)", fontWeight: 900, color: "var(--text-sub)", marginBottom: 8 }
  const chip = (on: boolean): React.CSSProperties => ({
    fontSize: "var(--fs-label)", fontWeight: 800, borderRadius: 999, padding: "5px 11px", cursor: "pointer", border: "1px solid",
    color: on ? "#a9741c" : "#5a6472", background: on ? "#fff3e2" : "#fff", borderColor: on ? "#f0dcb4" : "#dfe3ea",
  })

  return (
    // 練習後カルテ1枚 (モック画面5: 紺ヘッダー + ダッシュボード基調)
    <div style={{ background: "#f5f7fa", border: "1px solid #e6e9ef", borderRadius: 18, overflow: "hidden", color: "var(--text-ink)" }}>
      <div style={{ background: "#22346b", color: "#eaf0fb", padding: "13px 15px 13px" }}>
        <Link href={backHref} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "var(--fs-label)", fontWeight: 700, color: "#9fb2dd", textDecoration: "none" }}>
          <ArrowLeft size={13} /> {title}のカルテ
        </Link>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginTop: 5 }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: "var(--fs-head)", fontWeight: 900, margin: 0, color: "#fff" }}>{title}</h1>
            <div style={{ fontSize: "var(--fs-label)", fontWeight: 700, color: "#9fb2dd", marginTop: 2 }}>
              {star != null ? `★${star} ・ ` : ""}{cat} ・ {date}
            </div>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "center", flex: "none" }}>
            <div style={{ fontSize: "var(--fs-display)", fontWeight: 900, lineHeight: 1, color: "#fff" }}>{avg}</div>
            <div style={{ fontSize: "var(--fs-label)", color: "#9fb2dd", fontWeight: 800 }}>平均</div>
          </div>
        </div>
      </div>
      <div style={{ padding: "12px 13px 14px" }}>

      {/* 録音+分析 */}
      <div style={card}>
        <div style={lab}>録音＋分析</div>
        {audioUrl ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <audio controls preload="none" src={audioUrl} style={{ width: "100%", height: 34 }} />
        ) : (
          <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>音声を読み込めませんでした</div>
        )}
        <div style={{ display: "flex", gap: 14, fontSize: "var(--fs-caption)", marginTop: 9 }}>
          <span style={{ color: "var(--text-sub)" }}>音程 <b style={{ color: scoreColor(pitch) }}>{pitch}</b></span>
          <span style={{ color: "var(--text-sub)" }}>リズム <b style={{ color: scoreColor(timing) }}>{timing}</b></span>
        </div>
        {weak.length > 0 && (
          <div style={{ background: "#f4f7fc", borderRadius: 8, padding: "8px 10px", marginTop: 9 }}>
            <div style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-muted)", marginBottom: 3 }}>アルコの聴きとり・崩れやすかった所</div>
            {weak.map((w, i) => (
              <div key={i} style={{ fontSize: "var(--fs-caption)", color: "var(--text-body)", lineHeight: 1.7 }}>
                <span style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: w.tree === "音程" ? "#c0473a" : "#b7823a", background: w.tree === "音程" ? "#fbecea" : "#fbf1e2", borderRadius: 999, padding: "1px 6px", marginRight: 5 }}>{w.tree}</span>
                {w.name} 成功率{Math.max(0, Math.round(100 - (w.miss / Math.max(1, w.target)) * 100))}%（{w.target}音中{w.miss}ミス）
              </div>
            ))}
          </div>
        )}
      </div>

      {/* コメント */}
      <div style={card}>
        <div style={{ ...lab, display: "flex", alignItems: "center", gap: 5 }}><MessageCircle size={13} /> この演奏にコメント</div>
        {commentDone ? (
          <div style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-good)", display: "inline-flex", alignItems: "center", gap: 5 }}><Check size={14} /> コメントを送りました</div>
        ) : (
          <>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="例：ファ♯、移弦のあとに少し下がるね。移弦の前に指を準備しよう。"
              style={{ width: "100%", border: "1px solid #dfe3ea", borderRadius: 9, padding: "9px 11px", fontSize: "var(--fs-body)", resize: "vertical", boxSizing: "border-box" }} />
            <button type="button" onClick={sendComment} disabled={sendingC || !comment.trim()}
              style={{ marginTop: 8, fontSize: "var(--fs-caption)", fontWeight: 800, color: "#fff", background: "#3b56d4", border: "none", borderRadius: 9, padding: "8px 16px", cursor: "pointer", opacity: sendingC || !comment.trim() ? 0.5 : 1 }}>
              {sendingC ? "送信中…" : "コメントを送る"}
            </button>
          </>
        )}
      </div>

      {/* この曲のおすすめ練習 (生徒のホームに表示中) + 練習ポイント */}
      {materials.length > 0 && (
        <div style={card}>
          <div style={lab}>この曲のおすすめ練習（生徒のホームに表示中）</div>
          <div style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)", margin: "-4px 0 10px", lineHeight: 1.5 }}>
            「毎日の基礎練」として生徒に出ている教材です。練習ポイントを書くと、生徒がその教材を開いたときに表示されます（宿題にはなりません）。
          </div>
          {materials.map((m) => (
            <MaterialPointRow key={m.itemId} studentId={studentId} m={m} />
          ))}
        </div>
      )}

      {/* 癖 */}
      <div style={{ ...card, marginBottom: 0 }}>
        <div style={lab}>癖を記録（選ぶ＋重さ＋自由記述）</div>
        {kuseDone ? (
          <div style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-good)", display: "inline-flex", alignItems: "center", gap: 5 }}><Check size={14} /> 癖を記録しました</div>
        ) : (
          <>
            {aiTags.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: "#7a4dd6", marginBottom: 5 }}>◇ この演奏から考えられる癖（タップで採用）</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {aiTags.map((t) => (
                    <button key={t.id} type="button" onClick={() => toggle(t.id)} style={{ ...chip(tags.has(t.id)), borderStyle: tags.has(t.id) ? "solid" : "dashed" }}>{t.label} ＋</button>
                  ))}
                </div>
              </div>
            )}
            {OBSERVATION_CATALOG.map((c) => (
              <div key={c.id} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-muted)", marginBottom: 4 }}>{c.label}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {c.tags.map((t) => (
                    <button key={t.id} type="button" onClick={() => toggle(t.id)} style={chip(tags.has(t.id))}>{t.label}</button>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              {OBSERVATION_SEVERITIES.map((s) => (
                <button key={s.id} type="button" onClick={() => setSeverity(s.id as "mild" | "focus")}
                  style={{ flex: 1, fontSize: "var(--fs-label)", fontWeight: 900, borderRadius: 8, padding: "7px 2px", cursor: "pointer", border: "1px solid",
                    color: severity === s.id ? "#c0473a" : "#8b97a8", background: severity === s.id ? "#fbecea" : "#fff", borderColor: severity === s.id ? "#f0cfcb" : "#e3e7ee" }}>
                  {s.label}
                </button>
              ))}
            </div>
            <textarea value={kuseComment} onChange={(e) => setKuseComment(e.target.value)} rows={2} placeholder="自由記述：レッスンで見た様子（例：移弦の瞬間に肩が上がる）"
              style={{ width: "100%", border: "1px solid #dfe3ea", borderRadius: 9, padding: "9px 11px", fontSize: "var(--fs-body)", resize: "vertical", boxSizing: "border-box", marginTop: 8 }} />
            <button type="button" onClick={saveKuse} disabled={savingK || (tags.size === 0 && !kuseComment.trim())}
              style={{ marginTop: 8, fontSize: "var(--fs-caption)", fontWeight: 800, color: "#fff", background: "#8a5a1f", border: "none", borderRadius: 9, padding: "8px 16px", cursor: "pointer", opacity: savingK || (tags.size === 0 && !kuseComment.trim()) ? 0.5 : 1 }}>
              {savingK ? "記録中…" : `癖を記録${tags.size > 0 ? `（${tags.size}）` : ""}`}
            </button>
          </>
        )}
      </div>
      </div>
    </div>
  )
}

/* ═ おすすめ教材1行: 練習ポイントの記入 (upsert・空で削除) ═ */
function MaterialPointRow({ studentId, m }: { studentId: string; m: MaterialRow }) {
  const [text, setText] = useState(m.point)
  const [saved, setSaved] = useState<null | boolean>(null)
  const [pending, start] = useTransition()
  const save = () => {
    start(async () => {
      const r = await saveMaterialNote({ studentId, practiceItemId: m.itemId, point: text })
      setSaved(r.ok)
    })
  }
  const dirty = text.trim() !== m.point.trim() && saved !== true
  return (
    <div style={{ border: "1px solid #eef1f4", borderRadius: 10, padding: "9px 11px", marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-sub)", background: "#f7f8fa", border: "1px solid #eef1f4", borderRadius: 999, padding: "1px 7px", flex: "none" }}>{m.label}</span>
        {m.star != null && <span style={{ fontSize: "var(--fs-label)", fontWeight: 900, color: "#b58a1e", flex: "none" }}>★{m.star}</span>}
        {m.point && saved == null && <span style={{ marginLeft: "auto", fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-good)", flex: "none" }}>ポイント記入済み</span>}
        {saved === true && <span style={{ marginLeft: "auto", fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-good)", flex: "none", display: "inline-flex", alignItems: "center", gap: 3 }}><Check size={12} /> 保存しました</span>}
        {saved === false && <span style={{ marginLeft: "auto", fontSize: "var(--fs-label)", fontWeight: 800, color: "#c0473a", flex: "none" }}>保存に失敗</span>}
      </div>
      <textarea value={text} onChange={(e) => { setText(e.target.value); setSaved(null) }} rows={2}
        placeholder="練習ポイント（例：4の指の音程をよく聴いて。ゆっくりから）"
        style={{ width: "100%", border: "1px solid #dfe3ea", borderRadius: 8, padding: "8px 10px", fontSize: "var(--fs-body)", resize: "vertical", boxSizing: "border-box", marginTop: 7 }} />
      <button type="button" onClick={save} disabled={pending || !dirty}
        style={{ marginTop: 6, fontSize: "var(--fs-label)", fontWeight: 800, color: "#fff", background: "#3b56d4", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", opacity: pending || !dirty ? 0.45 : 1 }}>
        {pending ? "保存中…" : m.point && !text.trim() ? "ポイントを消す" : "ポイントを保存"}
      </button>
    </div>
  )
}
