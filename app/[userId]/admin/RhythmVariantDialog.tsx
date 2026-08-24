"use client"
// リズムパターン変種の作成ダイアログ (2026-08-24 要件確定 ・ admin)。
// ①くり返し単位 → ②元の音符に番号 → ③長さ+高さ+弾き方で1音ずつ足す → ④五線譜で確認して作成。
// 拍の合計が単位の長さと一致するまで作成できない (サーバ側でも再検証)。
import { useEffect, useMemo, useState } from "react"
import { createRhythmVariant, getRhythmContext } from "@/app/actions/createRhythmVariant"
import { noteQl, type RhythmNote } from "@/app/_libs/rhythmRecipe"
import StaffPreview from "./StaffPreview"

const BASE = [
  { id: "w", label: "𝅝", sub: "全" }, { id: "h", label: "𝅗𝅥", sub: "2分" },
  { id: "q", label: "♩", sub: "4分" }, { id: "e", label: "♪", sub: "8分" },
  { id: "s", label: "♬", sub: "16分" }, { id: "t", label: "𝅘𝅥𝅰", sub: "32分" },
]
const ARTS = [
  { id: "", label: "なし" }, { id: "legato", label: "レガート" }, { id: "staccato", label: "スタッカート" },
  { id: "spiccato", label: "スピッカート" }, { id: "martele", label: "マルテレ" },
  { id: "portato", label: "ポルタート" }, { id: "tenuto", label: "テヌート" },
  { id: "accent", label: "アクセント" }, { id: "tremolo", label: "トレモロ" },
]
type Ctx = Awaited<ReturnType<typeof getRhythmContext>>

