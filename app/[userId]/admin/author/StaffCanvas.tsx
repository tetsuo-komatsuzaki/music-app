"use client"
/**
 * 五線譜の描画と操作 (要件 10 ・ 05 ・ 06 ・ 07 ・ 08)。SVG。
 * 音符 ・ 休符 ・ 連桁 ・ 旗 ・ 付点 ・ 連符 ・ 臨時記号 ・ タイ ・ スラー ・ 奏法 ・ 弓 ・ 装飾 ・ 強弱 ・ 松葉 ・ 指 ・ 弦 ・
 * 反復 ・ 括弧 ・ とび先 ・ テンポ ・ 拍子 ・ 調号 ・ 小節番号 ・ 終止線 を描く。
 * 操作: 符頭を押す=選ぶ (Shift 範囲 ・ Ctrl 追加) ・ 上下に引く=音の高さ ・ 空いた場所を押す=その高さに音を足す ・ 小節番号を押す=小節を選ぶ
 */
import { useMemo, useRef, type PointerEvent as RPE } from "react"
import { type AuthorScore, type KeySig, type StringId } from "@/app/_libs/author/model"
import { layoutScore, yOfDi, diOfY, SP, STAFF_TOP, SYSTEM_H, type LaidElement, type LaidMeasure, type Layout } from "@/app/_libs/author/layout"

export type HeadSel = { id: string; hi: number }
export type Selection = { ids: string[]; anchor: string | null; head: HeadSel | null; measures: number[] }

type Props = {
  score: AuthorScore
  zoom: number
  width: number
  selection: Selection
  playingId: string | null
  onSelect: (id: string, hi: number, mode: "set" | "add" | "range") => void
  onSelectMeasure: (mIdx: number, mode: "set" | "add") => void
  onDragSteps: (steps: number) => void
  onDragEnd: () => void
  onAddAt: (mIdx: number, di: number) => void
  onBackground: () => void
  /** 拍が合わないなど「直す」問題のある小節番号 (番号の札を赤くする) */
  errorMeasures?: Set<number>
}

const MUSIC_FONT = "Bravura, 'Noto Music', 'Segoe UI Symbol', 'Apple Symbols', serif"
const SHARP_DI = [38, 35, 39, 36, 33, 37, 34]   // F5 C5 G5 D5 A4 E5 B4
const FLAT_DI = [34, 37, 33, 36, 32, 35, 31]    // B4 E5 A4 D5 G4 C5 F4
const FLAGS: Record<string, number> = { e: 1, s: 2, t: 3, x: 4 }
const BLUE = "#2b5bc4", GOLD = "#d9a93c", INK = "#1d2430", LINE = "#8d97a8"

function accText(kind: NonNullable<LaidElement["heads"][number]["acc"]>["kind"]): string {
  return kind === "sharp" ? "♯" : kind === "flat" ? "♭" : kind === "natural" ? "♮" : kind === "double-sharp" ? "𝄪" : "𝄫"
}
function beatQl(t: { beats: number; beatType: number }): number {
  if (t.beatType === 8 && t.beats % 3 === 0) return 1.5
  return 4 / t.beatType
}

