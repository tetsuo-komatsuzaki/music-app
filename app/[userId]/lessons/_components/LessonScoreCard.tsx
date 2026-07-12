"use client"

// レッスン譜面カード (図解モーション要件v1.0 Part C・実装指示書v1.2 §4)
//
// - 描画はOSMD+MusicXML原本。教材データJSONの lessonScores は描画に使わず、
//   ハイライト規則・補筆記号の正としてのみ参照する (指示書§0-2)
// - 拍子記号(4/4)は非表示 (C-1)
// - 緑丸ハイライト4規則 (C-5・JSON _meta.hiRules):
//     hiAll   = 弓系8本 + ds_seq + mordent → 全音符(休符除く)に各1円
//     hiLast  = harmonics/pos2..6 → 到達音(最右)のみ
//     hiChord = ds3/6/8/10 → 和音の音 (符頭+符幹を包含する拡大円)
//     default = 技術記号付き先頭音。23教材では先頭音と等価(trill/gliss/vibrato)
// - 補筆 (C-6・JSON _meta.editorialFlags): プラル/モル装飾・ハーモニクス○・pizz. は
//   MusicXML未記載のため表示側で暫定付与。**再書き出し版受領後はEDITORIALから削除し
//   原本タグから抽出に切り替えること**
// - OSMD標準挙動で満たされる項目(符幹方向・重音符幹・スラー・装飾)は追加実装しない

import { useEffect, useRef, useState } from "react"
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay"
import styles from "../lessons.module.css"

const HI_ALL = new Set([
  "staccato", "bow_staccato", "spiccato", "ricochet", "tremolo", "portato",
  "slur", "pizzicato", "ds_seq", "mordent",
])
const HI_LAST = new Set(["harmonics", "pos2", "pos3", "pos4", "pos5", "pos6"])
const HI_CHORD = new Set(["ds3", "ds6", "ds8", "ds10"])

/** 補筆 (再書き出し待ち3教材のみ。受領後に削除) */
const EDITORIAL: Record<string, Array<{ noteIndex: number; kind: "pral" | "mor" | "harm" | "pizz" }>> = {
  mordent: [
    { noteIndex: 0, kind: "pral" },
    { noteIndex: 1, kind: "mor" },
  ],
  harmonics: [{ noteIndex: -1, kind: "harm" }], // -1 = 最終音
  pizzicato: [{ noteIndex: 0, kind: "pizz" }],
}

const HI_COLOR = "#2EAD5B"

type NoteEntry = { els: SVGGraphicsElement[]; chordEl: SVGGraphicsElement | null }

export default function LessonScoreCard({
  buildUrl,
  lessonId,
  hi,
  className,
}: {
  buildUrl: string
  lessonId: string
  /** 緑丸ハイライトを描くか (S1/導入=true、S5下段/弾く画面=false) */
  hi: boolean
  className?: string
}) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let disposed = false
    const osmd = new OpenSheetMusicDisplay(host, {
      autoResize: false,
      backend: "svg",
      drawTitle: false,
      drawPartNames: false,
      pageFormat: "Endless",
      drawingParameters: "compacttight",
    })
    ;(async () => {
      try {
        await osmd.load(buildUrl)
        if (disposed) return
        // 拍子記号(4/4)非表示 (Part C C-1・2026-07-12確定)。テンポ表記もプロト準拠で非表示
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(osmd.EngravingRules as any).RenderTimeSignatures = false
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(osmd.EngravingRules as any).MetronomeMarksDrawn = false
        // 短フレーズがカード全面に拡大されないようプロトタイプの見た目に近い縮尺で描画
        osmd.zoom = 0.35
        osmd.render()
        decorate(osmd, host, lessonId, hi)
      } catch (e) {
        console.error("[lesson] score card failed:", e)
        setFailed(true)
      }
    })()
    return () => {
      disposed = true
      host.innerHTML = ""
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildUrl, lessonId, hi])

  return (
    <div ref={hostRef} className={className ?? styles.osmdCardBox}>
      {failed && <span style={{ fontSize: "1.4cqh", color: "#afafaf" }}>譜面を表示できません</span>}
    </div>
  )
}

/** OSMDのカーソルから音符要素列を収集 (休符除外・和音は同エントリにまとめる) */
function collectNotes(osmd: OpenSheetMusicDisplay): NoteEntry[] {
  const entries: NoteEntry[] = []
  const cursor = osmd.cursor
  cursor.reset()
  const guard = 500
  let steps = 0
  while (!cursor.iterator.EndReached && steps++ < guard) {
    const gNotes = (cursor.GNotesUnderCursor() ?? []).filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (g: any) => g && g.sourceNote && !g.sourceNote.isRest(),
    )
    if (gNotes.length > 0) {
      const els = gNotes
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((g: any) => (typeof g.getSVGGElement === "function" ? g.getSVGGElement() : null))
        .filter((el: unknown): el is SVGGraphicsElement => !!el)
      if (els.length > 0) {
        const chordEl = els[0].closest("g.vf-stavenote") as SVGGraphicsElement | null
        entries.push({ els, chordEl })
      }
    }
    cursor.next()
  }
  cursor.reset()
  cursor.hide()
  return entries
}

