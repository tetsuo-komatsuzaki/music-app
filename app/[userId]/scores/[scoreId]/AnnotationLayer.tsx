"use client"

// 譜面注釈レイヤー (Phase 1, 2026-07-19)
// 音符アンカー(note_index)でハイライト/テキスト/注意メモを保持し、#osmd-container 上に
// 命令的オーバーレイ(cursor/区間帯と同方式)で描画。OSMD再レイアウト/zoom/スクロールに追従。
// 記譜スタンプ①(MusicXML互換)は Phase 2。

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { Pencil } from "lucide-react"
import {
  getScoreAnnotation,
  saveScoreAnnotation,
} from "@/app/actions/scoreAnnotations"
import type { AnnotationData } from "@/app/_libs/annotationSanitize"
import styles from "./AnnotationLayer.module.css"

// 範囲スパナ (Phase 3): 音符 from→to をまたぐ記号。ハイライトと同じ二点タップで配置。
type SpanKind = "slur" | "cresc" | "decresc" | "gliss"
type Tool = null | "highlight" | "text" | "flat" | "sharp" | "tempo" | "hard" | "erase" | SpanKind
const SPAN_DEFS: { kind: SpanKind; label: string }[] = [
  { kind: "slur", label: "スラー" },
  { kind: "cresc", label: "クレッシェンド" },
  { kind: "decresc", label: "デクレッシェンド" },
  { kind: "gliss", label: "グリッサンド" },
]
const SPAN_KIND_SET = new Set<string>(SPAN_DEFS.map((s) => s.kind))
const isSpan = (t: Tool): t is SpanKind => t != null && SPAN_KIND_SET.has(t)

// 範囲スパナの SVG (弧/ヘアピン/斜線)。パレットのボタンにもオーバーレイにも使う (w,h 可変)。
function spanSvg(kind: SpanKind, w: number, h: number): string {
  const wrap = (inner: string, sw = 1.6) =>
    `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`
  switch (kind) {
    case "slur": return wrap(`<path d="M2 ${h - 2} Q ${w / 2} 0 ${w - 2} ${h - 2}"/>`)
    case "cresc": return wrap(`<path d="M1 ${h / 2} L ${w - 1} 1.5 M1 ${h / 2} L ${w - 1} ${h - 1.5}"/>`, 1.5)
    case "decresc": return wrap(`<path d="M1 1.5 L ${w - 1} ${h / 2} M1 ${h - 1.5} L ${w - 1} ${h / 2}"/>`, 1.5)
    case "gliss": return wrap(`<path d="M2 ${h - 3} L ${w - 2} 3"/>`, 1.4)
  }
}
// オーバーレイ配置 (帯 {l,r,t,b} に対する left/top/幅/高さ)。kind ごとに音符の上/下/上に置く。
function spanPlacement(kind: SpanKind, g: { l: number; r: number; t: number; b: number }) {
  const w = g.r - g.l
  if (kind === "slur") return { left: g.l - 4, top: g.t - 16, width: w + 8, height: 14 }
  if (kind === "gliss") return { left: g.l, top: g.t, width: w, height: Math.max(10, g.b - g.t) }
  return { left: g.l, top: g.b + 1, width: w, height: 9 } // cresc / decresc は音符の下
}

const WARN_PRESETS: Record<string, { label: string; icon: string; cls: string }> = {
  flat: { label: "低い", icon: "↓", cls: "wFlat" },
  sharp: { label: "高い", icon: "↑", cls: "wSharp" },
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

// value を HTML に直挿しする前のエスケープ (防御的多層防御・2026-08-08 テスト調査)。
// 現状 value は固定リスト (pp/p/../ff, 0-4, I-IV) のみで注入経路は無いが、
// dangerouslySetInnerHTML に生値を渡す設計なので、将来の自由入力化や不正保存値に備える。
function escHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string
  ))
}