export default function StaffCanvas(p: Props) {
  const layout = useMemo(() => layoutScore(p.score, p.width / p.zoom), [p.score, p.width, p.zoom])
  const drag = useRef<{ startY: number; last: number } | null>(null)
  const sel = new Set(p.selection.ids)
  const selMeasures = new Set(p.selection.measures)

  function onHeadDown(e: RPE, id: string, hi: number) {
    e.stopPropagation()
    e.preventDefault()
    p.onSelect(id, hi, e.shiftKey ? "range" : e.ctrlKey || e.metaKey ? "add" : "set")
    drag.current = { startY: e.clientY, last: 0 }
    ;(e.currentTarget as SVGElement).setPointerCapture?.(e.pointerId)
  }
  function onMove(e: RPE) {
    if (!drag.current) return
    const steps = Math.round((drag.current.startY - e.clientY) / ((SP / 2) * p.zoom))
    if (steps !== drag.current.last) { p.onDragSteps(steps - drag.current.last); drag.current.last = steps }
  }
  function onUp() {
    if (drag.current) { drag.current = null; p.onDragEnd() }
  }
  function onSvgDown(e: RPE<SVGSVGElement>) {
    // 空いた場所: その小節 ・ その高さに音を足す
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / p.zoom, y = (e.clientY - rect.top) / p.zoom
    const sys = layout.systems.find((s) => y >= s.y && y < s.y + SYSTEM_H)
    if (!sys) { p.onBackground(); return }
    const ly = y - sys.y
    const m = sys.measures.find((mm) => x >= mm.x && x < mm.x + mm.width)
    if (!m || ly < STAFF_TOP - 4 * SP || ly > STAFF_TOP + 8 * SP) { p.onBackground(); return }
    p.onAddAt(m.mIdx, diOfY(ly))
  }

  const W = layout.width * p.zoom, H = layout.height * p.zoom
  return (
    <svg width={W} height={H} viewBox={`0 0 ${layout.width} ${layout.height}`} style={{ display: "block", touchAction: "none", userSelect: "none" }}
      onPointerDown={onSvgDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}>
      {layout.systems.map((s) => (
        <g key={s.idx} transform={`translate(0 ${s.y})`}>
          {[0, 1, 2, 3, 4].map((i) => <line key={i} x1={s.x0} x2={s.x1} y1={STAFF_TOP + i * SP} y2={STAFF_TOP + i * SP} stroke={LINE} strokeWidth={0.9} />)}
          {s.measures.map((m) => <MeasureG key={m.mIdx} m={m} score={p.score} layout={layout} selected={selMeasures.has(m.mIdx)} hasError={p.errorMeasures?.has(m.no) ?? false} sel={sel} headSel={p.selection.head} playingId={p.playingId} onHeadDown={onHeadDown} onSelectMeasure={p.onSelectMeasure} isLast={m.mIdx === p.score.measures.length - 1} />)}
          <Slurs layout={layout} sysIdx={s.idx} />
        </g>
      ))}
    </svg>
  )
}

