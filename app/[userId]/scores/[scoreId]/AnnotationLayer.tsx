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

// 記譜スタンプ (Phase 2, MusicXML互換)。kind は music21/MusicXML の要素名に対応 → 将来round-trip可。
// 表示は自前SVG/テキストグリフ (OSMD描画検証済セット)。value は運指/弦/強弱の値。
type StampDef = { kind: string; value?: string; g: string; label: string }
const STAMP_GROUPS: { group: string; items: StampDef[] }[] = [
  { group: "弓", items: [
    { kind: "down-bow", g: "downbow", label: "ダウン弓" },
    { kind: "up-bow", g: "upbow", label: "アップ弓" },
  ] },
  { group: "奏法", items: [
    { kind: "staccato", g: "staccato", label: "スタッカート" },
    { kind: "staccatissimo", g: "staccatissimo", label: "スタッカーティシモ" },
    { kind: "accent", g: "accent", label: "アクセント" },
    { kind: "strong-accent", g: "marcato", label: "マルカート" },
    { kind: "tenuto", g: "tenuto", label: "テヌート" },
    { kind: "breath-mark", g: "breath", label: "ブレス" },
  ] },
  { group: "装飾", items: [
    { kind: "trill-mark", g: "trill", label: "トリル" },
    { kind: "fermata", g: "fermata", label: "フェルマータ" },
    { kind: "tremolo", g: "tremolo", label: "トレモロ" },
  ] },
  { group: "左手", items: [
    { kind: "stopped", g: "plus", label: "左手pizz" },
    { kind: "open-string", g: "circle", label: "開放弦" },
    { kind: "harmonic", g: "diamond", label: "ハーモニクス" },
  ] },
  { group: "強弱", items: ["pp", "p", "mp", "mf", "f", "ff"].map((v) => (
    { kind: "dynamic", value: v, g: "dyn", label: v }
  )) },
  { group: "運指", items: ["0", "1", "2", "3", "4"].map((v) => (
    { kind: "fingering", value: v, g: "num", label: v }
  )) },
  { group: "弦", items: ["I", "II", "III", "IV"].map((v) => (
    { kind: "string", value: v, g: "roman", label: v }
  )) },
]

// スタンプの描画HTML (SVG=クリーンな記号 / span=テキスト記号)。ダーク色・背景なしで記譜に馴染ませる。
function stampInnerHtml(kind: string, value?: string): string {
  const svg = (inner: string) =>
    `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`
  switch (kind) {
    case "down-bow": return svg('<path d="M5 6 H19 V15 H16 V9 H8 V15 H5 Z" fill="currentColor" stroke="none"/>')
    case "up-bow": return svg('<path d="M7 6 L12 17 L17 6"/>')
    case "accent": return svg('<path d="M6 8 L18 12 L6 16"/>')
    case "strong-accent": return svg('<path d="M7 16 L12 6 L17 16"/>')
    case "tenuto": return svg('<path d="M6 12 H18"/>')
    case "staccato": return svg('<circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none"/>')
    case "staccatissimo": return svg('<path d="M9.5 6 H14.5 L12 16 Z" fill="currentColor" stroke="none"/>')
    case "breath-mark": return svg('<path d="M13 6 C13 10 10 11 9 14 C12 12 15 12 14 7"/>')
    case "trill-mark": return `<span class="txt" style="font-style:italic;font-weight:800;font-family:Georgia,serif">tr</span>`
    case "fermata": return svg('<path d="M4 15 A9 9 0 0 1 20 15"/><circle cx="12" cy="13.5" r="1.4" fill="currentColor" stroke="none"/>')
    case "tremolo": return svg('<path d="M7 10 L17 7 M7 14 L17 11" stroke-width="2.4"/>')
    case "stopped": return svg('<path d="M12 6 V18 M6 12 H18"/>')
    case "open-string": return svg('<circle cx="12" cy="12" r="6" stroke-width="1.8"/>')
    case "harmonic": return svg('<path d="M12 6 L18 12 L12 18 L6 12 Z" stroke-width="1.8"/>')
    case "dynamic": return `<span class="txt" style="font-style:italic;font-weight:900;font-family:Georgia,serif">${value ?? ""}</span>`
    case "fingering": return `<span class="txt" style="font-weight:800">${value ?? ""}</span>`
    case "string": return `<span class="txt" style="font-weight:800;font-variant:small-caps">${value ?? ""}</span>`
    default: return `<span class="txt">?</span>`
  }
}

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
  // 記譜スタンプ: 選択中のスタンプ (kind,value)。null = 未選択。tool より優先して配置。
  const [stamp, setStamp] = useState<StampDef | null>(null)
  const stampRef = useRef<StampDef | null>(null)
  stampRef.current = stamp
  const [showPalette, setShowPalette] = useState(false)

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

    // 記譜スタンプ (音符の上に素の記号として)
    for (const n of d.notation ?? []) {
      const el = els[n.noteIndex]
      if (!el || !container.contains(el)) continue
      const r = el.getBoundingClientRect()
      const node = document.createElement("div")
      node.className = styles.stampGlyph
      node.style.left = `${r.left + r.width / 2 - cRect.left}px`
      node.style.top = `${r.top - cRect.top + scrollTop - 21}px`
      node.innerHTML = stampInnerHtml(n.kind, n.value)
      container.appendChild(node)
      overlayNodesRef.current.push(node)
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
      const st = stampRef.current
      const t = toolRef.current
      if (!st && !t) return
      const idx = nearestNote(e.clientX, e.clientY)
      if (idx === null) return
      e.preventDefault()
      e.stopPropagation()
      const d = dataRef.current
      if (st) {
        commit({ ...d, notation: [...(d.notation ?? []), { noteIndex: idx, kind: st.kind, value: st.value }] })
        return
      }
      if (!t) return
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
          notation: (d.notation ?? []).filter((n) => n.noteIndex !== idx),
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
      onClick={() => { setTool(tool === t ? null : t); setHlStart(null); setStamp(null); setShowPalette(false) }}
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
          <button
            type="button"
            className={`${styles.toolBtn} ${showPalette || stamp ? styles.toolOn : ""}`}
            onClick={() => { setShowPalette((v) => !v); setTool(null); setHlStart(null) }}
          >
            <span className={styles.g}>♪</span>記譜
          </button>
          {toolBtn("erase", "✕", "消す")}
          <button type="button" className={styles.clearBtn} onClick={clearAll}>全消去</button>
        </div>
      )}
      {active && showPalette && (
        <div className={styles.palette}>
          {STAMP_GROUPS.map((grp) => (
            <div key={grp.group} className={styles.palGroup}>
              <span className={styles.palLabel}>{grp.group}</span>
              <div className={styles.palItems}>
                {grp.items.map((it) => {
                  const on = stamp?.kind === it.kind && stamp?.value === it.value
                  return (
                    <button
                      key={it.kind + (it.value ?? "")}
                      type="button"
                      className={`${styles.stampBtn} ${on ? styles.stampOn : ""}`}
                      title={it.label}
                      onClick={() => { setStamp(on ? null : it); setTool(null) }}
                      dangerouslySetInnerHTML={{ __html: stampInnerHtml(it.kind, it.value) }}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      {active && stamp && (
        <p className={styles.hint}><b>{stamp.label}</b> を置く音符をタップ</p>
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
