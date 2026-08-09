"use client"

// 宿題の提出 (2026-08-01 仕様変更)。提出ボタンを押すと、提出する演奏データを
// 一覧から選んで送れる。録音直後でなくても、過去の録音を選んで提出できる。
import { useState, useTransition } from "react"
import {
  submitAssignment,
  listSubmittablePerformances,
  type SubmittablePerformance,
} from "@/app/actions/teacherActions"

export default function AssignmentSubmit({
  assignmentId,
  goalType,
  targetScore,
  onDone,
}: {
  assignmentId: string
  goalType?: string | null
  targetScore?: number | null
  onDone?: () => void
}) {
  const [pending, start] = useTransition()
  const [picking, setPicking] = useState(false)
  const [items, setItems] = useState<SubmittablePerformance[] | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const openPicker = () => {
    setErr(null)
    start(async () => {
      const r = await listSubmittablePerformances(assignmentId)
      if (!r.ok) { setErr(r.error); return }
      if (r.items.length === 0) { setErr("まず、この曲/教材を通して録音してください"); return }
      setItems(r.items)
      setPicking(true)
    })
  }

  const doSubmit = (performanceId: string) => {
    setErr(null)
    start(async () => {
      const r = await submitAssignment(assignmentId, performanceId)
      if (!r.ok) { setErr(r.error); return }
      const passed =
        goalType === "score" && targetScore != null && r.score != null ? r.score >= targetScore : null
      setDone(
        `提出しました！${r.score != null ? `（${r.score}点）` : ""}` +
        (passed === true ? " 合格！" : passed === false ? " 合格ラインまであと少し" : ""),
      )
      setPicking(false)
      onDone?.()
    })
  }

  if (done) return <span style={{ fontSize: 12, fontWeight: 800, color: "#2e8b57" }}>{done}</span>

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {!picking ? (
        <button
          type="button"
          onClick={openPicker}
          disabled={pending}
          style={{ fontSize: 12.5, fontWeight: 800, color: "#fff", background: "#e0a02f", border: "none", borderRadius: 9, padding: "8px 16px", cursor: "pointer", alignSelf: "flex-start" }}
        >
          {pending ? "…" : "先生に提出する"}
        </button>
      ) : (
        <div style={{ border: "1px solid #e2e6ea", borderRadius: 10, padding: 10, background: "#fff" }}>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: "#6b7885", margin: "0 0 8px" }}>どの録音を提出する？</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 220, overflowY: "auto" }}>
            {items?.map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => doSubmit(it.id)}
                disabled={pending}
                style={{ display: "flex", alignItems: "center", gap: 8, textAlign: "left", border: "1px solid #eef1f4", borderRadius: 9, padding: "8px 10px", background: "#fff", cursor: "pointer", fontFamily: "inherit" }}
              >
                <span style={{ fontSize: 12.5, fontWeight: 800, color: "#2b3742" }}>{it.name}</span>
                <span style={{ marginLeft: "auto", fontSize: 11.5, color: "#6b7885", fontVariantNumeric: "tabular-nums" }}>
                  {it.score != null ? `${it.score}点` : "—"} ・ {it.date}
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPicking(false)}
            style={{ marginTop: 8, fontSize: 11.5, fontWeight: 700, color: "#6b7885", background: "none", border: "none", cursor: "pointer" }}
          >
            キャンセル
          </button>
        </div>
      )}
      {err && <span style={{ fontSize: 11, color: "#cc5470" }}>{err}</span>}
    </div>
  )
}
