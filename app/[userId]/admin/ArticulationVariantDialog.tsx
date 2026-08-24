"use client"
// 教材の奏法バリエーション作成ダイアログ (2026-08-24 要件確定 ・ admin)。
// ステップ: ①繰り返し単位 → ②単位内の音符に1音ずつ奏法を割り当て → ③名前+適用先 → 作成。
// 何個でも追加できる (作成後も一覧に戻って続けて作れる)。
import { useEffect, useMemo, useState } from "react"
import {
  createArticulationVariant, getArticulationContext, type PerNoteAssignment,
} from "@/app/actions/createArticulationVariant"

const ARTS: { id: string; label: string; short: string }[] = [
  { id: "legato", label: "レガート", short: "レ" },
  { id: "staccato", label: "スタッカート", short: "ス" },
  { id: "spiccato", label: "スピッカート", short: "ピ" },
  { id: "martele", label: "マルテレ", short: "マ" },
  { id: "portato", label: "ポルタート", short: "ポ" },
  { id: "tenuto", label: "テヌート", short: "テ" },
  { id: "tremolo", label: "トレモロ", short: "ト" },
  { id: "accent", label: "アクセント", short: "ア" },
]

type Ctx = Awaited<ReturnType<typeof getArticulationContext>>

export default function ArticulationVariantDialog({ itemId, onClose }: { itemId: string; onClose: () => void }) {
  const [ctx, setCtx] = useState<Ctx | null>(null)
  const [unit, setUnit] = useState(1)          // 繰り返し単位 (小節)。0=全体
  const [assigns, setAssigns] = useState<Map<number, string>>(new Map())
  const [brush, setBrush] = useState("staccato") // いま選んでいる奏法 (タップで塗る)
  const [name, setName] = useState("")
  const [applyAll, setApplyAll] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    getArticulationContext(itemId).then((c) => {
      setCtx(c)
      // エチュードは調変種を持たないので「全部の調に適用」を無効化
      if (c.ok && c.category === "etude") setApplyAll(false)
    })
  }, [itemId])

  // 単位内の音符数 (先頭単位で数える)
  const unitNoteCount = useMemo(() => {
    if (!ctx || !ctx.ok) return 0
    const npm = ctx.notesPerMeasure
    if (unit <= 0) return npm.reduce((a, b) => a + b, 0)
    return npm.slice(0, unit).reduce((a, b) => a + b, 0)
  }, [ctx, unit])

  const setNote = (i: number) => {
    setAssigns((prev) => {
      const next = new Map(prev)
      if (next.get(i) === brush) next.delete(i) // 同じ奏法でもう一度タップ=解除
      else next.set(i, brush)
      return next
    })
  }

  const fillAll = () => setAssigns(new Map(Array.from({ length: unitNoteCount }, (_, i) => [i, brush])))
  const fillHalf = (half: "front" | "back") => {
    const mid = Math.ceil(unitNoteCount / 2)
    setAssigns((prev) => {
      const next = new Map(prev)
      const [s, e] = half === "front" ? [0, mid] : [mid, unitNoteCount]
      for (let i = s; i < e; i++) next.set(i, brush)
      return next
    })
  }

  const submit = async () => {
    setBusy(true); setMsg(null)
    const assignments: PerNoteAssignment[] = [...assigns.entries()].map(([noteIndex, articulation]) => ({ noteIndex, articulation }))
    const r = await createArticulationVariant({
      sourceItemId: itemId, name, unitMeasures: unit <= 0 ? 9999 : unit, assignments, applyAllKeys: applyAll,
    })
    setBusy(false)
    if (r.ok) {
      setMsg(`${r.created}件の変種を作成し、解析を開始しました。続けて別のバリエーションも作れます。`)
      setAssigns(new Map()); setName("")
      const c = await getArticulationContext(itemId)
      setCtx(c)
    } else setMsg(r.error)
  }

  const box: React.CSSProperties = {
    position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(6,10,22,.62)",
  }
  const sheet: React.CSSProperties = {
    width: "min(560px, 94vw)", maxHeight: "86vh", overflowY: "auto",
    background: "var(--card-in, #101b38)", border: "1px solid rgba(150,175,225,.25)",
    borderRadius: 16, padding: "18px 20px 20px",
  }
  const label: React.CSSProperties = { fontSize: "var(--fs-caption)", color: "var(--text-sub)", margin: "14px 0 6px", fontWeight: 700 }

  return (
    <div style={box} onClick={onClose}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <b>奏法バリエーションを追加</b>
          <button type="button" onClick={onClose}>とじる</button>
        </div>

        {!ctx && <p style={{ marginTop: 12 }}>読み込み中…</p>}
        {ctx && !ctx.ok && <p style={{ marginTop: 12 }}>{ctx.error}</p>}
        {ctx && ctx.ok && (
          <>
            <p style={{ marginTop: 8, fontSize: "var(--fs-body)", color: "var(--text-sub)" }}>
              {ctx.title} ・ 全{ctx.measureCount}小節
            </p>
            {ctx.existing.length > 0 && (
              <div style={{ margin: "8px 0 0", padding: "8px 10px", borderRadius: 10, background: "rgba(150,175,225,.08)", fontSize: "var(--fs-caption)" }}>
                既存: {ctx.existing.map((e) => `${e.name} (${e.keys})`).join(" / ")}
              </div>
            )}

            <div style={label}>STEP 1 ・ 繰り返しの単位</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[1, 2, 4, 0].map((u) => (
                <label key={u} style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                  <input type="radio" checked={unit === u} onChange={() => { setUnit(u); setAssigns(new Map()) }} />
                  {u === 0 ? "譜面全体で1回" : `${u}小節ごと`}
                </label>
              ))}
            </div>

            <div style={label}>STEP 2 ・ 音符に奏法を割り当て (単位内 {unitNoteCount}音 ・ 選んだ奏法でタップ)</div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
              {ARTS.map((a) => (
                <button key={a.id} type="button" onClick={() => setBrush(a.id)}
                  style={{
                    padding: "5px 10px", borderRadius: 999, fontSize: "var(--fs-caption)", fontWeight: 700, cursor: "pointer",
                    border: brush === a.id ? "1px solid #d9a93c" : "1px solid rgba(150,175,225,.3)",
                    background: brush === a.id ? "rgba(217,169,60,.18)" : "rgba(150,175,225,.08)",
                    color: "var(--text-body)",
                  }}>
                  {a.label}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <button type="button" onClick={fillAll} style={{ fontSize: "var(--fs-caption)" }}>全部この奏法</button>
              <button type="button" onClick={() => fillHalf("front")} style={{ fontSize: "var(--fs-caption)" }}>前半に塗る</button>
              <button type="button" onClick={() => fillHalf("back")} style={{ fontSize: "var(--fs-caption)" }}>後半に塗る</button>
              <button type="button" onClick={() => setAssigns(new Map())} style={{ fontSize: "var(--fs-caption)" }}>クリア</button>
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {Array.from({ length: unitNoteCount }, (_, i) => {
                const art = assigns.get(i)
                const def = ARTS.find((a) => a.id === art)
                return (
                  <button key={i} type="button" onClick={() => setNote(i)}
                    title={def?.label ?? "未割り当て"}
                    style={{
                      width: 40, height: 44, borderRadius: 8, cursor: "pointer",
                      display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      border: art ? "1px solid #d9a93c" : "1px solid rgba(150,175,225,.25)",
                      background: art ? "rgba(217,169,60,.16)" : "rgba(150,175,225,.06)",
                      color: "var(--text-body)", fontSize: 10, fontWeight: 700,
                    }}>
                    <span style={{ fontSize: 13 }}>♪{i + 1}</span>
                    <span>{def?.short ?? "-"}</span>
                  </button>
                )
              })}
            </div>

            <div style={label}>STEP 3 ・ 名前と適用先</div>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="例: 前半スラー・後半スタッカート" style={{ width: "100%", padding: "8px 10px" }}
            />
            {/* エチュードは調のパターンを作らない (2026-08-24 Tetsuo指示) ため適用先を出さない */}
            {ctx.category !== "etude" ? (
              <div style={{ marginTop: 8, display: "flex", gap: 12 }}>
                <label><input type="radio" checked={applyAll} onChange={() => setApplyAll(true)} /> 全部の調に適用</label>
                <label><input type="radio" checked={!applyAll} onChange={() => setApplyAll(false)} /> この調だけ</label>
              </div>
            ) : null}

            <div style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button type="button" disabled={busy || assigns.size === 0 || !name.trim()} onClick={submit}
                style={{ padding: "9px 18px", borderRadius: 10, fontWeight: 700, background: "#2b5bc4", color: "#fff", border: "none", cursor: "pointer" }}>
                {busy ? "作成中…" : "この規則で変種を作成"}
              </button>
              {msg && <span style={{ fontSize: "var(--fs-caption)" }}>{msg}</span>}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
