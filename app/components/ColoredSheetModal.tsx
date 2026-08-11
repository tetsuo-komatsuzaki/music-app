"use client"

// 分析後の色つき譜面をモーダルで表示する (2026-08-11 Tetsuo指示・先生カルテ入力画面用)。
// scoreDetail の ScoreViewer と同じ仕組みの軽量版: OSMD で譜面を描き、
// comparison_result の note_index と vf-stavenote の 1:1 対応で音符を色分けする。
// 色の意味は生徒側と同一 (緑=正確 / 赤=音程ミス / 橙=リズム等 / 灰=判定外)。
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay"

type CompNote = {
  note_index?: number
  pitch_ok?: boolean | null
  start_ok?: boolean | null
  evaluation_status?: string
}

const COLOR_GREEN = "#22aa44"
const COLOR_ORANGE = "#ee8800"
const COLOR_RED = "#ee2222"
const COLOR_GREY = "#aaaaaa"

function colorFor(r: CompNote): string {
  const st = r.evaluation_status
  if (st === "spectral_inconclusive" || st === "not_evaluated" || st === "section_missing" || st === "not_detected") return COLOR_GREY
  if (st === "double_stop_partial" || st === "harmonic_normal_tone") return COLOR_ORANGE
  if (r.pitch_ok === false) return COLOR_RED
  if (st === "evaluated" && r.start_ok === false) return COLOR_ORANGE
  return COLOR_GREEN
}

function colorize(el: Element, color: string) {
  el.querySelectorAll("path").forEach((p) => {
    const f = p.getAttribute("fill")
    if (f && f !== "none") p.setAttribute("fill", color)
    const s = p.getAttribute("stroke")
    if (s && s !== "none") p.setAttribute("stroke", color)
  })
}

export default function ColoredSheetModal({
  open, onClose, buildUrl, comparisonUrl, title,
}: {
  open: boolean
  onClose: () => void
  /** MusicXML の署名URL */
  buildUrl: string | null
  /** comparison_result.json の署名URL (この演奏の採点) */
  comparisonUrl: string | null
  title: string
}) {
  const boxRef = useRef<HTMLDivElement | null>(null)
  const [state, setState] = useState<"loading" | "ready" | "error">("loading")

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setState("loading")
    const run = async () => {
      const container = boxRef.current
      if (!container || !buildUrl) { setState("error"); return }
      container.innerHTML = ""
      try {
        const comp = comparisonUrl
          ? await fetch(comparisonUrl).then((r) => r.json()).catch(() => null)
          : null
        const results: CompNote[] = Array.isArray(comp) ? comp : (comp?.results ?? [])
        if (cancelled) return
        const osmd = new OpenSheetMusicDisplay(container, {
          autoResize: false, backend: "svg", drawTitle: false, drawPartNames: false,
          pageFormat: "Endless", newPageFromXML: false, pageBackgroundColor: "#ffffff", followCursor: false,
        })
        await osmd.load(buildUrl)
        if (cancelled) return
        osmd.zoom = 0.62
        osmd.render()
        const elements = Array.from(container.querySelectorAll("g.vf-stavenote"))
        for (const r of results) {
          if (r.note_index == null) continue
          const el = elements[r.note_index]
          if (el) colorize(el, colorFor(r))
        }
        setState("ready")
      } catch {
        if (!cancelled) setState("error")
      }
    }
    run()
    return () => { cancelled = true }
  }, [open, buildUrl, comparisonUrl])

  if (!open || typeof document === "undefined") return null
  return createPortal(
    <div onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(15,25,50,.55)", zIndex: 1300, display: "flex", alignItems: "center", justifyContent: "center", padding: 10 }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 15, width: "min(860px, 96vw)", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: "1px solid #e6e9ef", flex: "none" }}>
          <b style={{ fontSize: "var(--fs-caption)", color: "var(--text-ink)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}の採点スコア</b>
          <span style={{ display: "flex", gap: 8, fontSize: "var(--fs-label)", color: "var(--text-muted)", flex: "none" }}>
            <Leg c={COLOR_GREEN} t="正確" /><Leg c={COLOR_RED} t="音程" /><Leg c={COLOR_ORANGE} t="リズム" /><Leg c={COLOR_GREY} t="判定外" />
          </span>
          <button type="button" onClick={onClose}
            style={{ marginLeft: "auto", flex: "none", fontSize: "var(--fs-label)", fontWeight: 900, color: "var(--text-muted)", background: "#f1f4f8", border: "none", borderRadius: 999, padding: "5px 13px", cursor: "pointer" }}>
            とじる ×
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px", minHeight: 200 }}>
          {state === "loading" && <div style={{ fontSize: "var(--fs-caption)", color: "var(--text-muted)", padding: 20, textAlign: "center" }}>譜面を読み込み中…</div>}
          {state === "error" && <div style={{ fontSize: "var(--fs-caption)", color: "#c0473a", padding: 20, textAlign: "center" }}>譜面を読み込めませんでした</div>}
          <div ref={boxRef} />
        </div>
      </div>
    </div>,
    document.body,
  )
}

function Leg({ c, t }: { c: string; t: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
      <span style={{ width: 9, height: 9, borderRadius: 2, background: c, display: "inline-block" }} />{t}
    </span>
  )
}