export default function RhythmVariantDialog({ itemId, onClose }: { itemId: string; onClose: () => void }) {
  const [ctx, setCtx] = useState<Ctx | null>(null)
  const [unit, setUnit] = useState(1)
  const [pick, setPick] = useState<{ base: string | null; pitchNo: number | null; art: string }>({ base: null, pitchNo: null, art: "" })
  const [dot, setDot] = useState(false)
  const [tri, setTri] = useState(false)
  const [notes, setNotes] = useState<RhythmNote[]>([])
  const [editing, setEditing] = useState<number | null>(null)
  const [slurMode, setSlurMode] = useState(false)
  const [slurStart, setSlurStart] = useState<number | null>(null)
  const [slurSeq, setSlurSeq] = useState(1)
  const [name, setName] = useState("")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => { getRhythmContext(itemId).then(setCtx) }, [itemId])

  const beatsNeeded = ctx?.ok ? ctx.beatsPerMeasure * unit : 4 * unit
  const srcNames = useMemo(() => {
    if (!ctx?.ok) return []
    const one = ctx.srcNames.length ? ctx.srcNames : []
    const perUnit = (ctx.notesPerMeasure.slice(0, unit).reduce((a, b) => a + b, 0)) || one.length
    return Array.from({ length: perUnit }, (_, i) => one[i % Math.max(1, one.length)] ?? `${i + 1}`)
  }, [ctx, unit])

  const total = notes.reduce((a, n) => a + (noteQl(n) ?? 0), 0)
  const r3 = (x: number) => Math.round(x * 1000) / 1000
  const fit = Math.abs(total - beatsNeeded) < 1e-6 && notes.length > 0

  const add = () => {
    if (!pick.base || !pick.pitchNo) return
    const n: RhythmNote = { base: pick.base, dot, triplet: tri, pitchNo: pick.pitchNo, articulation: pick.art, slurId: editing !== null ? notes[editing].slurId ?? null : null }
    if (editing === null) setNotes([...notes, n])
    else { const c = [...notes]; c[editing] = n; setNotes(c); setEditing(null) }
  }
  const tapNote = (i: number) => {
    if (slurMode) {
      if (slurStart === null) setSlurStart(i)
      else {
        const [a, b] = [Math.min(slurStart, i), Math.max(slurStart, i)]
        setNotes(notes.map((n, k) => (k >= a && k <= b ? { ...n, slurId: slurSeq } : n)))
        setSlurSeq(slurSeq + 1); setSlurStart(null)
      }
      return
    }
    if (editing === i) { setEditing(null); return }
    setEditing(i)
    const n = notes[i]
    setPick({ base: n.base, pitchNo: n.pitchNo, art: n.articulation ?? "" })
    setDot(!!n.dot); setTri(!!n.triplet)
  }
  const submit = async () => {
    setBusy(true); setMsg(null)
    const r = await createRhythmVariant({ sourceItemId: itemId, name, unitMeasures: unit, notes })
    setBusy(false)
    if (r.ok) { setMsg("変種を作成し、解析を開始しました。続けて別のパターンも作れます。"); setNotes([]); setName(""); setEditing(null) }
    else setMsg(r.error)
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
          <b>リズムパターンを変える</b>
          <button type="button" onClick={onClose}>とじる</button>
        </div>

        {!ctx && <p style={{ marginTop: 12 }}>読み込み中…</p>}
        {ctx && !ctx.ok && <p style={{ marginTop: 12 }}>{ctx.error}</p>}
        {ctx && ctx.ok && (
          <>
            <p style={{ marginTop: 8, fontSize: "var(--fs-caption)", color: "var(--text-sub)" }}>
              {ctx.title} ・ 全{ctx.measureCount}小節 ・ 1小節{ctx.beatsPerMeasure}拍
            </p>

            <div style={S.label}>① くり返しの単位</div>
            <div style={S.row}>
              {ctx.unitCandidates.map((u) => (
                <button key={u} type="button" style={btn(unit === u)} onClick={() => { setUnit(u); setNotes([]); setEditing(null) }}>
                  {u}小節 <span style={{ color: "var(--text-sub)", fontWeight: 500 }}>同じ形 {ctx.sameCountByUnit[u] ?? 0}か所</span>
                </button>
              ))}
              <input type="number" min={1} max={32} value={unit} onChange={(e) => { setUnit(Math.max(1, Math.min(32, Number(e.target.value) || 1))); setNotes([]) }} style={{ width: 62 }} />
              <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-sub)" }}>小節</span>
            </div>

            <div style={S.label}>② 元の音符 (高さの番号)</div>
            <div style={S.row}>
              {srcNames.map((nm, i) => (
                <span key={i} style={{ ...btn(false), cursor: "default" }}>{i + 1} {nm}</span>
              ))}
            </div>

            <div style={S.label}>③ 音符を1つずつ足す</div>
            <div style={{ background: "rgba(11,18,32,.5)", border: "1px solid rgba(150,175,225,.2)", borderRadius: 12, padding: "11px 12px" }}>
              <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-sub)", fontWeight: 700, marginBottom: 5 }}>長さ</div>
              <div style={S.row}>
                {BASE.map((d) => <button key={d.id} type="button" style={btn(pick.base === d.id)} onClick={() => setPick({ ...pick, base: d.id })}><b style={{ fontSize: 15, marginRight: 4 }}>{d.label}</b>{d.sub}</button>)}
              </div>
              <div style={{ ...S.row, marginTop: 6 }}>
                <button type="button" style={btn(dot)} onClick={() => setDot(!dot)}>付点 ・ 1.5倍</button>
                <button type="button" style={btn(tri)} onClick={() => setTri(!tri)}>3連 ・ ⅔倍</button>
              </div>
              <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-sub)", fontWeight: 700, margin: "10px 0 5px" }}>高さ ・ 元の何番目の音か</div>
              <div style={S.row}>
                {srcNames.map((nm, i) => <button key={i} type="button" style={btn(pick.pitchNo === i + 1)} onClick={() => setPick({ ...pick, pitchNo: i + 1 })}>{i + 1} {nm}</button>)}
              </div>
              <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-sub)", fontWeight: 700, margin: "10px 0 5px" }}>弾き方 ・ 任意</div>
              <div style={S.row}>
                {ARTS.map((a) => <button key={a.id} type="button" style={btn(pick.art === a.id)} onClick={() => setPick({ ...pick, art: a.id })}>{a.label}</button>)}
              </div>
              <div style={{ ...S.row, marginTop: 12 }}>
                <button type="button" disabled={!pick.base || !pick.pitchNo} onClick={add}
                  style={{ padding: "8px 18px", borderRadius: 999, fontWeight: 800, border: "none", cursor: "pointer",
                    background: !pick.base || !pick.pitchNo ? "rgba(150,175,225,.2)" : "#2b5bc4", color: !pick.base || !pick.pitchNo ? "var(--text-sub)" : "#fff" }}>
                  {editing === null ? "この音を足す" : "この音を直す"}
                </button>
              </div>
            </div>

            <div style={{ height: 10, borderRadius: 999, background: "rgba(150,175,225,.12)", overflow: "hidden", marginTop: 12 }}>
              <div style={{ height: "100%", width: `${Math.min(100, (total / beatsNeeded) * 100)}%`, background: total > beatsNeeded ? "#c24444" : "linear-gradient(90deg,#E8CA84,#D9A93C)" }} />
            </div>
            <div style={{ fontSize: "var(--fs-caption)", fontWeight: 700, marginTop: 5, color: fit ? "#8FD3B0" : total > beatsNeeded ? "#E79999" : "var(--text-sub)" }}>
              {fit ? `${beatsNeeded}拍ぴったり ・ 作成できます` : total > beatsNeeded ? `${beatsNeeded}拍を ${r3(total - beatsNeeded)}拍 こえています` : `${beatsNeeded}拍のうち ${r3(total)}拍 ・ あと ${r3(beatsNeeded - total)}拍`}
            </div>

            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", minHeight: 70, background: "rgba(11,18,32,.5)", border: "1px dashed rgba(150,175,225,.25)", borderRadius: 12, padding: 9, marginTop: 10 }}>
              {notes.length === 0 && <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-sub)", padding: 12 }}>上で音符を足すと、ここに並びます</span>}
              {notes.map((n, i) => (
                <div key={i} onClick={() => tapNote(i)}
                  style={{ position: "relative", width: 64, borderRadius: 10, padding: "6px 0 5px", textAlign: "center", cursor: "pointer",
                    background: "linear-gradient(160deg,#17264A,#101B38)",
                    border: editing === i ? "1px solid #d9a93c" : "1px solid rgba(217,169,60,.3)",
                    borderTop: n.slurId ? "3px solid #7FA4E8" : undefined }}>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setNotes(notes.filter((_, k) => k !== i)); setEditing(null) }}
                    style={{ position: "absolute", top: -7, right: -7, width: 19, height: 19, borderRadius: "50%", background: "#2A3550", color: "#E7B7B7", border: "1px solid rgba(196,68,68,.5)", fontSize: 11, cursor: "pointer" }}>×</button>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#FFE9B8" }}>{(n.triplet ? "3" : "") + (BASE.find((b) => b.id === n.base)?.label ?? "") + (n.dot ? "." : "")}</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#D9A93C" }}>{n.pitchNo}: {srcNames[n.pitchNo - 1] ?? ""}</div>
                  <div style={{ fontSize: 10, color: "#9DB8E8" }}>{ARTS.find((a) => a.id === (n.articulation ?? ""))?.label}</div>
                </div>
              ))}
            </div>
            <div style={{ ...S.row, marginTop: 8 }}>
              <button type="button" style={btn(slurMode)} onClick={() => { setSlurMode(!slurMode); setSlurStart(null) }}>スラー選択モード</button>
              <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-sub)" }}>
                {slurMode ? (slurStart === null ? "つなぎたい最初の音符をタップ" : `${slurStart + 1}番目から ・ 最後の音符をタップ`) : "音符をタップすると選び直せます"}
              </span>
            </div>

            <div style={S.label}>④ 五線譜で確認</div>
            <StaffPreview notes={notes.map((n) => ({ ql: noteQl(n) ?? 0, name: srcNames[n.pitchNo - 1] ?? "", art: n.articulation ?? "", slurId: n.slurId ?? null, dot: !!n.dot, triplet: !!n.triplet }))} beats={beatsNeeded} />

            <div style={{ ...S.row, marginTop: 14 }}>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="例: 16分8つ→8分4つ" style={{ flex: "1 1 220px", minWidth: 0, padding: "8px 10px" }} />
              <button type="button" disabled={busy || !fit || !name.trim()} onClick={submit}
                style={{ padding: "9px 20px", borderRadius: 999, fontWeight: 800, border: "none", cursor: "pointer",
                  background: !fit || !name.trim() ? "rgba(150,175,225,.2)" : "linear-gradient(180deg,#F0D48A,#D9A93C)", color: !fit || !name.trim() ? "var(--text-sub)" : "#0B1220" }}>
                {busy ? "作成中…" : "この形で作成"}
              </button>
            </div>
            {msg && <p style={{ fontSize: "var(--fs-caption)", marginTop: 8 }}>{msg}</p>}
            <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-sub)", marginTop: 6 }}>
              作成すると、通常のアップロードと同じ形式の楽譜データを生成します。
            </p>
          </>
        )}
      </div>
    </div>
  )
}
