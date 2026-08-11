"use client"

// 練習後カルテ入力画面 (2026-08-11 Tetsuo確定・案3=3ステップ型):
// ①きく・みる (場面選択 / 演奏を聴く+採点スコアモーダル / 音程マップ)
// ②かく (本文[必須] / 練習ポイント / 癖 / 表現認定)
// ③わたす (宿題の合格判断 / 一括送信)
// 各セクションの独立保存は廃止。すべて下書きとして持ち、最後の「カルテを渡す」で一括送信する。
import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, MessageCircle, Check } from "lucide-react"
import { savePracticeKarte, saveFingerboardMark, removeFingerboardMark, passAssignment } from "@/app/actions/teacherActions"
import { createObservation } from "@/app/actions/teacherObservations"
import { saveMaterialNote } from "@/app/actions/teacherMaterialNotes"
import { recordExpressionClear } from "@/app/actions/expressionClears"
import { MOOD_TAG_DEFS, moodTagLabel } from "@/app/_libs/moodTags"
import { OBSERVATION_CATALOG, OBSERVATION_SEVERITIES } from "@/app/_libs/observationCatalog"
import { SKILL_ID_LABELS, FEATURE_TARGETS, SUB_TARGETS } from "@/app/_libs/skillCatalog"
import type { HeatmapData } from "@/app/_libs/fingerboard/heatmapTypes"
import FingerboardPanel, { type FingerboardMark } from "@/app/components/FingerboardPanel"
import ColoredSheetModal from "@/app/components/ColoredSheetModal"
import { MaterialPreviewLink } from "../[perfId]/KarteDetailClient"

type WeakSlot = { name: string; tree: "音程" | "リズム"; miss: number; target: number }
type PerfRow = { id: string; date: string; pitch: number; timing: number; avg: number; audioUrl: string | null; weak: WeakSlot[]; comparisonUrl: string | null }
type MaterialRow = { itemId: string; label: string; category: string; star: number | null; point: string }