// ───────────────────────── 小節 ─────────────────────────
function MeasureG({ m, score, layout, selected, hasError, sel, headSel, playingId, onHeadDown, onSelectMeasure, isLast }: {
  m: LaidMeasure; score: AuthorScore; layout: Layout; selected: boolean; hasError: boolean; sel: Set<string>; headSel: HeadSel | null; playingId: string | null
  onHeadDown: (e: RPE, id: string, hi: number) => void; onSelectMeasure: (mIdx: number, mode: "set" | "add") => void; isLast: boolean
}) {
  const mm = score.measures[m.mIdx]
  const top = STAFF_TOP, bottom = STAFF_TOP + 4 * SP
  const out: React.ReactNode[] = []
  // 選択の帯
  if (selected) out.push(<rect key="sel" x={m.x} y={top - 3.5 * SP} width={m.width} height={11 * SP} fill="rgba(43,91,196,.10)" />)
  // 左の縦線 ・ 反復
  if (mm.repeatStart) {
    out.push(<line key="rs1" x1={m.x + 1.5} x2={m.x + 1.5} y1={top} y2={bottom} stroke={INK} strokeWidth={3} />)
    out.push(<line key="rs2" x1={m.x + 6} x2={m.x + 6} y1={top} y2={bottom} stroke={INK} strokeWidth={1} />)
    out.push(<circle key="rs3" cx={m.x + 11} cy={top + 1.5 * SP} r={1.7} fill={INK} />)
    out.push(<circle key="rs4" cx={m.x + 11} cy={top + 2.5 * SP} r={1.7} fill={INK} />)
  } else if (!m.clef) {
    out.push(<line key="bl" x1={m.x} x2={m.x} y1={top} y2={bottom} stroke={INK} strokeWidth={1} />)
  } else {
    out.push(<line key="bl0" x1={m.x} x2={m.x} y1={top} y2={bottom} stroke={INK} strokeWidth={1} />)
  }
  // 右の縦線 ・ 反復の終わり ・ 終止線
  const xr = m.x + m.width
  if (mm.repeatEnd) {
    out.push(<circle key="re3" cx={xr - 11} cy={top + 1.5 * SP} r={1.7} fill={INK} />)
    out.push(<circle key="re4" cx={xr - 11} cy={top + 2.5 * SP} r={1.7} fill={INK} />)
    out.push(<line key="re2" x1={xr - 6} x2={xr - 6} y1={top} y2={bottom} stroke={INK} strokeWidth={1} />)
    out.push(<line key="re1" x1={xr - 1.5} x2={xr - 1.5} y1={top} y2={bottom} stroke={INK} strokeWidth={3} />)
  } else if (isLast) {
    out.push(<line key="fe2" x1={xr - 5} x2={xr - 5} y1={top} y2={bottom} stroke={INK} strokeWidth={1} />)
    out.push(<line key="fe1" x1={xr - 1.5} x2={xr - 1.5} y1={top} y2={bottom} stroke={INK} strokeWidth={3} />)
  } else {
    out.push(<line key="br" x1={xr} x2={xr} y1={top} y2={bottom} stroke={INK} strokeWidth={1} />)
  }
  // 音部記号 ・ 調号 ・ 拍子
  let hx = m.x + 4
  if (m.clef) {
    out.push(<text key="clef" x={hx} y={STAFF_TOP + 3 * SP} fontFamily={MUSIC_FONT} fontSize={4.4 * SP} fill={INK}>𝄞</text>)
    hx += 34
  }
  if (m.key) {
    const n = Math.abs(m.key.fifths)
    for (let i = 0; i < n; i++) {
      const di = m.key.fifths > 0 ? SHARP_DI[i] : FLAT_DI[i]
      out.push(<text key={`k${i}`} x={hx + i * 8} y={yOfDi(di) + 3.5} fontFamily={MUSIC_FONT} fontSize={2.3 * SP} fill={INK} textAnchor="middle">{m.key.fifths > 0 ? "♯" : "♭"}</text>)
    }
    hx += 4 + 8 * n
  }
  if (m.time) {
    out.push(<text key="t1" x={hx + 8} y={STAFF_TOP + 2 * SP - 1} fontSize={2.3 * SP} fontWeight={700} fill={INK} textAnchor="middle" fontFamily="Georgia, serif">{m.time.beats}</text>)
    out.push(<text key="t2" x={hx + 8} y={STAFF_TOP + 4 * SP - 1} fontSize={2.3 * SP} fontWeight={700} fill={INK} textAnchor="middle" fontFamily="Georgia, serif">{m.time.beatType}</text>)
  }
  // 小節番号 (押すと小節を選ぶ)
  out.push(
    <g key="no" style={{ cursor: "pointer" }} onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); onSelectMeasure(m.mIdx, e.ctrlKey || e.metaKey || e.shiftKey ? "add" : "set") }}>
      <rect x={m.x - 1} y={top - 3.4 * SP} width={22} height={13} rx={3} fill={selected ? BLUE : hasError ? "#b3261e" : "rgba(22,41,79,.08)"} />
      <text x={m.x + 10} y={top - 3.4 * SP + 10} fontSize={9.5} fill={selected || hasError ? "#fff" : "#3a4660"} textAnchor="middle" fontFamily="system-ui, sans-serif">{m.no}</text>
    </g>,
  )
  // 括弧 ・ とび先 ・ テンポ
  if (mm.endingStart != null) {
    const stopM = layout.measures.slice(m.mIdx).find((q) => score.measures[q.mIdx].endingStop != null)
    const xEnd = stopM && stopM.sysIdx === m.sysIdx ? stopM.x + stopM.width - 2 : m.x + m.width
    out.push(<path key="end" d={`M${m.x + 1} ${top - 1.4 * SP} v-9 H${xEnd} ${stopM && stopM.sysIdx === m.sysIdx ? "v9" : ""}`} fill="none" stroke={INK} strokeWidth={1} />)
    out.push(<text key="endn" x={m.x + 5} y={top - 1.4 * SP - 1} fontSize={9} fill={INK} fontFamily="system-ui, sans-serif">{mm.endingStart}.</text>)
  } else if (mm.endingStop != null && !layout.measures.slice(0, m.mIdx).some((q) => score.measures[q.mIdx].endingStart === mm.endingStop && q.sysIdx === m.sysIdx)) {
    out.push(<path key="end2" d={`M${m.x} ${top - 1.4 * SP - 9} H${m.x + m.width - 2} v9`} fill="none" stroke={INK} strokeWidth={1} />)
  }
  if (mm.direction) {
    const label = ({ segno: "𝄋 Segno", coda: "𝄌 Coda", fine: "Fine", toCoda: "To Coda 𝄌", dc: "D.C.", dcAlFine: "D.C. al Fine", dcAlCoda: "D.C. al Coda", ds: "D.S.", dsAlFine: "D.S. al Fine", dsAlCoda: "D.S. al Coda" } as Record<string, string>)[mm.direction]
    const right = /^(fine|toCoda|dc|ds)/.test(mm.direction)
    out.push(<text key="dir" x={right ? m.x + m.width - 4 : m.x + 26} y={top - 4.2 * SP} fontSize={11} fontStyle="italic" fontWeight={700} fill={INK} textAnchor={right ? "end" : "start"} fontFamily={`Georgia, ${MUSIC_FONT}`}>{label}</text>)
  }
  if (mm.tempo) {
    out.push(<text key="tempo" x={m.contentX - 4} y={top - 4.2 * SP} fontSize={11} fill={INK} fontFamily={`Georgia, ${MUSIC_FONT}`}>♩ = {mm.tempo}</text>)
  }
  // 中身
  out.push(<Elements key="els" m={m} layout={layout} sel={sel} headSel={headSel} playingId={playingId} onHeadDown={onHeadDown} />)
  return <g>{out}</g>
}

