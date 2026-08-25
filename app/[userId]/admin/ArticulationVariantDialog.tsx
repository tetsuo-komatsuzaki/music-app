"use client"
// 奏法バリエーションの作成ダイアログ (2026-08-25: リズム画面と構成・操作感を統一)。
// ①くり返しの単位 → 対象外にする小節 → ②奏法をえらぶ → ③音符に割り当て → ④名前を付けて作成
// リズムパターン (RhythmVariantDialog) と同じ並び・同じ見た目にそろえてある。
// 何個でも追加できる (作成後もそのまま次を作れる)。
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
  const [unit, setUnit] = useState(1)          // くり返し単位 (小節)。0=譜面全体で1回
  const [skipHead, setSkipHead] = useState(0)
  const [skipTail, setSkipTail] = useState(0)
  const [skipMeasures, setSkipMeasures] = useState<Set<number>>(new Set())
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

  // 単位内の音符数 (対象外を飛ばした先頭単位で数える)
  const unitNoteCount = useMemo(() => {
    if (!ctx || !ctx.ok) return 0
    const npm = ctx.notesPerMeasure
    if (unit <= 0) return npm.reduce((a, b) => a + b, 0)
    return npm.slice(skipHead, skipHead + unit).reduce((a, b) => a + b, 0)
  }, [ctx, unit, skipHead])

  const setNote = (i: number) => {
    setAssigns((prev) => {
      const next = new Map(prev)
      if (next.get(i) === brush) next.delete(i) // 同じ奏法をもう一度タップ=解除
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
      skipHead, skipTail, skipMeasures: [...skipMeasures],
    })
    setBusy(false)
    if (r.ok) {
      setMsg(`${r.created}件の変種を作成し、解析を開始しました。続けて別のパターンも作れます。`)
      setAssigns(new Map()); setName("")
      setCtx(await getArticulationContext(itemId))
    } else setMsg(r.error)
  }

  const S = {
    box: { position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(6,10,22,.62)" } as React.CSSProperties,
    sheet: { width: "min(620px, 94vw)", maxHeight: "88vh", overflowY: "auto", background: "var(--card-in)", border: "1px solid rgba(150,175,225,.25)", borderRadius: 16, padding: "18px 20px 20px" } as React.CSSProperties,
    label: { fontSize: "var(--fs-caption)", color: "var(--text-sub)", margin: "14px 0 6px", fontWeight: 700 } as React.CSSProperties,
    row: { display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" } as React.CSSProperties,
  }
  const btn = (on: boolean): React.CSSProperties => ({
    padding: "6px 11px", borderRadius: 9, fontSize: "var(--fs-caption)", fontWeight: 700, cursor: "pointer",
    border: on ? "1px solid #d9a93c" : "1px solid rgba(150,175,225,.28)",
    background: on ? "rgba(217,169,60,.18)" : "rgba(150,175,225,.08)", color: "var(--text-body)",
  })

  return (
    <div style={S.box} onClick={onClose}>
      <div style={S.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <b>奏法バリエーションを追加</b>
          <button type="button" onClick={onClose}>とじる</button>
        </div>

        {!ctx && <p style={{ marginTop: 12 }}>読み込み中…</p>}
        {ctx && !ctx.ok && <p style={{ marginTop: 12 }}>{ctx.error}</p>}
        {ctx && ctx.ok && (
          <>
            <p style={{ marginTop: 8, fontSize: "var(--fs-caption)", color: "var(--text-sub)" }}>
              {ctx.title} ・ 全{ctx.measureCount}小節
            </p>
            {ctx.existing.length > 0 && (
              <div style={{ margin: "8px 0 0", padding: "8px 10px", borderRadius: 10, background: "rgba(150,175,225,.08)", fontSize: "var(--fs-caption)" }}>
                既存: {ctx.existing.map((e) => `${e.name} (${e.keys})`).join(" / ")}
              </div>
            )}

            <div style={S.label}>① くり返しの単位</div>
            <div style={S.row}>
              {[1, 2, 4].map((u) => (
                <button key={u} type="button" style={btn(unit === u)}
                  onClick={() => { setUnit(u); setAssigns(new Map()) }}>
                  {u}小節ごと
                </button>
              ))}
              <button type="button" style={btn(unit === 0)}
                onClick={() => { setUnit(0); setAssigns(new Map()) }}>
                譜面全体で1回
              </button>
              <input type="number" min={1} max={32} value={unit || ""} placeholder="任意"
                onChange={(e) => { setUnit(Math.max(0, Math.min(32, Number(e.target.value) || 0))); setAssigns(new Map()) }}
                style={{ width: 62 }} />
              <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-sub)" }}>小節</span>
            </div>

            <div style={S.label}>対象外にする小節 (形が違うところ)</div>
            <div style={S.row}>
              <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-sub)" }}>先頭から</span>
              <input type="number" min={0} max={ctx.measureCount} value={skipHead}
                onChange={(e) => setSkipHead(Math.max(0, Number(e.target.value) || 0))} style={{ width: 56 }} />
              <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-sub)" }}>小節 ・ 終わりから</span>
              <input type="number" min={0} max={ctx.measureCount} value={skipTail}
                onChange={(e) => setSkipTail(Math.max(0, Number(e.target.value) || 0))} style={{ width: 56 }} />
              <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-sub)" }}>小節</span>
            </div>
            <div style={{ ...S.row, marginTop: 8 }}>
              {Array.from({ length: ctx.measureCount }, (_, i) => i + 1).map((m) => {
                const auto = m <= skipHead || m > ctx.measureCount - skipTail
                const on = skipMeasures.has(m) || auto
                return (
                  <button key={m} type="button" disabled={auto}
                    onClick={() => setSkipMeasures((prev) => {
                      const next = new Set(prev)
                      if (next.has(m)) next.delete(m); else next.add(m)
                      return next
                    })}
                    style={{ ...btn(on), width: 38, padding: "5px 0", opacity: auto ? 0.55 : 1, cursor: auto ? "default" : "pointer" }}
                    title={auto ? "先頭/終わりの指定で対象外" : "タップで対象外にする"}>
                    {m}
                  </button>
                )
              })}
            </div>
            <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-sub)", marginTop: 5 }}>
              光っている小節は対象外です。
            </p>

            <div style={S.label}>② 奏法をえらぶ</div>
            <div style={S.row}>
              {ARTS.map((a) => (
                <button key={a.id} type="button" style={btn(brush === a.id)} onClick={() => setBrush(a.id)}>
                  {a.label}
                </button>
              ))}
            </div>

            <div style={S.label}>③ 音符に割り当てる (単位内 {unitNoteCount}音 ・ タップで塗る)</div>
            <div style={S.row}>
              <button type="button" style={btn(false)} onClick={fillAll}>全部この奏法</button>
              <button type="button" style={btn(false)} onClick={() => fillHalf("front")}>前半に塗る</button>
              <button type="button" style={btn(false)} onClick={() => fillHalf("back")}>後半に塗る</button>
              <button type="button" style={btn(false)} onClick={() => setAssigns(new Map())}>クリア</button>
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", minHeight: 60, background: "rgba(11,18,32,.5)", border: "1px dashed rgba(150,175,225,.25)", borderRadius: 12, padding: 9, marginTop: 9 }}>
              {unitNoteCount === 0 && (
                <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-sub)", padding: 10 }}>単位を選ぶと音符が並びます</span>
              )}
              {Array.from({ length: unitNoteCount }, (_, i) => {
                const art = assigns.get(i)
                const def = ARTS.find((a) => a.id === art)
                return (
                  <button key={i} type="button" onClick={() => setNote(i)} title={def?.label ?? "未割り当て"}
                    style={{
                      width: 42, height: 46, borderRadius: 9, cursor: "pointer",
                      display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      border: art ? "1px solid #d9a93c" : "1px solid rgba(150,175,225,.25)",
                      background: art ? "rgba(217,169,60,.16)" : "rgba(150,175,225,.06)",
                      color: "var(--text-body)", fontSize: 10, fontWeight: 700,
                    }}>
                    <span style={{ fontSize: 12 }}>♪{i + 1}</span>
                    <span>{def?.short ?? "-"}</span>
                  </button>
                )
              })}
            </div>

            <div style={S.label}>④ 名前を付けて作成</div>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="例: 前半スラー ・ 後半スタッカート" style={{ width: "100%", padding: "8px 10px" }} />
            {/* エチュードは調のパターンを作らない (2026-08-24 確定) ため適用先を出さない */}
            {ctx.category !== "etude" && (
              <div style={{ ...S.row, marginTop: 8 }}>
                <label><input type="radio" checked={applyAll} onChange={() => setApplyAll(true)} /> 全部の調に適用</label>
                <label><input type="radio" checked={!applyAll} onChange={() => setApplyAll(false)} /> この調だけ</label>
              </div>
            )}
            <div style={{ ...S.row, marginTop: 14 }}>
              <button type="button" disabled={busy || assigns.size === 0 || !name.trim()} onClick={submit}
                style={{ padding: "9px 20px", borderRadius: 999, fontWeight: 800, border: "none", cursor: "pointer",
                  background: assigns.size === 0 || !name.trim() ? "rgba(150,175,225,.2)" : "linear-gradient(180deg,#F0D48A,#D9A93C)",
                  color: assigns.size === 0 || !name.trim() ? "var(--text-sub)" : "#0B1220" }}>
                {busy ? "作成中…" : "この形で作成"}
              </button>
              {msg && <span style={{ fontSize: "var(--fs-caption)" }}>{msg}</span>}
            </div>
            <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-sub)", marginTop: 6 }}>
              付けた名前が、練習前の「パターンを選ぶ」に並びます。
            </p>
          </>
        )}
      </div>
    </div>
  )
}