// スタンプの描画HTML (SVG=クリーンな記号 / span=テキスト記号)。ダーク色・背景なしで記譜に馴染ませる。
function stampInnerHtml(kind: string, value?: string): string {
  const v = escHtml(value ?? "")
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
    case "dynamic": return `<span class="txt" style="font-style:italic;font-weight:900;font-family:Georgia,serif">${v}</span>`
    case "fingering": return `<span class="txt" style="font-weight:800">${v}</span>`
    case "string": return `<span class="txt" style="font-weight:800;font-variant:small-caps">${v}</span>`
    default: return `<span class="txt">?</span>`
  }
}

type Props = {
  containerId: string
  noteElementsRef: React.MutableRefObject<Element[]>
  noteElementsVersion: number
  scoreId?: string
  practiceItemId?: string
  /** 添削モード等で読み書きを差し替える (省略時は自分の ScoreAnnotation)。 */
  loadOverride?: () => Promise<AnnotationData>
  saveOverride?: (data: AnnotationData) => void | Promise<void>
  /** 読み取り専用: ツールバーを出さず、描画のみ (生徒が先生の添削を見る等)。 */
  readOnly?: boolean
}

export default function AnnotationLayer({
  containerId,
  noteElementsRef,
  noteElementsVersion,
  scoreId,
  practiceItemId,
  loadOverride,
  saveOverride,
  readOnly = false,
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
  const [showRange, setShowRange] = useState(false)

  const overlayNodesRef = useRef<HTMLElement[]>([])
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ---- 読み込み ----
  const loadOverrideRef = useRef(loadOverride)
  loadOverrideRef.current = loadOverride
  const saveOverrideRef = useRef(saveOverride)
  saveOverrideRef.current = saveOverride
  useEffect(() => {
    let cancelled = false
    const p = loadOverrideRef.current
      ? loadOverrideRef.current()
      : getScoreAnnotation({ scoreId, practiceItemId }).then((r) => (r.ok ? r.data ?? {} : {}))
    p.then((d) => { if (!cancelled) setData(d ?? {}) })
    return () => { cancelled = true }
  }, [scoreId, practiceItemId])

  // ---- 保存 (デバウンス) ----
  const commit = useCallback((next: AnnotationData) => {
    setData(next)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      if (saveOverrideRef.current) saveOverrideRef.current(next)
      else saveScoreAnnotation({ scoreId, practiceItemId, data: next })
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
    // 2026-08-28: 印は React の管理外で #osmd-container に直接ぶら下げている。
    // 以前は「譜面が見つからない」ときに、直前に描いた印を消す処理の手前で return して
    // いたため、譜面が消えても印だけが DOM に残り、譜面の無い場所に浮いて見えていた。
    // 譜面が無い・畳まれている・音符が1つも無い、のどれでも必ず消してから戻る。
    const clearOverlay = () => {
      overlayNodesRef.current.forEach((n) => n.remove())
      overlayNodesRef.current = []
    }
    const container = document.getElementById(containerId)
    if (!container) { clearOverlay(); return }
    clearOverlay()
    container.style.position = "relative"
    const cRect = container.getBoundingClientRect()
    // 畳まれている (大きさが無い) なら描かない
    if (cRect.width < 1 || cRect.height < 1) return
    // 音符が1つも描かれていないなら譜面は出ていない。座標の当てが無いので描かない
    if (!noteElementsRef.current.some((el) => container.contains(el))) return
    const scrollTop = container.scrollTop
    // 2026-08-27: 横スクロール量。注釈は position:absolute でコンテナ内に置くので、
    // viewport 相対の rect をコンテナ座標へ直すには scrollTop と同様 scrollLeft も足す。
    // 縦レイアウトでは常に0なので挙動は不変。9a帯モード (横画面録音) では録音中ずっと
    // 横スクロールし続けるため、これが無いと注釈だけが音符から取り残されて流れて見える。
    // テンポガイド (scoreDetail の updateRecordingCursor) は帯モード対応時に
    // 同じ補正が入っているが、この注釈レイヤーは一緒に直されていなかった。
    const scrollLeft = container.scrollLeft
    const els = noteElementsRef.current
    const d = dataRef.current

    // 音符 lo..hi を行ごとの帯にまとめる (行またぎ対応: x が左に戻ったら次行)。ハイライト/範囲スパナ共通。
    const bandsOf = (lo: number, hi: number): Array<{ l: number; r: number; t: number; b: number }> => {
      let cur: { l: number; r: number; t: number; b: number } | null = null
      let prevCx = -Infinity
      const bands: Array<{ l: number; r: number; t: number; b: number }> = []
      for (let i = lo; i <= hi; i++) {
        const el = els[i]
        if (!el || !container.contains(el)) continue
        const r = el.getBoundingClientRect()
        const l = r.left - cRect.left + scrollLeft, rr = r.right - cRect.left + scrollLeft
        const t = r.top - cRect.top + scrollTop, b = r.bottom - cRect.top + scrollTop
        const cx = (l + rr) / 2
        if (!cur || cx < prevCx - 4) { cur = { l, r: rr, t, b }; bands.push(cur) }
        else { cur.l = Math.min(cur.l, l); cur.r = Math.max(cur.r, rr); cur.t = Math.min(cur.t, t); cur.b = Math.max(cur.b, b) }
        prevCx = cx
      }
      return bands
    }

    // ハイライト帯
    for (const h of d.highlight ?? []) {
      const bands = bandsOf(Math.min(h.fromNote, h.toNote), Math.max(h.fromNote, h.toNote))
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

    // 範囲スパナ (Phase 3): スラー弧 / ヘアピン / グリッサンド。行ごとの帯に SVG を配置
    for (const s of d.spans ?? []) {
      const kind = s.kind as SpanKind
      if (!SPAN_KIND_SET.has(kind)) continue
      const bands = bandsOf(Math.min(s.fromNote, s.toNote), Math.max(s.fromNote, s.toNote))
      for (const g of bands) {
        const p = spanPlacement(kind, g)
        if (p.width <= 0) continue
        const node = document.createElement("div")
        node.className = styles.spanGlyph
        node.style.left = `${p.left}px`
        node.style.top = `${p.top}px`
        node.style.width = `${p.width}px`
        node.style.height = `${p.height}px`
        node.innerHTML = spanSvg(kind, p.width, p.height)
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
      node.style.left = `${r.left + r.width / 2 - cRect.left + scrollLeft}px`
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
    // 同じ音符に複数のスタンプが付く場合は縦に積む (2026-08-24 Tetsuo指摘:
    // 弦の文字とスタッカート等が重なって読めない問題の対処)。
    const stampStack = new Map<number, number>()
    for (const n of d.notation ?? []) {
      const el = els[n.noteIndex]
      if (!el || !container.contains(el)) continue
      const r = el.getBoundingClientRect()
      const level = stampStack.get(n.noteIndex) ?? 0
      stampStack.set(n.noteIndex, level + 1)
      const node = document.createElement("div")
      node.className = styles.stampGlyph
      node.style.left = `${r.left + r.width / 2 - cRect.left + scrollLeft}px`
      node.style.top = `${r.top - cRect.top + scrollTop - 21 - level * 14}px`
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
      // 録音全画面中は再構築しない (2026-08-28)。
      // 帯モードは録音中ずっと横スクロールし続けるため、scroll のたびに
      // 全ノードを消して作り直すこの処理が毎フレーム級に走り、フレーム落ちの
      // 主因になっていた (実測: 記号の多い曲で 100ms 超の引っかかり281回)。
      // 印は入れ物の中にコンテンツ座標で置いてあり、スクロールには自然に
      // ついて動くので、録音中に作り直す必要はそもそも無い。
      // 録音が終わると譜面が縦レイアウトで読み直され noteElementsVersion が
      // 変わるので、この effect が再実行されて描き直される。
      if (document.body.getAttribute("data-fullscreen") === "true") return
      if (raf !== null) return
      raf = requestAnimationFrame(() => { raf = null; renderOverlay() })
    }
    container.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    // 2026-08-28: 譜面が畳まれたことに気づく口が無かった。
    // scroll と window.resize しか見ていないため、譜面の入れ物が高さ0になっても
    // 描き直しが走らず、印だけが残っていた。入れ物の大きさ変化そのものを見る。
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedule) : null
    ro?.observe(container)
    return () => {
      if (raf !== null) cancelAnimationFrame(raf)
      ro?.disconnect()
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
      } else if (isSpan(t)) {
        // 範囲スパナも二点タップ (開始→終了)
        const start = hlStartRef.current
        if (start === null) { setHlStart(idx) }
        else {
          const lo = Math.min(start, idx), hi = Math.max(start, idx)
          commit({ ...d, spans: [...(d.spans ?? []), { fromNote: lo, toNote: hi, kind: t }] })
          setHlStart(null)
        }
      } else if (t === "erase") {
        // このノートに関わる注釈を削除 (範囲系は範囲内に含めば消す)
        const inRange = (from: number, to: number) => idx >= Math.min(from, to) && idx <= Math.max(from, to)
        commit({
          ...d,
          highlight: (d.highlight ?? []).filter((h) => !inRange(h.fromNote, h.toNote)),
          spans: (d.spans ?? []).filter((s) => !inRange(s.fromNote, s.toNote)),
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

  const toolBtn = (t: Tool, glyph: ReactNode, label: string) => (
    <button
      type="button"
      className={`${styles.toolBtn} ${tool === t ? styles.toolOn : ""}`}
      onClick={() => { setTool(tool === t ? null : t); setHlStart(null); setStamp(null); setShowPalette(false); setShowRange(false) }}
    >
      {glyph && <span className={styles.g}>{glyph}</span>}
      {label}
    </button>
  )

  // 読み取り専用 (生徒が先生の添削を見る): ツールバーは出さず、オーバーレイ描画だけ効かせる。
  if (readOnly) return null

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <button
          type="button"
          className={`${styles.modeBtn} ${active ? styles.modeOn : ""}`}
          onClick={() => { setActive((v) => !v); setTool(null); setHlStart(null) }}
          aria-pressed={active}
        >
          <span className={styles.g}><Pencil size={14} /></span> 譜面に書き込む
        </button>
      </div>
      {active && (
        <div className={styles.tools}>
          {toolBtn("highlight", "▬", "ハイライト")}
          {toolBtn("text", <Pencil size={14} />, "メモ")}
          {toolBtn("flat", "↓", "低い")}
          {toolBtn("sharp", "↑", "高い")}
          {toolBtn("tempo", "♩", "テンポ")}
          {toolBtn("hard", "!", "難所")}
          <button
            type="button"
            className={`${styles.toolBtn} ${showPalette || stamp ? styles.toolOn : ""}`}
            onClick={() => { setShowPalette((v) => !v); setShowRange(false); setTool(null); setHlStart(null); setStamp(null) }}
          >
            <span className={styles.g}>♪</span>記譜
          </button>
          <button
            type="button"
            className={`${styles.toolBtn} ${showRange || isSpan(tool) ? styles.toolOn : ""}`}
            onClick={() => { setShowRange((v) => !v); setShowPalette(false); setTool(null); setHlStart(null); setStamp(null) }}
          >
            <span className={styles.g}>⌒</span>範囲
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
      {active && showRange && (
        <div className={styles.palette}>
          <div className={styles.palGroup}>
            <span className={styles.palLabel}>範囲</span>
            <div className={styles.palItems}>
              {SPAN_DEFS.map((s) => (
                <button
                  key={s.kind}
                  type="button"
                  className={`${styles.stampBtn} ${tool === s.kind ? styles.stampOn : ""}`}
                  title={s.label}
                  onClick={() => { setTool(tool === s.kind ? null : s.kind); setStamp(null); setHlStart(null) }}
                  dangerouslySetInnerHTML={{ __html: spanSvg(s.kind, 26, 14) }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      {active && isSpan(tool) && (
        <p className={styles.hint}>
          <b>{SPAN_DEFS.find((s) => s.kind === tool)?.label}</b>：
          {hlStart === null ? "開始の音符をタップ → 終了の音符をタップ" : "終了の音符をタップ"}
        </p>
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
      {active && tool && tool !== "highlight" && tool !== "erase" && !isSpan(tool) && (
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