// ───────────────────────── 音符 ・ 休符 ─────────────────────────
function Elements({ m, layout, sel, headSel, playingId, onHeadDown }: {
  m: LaidMeasure; layout: Layout; sel: Set<string>; headSel: HeadSel | null; playingId: string | null
  onHeadDown: (e: RPE, id: string, hi: number) => void
}) {
  const out: React.ReactNode[] = []
  const els = m.elements
  // 連桁のまとまり: 同じ拍の中の 8 分以下の音 (休符 ・ 装飾音で切れる)
  const bq = beatQl(m.effTime)
  const groups: LaidElement[][] = []
  let cur: LaidElement[] = []
  let curBeat = -1
  for (const le of els) {
    const flags = le.el.kind === "note" && !le.el.grace ? FLAGS[le.el.dur.base] ?? 0 : 0
    const beat = Math.floor(le.onset / bq + 1e-6)
    if (flags > 0 && (cur.length === 0 || beat === curBeat)) { cur.push(le); curBeat = beat }
    else { if (cur.length > 1) groups.push(cur); cur = flags > 0 ? [le] : []; curBeat = beat }
  }
  if (cur.length > 1) groups.push(cur)
  const beamed = new Map<string, { up: boolean; stemEndY: number }>()
  for (const g of groups) {
    const ups = g.filter((x) => x.stemUp).length
    const up = ups * 2 >= g.length
    const ys = g.flatMap((x) => x.heads.map((h) => h.y))
    const stemEndY = up ? Math.min(...ys) - 3.6 * SP : Math.max(...ys) + 3.6 * SP
    for (const x of g) beamed.set(x.id, { up, stemEndY })
    const sx = (le: LaidElement) => (up ? le.x + 5.4 : le.x - 5.4)
    const maxFlags = Math.max(...g.map((x) => FLAGS[x.el.dur.base] ?? 0))
    for (let L = 1; L <= maxFlags; L++) {
      const dy = (up ? 1 : -1) * (L - 1) * 5.5
      for (let i = 0; i < g.length; i++) {
        const f = FLAGS[g[i].el.dur.base] ?? 0
        if (f < L) continue
        const nextHas = i + 1 < g.length && (FLAGS[g[i + 1].el.dur.base] ?? 0) >= L
        const prevHas = i > 0 && (FLAGS[g[i - 1].el.dur.base] ?? 0) >= L
        if (nextHas) out.push(<line key={`bm${g[i].id}-${L}`} x1={sx(g[i])} x2={sx(g[i + 1])} y1={stemEndY + dy} y2={stemEndY + dy} stroke={INK} strokeWidth={4.2} />)
        else if (!prevHas) { const dir = i + 1 < g.length ? 1 : -1; out.push(<line key={`bs${g[i].id}-${L}`} x1={sx(g[i])} x2={sx(g[i]) + dir * 9} y1={stemEndY + dy} y2={stemEndY + dy} stroke={INK} strokeWidth={4.2} />) }
        else if (L > 1 && !nextHas && prevHas) { /* 前とつながっている */ }
      }
    }
  }
  // 連符の括弧
  let i = 0
  while (i < els.length) {
    const e = els[i]
    if (!e.el.dur.tuplet) { i++; continue }
    let j = i
    while (j < els.length && els[j].el.dur.tuplet && els[j].el.dur.tuplet!.actual === e.el.dur.tuplet.actual) j++
    const g = els.slice(i, j)
    const ys = g.flatMap((x) => [...x.heads.map((h) => h.y), beamed.get(x.id)?.stemEndY ?? (x.stemUp ? Math.min(...x.heads.map((h) => h.y), 999) - 3.6 * SP : 999)])
    const y = Math.min(...ys.filter((v) => Number.isFinite(v)), STAFF_TOP) - 8
    const x1 = g[0].x - 6, x2 = g[g.length - 1].x + 6
    out.push(<path key={`tp${e.id}`} d={`M${x1} ${y + 5} v-5 H${(x1 + x2) / 2 - 7} M${(x1 + x2) / 2 + 7} ${y} H${x2} v5`} fill="none" stroke={INK} strokeWidth={0.9} />)
    out.push(<text key={`tn${e.id}`} x={(x1 + x2) / 2} y={y + 3.5} fontSize={9.5} fontStyle="italic" fontWeight={700} fill={INK} textAnchor="middle" fontFamily="Georgia, serif">{e.el.dur.tuplet.actual}</text>)
    i = j
  }
  // 音ごと
  els.forEach((le, k) => {
    const e = le.el
    const selected = sel.has(e.id)
    const color = playingId === e.id ? GOLD : selected ? BLUE : INK
    const b = beamed.get(e.id)
    const up = b ? b.up : e.grace ? true : le.stemUp
    if (e.kind === "rest") {
      out.push(<Rest key={e.id} le={le} color={color} onDown={(ev) => onHeadDown(ev, e.id, 0)} />)
    } else {
      const flags = FLAGS[e.dur.base] ?? 0
      const hollow = e.dur.base === "w" || e.dur.base === "h"
      const hx = le.x
      const headYs = le.heads.map((h) => h.y)
      const stemX = up ? hx + 5.4 : hx - 5.4
      const stemLen = (e.grace ? 2.6 : 3.5) * SP
      const stemEnd = b ? b.stemEndY : up ? Math.min(...headYs) - stemLen : Math.max(...headYs) + stemLen
      // 加線
      const lowDi = Math.min(...le.heads.map((h) => h.di)), highDi = Math.max(...le.heads.map((h) => h.di))
      for (let d = 28; d >= lowDi; d -= 2) out.push(<line key={`ll${e.id}${d}`} x1={hx - 9} x2={hx + 9} y1={yOfDi(d)} y2={yOfDi(d)} stroke={INK} strokeWidth={0.9} />)
      for (let d = 40; d <= highDi; d += 2) out.push(<line key={`lh${e.id}${d}`} x1={hx - 9} x2={hx + 9} y1={yOfDi(d)} y2={yOfDi(d)} stroke={INK} strokeWidth={0.9} />)
      // 符幹
      if (e.dur.base !== "w") {
        const y0 = up ? Math.max(...headYs) : Math.min(...headYs)
        out.push(<line key={`st${e.id}`} x1={stemX} x2={stemX} y1={y0} y2={stemEnd} stroke={color} strokeWidth={1.1} />)
        if (e.grace) out.push(<line key={`gs${e.id}`} x1={stemX - 5} x2={stemX + 5} y1={stemEnd + 9} y2={stemEnd + 3} stroke={color} strokeWidth={1} />)
        // 旗 (連桁でないとき)
        if (!b) for (let f = 0; f < flags; f++) {
          const fy = stemEnd + (up ? 1 : -1) * f * 6
          out.push(<path key={`fl${e.id}${f}`} d={up ? `M${stemX} ${fy} c 2 6, 10 6, 8 16 c 0 -7, -4 -9, -8 -10 z` : `M${stemX} ${fy} c 2 -6, 10 -6, 8 -16 c 0 7, -4 9, -8 10 z`} fill={color} />)
        }
        // トレモロ (符幹に 3 本の斜線)
        if (e.arts.includes("tremolo")) {
          const cy = (y0 + stemEnd) / 2
          for (let t = -1; t <= 1; t++) out.push(<line key={`tr${e.id}${t}`} x1={stemX - 5} x2={stemX + 5} y1={cy + t * 4 + 2} y2={cy + t * 4 - 2} stroke={color} strokeWidth={2} />)
        }
      }
      // 符頭 ・ 臨時記号 ・ 付点
      le.heads.forEach((h, hi) => {
        const x = h.shift ? hx + 10.5 : hx
        const isHeadSel = headSel?.id === e.id && headSel.hi === hi
        const hc = isHeadSel ? "#7c2bc4" : color
        out.push(
          <g key={`h${e.id}${hi}`} style={{ cursor: "ns-resize" }} onPointerDown={(ev) => onHeadDown(ev, e.id, hi)}>
            <rect x={x - 9} y={h.y - 7} width={18} height={14} fill="transparent" />
            {e.dur.base === "w"
              ? <ellipse cx={x} cy={h.y} rx={e.grace ? 5 : 7} ry={4.4} fill="none" stroke={hc} strokeWidth={2.2} />
              : <ellipse cx={x} cy={h.y} rx={e.grace ? 4.6 : 6.2} ry={e.grace ? 3.2 : 4.3} transform={`rotate(-20 ${x} ${h.y})`} fill={hollow ? "none" : hc} stroke={hc} strokeWidth={hollow ? 2 : 1} />}
          </g>,
        )
        if (h.acc) {
          const t = accText(h.acc.kind)
          out.push(<text key={`ac${e.id}${hi}`} x={x - 10} y={h.y + 3.8} fontFamily={MUSIC_FONT} fontSize={2.1 * SP} fill={color} textAnchor="middle">{h.acc.cautionary ? `(${t})` : t}</text>)
        }
        for (let d = 0; d < e.dur.dots; d++) {
          const dy = h.di % 2 === 0 ? -SP / 2 : 0   // 線の上の音は点を上の間に
          out.push(<circle key={`dt${e.id}${hi}${d}`} cx={x + 11 + d * 5} cy={h.y + dy} r={1.6} fill={color} />)
        }
        // ハーモニクス
        if (e.special === "harmonic") out.push(<circle key={`hm${e.id}${hi}`} cx={x} cy={(up ? Math.max(...headYs) : Math.min(...headYs)) + (up ? 1 : -1) * 1.3 * SP} r={2.6} fill="none" stroke={color} strokeWidth={1} />)
      })
      // タイ (次の音が同じ高さ)
      if (e.tie === "start" || e.tie === "both") {
        const next = k + 1 < els.length ? els[k + 1] : (layout.measures[m.mIdx + 1]?.elements[0] ?? null)
        const nx = next && next.mIdx === m.mIdx + 1 && layout.measures[m.mIdx + 1].sysIdx !== m.sysIdx ? le.x + 30 : next ? next.x : le.x + 30
        le.heads.forEach((h, hi) => {
          const dir = up ? 1 : -1   // 符幹の反対側へ膨らむ
          out.push(<path key={`tie${e.id}${hi}`} d={`M${le.x + 7} ${h.y + dir * 4} Q${(le.x + nx) / 2} ${h.y + dir * 12} ${nx - 7} ${h.y + dir * 4}`} fill="none" stroke={color} strokeWidth={1.3} />)
        })
      }
      // 音符の下の記号 (符幹の反対側): 奏法
      const artSideY = up ? Math.max(...headYs) + 1.1 * SP : Math.min(...headYs) - 1.1 * SP
      let ay = artSideY
      const step = up ? 8 : -8
      for (const a of e.arts) {
        if (a === "tremolo") continue
        out.push(<ArtGlyph key={`art${e.id}${a}`} art={a} x={hx} y={ay} up={up} color={color} />)
        ay += step
      }
      if (e.orn) {
        const t = e.orn === "trill" ? "tr" : e.orn === "mordent" ? "𝆗" : "𝆖"
        out.push(<text key={`orn${e.id}`} x={hx} y={Math.min(stemEnd, Math.min(...headYs)) - 1.2 * SP} fontSize={11} fontStyle="italic" fontWeight={700} fill={color} textAnchor="middle" fontFamily={`Georgia, ${MUSIC_FONT}`}>{t}</text>)
      }
      // 上の段: 弓 ・ 指 ・ 弦 ・ sul ・ pizz
      const topY = Math.min(stemEnd, Math.min(...headYs), STAFF_TOP) - 1.4 * SP
      let ty = topY
      if (e.orn) ty -= 10
      const fingers = le.heads.map((h) => e.heads[le.heads.indexOf(h)].finger).filter((f): f is 0 | 1 | 2 | 3 | 4 => f != null)
      if (fingers.length) {
        // 重音は上の音の指を上に (縦に積む)
        ;[...fingers].reverse().forEach((f, i) => out.push(<text key={`fg${e.id}${i}`} x={hx} y={ty - (fingers.length - 1 - i) * 10} fontSize={10.5} fontWeight={700} fill={color} textAnchor="middle" fontFamily="system-ui, sans-serif">{f}</text>))
        ty -= 11 + (fingers.length - 1) * 10
      }
      if (e.bow) {
        out.push(e.bow === "up"
          ? <path key={`bw${e.id}`} d={`M${hx - 4} ${ty - 8} L${hx} ${ty} L${hx + 4} ${ty - 8}`} fill="none" stroke={color} strokeWidth={1.3} />
          : <path key={`bw${e.id}`} d={`M${hx - 5} ${ty} v-7 h10 v7`} fill="none" stroke={color} strokeWidth={1.3} />)
        ty -= 11
      }
      const strings = Array.from(new Set(e.heads.map((h) => h.string).filter((s): s is StringId => !!s)))
      if (e.sul) { out.push(<text key={`sul${e.id}`} x={hx} y={ty} fontSize={9} fontStyle="italic" fill={color} textAnchor="middle" fontFamily="Georgia, serif">sul {e.sul}</text>); ty -= 10 }
      if (e.special === "pizz" || e.special === "arco") { out.push(<text key={`sp${e.id}`} x={hx} y={ty} fontSize={9.5} fontStyle="italic" fill={color} textAnchor="middle" fontFamily="Georgia, serif">{e.special === "pizz" ? "pizz." : "arco"}</text>); ty -= 10 }
      // 下の段: 弦 ・ 強弱 ・ 松葉
      const underY = STAFF_TOP + 4 * SP + 1.5 * SP + Math.max(0, Math.max(...headYs, up ? 0 : stemEnd) - (STAFF_TOP + 4 * SP))
      if (strings.length) {
        strings.forEach((s, si) => out.push(
          <g key={`str${e.id}${s}`}>
            <rect x={hx - 6 + si * 13} y={underY - 8} width={12} height={11} rx={2.5} fill="none" stroke={color} strokeWidth={0.9} />
            <text x={hx + si * 13} y={underY + 0.5} fontSize={8.5} fontWeight={700} fill={color} textAnchor="middle" fontFamily="system-ui, sans-serif">{s}</text>
          </g>,
        ))
      }
      if (e.dyn) out.push(<text key={`dyn${e.id}`} x={hx} y={underY + 17} fontSize={12} fontStyle="italic" fontWeight={700} fill={color} textAnchor="middle" fontFamily="Georgia, serif">{e.dyn}</text>)
      if (e.wedge === "cresc" || e.wedge === "dim") {
        // 次の wedge (stop か別の始まり) まで、無ければ小節の終わりまで
        let end: LaidElement | null = null
        const flat = layout.measures.flatMap((q) => q.elements)
        const idx = flat.findIndex((q) => q.id === e.id)
        for (let q = idx + 1; q < flat.length; q++) if (flat[q].el.wedge) { end = flat[q]; break }
        const x2 = end && end.mIdx <= m.mIdx + 1 && layout.measures[end.mIdx].sysIdx === m.sysIdx ? end.x - 4 : m.x + m.width - 6
        const y = underY + 15
        out.push(e.wedge === "cresc"
          ? <path key={`wg${e.id}`} d={`M${x2} ${y - 4} L${hx + 8} ${y} L${x2} ${y + 4}`} fill="none" stroke={color} strokeWidth={1} />
          : <path key={`wg${e.id}`} d={`M${hx + 8} ${y - 4} L${x2} ${y} L${hx + 8} ${y + 4}`} fill="none" stroke={color} strokeWidth={1} />)
      }
      if (e.special === "gliss") {
        const next = k + 1 < els.length ? els[k + 1] : null
        if (next && next.heads.length) out.push(<line key={`gl${e.id}`} x1={hx + 8} x2={next.x - 8} y1={headYs[headYs.length - 1]} y2={next.heads[next.heads.length - 1].y} stroke={color} strokeWidth={1} strokeDasharray="3 2" />)
      }
    }
  })
  return <g>{out}</g>
}

