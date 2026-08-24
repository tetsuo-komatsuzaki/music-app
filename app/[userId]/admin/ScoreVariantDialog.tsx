"use client"
// 曲の難易度・パート変種を作るダイアログ (2026-08-24 要件確定 ・ admin)。
// - 難易度: 初級/中級 (自動変換は下方向のみ。上級は手動アップロードのため出さない)
// - 変換ルール: 音価2倍 / 同音2分割 / 小節範囲限定 の3つだけ (テンポ表記は不変)
// - パート: グループの parts から選択 (選ぶと小節範囲が自動で入る)
// - 既存変種の一覧も表示 (同じ難易度×パートの重複はサーバ側でも拒否)
import { useEffect, useState } from "react"
import { createScoreVariant, type VariantRule } from "@/app/actions/createScoreVariant"
import { getScoreVariantContext, type ScoreVariantContext } from "@/app/actions/getScoreVariantContext"

const TIER_LABEL: Record<string, string> = { BEGINNER: "初級", INTERMEDIATE: "中級", ADVANCED: "上級" }
const STAR_RANGE: Record<string, [number, number]> = { BEGINNER: [1, 3], INTERMEDIATE: [4, 6], ADVANCED: [7, 10] }

export default function ScoreVariantDialog({ scoreId, onClose }: { scoreId: string; onClose: () => void }) {
  const [ctx, setCtx] = useState<ScoreVariantContext | null>(null)
  const [tier, setTier] = useState("BEGINNER")
  const [star, setStar] = useState(2)
  const [useDouble, setUseDouble] = useState(true)
  const [useSplit, setUseSplit] = useState(false)
  const [useRange, setUseRange] = useState(false)
  const [rangeFrom, setRangeFrom] = useState("")
  const [rangeTo, setRangeTo] = useState("")
  const [partId, setPartId] = useState("")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    getScoreVariantContext(scoreId).then(setCtx)
  }, [scoreId])

  const submit = async () => {
    setBusy(true)
    setMsg(null)
    const rules: VariantRule[] = []
    if (useRange && rangeFrom && rangeTo) {
      rules.push({ type: "measure_range", from: Number(rangeFrom), to: Number(rangeTo) })
    }
    if (useSplit) rules.push({ type: "split_repeat" })
    if (useDouble) rules.push({ type: "double_duration" })
    const r = await createScoreVariant({ sourceScoreId: scoreId, difficulty: tier, star, rules, partId: partId || null })
    setBusy(false)
    if (r.ok) {
      setMsg("変種を作成し、解析を開始しました。数分後に一覧へ反映されます。")
      const c = await getScoreVariantContext(scoreId)
      setCtx(c)
    } else {
      setMsg(r.error)
    }
  }

  const range = STAR_RANGE[tier]
  const stars = Array.from({ length: range[1] - range[0] + 1 }, (_, i) => range[0] + i)

  const box: React.CSSProperties = {
    position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(6,10,22,.62)",
  }
  const sheet: React.CSSProperties = {
    width: "min(480px, 92vw)", maxHeight: "84vh", overflowY: "auto",
    background: "var(--card-in, #101b38)", border: "1px solid rgba(150,175,225,.25)",
    borderRadius: 16, padding: "18px 20px 20px",
  }
  const label: React.CSSProperties = { fontSize: "var(--fs-caption)", color: "var(--text-sub)", margin: "14px 0 6px", fontWeight: 700 }

  return (
    <div style={box} onClick={onClose}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <b>難易度・パート変種を作る</b>
          <button type="button" onClick={onClose}>とじる</button>
        </div>

        {!ctx && <p style={{ marginTop: 12 }}>読み込み中…</p>}
        {ctx && !ctx.ok && <p style={{ marginTop: 12 }}>{ctx.error}</p>}
        {ctx && ctx.ok && (
          <>
            <p style={{ marginTop: 8, fontSize: "var(--fs-body)", color: "var(--text-sub)" }}>
              元: {ctx.source.title}
              {ctx.source.difficulty ? ` ・ ${TIER_LABEL[ctx.source.difficulty] ?? ctx.source.difficulty}` : ""}
              {ctx.source.star ? ` ・ ★${ctx.source.star}` : ""}
            </p>

            {ctx.variants.length > 0 && (
              <div style={{ margin: "10px 0 2px", padding: "8px 10px", borderRadius: 10, background: "rgba(150,175,225,.08)", fontSize: "var(--fs-caption)" }}>
                既存の変種: {ctx.variants.map((v) =>
                  `${TIER_LABEL[v.difficulty ?? ""] ?? "同難度"}${v.partId ? "・パート" : ""}${v.star ? `★${v.star}` : ""}(${v.buildStatus})`,
                ).join(" / ")}
              </div>
            )}

            <div style={label}>変種の難易度 (自動変換は下方向のみ ・ 上級は手動アップロード)</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["BEGINNER", "INTERMEDIATE"].map((t) => (
                <label key={t} style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                  <input type="radio" checked={tier === t} onChange={() => { setTier(t); setStar(STAR_RANGE[t][0] + 1) }} />
                  {TIER_LABEL[t]} (★{STAR_RANGE[t][0]}-{STAR_RANGE[t][1]})
                </label>
              ))}
            </div>

            <div style={label}>★</div>
            <select value={star} onChange={(e) => setStar(Number(e.target.value))}>
              {stars.map((n) => <option key={n} value={n}>★{n}</option>)}
            </select>

            <div style={label}>変換ルール (複数選択可 ・ テンポ表記はそのまま)</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label><input type="checkbox" checked={useDouble} onChange={(e) => setUseDouble(e.target.checked)} /> 音価を2倍にする (ゆっくり弾ける)</label>
              <label><input type="checkbox" checked={useSplit} onChange={(e) => setUseSplit(e.target.checked)} /> 1音を2分割して同じ音を繰り返す</label>
              <label>
                <input type="checkbox" checked={useRange} onChange={(e) => setUseRange(e.target.checked)} /> 使う小節を限定する
                {useRange && (
                  <span style={{ marginLeft: 8 }}>
                    <input type="number" min={1} value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} style={{ width: 56 }} /> 〜
                    <input type="number" min={1} value={rangeTo} onChange={(e) => setRangeTo(e.target.value)} style={{ width: 56, marginLeft: 4 }} /> 小節
                  </span>
                )}
              </label>
            </div>

            {ctx.parts.length > 0 && (
              <>
                <div style={label}>パート (選ぶと小節範囲が自動で入ります)</div>
                <select
                  value={partId}
                  onChange={(e) => {
                    const id = e.target.value
                    setPartId(id)
                    const p = ctx.parts.find((x) => x.id === id)
                    if (p) {
                      setUseRange(true)
                      setRangeFrom(String(p.startMeasure))
                      setRangeTo(String(p.endMeasure))
                    }
                  }}
                >
                  <option value="">通し (パートなし)</option>
                  {ctx.parts.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.startMeasure}〜{p.endMeasure}小節)</option>
                  ))}
                </select>
              </>
            )}

            <div style={{ marginTop: 18, display: "flex", gap: 10, alignItems: "center" }}>
              <button type="button" disabled={busy} onClick={submit}
                style={{ padding: "9px 18px", borderRadius: 10, fontWeight: 700, background: "#2b5bc4", color: "#fff", border: "none", cursor: "pointer" }}>
                {busy ? "作成中…" : "この内容で変種を作成"}
              </button>
              {msg && <span style={{ fontSize: "var(--fs-caption)" }}>{msg}</span>}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
