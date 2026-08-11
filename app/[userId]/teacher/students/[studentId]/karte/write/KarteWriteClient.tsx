"use client"

// 練習後カルテ入力画面 (2026-08-11 Tetsuo確定): 曲/教材に1枚たまるカルテを書く場。
// 直近の演奏を聴きながら、カルテ本文・癖(わざ先行)・表現認定・おすすめ練習ポイントをまとめて書く。
// 各セクションは既存アクションに保存され、生徒側の成長カルテ/表現レベル/教材ページに連動する。
import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, MessageCircle, Check } from "lucide-react"
import { savePracticeKarte, saveFingerboardMark, removeFingerboardMark } from "@/app/actions/teacherActions"
import { createObservation } from "@/app/actions/teacherObservations"
import { OBSERVATION_CATALOG, OBSERVATION_SEVERITIES } from "@/app/_libs/observationCatalog"
import { SKILL_ID_LABELS } from "@/app/_libs/skillCatalog"
import type { HeatmapData } from "@/app/_libs/fingerboard/heatmapTypes"
import FingerboardPanel, { type FingerboardMark } from "@/app/components/FingerboardPanel"
import { ExprCertifyBox, MaterialPointRow } from "../[perfId]/KarteDetailClient"

type WeakSlot = { name: string; tree: "音程" | "リズム"; miss: number; target: number }
type PerfRow = { id: string; date: string; pitch: number; timing: number; avg: number; audioUrl: string | null; weak: WeakSlot[] }
type MaterialRow = { itemId: string; label: string; category: string; star: number | null; point: string }
const scoreColor = (n: number) => (n >= 90 ? "#2e8b57" : n >= 70 ? "#b7823a" : "#c0473a")