function ArtGlyph({ art, x, y, up, color }: { art: string; x: number; y: number; up: boolean; color: string }) {
  switch (art) {
    case "staccato": case "bow_staccato": return <circle cx={x} cy={y} r={1.8} fill={color} />
    case "staccatissimo": return <path d={up ? `M${x - 2} ${y - 4} L${x} ${y + 3} L${x + 2} ${y - 4} z` : `M${x - 2} ${y + 4} L${x} ${y - 3} L${x + 2} ${y + 4} z`} fill={color} />
    case "tenuto": return <line x1={x - 5} x2={x + 5} y1={y} y2={y} stroke={color} strokeWidth={1.8} />
    case "legato": return <text x={x} y={y + 3} fontSize={7.5} fontStyle="italic" fill={color} textAnchor="middle" fontFamily="Georgia, serif">leg.</text>
    case "portato": return <g><line x1={x - 5} x2={x + 5} y1={y + 2} y2={y + 2} stroke={color} strokeWidth={1.6} /><circle cx={x} cy={y - 2.5} r={1.6} fill={color} /></g>
    case "accent": return <path d={`M${x - 5} ${y - 3.5} L${x + 5} ${y} L${x - 5} ${y + 3.5}`} fill="none" stroke={color} strokeWidth={1.3} />
    case "martele": return <path d={up ? `M${x - 4.5} ${y + 4} L${x} ${y - 4} L${x + 4.5} ${y + 4}` : `M${x - 4.5} ${y - 4} L${x} ${y + 4} L${x + 4.5} ${y - 4}`} fill="none" stroke={color} strokeWidth={1.6} />
    case "spiccato": return <g><circle cx={x} cy={y} r={1.8} fill={color} /><text x={x} y={y + (up ? 10 : -5)} fontSize={7} fontStyle="italic" fill={color} textAnchor="middle" fontFamily="Georgia, serif">spicc.</text></g>
    default: return null
  }
}

