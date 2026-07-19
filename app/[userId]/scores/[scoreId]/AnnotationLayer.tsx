"use client"

// 譜面注釈レイヤー (Phase 1, 2026-07-19)
// 音符アンカー(note_index)でハイライト/テキスト/注意メモを保持し、#osmd-container 上に
// 命令的オーバーレイ(cursor/区間帯と同方式)で描画。OSMD再レイアウト/zoom/スクロールに追従。
// 記譜スタンプ①(MusicXML互換)は Phase 2。

import { useCallback, useEffect, useRef, useState } from "react"
import {
  getScoreAnnotation,
  saveScoreAnnotation,
  type AnnotationData,
} from "@/app/actions/scoreAnnotations"
import styles from "./AnnotationLayer.module.css"

type Tool = null | "highlight" | "text" | "flat" | "sharp" | "tempo" | "hard" | "erase"

const WARN_PRESETS: Record<string, { label: string; icon: string; cls: string }> = {
  flat: { label: "低い", icon: "♭", cls: "wFlat" },
  sharp: { label: "高い", icon: "♯", cls: "wSharp" },
  tempo: { label: "テンポ", icon: "♩", cls: "wTempo" },
  hard: { label: "難所", icon: "!", cls: "wHard" },
}

// ハイライト色 (乗算合成前提の半透明)。用途で色分けできる本格ハイライター。
const HL_COLORS = [
  "rgba(255,213,74,.46)",  // yellow
  "rgba(120,214,130,.44)", // green
  "rgba(120,182,255,.42)", // blue
  "rgba(255,150,190,.42)", // pink
]

type Props = {
  containerId: string
  noteElementsRef: React.MutableRefObject<Element[]>
  noteElementsVersion: number
  scoreId?: string
  practiceItemId?: string
}