export default function KarteWriteClient({
  backHref, userId, studentId, kind, targetId, title, cat, star, performances, aiTags, materials,
  heatmap, marks: initialMarks = [],
}: {
  backHref: string; userId: string; studentId: string
  kind: "score" | "practice"; targetId: string
  title: string; cat: string; star: number | null
  performances: PerfRow[]
  aiTags: { id: string; label: string }[]
  materials: MaterialRow[]
  /** 指板ヒートマップ (この曲/教材の全演奏合算・案5) */
  heatmap?: HeatmapData
  marks?: FingerboardMark[]
}) {
  const router = useRouter()
  const [marks, setMarks] = useState<FingerboardMark[]>(initialMarks)

  // 直近の演奏 (プルダウンで1件えらんで再生。初期値=最新)
  const [selPerfId, setSelPerfId] = useState<string | null>(performances[0]?.id ?? null)
  const selPerf = performances.find((p) => p.id === selPerfId) ?? null

  // カルテ本文 (保存すると曲/教材にたまり、生徒に届く)
  const [body, setBody] = useState("")
  const [bodyDone, setBodyDone] = useState(false)
  const [bodyErr, setBodyErr] = useState("")
  const [sendingB, startB] = useTransition()
  const saveBody = () => {
    const t = body.trim(); if (!t) return
    startB(async () => {
      const r = await savePracticeKarte(studentId, kind === "score" ? { scoreId: targetId } : { practiceItemId: targetId }, t)
      if (r.ok) { setBodyDone(true); setBody(""); router.refresh() } else setBodyErr(r.error)
    })
  }

  // 癖 (わざ先行フロー: ①わざを選ぶ → ②その癖を選ぶ + 重さ + 自由記述)
  const [skillSel, setSkillSel] = useState<string | null>(null)
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
    <div style={{ background: "#f5f7fa", border: "1px solid #e6e9ef", borderRadius: 18, overflow: "hidden", color: "var(--text-ink)" }}>
      <div style={{ background: "#22346b", color: "#eaf0fb", padding: "13px 15px 13px" }}>
        <Link href={backHref} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "var(--fs-label)", fontWeight: 700, color: "#9fb2dd", textDecoration: "none" }}>
          <ArrowLeft size={13} /> 練習後カルテにもどる
        </Link>
        <div style={{ marginTop: 5 }}>
          <h1 style={{ fontSize: "var(--fs-head)", fontWeight: 900, margin: 0, color: "#fff" }}>練習後カルテを書く</h1>
          <div style={{ fontSize: "var(--fs-label)", fontWeight: 700, color: "#9fb2dd", marginTop: 2 }}>
            {title}{star != null ? ` ・ ★${star}` : ""} ・ {cat}
          </div>
        </div>
      </div>
      <div style={{ padding: "12px 13px 14px" }}>

      {/* 直近の演奏を聴く (カルテは演奏に紐づかない。いろいろ聴いて1枚書く)。
          場所をとらないよう プルダウンで1件えらんで再生する方式 (2026-08-11 Tetsuo指定) */}
      <div style={card}>
        <div style={lab}>直近の演奏を聴く（えらんで再生・聴きながら下にカルテを書けます）</div>
        {performances.length === 0 ? (
          <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>まだ演奏がありません。</div>
        ) : (
          <>
            <select value={selPerfId ?? ""} onChange={(e) => setSelPerfId(e.target.value)}
              style={{ width: "100%", border: "1px solid #dfe3ea", borderRadius: 8, padding: "8px 10px", fontSize: "var(--fs-body)", background: "#fff", boxSizing: "border-box" }}>
              {performances.map((p) => (
                <option key={p.id} value={p.id}>{p.date} ・ {p.avg}点（音程{p.pitch}／リズム{p.timing}）</option>
              ))}
            </select>
            {selPerf && (
              <div style={{ marginTop: 8 }}>
                {selPerf.audioUrl ? (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <audio key={selPerf.id} controls preload="none" src={selPerf.audioUrl} style={{ width: "100%", height: 32 }} />
                ) : (
                  <div style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)" }}>音声なし</div>
                )}
                {selPerf.weak.length > 0 && (
                  <div style={{ fontSize: "var(--fs-label)", color: "var(--text-body)", marginTop: 5, lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 800, color: "var(--text-muted)" }}>崩れ：</span>
                    {selPerf.weak.slice(0, 2).map((w, i) => (
                      <span key={i}>{i > 0 ? " / " : ""}<span style={{ color: w.tree === "音程" ? "#c0473a" : "#b7823a", fontWeight: 800 }}>{w.tree}</span>{w.name}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 指板ヒートマップ (案5: 音程FBは文章ではなく指板。マーキングモードで「気をつける音」を渡す) */}
      {heatmap && (
        <div style={card}>
          <div style={lab}>音程マップ（この{kind === "score" ? "曲" : "教材"}の全演奏 {heatmap.perfCount}回分）</div>
          <FingerboardPanel
            cells={heatmap.cells}
            details={heatmap.details}
            marks={marks}
            markable
            onSaveMark={async (cellId, note) => {
              const r = await saveFingerboardMark(studentId, cellId, note)
              if (r.ok) setMarks((prev) => [...prev.filter((m) => m.cellId !== cellId), { cellId, note }])
              return r.ok
            }}
            onRemoveMark={async (cellId) => {
              const r = await removeFingerboardMark(studentId, cellId)
              if (r.ok) setMarks((prev) => prev.filter((m) => m.cellId !== cellId))
              return r.ok
            }}
          />
        </div>
      )}

      {/* カルテ本文 */}
      <div style={card}>
        <div style={{ ...lab, display: "flex", alignItems: "center", gap: 5 }}><MessageCircle size={13} /> カルテ本文（保存すると生徒に届きます）</div>
        {bodyDone ? (
          <div style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-good)", display: "inline-flex", alignItems: "center", gap: 5 }}><Check size={14} /> カルテを渡しました</div>
        ) : (
          <>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="例：ファ♯、移弦のあとに少し下がるね。移弦の前に指を準備しよう。"
              style={{ width: "100%", border: "1px solid #dfe3ea", borderRadius: 9, padding: "9px 11px", fontSize: "var(--fs-body)", resize: "vertical", boxSizing: "border-box" }} />
            {bodyErr && <div style={{ fontSize: "var(--fs-label)", color: "#c0473a", fontWeight: 800, marginTop: 4 }}>{bodyErr}</div>}
            <button type="button" onClick={saveBody} disabled={sendingB || !body.trim()}
              style={{ marginTop: 8, fontSize: "var(--fs-caption)", fontWeight: 800, color: "#fff", background: "#3b56d4", border: "none", borderRadius: 9, padding: "8px 16px", cursor: "pointer", opacity: sendingB || !body.trim() ? 0.5 : 1 }}>
              {sendingB ? "保存中…" : "カルテを渡す"}
            </button>
          </>
        )}
      </div>

      {/* この曲のおすすめ練習 (生徒のホームに表示中) + 練習ポイント → 生徒の教材ページに連動 */}
      {materials.length > 0 && (
        <div style={card}>
          <div style={lab}>この曲のおすすめ練習（生徒のホームに表示中）</div>
          <div style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)", margin: "-4px 0 10px", lineHeight: 1.5 }}>
            「毎日の基礎練」として生徒に出ている教材です。練習ポイントを書くと、生徒がその教材を開いたときに表示されます（宿題にはなりません）。
          </div>
          {materials.map((m) => (
            <MaterialPointRow key={m.itemId} userId={userId} studentId={studentId} m={m} />
          ))}
        </div>
      )}

      {/* 癖 (わざ先行フロー) → 成長カルテ・癖マップ・指摘トラッキングに連動 */}
      <div style={card}>
        <div style={lab}>癖を記録</div>
        {kuseDone ? (
          <div style={{ fontSize: "var(--fs-caption)", fontWeight: 800, color: "var(--text-good)", display: "inline-flex", alignItems: "center", gap: 5 }}><Check size={14} /> 癖を記録しました</div>
        ) : (
          <>
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
                わざ以外（姿勢・かまえ）
              </button>
            </div>

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
                      <div style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: "#7a4dd6", marginBottom: 4 }}>◇ 直近の演奏から考えられる癖</div>
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
                    {savingK ? "記録中…" : `このわざの癖として記録${tags.size > 0 ? `（${tags.size}）` : ""}`}
                  </button>
                </div>
              )
            })()}
          </>
        )}
      </div>

      {/* 表現クリア認定 (曲のみ) → 生徒の表現力レベル・成長カルテに連動 */}
      {kind === "score" && (
        <ExprCertifyBox studentId={studentId} scoreId={targetId} cardStyle={{ ...card, marginBottom: 0 }} labStyle={lab} />
      )}
      </div>
    </div>
  )
}