function Rest({ le, color, onDown }: { le: LaidElement; color: string; onDown: (e: RPE) => void }) {
  const x = le.x, b = le.el.dur.base
  const mid = STAFF_TOP + 2 * SP
  let body: React.ReactNode
  if (b === "w") body = <rect x={x - 6} y={STAFF_TOP + SP} width={12} height={SP / 2} fill={color} />
  else if (b === "h") body = <rect x={x - 6} y={mid - SP / 2} width={12} height={SP / 2} fill={color} />
  else if (b === "q") body = <path d={`M${x - 2} ${mid - 1.6 * SP} l6 7 l-6 7 c3 3, 6 4, 4 9 c-4 -4, -7 -3, -6 1 c-2 -5, 1 -8, 4 -8 l-5 -6 l5 -7 z`} fill={color} />
  else {
    const n = FLAGS[b] ?? 1
    const top = mid - SP + (n - 1) * -5
    body = (
      <g>
        <line x1={x + 4} x2={x - 3} y1={top} y2={mid + SP + (n - 1) * 3} stroke={color} strokeWidth={1.4} />
        {Array.from({ length: n }).map((_, i) => <g key={i}><circle cx={x - 3} cy={top + 2 + i * 6} r={2.2} fill={color} /><path d={`M${x - 3} ${top + 2 + i * 6} q4 4, 7 -2`} fill="none" stroke={color} strokeWidth={1.2} /></g>)}
      </g>
    )
  }
  return (
    <g style={{ cursor: "pointer" }} onPointerDown={onDown}>
      <rect x={x - 9} y={STAFF_TOP - 4} width={18} height={4 * SP + 8} fill="transparent" />
      {body}
      {Array.from({ length: le.el.dur.dots }).map((_, d) => <circle key={d} cx={x + 10 + d * 5} cy={mid - SP / 2} r={1.6} fill={color} />)}
    </g>
  )
}