export default function KarteWriteClient({
  backHref, userId, studentId, kind, targetId, title, cat, star, performances, aiTags, materials,
  heatmap, marks: initialMarks = [], hw = null, sheetUrl = null,
}: {
  backHref: string; userId: string; studentId: string
  kind: "score" | "practice"; targetId: string
  title: string; cat: string; star: number | null
  performances: PerfRow[]
  aiTags: { id: string; label: string }[]
  materials: MaterialRow[]
  heatmap?: HeatmapData
  marks?: FingerboardMark[]
  /** この曲/教材が提出済み・未合格の宿題なら合格判断を出す */
  hw?: { id: string; targetScore: number | null; submittedScore: number | null } | null
  /** 採点スコアモーダル用の楽譜URL */
  sheetUrl?: string | null
}) {
  const router = useRouter()

  // ①きく・みる
  const [selPerfId, setSelPerfId] = useState<string | null>(performances[0]?.id ?? null)
  const selPerf = performances.find((p) => p.id === selPerfId) ?? null
  const [sheetOpen, setSheetOpen] = useState(false)
  const [ctx, setCtx] = useState<"lesson" | "audio">("audio")
  const [marks, setMarks] = useState<FingerboardMark[]>(initialMarks)

  // ②かく (すべて下書き)
  const [body, setBody] = useState("")
  const [skillSel, setSkillSel] = useState<string | null>(null)
  const [featSel, setFeatSel] = useState<Set<string>>(new Set()) // 細目 (特徴タグ・任意)
  const [tags, setTags] = useState<Set<string>>(new Set())
  const [severity, setSeverity] = useState<"mild" | "focus">("mild")
  const [kuseComment, setKuseComment] = useState("")
  const toggle = (id: string) => setTags((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const [exprTag, setExprTag] = useState("")
  const [points, setPoints] = useState<Record<string, string>>(() => Object.fromEntries(materials.map((m) => [m.itemId, m.point])))

  // ③わたす
  const [passHw, setPassHw] = useState(false)
  const [sending, startSend] = useTransition()
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)
  const [done, setDone] = useState(false)

  const kuseDirty = tags.size > 0 || kuseComment.trim().length > 0
  const dirtyPoints = materials.filter((m) => (points[m.itemId] ?? "").trim() !== m.point.trim())
  const markAdds = marks.filter((m) => {
    const before = initialMarks.find((x) => x.cellId === m.cellId)
    return !before || before.note !== m.note
  })
  const markRemoves = initialMarks.filter((m) => !marks.some((x) => x.cellId === m.cellId))
  const sendCount = (body.trim() ? 1 : 0) + (kuseDirty ? 1 : 0) + (exprTag ? 1 : 0) + dirtyPoints.length + markAdds.length + markRemoves.length + (passHw ? 1 : 0)

  const submitAll = () => {
    if (!body.trim()) { setResult({ ok: false, text: "カルテ本文を書いてください・本文だけは必須です" }); return }
    startSend(async () => {
      const errs: string[] = []
      const r1 = await savePracticeKarte(studentId, kind === "score" ? { scoreId: targetId } : { practiceItemId: targetId }, body.trim(), ctx)
      if (!r1.ok) { setResult({ ok: false, text: `カルテ本文の送信に失敗・${r1.error}` }); return }
      if (passHw && hw) {
        const r = await passAssignment(hw.id)
        if (!r.ok) errs.push("宿題の合格")
      }
      if (kuseDirty) {
        const r = await createObservation({
          studentId, tagIds: [...tags], severity, comment: kuseComment.trim() || null,
          skillIds: skillSel && skillSel !== "general" ? [skillSel, ...featSel].slice(0, 4) : [],
        })
        if (!r.ok) errs.push("癖の記録")
      }
      if (exprTag && kind === "score") {
        const r = await recordExpressionClear({ studentId, moodTagId: exprTag, scoreId: targetId })
        if (!r.ok) errs.push("表現クリア認定")
      }
      for (const m of dirtyPoints) {
        const r = await saveMaterialNote({ studentId, practiceItemId: m.itemId, point: (points[m.itemId] ?? "").trim() })
        if (!r.ok) errs.push(`練習ポイント・${m.label}`)
      }
      for (const m of markAdds) {
        const r = await saveFingerboardMark(studentId, m.cellId, m.note)
        if (!r.ok) errs.push("指板マーク")
      }
      for (const m of markRemoves) {
        const r = await removeFingerboardMark(studentId, m.cellId)
        if (!r.ok) errs.push("指板マークの削除")
      }
      if (errs.length) {
        setResult({ ok: false, text: `カルテ本文は届きました。ただし失敗した項目があります: ${[...new Set(errs)].join(" / ")}` })
      } else {
        setResult({ ok: true, text: "すべての項目を生徒に渡しました" })
        setDone(true)
        router.refresh()
      }
    })
  }

  const card: React.CSSProperties = { background: "#fff", border: "1px solid #e6e9ef", borderRadius: 14, padding: "13px 15px", marginBottom: 10 }
  const lab: React.CSSProperties = { fontSize: "var(--fs-caption)", fontWeight: 900, color: "var(--text-sub)", marginBottom: 8 }
  const optBadge = <span style={{ fontSize: "var(--fs-label)", fontWeight: 900, color: "var(--text-muted)", background: "#f2f4f8", borderRadius: 5, padding: "0 6px", marginLeft: 6 }}>任意</span>
  const chip = (on: boolean): React.CSSProperties => ({
    fontSize: "var(--fs-label)", fontWeight: 800, borderRadius: 999, padding: "5px 11px", cursor: "pointer", border: "1px solid",
    color: on ? "#a9741c" : "#5a6472", background: on ? "#fff3e2" : "#fff", borderColor: on ? "#f0dcb4" : "#dfe3ea",
  })
  const step = (n: number, label: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "var(--fs-caption)", fontWeight: 900, color: "#22346b", margin: "12px 2px 7px" }}>
      <span style={{ background: "#22346b", color: "#fff", borderRadius: "50%", width: 19, height: 19, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "var(--fs-label)", flex: "none" }}>{n}</span>
      {label}
    </div>
  )

  return (
    <div style={{ background: "#f5f7fa", border: "1px solid #e6e9ef", borderRadius: 18, overflow: "hidden", color: "var(--text-ink)" }}>
      <div style={{ background: "#22346b", color: "#eaf0fb", padding: "13px 15px 13px" }}>
        <Link href={backHref} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "var(--fs-label)", fontWeight: 700, color: "#9fb2dd", textDecoration: "none" }}>
          <ArrowLeft size={13} /> 練習後カルテにもどる
        </Link>
        <div style={{ marginTop: 5 }}>
          <h1 style={{ fontSize: "var(--fs-head)", fontWeight: 900, margin: 0, color: "#fff" }}>練習後カルテを書く</h1>
          <div style={{ fontSize: "var(--fs-label)", fontWeight: 700, color: "#9fb2dd", marginTop: 2 }}>
            {title}{star != null ? ` ・ ★${star}` : ""} ・ {cat} ・ 最後にまとめて送信
          </div>
        </div>
      </div>
      <div style={{ padding: "4px 13px 14px" }}>

      {/* ① きく・みる */}
      {step(1, "きく・みる")}
      <div style={card}>
        <div style={lab}>どんな場面で書いていますか</div>
        <div style={{ display: "flex", gap: 6 }}>
          {([["lesson", "レッスン直後"], ["audio", "演奏音声のみで確認"]] as const).map(([v, label]) => (
            <button key={v} type="button" onClick={() => setCtx(v)} disabled={done}
              style={{ flex: 1, fontSize: "var(--fs-caption)", fontWeight: 900, borderRadius: 8, padding: "8px 0", cursor: "pointer", border: "1px solid",
                background: ctx === v ? "#22346b" : "#fff", color: ctx === v ? "#fff" : "var(--text-muted)", borderColor: ctx === v ? "#22346b" : "#dfe3ea" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={card}>
        <div style={lab}>直近の演奏を聴く・えらんで再生</div>
        {performances.length === 0 ? (
          <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)" }}>まだ演奏がありません。</div>
        ) : (
          <>
            <select value={selPerfId ?? ""} onChange={(e) => setSelPerfId(e.target.value)}
              style={{ width: "100%", border: "1px solid #dfe3ea", borderRadius: 8, padding: "8px 10px", fontSize: "var(--fs-body)", background: "#fff", boxSizing: "border-box" }}>
              {performances.map((p) => (
                <option key={p.id} value={p.id}>{p.date} ・ {p.avg}点・音程{p.pitch}／リズム{p.timing}</option>
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
                {sheetUrl && selPerf.comparisonUrl && (
                  <button type="button" onClick={() => setSheetOpen(true)}
                    style={{ display: "block", width: "100%", textAlign: "center", marginTop: 7, fontSize: "var(--fs-caption)", fontWeight: 900, color: "#2f66c4", background: "#eef3fc", border: "1px solid #c9daf3", borderRadius: 8, padding: "8px 0", cursor: "pointer" }}>
                    この演奏の採点スコアを確認・色つき譜面 →
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {heatmap && (
        <div style={card}>
          <div style={lab}>音程マップ・いままでの演奏{heatmap.perfCount}回ぶんを合算</div>
          <FingerboardPanel
            cells={heatmap.cells}
            details={heatmap.details}
            marks={marks}
            markable
            onSaveMark={async (cellId, note) => {
              setMarks((prev) => [...prev.filter((m) => m.cellId !== cellId), { cellId, note }])
              return true
            }}
            onRemoveMark={async (cellId) => {
              setMarks((prev) => prev.filter((m) => m.cellId !== cellId))
              return true
            }}
          />
          <div style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)", marginTop: 5 }}>マークは下書きです。最後の「カルテを渡す」で生徒に届きます。</div>
        </div>
      )}

      {/* ② かく */}
      {step(2, "かく")}
      <div style={card}>
        <div style={{ ...lab, display: "flex", alignItems: "center", gap: 5 }}>
          <MessageCircle size={13} /> カルテ本文
          <span style={{ fontSize: "var(--fs-label)", fontWeight: 900, color: "#fff", background: "#c0473a", borderRadius: 5, padding: "0 6px" }}>必須</span>
        </div>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="例：ファ♯、移弦のあとに少し下がるね。移弦の前に指を準備しよう。"
          disabled={done}
          style={{ width: "100%", border: "1px solid #dfe3ea", borderRadius: 9, padding: "9px 11px", fontSize: "var(--fs-body)", resize: "vertical", boxSizing: "border-box" }} />
      </div>

      {materials.length > 0 && (
        <div style={card}>
          <div style={lab}>おすすめ練習の練習ポイント{optBadge}</div>
          <div style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)", margin: "-4px 0 10px", lineHeight: 1.5 }}>
            生徒のホームに出ている教材です。ポイントを書くと生徒がその教材を開いたときに表示されます。
          </div>
          {materials.map((m) => (
            <div key={m.itemId} style={{ border: "1px solid #eef1f4", borderRadius: 10, padding: "9px 11px", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                <span style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-sub)", background: "#f7f8fa", border: "1px solid #eef1f4", borderRadius: 999, padding: "1px 7px", flex: "none" }}>{m.label}</span>
                {m.star != null && <span style={{ fontSize: "var(--fs-label)", fontWeight: 900, color: "#b58a1e", flex: "none" }}>★{m.star}</span>}
                <MaterialPreviewLink href={`/${userId}/practice/${m.category}/${m.itemId}`} label={m.label} />
                {(points[m.itemId] ?? "").trim() !== m.point.trim() && (
                  <span style={{ marginLeft: "auto", fontSize: "var(--fs-label)", fontWeight: 800, color: "#b58a1e", flex: "none" }}>下書き</span>
                )}
              </div>
              <textarea value={points[m.itemId] ?? ""} onChange={(e) => setPoints((prev) => ({ ...prev, [m.itemId]: e.target.value }))} rows={2}
                placeholder="練習ポイント・例：4の指の音程をよく聴いて。ゆっくりから" disabled={done}
                style={{ width: "100%", border: "1px solid #dfe3ea", borderRadius: 8, padding: "8px 10px", fontSize: "var(--fs-body)", resize: "vertical", boxSizing: "border-box", marginTop: 7 }} />
            </div>
          ))}
        </div>
      )}

      <div style={card}>
        <div style={lab}>癖を記録{optBadge}</div>
        <div style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-sub)", marginBottom: 5 }}>① どの対象の癖？</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {SKILL_ID_LABELS.map((sk) => (
            <button key={sk.id} type="button" onClick={() => { setSkillSel(sk.id); setTags(new Set()); setFeatSel(new Set()) }}
              style={{ fontSize: "var(--fs-label)", fontWeight: 800, borderRadius: 999, padding: "5px 11px", cursor: "pointer", border: "1px solid",
                color: skillSel === sk.id ? "#fff" : "#33405a", background: skillSel === sk.id ? "#22346b" : "#fff", borderColor: skillSel === sk.id ? "#22346b" : "#dfe3ea" }}>
              {sk.label}
            </button>
          ))}
          {/* 曲の特徴 (2026-08-11 Tetsuo確定: 特徴タグ由来の対象を追加) */}
          {FEATURE_TARGETS.map((ft) => (
            <button key={ft.id} type="button" onClick={() => { setSkillSel(ft.id); setTags(new Set()); setFeatSel(new Set()) }}
              style={{ fontSize: "var(--fs-label)", fontWeight: 800, borderRadius: 999, padding: "5px 11px", cursor: "pointer", border: "1px solid",
                color: skillSel === ft.id ? "#fff" : "#6b4a9e", background: skillSel === ft.id ? "#7a4dd6" : "#faf7ff", borderColor: skillSel === ft.id ? "#7a4dd6" : "#e0d0f5" }}>
              {ft.label}
            </button>
          ))}
          <button type="button" onClick={() => { setSkillSel("general"); setTags(new Set()); setFeatSel(new Set()) }}
            style={{ fontSize: "var(--fs-label)", fontWeight: 800, borderRadius: 999, padding: "5px 11px", cursor: "pointer", border: "1px dashed",
              color: skillSel === "general" ? "#fff" : "#8b97a8", background: skillSel === "general" ? "#8b97a8" : "#fff", borderColor: "#c9d0da" }}>
            わざ以外・姿勢 かまえ
          </button>
        </div>

        {/* 細目 (特徴タグ・任意): ポジション移動/重音/リズム/強弱を選んだときだけ出る */}
        {skillSel && SUB_TARGETS[skillSel] && (
          <div style={{ marginTop: 9 }}>
            <div style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-sub)", marginBottom: 4 }}>くわしく・どれの癖？（任意・未選択=全般）</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {SUB_TARGETS[skillSel].map((sub) => (
                <button key={sub.id} type="button"
                  onClick={() => setFeatSel((prev) => { const n = new Set(prev); n.has(sub.id) ? n.delete(sub.id) : n.add(sub.id); return n })}
                  style={{ fontSize: "var(--fs-label)", fontWeight: 900, borderRadius: 7, padding: "4px 10px", cursor: "pointer", border: "1px solid",
                    color: featSel.has(sub.id) ? "#22346b" : "var(--text-muted)", background: featSel.has(sub.id) ? "#e9eefb" : "#fff", borderColor: featSel.has(sub.id) ? "#ccd8f0" : "#e3e7ee" }}>
                  {sub.label}
                </button>
              ))}
            </div>
            {(skillSel === "feat_dynamics" || featSel.has("feat:rhy:sync")) && (
              <div style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)", marginTop: 4 }}>※ この対象は自動判定の対象外です。指摘トラッキングでは「判定中」のままになります</div>
            )}
          </div>
        )}

        {skillSel && (() => {
          const lane = SKILL_ID_LABELS.find((sk) => sk.id === skillSel)?.lane
          // リズム/強弱は体のどちら由来か決めつけられないため右手+左手の両タグを表示
          const catIds = skillSel === "general" ? ["posture", "tone"] : skillSel.startsWith("feat_") ? ["bow", "left"] : lane === "bow" ? ["bow"] : ["left"]
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
              <textarea value={kuseComment} onChange={(e) => setKuseComment(e.target.value)} rows={2} placeholder="自由記述・例：移弦の瞬間に肩が上がる" disabled={done}
                style={{ width: "100%", border: "1px solid #dfe3ea", borderRadius: 9, padding: "9px 11px", fontSize: "var(--fs-body)", resize: "vertical", boxSizing: "border-box", marginTop: 8 }} />
            </div>
          )
        })()}
      </div>

      {kind === "score" && (
        <div style={card}>
          <div style={lab}>表現クリアを認定{optBadge}</div>
          <select value={exprTag} onChange={(e) => setExprTag(e.target.value)} disabled={done}
            style={{ width: "100%", border: "1px solid #dfe3ea", borderRadius: 8, padding: "8px 10px", fontSize: "var(--fs-body)", background: "#fff", boxSizing: "border-box" }}>
            <option value="">認定しない</option>
            {MOOD_TAG_DEFS.map((t) => <option key={t.id} value={t.id}>{moodTagLabel(t.id)}</option>)}
          </select>
          <div style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)", marginTop: 6 }}>認定すると、曲の★がそのまま生徒の表現力レベルになります。</div>
        </div>
      )}

      {/* ③ わたす */}
      {step(3, "わたす")}
      {hw && (
        <div style={{ ...card, border: "1px solid #cfe9db", background: "#f4faf7" }}>
          <div style={{ fontSize: "var(--fs-caption)", fontWeight: 900, color: "#136647", marginBottom: 5 }}>宿題の合格を判断</div>
          <div style={{ fontSize: "var(--fs-caption)", color: "#1f3a2e", lineHeight: 1.6 }}>
            この{kind === "score" ? "曲" : "教材"}は宿題です。
            {hw.submittedScore != null && <>提出 <b>{hw.submittedScore}点</b></>}
            {hw.targetScore != null && <>・ゴール <b>{hw.targetScore}点</b></>}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            {([[true, "合格にする"], [false, "今回は見送る"]] as const).map(([v, label]) => (
              <button key={label} type="button" onClick={() => setPassHw(v)} disabled={done}
                style={{ flex: 1, fontSize: "var(--fs-caption)", fontWeight: 900, borderRadius: 8, padding: "8px 0", cursor: "pointer", border: "1px solid",
                  background: passHw === v ? "#158253" : "#fff", color: passHw === v ? "#fff" : "var(--text-muted)", borderColor: passHw === v ? "#158253" : "#cfe9db" }}>
                {label}
              </button>
            ))}
          </div>
          {passHw && <div style={{ fontSize: "var(--fs-label)", color: "#136647", marginTop: 6 }}>送信すると生徒に「合格！」の通知が届き、ホームの宿題カードから消えます。</div>}
        </div>
      )}

      <div style={{ ...card, marginBottom: 0, border: "1px solid #c9d6ea", background: "#f0f4fb" }}>
        <div style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: "#33405a", lineHeight: 1.7 }}>
          送る内容：
          {body.trim() && <span> カルテ本文</span>}
          {kuseDirty && <span> ・癖の記録</span>}
          {exprTag && <span> ・表現クリア認定</span>}
          {dirtyPoints.length > 0 && <span> ・練習ポイント{dirtyPoints.length}件</span>}
          {(markAdds.length > 0 || markRemoves.length > 0) && <span> ・指板マーク{markAdds.length + markRemoves.length}件</span>}
          {passHw && <span> ・宿題の合格</span>}
          {sendCount === 0 && <span style={{ color: "var(--text-muted)" }}> まだ何も書いていません</span>}
        </div>
        {result && (
          <div style={{ fontSize: "var(--fs-caption)", fontWeight: 800, marginTop: 7, color: result.ok ? "#158253" : "#c0473a", display: "inline-flex", alignItems: "center", gap: 5 }}>
            {result.ok && <Check size={14} />} {result.text}
          </div>
        )}
        {!done && (
          <button type="button" onClick={submitAll} disabled={sending}
            style={{ marginTop: 9, width: "100%", fontSize: "var(--fs-body)", fontWeight: 900, color: "#fff", background: "#22346b", border: "none", borderRadius: 10, padding: "12px 0", cursor: "pointer", opacity: sending ? 0.6 : 1 }}>
            {sending ? "送信中…" : "カルテを渡す・まとめて送信"}
          </button>
        )}
        {done && (
          <Link href={backHref} style={{ display: "block", textAlign: "center", marginTop: 9, fontSize: "var(--fs-caption)", fontWeight: 900, color: "#22346b", background: "#fff", border: "1px solid #c9d6ea", borderRadius: 10, padding: "10px 0", textDecoration: "none" }}>
            カルテ一覧にもどる →
          </Link>
        )}
      </div>
      </div>

      {/* 採点スコアモーダル (分析後の色つき譜面) */}
      <ColoredSheetModal
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        buildUrl={sheetUrl}
        comparisonUrl={selPerf?.comparisonUrl ?? null}
        title={selPerf ? `${selPerf.date} ${title}` : title}
      />
    </div>
  )
}
