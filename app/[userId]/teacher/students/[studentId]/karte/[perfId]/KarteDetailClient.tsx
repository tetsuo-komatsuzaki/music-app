"use client"

// 練習後カルテ1枚 (先生が書く場)。録音+分析を見て、コメント・癖を返す。2026-08-11 v3第2段②。
import { useState, useTransition } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, MessageCircle, Check } from "lucide-react"
import { savePracticeKarte, passAssignment } from "@/app/actions/teacherActions"
import { createObservation } from "@/app/actions/teacherObservations"
import { saveMaterialNote } from "@/app/actions/teacherMaterialNotes"
import { recordExpressionClear } from "@/app/actions/expressionClears"
import { MOOD_TAG_DEFS, moodTagLabel } from "@/app/_libs/moodTags"
import { OBSERVATION_CATALOG, OBSERVATION_SEVERITIES, isSelectableObsTag } from "@/app/_libs/observationCatalog"
import { SKILL_ID_LABELS } from "@/app/_libs/skillCatalog"

type WeakSlot = { name: string; tree: "音程" | "リズム"; miss: number; target: number }
type MaterialRow = { itemId: string; label: string; category: string; star: number | null; point: string }
const scoreColor = (n: number) => (n >= 90 ? "#2e8b57" : n >= 70 ? "#b7823a" : "#c0473a")

