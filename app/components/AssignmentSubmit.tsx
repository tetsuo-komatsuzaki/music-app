"use client"

// 宿題の提出 (2026-08-11): 「先生に提出する」→ モーダルで演奏履歴を縦スクロール選択。
// 各候補は点数＋音程/リズムの内訳(案4)。過去の録音も選んで提出できる。
import { useState, useTransition } from "react"
import { createPortal } from "react-dom"
import { Check, Star } from "lucide-react"
import {
  submitAssignment,
  listSubmittablePerformances,
  type SubmittablePerformance,
} from "@/app/actions/teacherActions"

const scoreColor = (s: number | null) =>
  s == null ? "var(--text-muted)" : s >= 90 ? "#c0891f" : s >= 75 ? "#1f3d78" : "var(--text-sub)"

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
      if (r.items.length === 0) { setErr("まず、この曲/教材を通して演奏してください"); return }
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

  if (done) return <span style={{ fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-good)" }}>{done}</span>

  const bestScore = items && items.length ? Math.max(...items.map((i) => i.score ?? -1)) : -1

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <button
        type="button"
        className="pressable"
        onClick={openPicker}
        disabled={pending}
        style={{ fontSize: "var(--fs-body)", fontWeight: 800, color: "var(--text-on-accent)", background: "#e0a02f", border: "none", borderRadius: 9, padding: "9px 16px", cursor: "pointer", alignSelf: "flex-start" }}
      >
        {pending && !picking ? "…" : "先生に提出する"}
      </button>
      {err && <span style={{ fontSize: "var(--fs-caption)", color: "var(--text-error)" }}>{err}</span>}

      {picking && items && createPortal(
        <div
          onClick={() => setPicking(false)}
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(20,20,30,.45)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "min(100%,480px)", background: "#fff", borderRadius: "18px 18px 0 0", padding: "14px 14px calc(14px + env(safe-area-inset-bottom))", boxShadow: "0 -6px 30px rgba(20,20,40,.25)", maxHeight: "80vh", display: "flex", flexDirection: "column" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flex: "none" }}>
              <span style={{ fontSize: "var(--fs-subhead)", fontWeight: 900, color: "var(--text-ink)" }}>どの演奏を提出する？</span>
              <button type="button" onClick={() => setPicking(false)} aria-label="閉じる"
                style={{ border: "none", background: "none", fontSize: "var(--fs-subhead)", color: "var(--text-sub)", cursor: "pointer" }}>✕</button>
            </div>

            {/* 縦スクロールの選択リスト (案4: 点数＋音程/リズム内訳) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, overflowY: "auto", padding: "2px 2px 4px" }}>
              {items.map((it) => {
                const isBest = it.score != null && it.score === bestScore
                return (
                  <button
                    key={it.id}
                    type="button"
                    className="pressable"
                    onClick={() => doSubmit(it.id)}
                    disabled={pending}
                    style={{
                      textAlign: "left", border: `1px solid ${isBest ? "#ecd8a4" : "#eef1f4"}`, borderRadius: 12, padding: "11px 13px",
                      background: isBest ? "linear-gradient(155deg,#fffdf4,#fdf2d2)" : "#fff", cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: "var(--fs-title)", fontWeight: 900, lineHeight: 1, color: scoreColor(it.score), fontVariantNumeric: "tabular-nums" }}>{it.score ?? "—"}</span>
                      <span style={{ fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-muted)" }}>点</span>
                      {isBest && <span style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: "var(--fs-label)", fontWeight: 900, color: "#c0891f" }}><Star size={11} fill="currentColor" stroke="none" /> 自己ベスト</span>}
                      <span style={{ marginLeft: "auto", fontSize: "var(--fs-caption)", color: "var(--text-muted)", fontWeight: 700 }}>{it.name} ・ {it.date}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
                      <MiniBar label="音程" value={it.pitch} color="#2b5bc4" />
                      <MiniBar label="リズム" value={it.timing} color="#e6a94a" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}

function MiniBar({ label, value, color }: { label: string; value: number | null; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "var(--fs-label)", fontWeight: 800, color: "var(--text-sub)" }}>
      <span style={{ width: 30, flex: "none" }}>{label}</span>
      <span style={{ flex: 1, height: 6, borderRadius: 4, background: "#eef1f5", overflow: "hidden" }}>
        <span style={{ display: "block", height: "100%", width: `${value ?? 0}%`, background: color, borderRadius: 4 }} />
      </span>
      <b style={{ width: 26, textAlign: "right", color: "var(--text-ink)", fontVariantNumeric: "tabular-nums" }}>{value ?? "—"}</b>
    </div>
  )
}