export default function AnnotationLayer({
  containerId,
  noteElementsRef,
  noteElementsVersion,
  scoreId,
  practiceItemId,
}: Props) {
  const [active, setActive] = useState(false)
  const [tool, setTool] = useState<Tool>(null)
  const [data, setData] = useState<AnnotationData>({})
  const dataRef = useRef<AnnotationData>({})
  dataRef.current = data
  const activeRef = useRef(false)
  activeRef.current = active
  const toolRef = useRef<Tool>(null)
  toolRef.current = tool
  const hlStartRef = useRef<number | null>(null)
  const [hlStart, setHlStart] = useState<number | null>(null)
  hlStartRef.current = hlStart
  const [hlColor, setHlColor] = useState<string>(HL_COLORS[0])
  const hlColorRef = useRef<string>(HL_COLORS[0])
  hlColorRef.current = hlColor

  const overlayNodesRef = useRef<HTMLElement[]>([])
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ---- 読み込み ----
  useEffect(() => {
    let cancelled = false
    getScoreAnnotation({ scoreId, practiceItemId }).then((r) => {
      if (!cancelled && r.ok) setData(r.data ?? {})
    })
    return () => { cancelled = true }
  }, [scoreId, practiceItemId])

  // ---- 保存 (デバウンス) ----
  const commit = useCallback((next: AnnotationData) => {
    setData(next)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveScoreAnnotation({ scoreId, practiceItemId, data: next })
    }, 700)
  }, [scoreId, practiceItemId])

  // アンマウント時にオーバーレイ節点を除去 (leak防止)
  useEffect(() => () => {
    overlayNodesRef.current.forEach((n) => n.remove())
    overlayNodesRef.current = []
  }, [])

  // ---- クリック座標 → 最近傍ノート index ----
  const nearestNote = useCallback((clientX: number, clientY: number): number | null => {
    const els = noteElementsRef.current
    let best = -1, bd = Infinity
    for (let i = 0; i < els.length; i++) {
      const r = els[i].getBoundingClientRect()
      const d = Math.hypot(clientX - (r.left + r.width / 2), clientY - (r.top + r.height / 2))
      if (d < bd) { bd = d; best = i }
    }
    return best >= 0 && bd <= 60 ? best : null
  }, [noteElementsRef])

  // ---- オーバーレイ描画 (ハイライト帯 + テキスト/注意バッジ) ----
  const renderOverlay = useCallback(() => {
    const container = document.getElementById(containerId)
    if (!container) return
    overlayNodesRef.current.forEach((n) => n.remove())
    overlayNodesRef.current = []
    container.style.position = "relative"
    const cRect = container.getBoundingClientRect()
    const scrollTop = container.scrollTop
    const els = noteElementsRef.current
    const d = dataRef.current

    // ハイライト帯 (行またぎ対応: x が左に戻ったら次行)
    for (const h of d.highlight ?? []) {
      const lo = Math.min(h.fromNote, h.toNote), hi = Math.max(h.fromNote, h.toNote)
      let cur: { l: number; r: number; t: number; b: number } | null = null
      let prevCx = -Infinity
      const bands: Array<{ l: number; r: number; t: number; b: number }> = []
      for (let i = lo; i <= hi; i++) {
        const el = els[i]
        if (!el || !container.contains(el)) continue
        const r = el.getBoundingClientRect()
        const l = r.left - cRect.left, rr = r.right - cRect.left
        const t = r.top - cRect.top + scrollTop, b = r.bottom - cRect.top + scrollTop
        const cx = (l + rr) / 2
        if (!cur || cx < prevCx - 4) { cur = { l, r: rr, t, b }; bands.push(cur) }
        else { cur.l = Math.min(cur.l, l); cur.r = Math.max(cur.r, rr); cur.t = Math.min(cur.t, t); cur.b = Math.max(cur.b, b) }
        prevCx = cx
      }
      for (const g of bands) {
        const node = document.createElement("div")
        node.className = styles.hlBand
        node.style.background = h.color || HL_COLORS[0]
        node.style.left = `${g.l - 5}px`
        node.style.top = `${g.t - 12}px`
        node.style.width = `${g.r - g.l + 10}px`
        node.style.height = `${g.b - g.t + 24}px`
        container.appendChild(node)
        overlayNodesRef.current.push(node)
      }
    }

    // テキスト/注意 バッジ (音符の上)
    const placeBadge = (noteIndex: number, dy: number, inner: string, cls: string) => {
      const el = els[noteIndex]
      if (!el || !container.contains(el)) return
      const r = el.getBoundingClientRect()
      const node = document.createElement("div")
      node.className = `${styles.badge} ${cls}`
      node.style.left = `${r.left + r.width / 2 - cRect.left}px`
      node.style.top = `${r.top - cRect.top + scrollTop + (dy || 0) - 22}px`
      node.innerHTML = inner
      container.appendChild(node)
      overlayNodesRef.current.push(node)
    }
    for (const w of d.warnings ?? []) {
      if (w.kind === "text") {
        placeBadge(w.noteIndex, w.dy ?? 0, escapeHtml(w.text ?? ""), styles.badgeText)
      } else {
        const p = WARN_PRESETS[w.kind]
        if (p) placeBadge(w.noteIndex, w.dy ?? 0, `<span class="${styles.g}">${p.icon}</span>${p.label}`, styles[p.cls] ?? "")
      }
    }
  }, [containerId, noteElementsRef])

  // 描画 + スクロール/リサイズ/再レイアウト追従
  useEffect(() => {
    renderOverlay()
    const container = document.getElementById(containerId)
    if (!container) return
    let raf: number | null = null
    const schedule = () => {
      if (raf !== null) return
      raf = requestAnimationFrame(() => { raf = null; renderOverlay() })
    }
    container.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    return () => {
      if (raf !== null) cancelAnimationFrame(raf)
      container.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
    }
  }, [renderOverlay, noteElementsVersion, data])

  // ---- 注釈モード中のクリック捕捉 (capture phase で scoreDetail の再生ジャンプを抑止) ----
  useEffect(() => {
    if (!active) return
    const container = document.getElementById(containerId)
    if (!container) return
    const onClick = (e: MouseEvent) => {
      const t = toolRef.current
      if (!t) return
      const idx = nearestNote(e.clientX, e.clientY)
      if (idx === null) return
      e.preventDefault()
      e.stopPropagation()
      const d = dataRef.current
      if (t === "highlight") {
        const start = hlStartRef.current
        if (start === null) { setHlStart(idx) }
        else {
          const lo = Math.min(start, idx), hi = Math.max(start, idx)
          commit({ ...d, highlight: [...(d.highlight ?? []), { fromNote: lo, toNote: hi, color: hlColorRef.current }] })
          setHlStart(null)
        }
      } else if (t === "erase") {
        // このノートに関わる注釈を削除
        commit({
          ...d,
          highlight: (d.highlight ?? []).filter((h) => idx < Math.min(h.fromNote, h.toNote) || idx > Math.max(h.fromNote, h.toNote)),
          warnings: (d.warnings ?? []).filter((w) => w.noteIndex !== idx),
        })
      } else if (t === "text") {
        const text = window.prompt("メモを入力")
        if (text && text.trim()) {
          commit({ ...d, warnings: [...(d.warnings ?? []), { noteIndex: idx, kind: "text", text: text.trim().slice(0, 40) }] })
        }
      } else if (WARN_PRESETS[t]) {
        commit({ ...d, warnings: [...(d.warnings ?? []), { noteIndex: idx, kind: t }] })
      }
    }
    container.addEventListener("click", onClick, true)
    return () => container.removeEventListener("click", onClick, true)
  }, [active, containerId, nearestNote, commit])

  const clearAll = () => {
    if (window.confirm("この譜面の注釈をすべて消去しますか？")) commit({})
  }

  const toolBtn = (t: Tool, glyph: string, label: string) => (
    <button
      type="button"
      className={`${styles.toolBtn} ${tool === t ? styles.toolOn : ""}`}
      onClick={() => { setTool(tool === t ? null : t); setHlStart(null) }}
    >
      {glyph && <span className={styles.g}>{glyph}</span>}
      {label}
    </button>
  )

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <button
          type="button"
          className={`${styles.modeBtn} ${active ? styles.modeOn : ""}`}
          onClick={() => { setActive((v) => !v); setTool(null); setHlStart(null) }}
          aria-pressed={active}
        >
          <span className={styles.g}>✎</span> 譜面に書き込む
        </button>
      </div>
      {active && (
        <div className={styles.tools}>
          {toolBtn("highlight", "▬", "ハイライト")}
          {toolBtn("text", "✎", "メモ")}
          {toolBtn("flat", "♭", "低い")}
          {toolBtn("sharp", "♯", "高い")}
          {toolBtn("tempo", "♩", "テンポ")}
          {toolBtn("hard", "!", "難所")}
          {toolBtn("erase", "✕", "消す")}
          <button type="button" className={styles.clearBtn} onClick={clearAll}>全消去</button>
        </div>
      )}
      {active && tool === "highlight" && (
        <>
          <div className={styles.swatches}>
            {HL_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`${styles.swatch} ${hlColor === c ? styles.swatchOn : ""}`}
                style={{ background: c.replace(/,[.\d]+\)$/, ",1)") }}
                onClick={() => setHlColor(c)}
                aria-label="ハイライト色"
              />
            ))}
          </div>
          <p className={styles.hint}>
            {hlStart === null ? "開始の音符をタップ → 終了の音符をタップ" : "終了の音符をタップ"}
          </p>
        </>
      )}
      {active && tool && tool !== "highlight" && tool !== "erase" && (
        <p className={styles.hint}>音符をタップして配置</p>
      )}
      {active && tool === "erase" && (
        <p className={styles.hint}>消したい注釈の音符をタップ</p>
      )}
    </div>
  )
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string
  ))
}