// ───────────────────────── スラー (段ごとに描く ・ 段をまたぐときは分ける) ─────────────────────────
function Slurs({ layout, sysIdx }: { layout: Layout; sysIdx: number }) {
  const flat = layout.measures.flatMap((m) => m.elements)
  const out: React.ReactNode[] = []
  const open = new Map<number, LaidElement>()
  flat.forEach((le) => {
    for (const n of le.el.slurStop) {
      const s = open.get(n)
      if (!s) continue
      open.delete(n)
      const sSys = layout.measures[s.mIdx].sysIdx, eSys = layout.measures[le.mIdx].sysIdx
      const between = flat.slice(flat.indexOf(s), flat.indexOf(le) + 1)
      if (sSys === sysIdx && eSys === sysIdx) out.push(<SlurArc key={`sl${n}${s.id}`} x1={s.x} x2={le.x} els={between} />)
      else if (sSys === sysIdx) out.push(<SlurArc key={`sl${n}${s.id}a`} x1={s.x} x2={layout.systems[sysIdx].x1 - 6} els={between.filter((q) => layout.measures[q.mIdx].sysIdx === sysIdx)} />)
      else if (eSys === sysIdx) out.push(<SlurArc key={`sl${n}${s.id}b`} x1={layout.systems[sysIdx].measures[0].contentX} x2={le.x} els={between.filter((q) => layout.measures[q.mIdx].sysIdx === sysIdx)} />)
      else if (sSys < sysIdx && eSys > sysIdx) out.push(<SlurArc key={`sl${n}${s.id}c`} x1={layout.systems[sysIdx].measures[0].contentX} x2={layout.systems[sysIdx].x1 - 6} els={between.filter((q) => layout.measures[q.mIdx].sysIdx === sysIdx)} />)
    }
    for (const n of le.el.slurStart) open.set(n, le)
  })
  return <g>{out}</g>
}
function SlurArc({ x1, x2, els }: { x1: number; x2: number; els: LaidElement[] }) {
  const ys = els.flatMap((e) => e.heads.map((h) => h.y))
  const top = (ys.length ? Math.min(...ys) : STAFF_TOP) - 1.6 * SP
  const y = Math.min(top, STAFF_TOP - 0.6 * SP)
  return <path d={`M${x1} ${y + 4} Q${(x1 + x2) / 2} ${y - 12} ${x2} ${y + 4}`} fill="none" stroke={INK} strokeWidth={1.4} />
}

export type { KeySig }