export default function KarteDetailClient(props: {
  backHref: string; userId: string; scoreId: string | null; itemId?: string | null; studentId: string; perfId: string; kind: "score" | "practice"
  title: string; cat: string; star: number | null; date: string
  pitch: number; timing: number; avg: number; weak: WeakSlot[]
  audioUrl: string | null; aiTags: { id: string; label: string }[]
  materials?: MaterialRow[]
  /** この演奏が提出された宿題 (あれば最下部に合格セクション) */
  hwForPerf?: { id: string; targetScore: number | null; passed: boolean } | null
}) {
  const { backHref, userId, scoreId, itemId = null, studentId, perfId, kind, title, cat, star, date, pitch, timing, avg, weak, audioUrl, aiTags, materials = [], hwForPerf = null } = props
  const router = useRouter()

  // 練習後カルテ (2026-08-11 Tetsuo確定: 演奏コメントは廃止し、曲にぶら下がるカルテに一本化)
  const [comment, setComment] = useState("")
  const [commentDone, setCommentDone] = useState(false)
  const [sendingC, startC] = useTransition()
  const karteTarget = kind === "score" ? (scoreId ? { scoreId } : null) : (itemId ? { practiceItemId: itemId } : null)
  const sendComment = () => {
    const t = comment.trim(); if (!t || !karteTarget) return
    startC(async () => {
      const r = await savePracticeKarte(studentId, karteTarget, t)
      if (r.ok) { setCommentDone(true); setComment("") }
    })
  }

  // 癖 (2026-08-11 Tetsuo確定: わざを先に選んでから、その癖を選ぶ)
  const [skillSel, setSkillSel] = useState<string | null>(null) // SKILL id または "general"(わざ以外)
  const [tags, setTags] = useState<Set<string>>(new Set())
  const [severity, setSeverity] = useState<"mild" | "focus">("mild")
  const [kuseComment, setKuseComment] = useState("")
  const [kuseDone, setKuseDone] = useState(false)
  const [savingK, startK] = useTransition()
  const toggle = (id: string) => setTags((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const saveKuse = () => {
    if (tags.size === 0 && !kuseComment.trim()) return
    startK(async () => {
      const r = await createObservation({
        studentId, tagIds: [...tags], severity, comment: kuseComment.trim() || null,
        skillIds: skillSel && skillSel !== "general" ? [skillSel] : [],
      })
      if (r.ok) { setKuseDone(true); setTags(new Set()); setKuseComment(""); setSkillSel(null); router.refresh() }
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
                {w.name} 成功率{Math.max(0, Math.round(100 - (w.miss / Math.max(1, w.target)) * 100))}%・{w.target}音中{w.miss}ミス
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 採点カルテ(添削)は廃止 (2026-08-11 Tetsuo確定)。代わりに演奏ふりかえりへの導線 */}
      <Link href={`/${userId}/teacher/students/${studentId}?tab=karte`}
        style={{ display: "block", textAlign: "center", fontSize: "var(--fs-caption)", fontWeight: 900, color: "#22346b", background: "#fff", border: "1px solid #d3dce9", borderRadius: 10, padding: "11px 0", textDecoration: "none", marginBottom: 11 }}>
        この曲の演奏ふりかえりを見る→
      </Link>

      {/* 練習後カルテを書く (演奏コメント廃止→曲にたまるカルテに一本化) */}
      {karteTarget && (
        <div style={card}>
          <div style={{ ...lab, display: "flex", alignItems: "center", gap: 5 }}><MessageCircle size={13} /> 練習後カルテを書く・この{kind === "score" ? "曲" : "教材"}にたまります</div>
          {commentDone ? (
            <div style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-good)", display: "inline-flex", alignItems: "center", gap: 5 }}><Check size={14} /> カルテを渡しました</div>
          ) : (
            <>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="例：ファ♯、移弦のあとに少し下がるね。移弦の前に指を準備しよう。"
                style={{ width: "100%", border: "1px solid #dfe3ea", borderRadius: 9, padding: "9px 11px", fontSize: "var(--fs-body)", resize: "vertical", boxSizing: "border-box" }} />
              <button type="button" onClick={sendComment} disabled={sendingC || !comment.trim()}
                style={{ marginTop: 8, fontSize: "var(--fs-caption)", fontWeight: 800, color: "#fff", background: "#3b56d4", border: "none", borderRadius: 9, padding: "8px 16px", cursor: "pointer", opacity: sendingC || !comment.trim() ? 0.5 : 1 }}>
                {sendingC ? "送信中…" : "カルテを渡す"}
              </button>
            </>
          )}
        </div>
      )}

      {/* この曲のおすすめ練習 (生徒のホームに表示中) + 練習ポイント */}
      {materials.length > 0 && (
        <div style={card}>
          <div style={lab}>この曲のおすすめ練習</div>
          <div style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)", margin: "-4px 0 10px", lineHeight: 1.5 }}>
            「毎日の基礎練」として生徒に出ている教材です。練習ポイントを書くと、生徒がその教材を開いたときに表示されます。
          </div>
          {materials.map((m) => (
            <MaterialPointRow key={m.itemId} userId={userId} studentId={studentId} m={m} />
          ))}
        </div>
      )}

      {/* 癖 (わざ先行フロー: ①わざを選ぶ → ②その癖を選ぶ + 重さ + 自由記述) */}
      <div style={card}>
        <div style={lab}>癖を記録</div>
        {kuseDone ? (
          <div style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-good)", display: "inline-flex", alignItems: "center", gap: 5 }}><Check size={14} /> 癖を記録しました</div>
        ) : (
          <>
            {/* ① どのわざの癖か (必須・先に選ぶ) */}
            <div style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-sub)", marginBottom: 5 }}>① どのわざの癖？</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {SKILL_ID_LABELS.map((sk) => (
                <button key={sk.id} type="button" onClick={() => { setSkillSel(sk.id); setTags(new Set()) }}
                  style={{ fontSize: "var(--fs-label)", fontWeight: 800, borderRadius: 999, padding: "5px 11px", cursor: "pointer", border: "1px solid",
                    color: skillSel === sk.id ? "#fff" : "#33405a", background: skillSel === sk.id ? "#22346b" : "#fff", borderColor: skillSel === sk.id ? "#22346b" : "#dfe3ea" }}>
                  {sk.label}
                </button>
              ))}
              <button type="button" onClick={() => { setSkillSel("general"); setTags(new Set()) }}
                style={{ fontSize: "var(--fs-label)", fontWeight: 800, borderRadius: 999, padding: "5px 11px", cursor: "pointer", border: "1px dashed",
                  color: skillSel === "general" ? "#fff" : "#8b97a8", background: skillSel === "general" ? "#8b97a8" : "#fff", borderColor: "#c9d0da" }}>
                わざ以外
              </button>
            </div>

            {/* ② そのわざの癖を選ぶ (わざ選択後に表示。右手わざ=右手タグ / 左手わざ=左手タグ / わざ以外=姿勢+音色) */}
            {skillSel && (() => {
              const lane = SKILL_ID_LABELS.find((sk) => sk.id === skillSel)?.lane
              const catIds = skillSel === "general" ? ["posture", "tone"] : lane === "bow" ? ["bow"] : ["left"]
              const cats = OBSERVATION_CATALOG.filter((c) => catIds.includes(c.id))
              const allowed = new Set(cats.flatMap((c) => c.tags.map((t) => t.id)))
              const ai = aiTags.filter((t) => allowed.has(t.id))
              return (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-sub)", marginBottom: 5 }}>② どんな癖？</div>
                  {ai.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: "#7a4dd6", marginBottom: 4 }}>◇ この演奏から考えられる癖</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {ai.map((t) => (
                          <button key={t.id} type="button" onClick={() => toggle(t.id)} style={{ ...chip(tags.has(t.id)), borderStyle: tags.has(t.id) ? "solid" : "dashed" }}>{t.label} ＋</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {cats.map((c) => (
                    <div key={c.id} style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-muted)", marginBottom: 4 }}>{c.label}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {/* その他タグは廃止・自由記入に一本化 (2026-08-16 Q4確定) */}
                        {c.tags.filter((t) => isSelectableObsTag(t.id)).map((t) => (
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
                  <textarea value={kuseComment} onChange={(e) => setKuseComment(e.target.value)} rows={2} placeholder="自由記述：レッスンで見た様子"
                    style={{ width: "100%", border: "1px solid #dfe3ea", borderRadius: 9, padding: "9px 11px", fontSize: "var(--fs-body)", resize: "vertical", boxSizing: "border-box", marginTop: 8 }} />
                  <button type="button" onClick={saveKuse} disabled={savingK || (tags.size === 0 && !kuseComment.trim())}
                    style={{ marginTop: 8, fontSize: "var(--fs-caption)", fontWeight: 800, color: "#fff", background: "#8a5a1f", border: "none", borderRadius: 9, padding: "8px 16px", cursor: "pointer", opacity: savingK || (tags.size === 0 && !kuseComment.trim()) ? 0.5 : 1 }}>
                    {savingK ? "記録中…" : `このわざの癖として記録${tags.size > 0 ? `・${tags.size}` : ""}`}
                  </button>
                </div>
              )
            })()}
          </>
        )}
      </div>

      {/* 表現クリア認定 (この曲で・2026-08-11 まとめから移設: 認定は演奏を聴くこの場で行う) */}
      {kind === "score" && scoreId && (
        <ExprCertifyBox studentId={studentId} scoreId={scoreId} cardStyle={hwForPerf ? card : { ...card, marginBottom: 0 }} labStyle={lab} />
      )}

      {/* 合格 (2026-08-11 Tetsuo確定: 提出された宿題は、演奏詳細を見たこの場の最下部で合格にする) */}
      {hwForPerf && (
        <HwPassBox hw={hwForPerf} avg={avg} cardStyle={{ ...card, marginBottom: 0 }} />
      )}
      </div>
    </div>
  )
}

/* ═ 宿題の合格 (提出演奏の詳細を見たうえで、ここで合格にする) ═ */
/** 教材の中身をページ遷移せずモーダル(iframe)で見る (2026-08-11 Tetsuo指示) */
export function MaterialPreviewLink({ href, label }: { href: string; label: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: "#3b56d4", background: "none", border: "none", padding: 0, cursor: "pointer", flex: "none" }}>
        教材の中身を見る
      </button>
      {open && typeof document !== "undefined" && createPortal(
        <div onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(15,25,50,.55)", zIndex: 1300, display: "flex", alignItems: "center", justifyContent: "center", padding: 10 }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 15, width: "min(760px, 96vw)", height: "88vh", display: "flex", flexDirection: "column", overflow: "hidden", boxSizing: "border-box" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: "1px solid #e6e9ef" }}>
              <b style={{ fontSize: "var(--fs-caption)", color: "var(--text-ink)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</b>
              <button type="button" onClick={() => setOpen(false)}
                style={{ marginLeft: "auto", flex: "none", fontSize: "var(--fs-label)", fontWeight: 900, color: "var(--text-muted)", background: "#f1f4f8", border: "none", borderRadius: 999, padding: "5px 13px", cursor: "pointer" }}>
                とじる ×
              </button>
            </div>
            <iframe src={href} title={label} style={{ flex: 1, border: "none", width: "100%" }} />
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

function HwPassBox({ hw, avg, cardStyle }: { hw: { id: string; targetScore: number | null; passed: boolean }; avg: number; cardStyle: React.CSSProperties }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [done, setDone] = useState(hw.passed)
  const [err, setErr] = useState(false)
  const pass = () => {
    if (!window.confirm("この宿題を合格にしますか？")) return
    start(async () => {
      const r = await passAssignment(hw.id)
      if (r.ok) { setDone(true); router.refresh() } else setErr(true)
    })
  }
  return (
    <div style={{ ...cardStyle, border: "1px solid #cfe9db", background: "#f4faf7" }}>
      <div style={{ fontSize: "var(--fs-caption)", fontWeight: 900, color: "#136647", marginBottom: 6 }}>宿題の合格</div>
      <div style={{ fontSize: "var(--fs-caption)", color: "#1f3a2e", lineHeight: 1.6 }}>
        この演奏は宿題の提出です。今回 <b>{avg}点</b>{hw.targetScore != null && <>・ゴール {hw.targetScore}点</>}。
      </div>
      {done ? (
        <div style={{ fontSize: "var(--fs-caption)", fontWeight: 900, color: "#158253", marginTop: 8, display: "inline-flex", alignItems: "center", gap: 5 }}><Check size={14} /> 合格ずみ</div>
      ) : (
        <button type="button" onClick={pass} disabled={pending}
          style={{ marginTop: 9, width: "100%", fontSize: "var(--fs-caption)", fontWeight: 900, color: "#fff", background: "#158253", border: "none", borderRadius: 9, padding: "10px 0", cursor: "pointer", opacity: pending ? 0.6 : 1 }}>
          {pending ? "…" : err ? "失敗・もう一度" : "合格にする"}
        </button>
      )}
    </div>
  )
}

/* ═ 表現クリア認定 (この曲でこの表現ができていた → 曲の★が表現力レベルに) ═ */
export function ExprCertifyBox({ studentId, scoreId, cardStyle, labStyle }: {
  studentId: string; scoreId: string; cardStyle: React.CSSProperties; labStyle: React.CSSProperties
}) {
  const [tag, setTag] = useState("")
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, start] = useTransition()
  const certify = () => {
    if (!tag) return
    start(async () => {
      const r = await recordExpressionClear({ studentId, moodTagId: tag, scoreId })
      if (!r.ok) { setMsg({ ok: false, text: r.error }); return }
      setMsg({ ok: true, text: `認定しました。この表現の到達レベルは ★${r.star} 相当になります` })
      setTag("")
    })
  }
  return (
    <div style={cardStyle}>
      <div style={labStyle}>表現クリアを認定</div>
      <div style={{ display: "flex", gap: 7 }}>
        <select value={tag} onChange={(e) => { setTag(e.target.value); setMsg(null) }}
          style={{ flex: 1, border: "1px solid #dfe3ea", borderRadius: 8, padding: "8px 10px", fontSize: "var(--fs-body)", background: "#fff" }}>
          <option value="">表現をえらぶ</option>
          {MOOD_TAG_DEFS.map((t) => <option key={t.id} value={t.id}>{moodTagLabel(t.id)}</option>)}
        </select>
        <button type="button" onClick={certify} disabled={pending || !tag}
          style={{ flex: "none", fontSize: "var(--fs-caption)", fontWeight: 900, color: "#fff", background: "#7a4dd6", border: "none", borderRadius: 8, padding: "8px 16px", cursor: "pointer", opacity: pending || !tag ? 0.5 : 1 }}>
          {pending ? "認定中…" : "認定する"}
        </button>
      </div>
      <div style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)", marginTop: 6 }}>認定すると、曲の★がそのまま生徒の表現力レベルになります。</div>
      {msg && <div style={{ fontSize: "var(--fs-caption)", fontWeight: 800, marginTop: 6, color: msg.ok ? "#158253" : "#c0473a" }}>{msg.text}</div>}
    </div>
  )
}

/* ═ おすすめ教材1行: 教材の中身を見てから練習ポイントを記入 (upsert・空で削除) ═ */
export function MaterialPointRow({ userId, studentId, m }: { userId: string; studentId: string; m: MaterialRow }) {
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
      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
        <span style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-sub)", background: "#f7f8fa", border: "1px solid #eef1f4", borderRadius: 999, padding: "1px 7px", flex: "none" }}>{m.label}</span>
        {m.star != null && <span style={{ fontSize: "var(--fs-label)", fontWeight: 900, color: "#b58a1e", flex: "none" }}>★{m.star}</span>}
        <MaterialPreviewLink href={`/${userId}/practice/${m.category}/${m.itemId}`} label={m.label} />
        {m.point && saved == null && <span style={{ marginLeft: "auto", fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-good)", flex: "none" }}>ポイント記入済み</span>}
        {saved === true && <span style={{ marginLeft: "auto", fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-good)", flex: "none", display: "inline-flex", alignItems: "center", gap: 3 }}><Check size={12} /> 保存しました</span>}
        {saved === false && <span style={{ marginLeft: "auto", fontSize: "var(--fs-label)", fontWeight: 800, color: "#c0473a", flex: "none" }}>保存に失敗</span>}
      </div>
      <textarea value={text} onChange={(e) => { setText(e.target.value); setSaved(null) }} rows={2}
        placeholder="練習ポイント・例：4の指の音程をよく聴いて。ゆっくりから"
        style={{ width: "100%", border: "1px solid #dfe3ea", borderRadius: 8, padding: "8px 10px", fontSize: "var(--fs-body)", resize: "vertical", boxSizing: "border-box", marginTop: 7 }} />
      <button type="button" onClick={save} disabled={pending || !dirty}
        style={{ marginTop: 6, fontSize: "var(--fs-label)", fontWeight: 800, color: "#fff", background: "#3b56d4", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", opacity: pending || !dirty ? 0.45 : 1 }}>
        {pending ? "保存中…" : m.point && !text.trim() ? "ポイントを消す" : "ポイントを保存"}
      </button>
    </div>
  )
}
