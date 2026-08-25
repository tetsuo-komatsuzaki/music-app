"use client"
// パートの追加・編集ダイアログ (2026-08-25 Tetsuo確定 ・ admin)。
// 「開始小節 / 終了小節 / パート名」を何個でも追加でき、付けた名前がそのまま
// 練習前シートの「パートを選ぶ」の選択肢として並ぶ。曲・エチュード共通。
import { useEffect, useState } from "react"
import { getPartsContext, updateMaterialParts, type PartInput } from "@/app/actions/updateMaterialParts"

type Ctx = Awaited<ReturnType<typeof getPartsContext>>

export default function PartsDialog({
  itemId, kind, onClose,
}: { itemId: string; kind: "practice" | "score"; onClose: () => void }) {
  const [ctx, setCtx] = useState<Ctx | null>(null)
  const [rows, setRows] = useState<PartInput[]>([])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    getPartsContext(itemId, kind).then((c) => {
      setCtx(c)
      if (c.ok) setRows(c.parts.map((p) => ({ id: p.id, name: p.name, startMeasure: p.startMeasure, endMeasure: p.endMeasure })))
    })
  }, [itemId, kind])

  const add = () => setRows([...rows, { name: "", startMeasure: 1, endMeasure: 1 }])
  const patch = (i: number, v: Partial<PartInput>) => setRows(rows.map((r, k) => (k === i ? { ...r, ...v } : r)))
  const del = (i: number) => setRows(rows.filter((_, k) => k !== i))

  const save = async () => {
    setBusy(true); setMsg(null)
    const r = await updateMaterialParts({ itemId, kind, parts: rows })
    setBusy(false)
    setMsg(r.ok ? `${r.count}件のパートを保存しました。練習前シートの選択肢に並びます。` : r.error)
  }

  const S = {
    box: { position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(6,10,22,.62)" } as React.CSSProperties,
    sheet: { width: "min(520px, 94vw)", maxHeight: "86vh", overflowY: "auto", background: "var(--card-in)", border: "1px solid rgba(150,175,225,.25)", borderRadius: 16, padding: "18px 20px 20px" } as React.CSSProperties,
    row: { display: "flex", gap: 7, alignItems: "center", marginTop: 8, flexWrap: "wrap" } as React.CSSProperties,
    num: { width: 66, padding: "6px 8px" } as React.CSSProperties,
  }

  return (
    <div style={S.box} onClick={onClose}>
      <div style={S.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <b>パートを設定する</b>
          <button type="button" onClick={onClose}>とじる</button>
        </div>

        {!ctx && <p style={{ marginTop: 12 }}>読み込み中…</p>}
        {ctx && !ctx.ok && <p style={{ marginTop: 12 }}>{ctx.error}</p>}
        {ctx && ctx.ok && (
          <>
            <p style={{ marginTop: 8, fontSize: "var(--fs-caption)", color: "var(--text-sub)" }}>
              {ctx.title}{ctx.measureCount > 0 ? ` ・ 全${ctx.measureCount}小節` : ""}
            </p>
            <p style={{ fontSize: "var(--fs-caption)", color: "var(--text-sub)", marginTop: 4 }}>
              付けた名前が、そのまま練習前の「パートを選ぶ」に並びます。
            </p>

            {rows.map((r, i) => (
              <div key={i} style={S.row}>
                <input
                  type="text" value={r.name} placeholder="パート名 (例: 前半)"
                  onChange={(e) => patch(i, { name: e.target.value })}
                  style={{ flex: "1 1 140px", minWidth: 0, padding: "6px 9px" }}
                />
                <input type="number" min={1} max={ctx.measureCount || undefined} value={r.startMeasure}
                  onChange={(e) => patch(i, { startMeasure: Number(e.target.value) || 1 })} style={S.num} />
                <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-sub)" }}>〜</span>
                <input type="number" min={1} max={ctx.measureCount || undefined} value={r.endMeasure}
                  onChange={(e) => patch(i, { endMeasure: Number(e.target.value) || 1 })} style={S.num} />
                <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-sub)" }}>小節</span>
                <button type="button" onClick={() => del(i)}
                  style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid rgba(196,68,68,.4)", background: "rgba(196,68,68,.14)", color: "#E7B7B7", cursor: "pointer", fontSize: "var(--fs-caption)" }}>
                  削除
                </button>
              </div>
            ))}

            <div style={{ ...S.row, marginTop: 12 }}>
              <button type="button" onClick={add}
                style={{ padding: "7px 14px", borderRadius: 9, border: "1px solid rgba(150,175,225,.3)", background: "rgba(150,175,225,.1)", color: "var(--text-body)", cursor: "pointer", fontWeight: 700, fontSize: "var(--fs-caption)" }}>
                ＋ パートを追加
              </button>
              <button type="button" disabled={busy} onClick={save}
                style={{ padding: "8px 20px", borderRadius: 999, fontWeight: 800, border: "none", cursor: "pointer", background: "#2b5bc4", color: "#fff" }}>
                {busy ? "保存中…" : "保存する"}
              </button>
              {msg && <span style={{ fontSize: "var(--fs-caption)" }}>{msg}</span>}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