/** 緑丸 + 補筆を OSMD の svg 上へオーバーレイ */
function decorate(osmd: OpenSheetMusicDisplay, host: HTMLElement, lessonId: string, hi: boolean) {
  const svg = host.querySelector("svg")
  if (!svg) return
  svg.style.overflow = "visible" // 高音の緑丸・記号の見切れ防止 (C-1余白の代替)
  const entries = collectNotes(osmd)
  if (entries.length === 0) return

  // 基準単位 = 符頭の高さ (≈1譜線間隔)
  const nh = entries[0].els[0].getBBox().height || 10

  const circleFor = (e: NoteEntry) => {
    const isChord = e.els.length > 1
    if (isChord && e.chordEl) {
      // 重音: 符頭群+符幹を包含する拡大円 (C-5)
      const b = e.chordEl.getBBox()
      const cx = b.x + b.width / 2
      const cy = b.y + b.height / 2
      const r = Math.max(b.width, b.height) / 2 + nh * 0.9
      return { cx, cy, r }
    }
    const b = e.els[0].getBBox()
    return { cx: b.x + b.width / 2, cy: b.y + b.height / 2, r: nh * 1.5 }
  }
  const draw = (c: { cx: number; cy: number; r: number }) => {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "circle")
    el.setAttribute("cx", String(c.cx))
    el.setAttribute("cy", String(c.cy))
    el.setAttribute("r", String(c.r))
    el.setAttribute("fill", "none")
    el.setAttribute("stroke", HI_COLOR)
    el.setAttribute("stroke-width", String(nh * 0.36))
    svg.appendChild(el)
  }

  if (hi) {
    if (HI_ALL.has(lessonId)) {
      for (const e of entries) draw(circleFor(e))
    } else if (HI_LAST.has(lessonId)) {
      draw(circleFor(entries[entries.length - 1]))
    } else if (HI_CHORD.has(lessonId)) {
      const chord = entries.find((e) => e.els.length > 1) ?? entries[0]
      draw(circleFor(chord))
    } else {
      draw(circleFor(entries[0])) // default: 技術記号付き先頭音 (23教材では先頭音と等価)
    }
  }

  // ── 補筆 (C-6・再書き出し待ちの3教材のみ) ──
  for (const ed of EDITORIAL[lessonId] ?? []) {
    const e = entries[ed.noteIndex === -1 ? entries.length - 1 : ed.noteIndex]
    if (!e) continue
    const b = e.els[0].getBBox()
    const cx = b.x + b.width / 2
    const top = (e.chordEl ?? e.els[0]).getBBox().y
    const put = (node: SVGElement) => svg.appendChild(node)
    if (ed.kind === "pral" || ed.kind === "mor") {
      // 装飾波線 (プラルトリラー)。モルデントは+縦棒
      const my = top - nh * 1.2
      const w = nh * 0.45
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path")
      p.setAttribute(
        "d",
        `M ${cx - w * 2},${my} l ${w},${-w} l ${w * 1.2},${w * 1.2} l ${w},${-w} l ${w * 1.2},${w * 1.2} l ${w},${-w}`,
      )
      p.setAttribute("stroke", "#333")
      p.setAttribute("stroke-width", String(nh * 0.2))
      p.setAttribute("fill", "none")
      put(p)
      if (ed.kind === "mor") {
        const l = document.createElementNS("http://www.w3.org/2000/svg", "line")
        l.setAttribute("x1", String(cx))
        l.setAttribute("y1", String(my - nh * 0.8))
        l.setAttribute("x2", String(cx))
        l.setAttribute("y2", String(my + nh * 0.5))
        l.setAttribute("stroke", "#333")
        l.setAttribute("stroke-width", String(nh * 0.2))
        put(l)
      }
    } else if (ed.kind === "harm") {
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      c.setAttribute("cx", String(cx))
      c.setAttribute("cy", String(top - nh * 1.1))
      c.setAttribute("r", String(nh * 0.42))
      c.setAttribute("fill", "none")
      c.setAttribute("stroke", "#333")
      c.setAttribute("stroke-width", String(nh * 0.2))
      put(c)
    } else if (ed.kind === "pizz") {
      const t = document.createElementNS("http://www.w3.org/2000/svg", "text")
      t.setAttribute("x", String(cx))
      t.setAttribute("y", String(top - nh * 1.2))
      t.setAttribute("text-anchor", "middle")
      t.setAttribute("font-size", String(nh * 1.15))
      t.setAttribute("font-style", "italic")
      t.setAttribute("font-weight", "700")
      t.setAttribute("font-family", "serif")
      t.setAttribute("fill", "#333")
      t.textContent = "pizz."
      put(t)
    }
  }
}
