"use client"
/**
 * スコアを自分で作る ・ 画面 (要件定義 v1 の全項目を一度に)。
 * 五線譜が主役。音は「空いた場所を押す」「Enter」「並べる」で足し、上下に引くか矢印で高さを変える。
 * 右の板: 音符 / 弦と指 / 記号 / 小節 / 並べる / 登録。下の帯: いまの問題 (押すとその場所へ)。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import styles from "./author.module.css"
import StaffCanvas, { type Selection } from "./StaffCanvas"
import OsmdPreview from "./OsmdPreview"
import { playScore } from "./playback"
import {
  ARTICULATION_DEFS, DIRECTION_DEFS, DUR_BASES, DYNAMICS, ORNAMENT_DEFS, SPECIAL_DEFS, STRINGS, TIME_SIGS, TUPLETS,
  durQl, effectiveKey, effectiveTime, elementsQl, emptyMeasure, measureQl, newId, newNote, newRest,
  type AuthorCategory, type AuthorScore, type Direction, type DurBase, type Duration, type Element, type KeySig, type Measure, type Pitch, type StringId, type TimeSig, type Tuplet,
} from "@/app/_libs/author/model"
import {
  KEY_CHOICES, PRESETS, autoFingerAll, autoStringFinger, fingerChoices, generateArpeggio, generateScale, keyAlter, keyLabel, midiOf, parseShorthand, pitchKana, pitchName, positionOf, respell, semitone, stepInKey, tonicPitchClass,
  type ScaleKind, type ArpKind,
} from "@/app/_libs/author/pitch"
import { buildMusicXml } from "@/app/_libs/author/musicxml"
import { validateScore, type Problem } from "@/app/_libs/author/validate"
import { createAuthoredScore, updateAuthoredScore } from "@/app/actions/authorScore"
import { ARTICULATIONS } from "@/app/_libs/materialVariant"
import { STANDARD_ARTICULATIONS } from "@/app/_libs/articulationPatterns"
import { CATEGORY_LABELS } from "@/app/_libs/practiceConstants"

type Group = { id: string; category: string; title: string }
type Props = {
  userId: string
  groups: Group[]
  initial: { itemId: string; score: AuthorScore; star: number } | null
}
type Tab = "note" | "finger" | "mark" | "measure" | "arrange" | "register"
const CATS: AuthorCategory[] = ["scale", "arpeggio", "bowing", "fingering"]
const EXPAND_CATS = ["scale", "arpeggio", "fingering"]

function freshScore(): AuthorScore {
  return { version: 1, title: "", composer: "", category: "scale", time: { beats: 4, beatType: 4 }, key: { fifths: 0, mode: "major" }, tempoMin: 60, tempoMax: 100, articulation: null, measures: [emptyMeasure(), emptyMeasure(), emptyMeasure(), emptyMeasure()] }
}
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))
const REST_FILL: DurBase[] = ["w", "h", "q", "e", "s", "t", "x"]

/** 残りの拍を休符で埋める */
export function restsFor(remain: number): Element[] {
  const out: Element[] = []
  let r = Math.round(remain * 1e6) / 1e6
  for (const b of REST_FILL) {
    const ql = DUR_BASES.find((d) => d.id === b)!.ql
    while (r >= ql - 1e-6) { out.push(newRest({ base: b, dots: 0, tuplet: null })); r = Math.round((r - ql) * 1e6) / 1e6 }
  }
  return out
}
/** 音の列を拍子どおりに小節へ詰める */
export function packIntoMeasures(els: Element[], time: TimeSig): Measure[] {
  const full = measureQl(time)
  const out: Measure[] = []
  let cur: Element[] = []
  let used = 0
  for (const e of els) {
    const ql = e.grace ? 0 : durQl(e.dur)
    if (used + ql > full + 1e-6 && cur.length) { out.push(emptyMeasure({ elements: [...cur, ...restsFor(full - used)] })); cur = []; used = 0 }
    cur.push(e); used += ql
    if (Math.abs(used - full) < 1e-6) { out.push(emptyMeasure({ elements: cur })); cur = []; used = 0 }
  }
  if (cur.length) out.push(emptyMeasure({ elements: [...cur, ...restsFor(full - used)] }))
  return out.length ? out : [emptyMeasure()]
}

export default function AuthorEditor({ userId, groups, initial }: Props) {
  const [score, setScore] = useState<AuthorScore>(() => initial?.score ?? freshScore())
  const past = useRef<AuthorScore[]>([])
  const future = useRef<AuthorScore[]>([])
  const [histN, setHistN] = useState(0)
  const [sel, setSel] = useState<Selection>({ ids: [], anchor: null, head: null, measures: [] })
  const [curDur, setCurDur] = useState<Duration>({ base: "q", dots: 0, tuplet: null })
  const [zoom, setZoom] = useState(1.15)
  const [tab, setTab] = useState<Tab>("note")
  const [msg, setMsg] = useState("")
  const [confirm, setConfirm] = useState<{ xml: string; problems: Problem[] } | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<{ itemId: string } | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const player = useRef<{ stop: () => void } | null>(null)
  const clip = useRef<Element[]>([])
  const dragSnap = useRef<AuthorScore | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [wrapW, setWrapW] = useState(900)
  const [draft, setDraft] = useState<AuthorScore | null>(null)
  const [tupletN, setTupletN] = useState("5"), [tupletM, setTupletM] = useState("4")
  const [pitchText, setPitchText] = useState("")
  const DRAFT_KEY = "arcoda_author_draft"
  // 登録の項目
  const [star, setStar] = useState(initial?.star ?? 2)
  const [joinGroupId, setJoinGroupId] = useState("")
  const [descShort, setDescShort] = useState("")
  const [desc, setDesc] = useState("")
  const [expandAllKeys, setExpandAllKeys] = useState(false)
  const [stdArts, setStdArts] = useState(false)
  const [artIds, setArtIds] = useState<Set<string>>(new Set(STANDARD_ARTICULATIONS.map((a) => a.id)))

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setWrapW(Math.max(480, el.clientWidth - 24)))
    ro.observe(el)
    setWrapW(Math.max(480, el.clientWidth - 24))
    return () => ro.disconnect()
  }, [])

  // 下書き: 作っている内容をこのブラウザに残し、次に開いたとき続きから (登録済みの直しは対象外)
  useEffect(() => {
    if (initial) return
    try { const raw = localStorage.getItem(DRAFT_KEY); if (raw) { const d = JSON.parse(raw) as AuthorScore; if (d.measures?.some((m) => m.elements.length) || d.title) setDraft(d) } } catch { /* noop */ }
  }, [initial])
  useEffect(() => {
    if (initial) return
    const t = setTimeout(() => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(score)) } catch { /* noop */ } }, 400)
    return () => clearTimeout(t)
  }, [score, initial])

  const problems = useMemo(() => validateScore(score), [score])
  const errors = problems.filter((p) => p.level === "error")
  const errorMeasures = useMemo(() => new Set(problems.filter((p) => p.level === "error" && p.measure > 0).map((p) => p.measure)), [problems])

  // ───────── 履歴 ─────────
  const commit = useCallback((next: AuthorScore) => {
    past.current.push(score)
    if (past.current.length > 300) past.current.shift()
    future.current = []
    setScore(next)
    setHistN((n) => n + 1)
  }, [score])
  const undo = () => { const p = past.current.pop(); if (!p) return; future.current.push(score); setScore(p); setHistN((n) => n + 1) }
  const redo = () => { const f = future.current.pop(); if (!f) return; past.current.push(score); setScore(f); setHistN((n) => n + 1) }

  // ───────── 選択の道具 ─────────
  const flat = useMemo(() => score.measures.flatMap((m, mIdx) => m.elements.map((el, eIdx) => ({ mIdx, eIdx, el }))), [score])
  const selected = useMemo(() => flat.filter((f) => sel.ids.includes(f.el.id)), [flat, sel.ids])
  const selSet = useMemo(() => new Set(sel.ids), [sel.ids])
  const selectIds = (ids: string[], anchor?: string | null, head?: Selection["head"]) => setSel({ ids, anchor: anchor ?? ids[0] ?? null, head: head ?? null, measures: [] })

  const onSelect = (id: string, hi: number, mode: "set" | "add" | "range") => {
    if (mode === "set") { selectIds([id], id, { id, hi }); return }
    if (mode === "add") { const ids = selSet.has(id) ? sel.ids.filter((x) => x !== id) : [...sel.ids, id]; setSel({ ids, anchor: sel.anchor ?? id, head: null, measures: [] }); return }
    const a = flat.findIndex((f) => f.el.id === (sel.anchor ?? id)), b = flat.findIndex((f) => f.el.id === id)
    const [lo, hi2] = a < b ? [a, b] : [b, a]
    setSel({ ids: flat.slice(lo, hi2 + 1).map((f) => f.el.id), anchor: sel.anchor ?? id, head: null, measures: [] })
  }
  const onSelectMeasure = (mIdx: number, mode: "set" | "add") => {
    const measures = mode === "set" ? [mIdx] : sel.measures.includes(mIdx) ? sel.measures.filter((x) => x !== mIdx) : [...sel.measures, mIdx].sort((a, b) => a - b)
    const ids = measures.flatMap((i) => score.measures[i].elements.map((e) => e.id))
    setSel({ ids, anchor: ids[0] ?? null, head: null, measures })
  }
  const clearSel = () => setSel({ ids: [], anchor: null, head: null, measures: [] })

  /** 選ばれている音 (または小節) を書き換える */
  const mapSelected = (fn: (e: Element, ctx: { mIdx: number; eIdx: number; key: KeySig }) => Element) => {
    if (!sel.ids.length) { setMsg("先に音を選んでください"); return }
    const next = clone(score)
    next.measures.forEach((m, mIdx) => { m.elements = m.elements.map((e, eIdx) => (selSet.has(e.id) ? fn(e, { mIdx, eIdx, key: effectiveKey(score, mIdx) }) : e)) })
    commit(next)
  }
  /** 挿入位置: 選んだ音の直後 → 選んだ小節の終わり → 最後の小節の終わり */
  const insertionPoint = (): { mIdx: number; eIdx: number } => {
    if (selected.length) { const last = selected[selected.length - 1]; return { mIdx: last.mIdx, eIdx: last.eIdx + 1 } }
    if (sel.measures.length) { const mIdx = sel.measures[sel.measures.length - 1]; return { mIdx, eIdx: score.measures[mIdx].elements.length } }
    const mIdx = Math.max(0, score.measures.length - 1)
    return { mIdx, eIdx: score.measures[mIdx]?.elements.length ?? 0 }
  }
  const prevNoteBefore = (mIdx: number, eIdx: number): Element | null => {
    const idx = flat.findIndex((f) => f.mIdx === mIdx && f.eIdx === eIdx)
    const list = idx < 0 ? flat : flat.slice(0, idx)
    for (let i = list.length - 1; i >= 0; i--) if (list[i].el.kind === "note") return list[i].el
    return null
  }
  const insertElements = (els: Element[], at?: { mIdx: number; eIdx: number }) => {
    const p = at ?? insertionPoint()
    const next = clone(score)
    if (!next.measures.length) next.measures.push(emptyMeasure())
    const m = next.measures[Math.min(p.mIdx, next.measures.length - 1)]
    m.elements.splice(p.eIdx, 0, ...els)
    commit(next)
    selectIds(els.map((e) => e.id), els[0]?.id, els.length === 1 && els[0].kind === "note" ? { id: els[0].id, hi: 0 } : null)
  }
  const fingerFor = (pitch: Pitch, prev: Element | null) => {
    const ph = prev?.heads[prev.heads.length - 1]
    const prevCtx = ph?.string && ph.finger != null ? (() => { const r = positionOf(ph.pitch, ph.string!, ph.finger!); return r.pos != null ? { string: ph.string!, pos: r.pos === 0 ? 1 : r.pos } : null })() : null
    const a = autoStringFinger(pitch, prevCtx)
    return a ? { string: a.string, finger: a.finger } : { string: null, finger: null }
  }
  const addNote = (pitch?: Pitch) => {
    const p = insertionPoint()
    const prev = prevNoteBefore(p.mIdx, p.eIdx)
    const key = effectiveKey(score, p.mIdx)
    const t = tonicPitchClass(key)
    const pitch2 = pitch ?? prev?.heads[0].pitch ?? { step: t.step, alter: t.alter, octave: 4 }
    insertElements([newNote(pitch2, { ...curDur }, fingerFor(pitch2, prev))], p)
  }
  const addRest = () => insertElements([newRest({ ...curDur })])
  const onAddAt = (mIdx: number, di: number) => {
    const key = effectiveKey(score, mIdx)
    const step = (["C", "D", "E", "F", "G", "A", "B"] as const)[((di % 7) + 7) % 7]
    const pitch: Pitch = { step, alter: keyAlter(key, step), octave: Math.floor(di / 7) }
    const midi = midiOf(pitch)
    if (midi < 55 || midi > 100) { setMsg(`${pitchKana(pitch)}${pitch.octave} はバイオリンの音域の外です`); return }
    const eIdx = score.measures[mIdx].elements.length
    insertElements([newNote(pitch, { ...curDur }, fingerFor(pitch, prevNoteBefore(mIdx, eIdx)))], { mIdx, eIdx })
  }
  const deleteSelected = () => {
    if (sel.measures.length && sel.ids.length === 0) { deleteMeasures(); return }
    if (!sel.ids.length) return
    const next = clone(score)
    next.measures.forEach((m) => { m.elements = m.elements.filter((e) => !selSet.has(e.id)) })
    // 消した音を指すスラーの番号を掃除
    const starts = new Set<number>(), stops = new Set<number>()
    next.measures.forEach((m) => m.elements.forEach((e) => { e.slurStart.forEach((n) => starts.add(n)); e.slurStop.forEach((n) => stops.add(n)) }))
    next.measures.forEach((m) => m.elements.forEach((e) => { e.slurStart = e.slurStart.filter((n) => stops.has(n)); e.slurStop = e.slurStop.filter((n) => starts.has(n)) }))
    commit(next)
    clearSel()
  }

  // ───────── 高さ ─────────
  const movePitch = (steps: number, mode: "key" | "semi" | "octave", base?: AuthorScore, live = false) => {
    const src = base ?? score
    const next = clone(src)
    const onlyHead = sel.head
    const flatNext = next.measures.flatMap((m) => m.elements)
    next.measures.forEach((m, mIdx) => {
      const key = effectiveKey(src, mIdx)
      m.elements.forEach((e) => {
        if (!selSet.has(e.id) || e.kind !== "note") return
        // 高さを変えたら弦と指は前の音の文脈で付け直す (前の弦 ・ 指のまま高いポジションに飛ばない)
        const prevEl = (() => { const i = flatNext.indexOf(e); for (let k = i - 1; k >= 0; k--) if (flatNext[k].kind === "note") return flatNext[k]; return null })()
        const ph = prevEl?.heads[prevEl.heads.length - 1]
        const prevCtx = ph?.string && ph.finger != null ? (() => { const r = positionOf(ph.pitch, ph.string!, ph.finger!); return r.pos != null ? { string: ph.string!, pos: r.pos === 0 ? 1 : r.pos } : null })() : null
        e.heads.forEach((h, hi) => {
          if (onlyHead && sel.ids.length === 1 && hi !== onlyHead.hi) return
          let p = h.pitch
          for (let i = 0; i < Math.abs(steps); i++) {
            const dir = steps > 0 ? 1 : -1
            p = mode === "key" ? stepInKey(p, dir, key) : mode === "semi" ? semitone(p, dir) : { ...p, octave: p.octave + dir }
          }
          const midi = midiOf(p)
          if (midi < 55 || midi > 100) return
          h.pitch = p
          if (h.string && h.finger != null) {
            const a = autoStringFinger(p, prevCtx)
            h.string = a?.string ?? null; h.finger = a?.finger ?? null
          }
        })
        e.heads.sort((a, b) => midiOf(a.pitch) - midiOf(b.pitch))
      })
    })
    if (live) setScore(next)
    else commit(next)
    return next
  }
  const onDragSteps = (d: number) => {
    if (!dragSnap.current) dragSnap.current = score
    movePitch(d, "key", undefined, true)
  }
  const onDragEnd = () => {
    if (!dragSnap.current) return
    const snap = dragSnap.current
    dragSnap.current = null
    if (JSON.stringify(snap) !== JSON.stringify(score)) { past.current.push(snap); future.current = []; setHistN((n) => n + 1) }
  }

  // ───────── 長さ ・ タイ ・ 装飾 ・ 重音 ─────────
  const setDurBase = (base: DurBase) => { setCurDur((d) => ({ ...d, base })); if (sel.ids.length) mapSelected((e) => ({ ...e, dur: { ...e.dur, base } })) }
  const setDots = (dots: 0 | 1 | 2) => { setCurDur((d) => ({ ...d, dots })); if (sel.ids.length) mapSelected((e) => ({ ...e, dur: { ...e.dur, dots } })) }
  const setTuplet = (t: Tuplet | null) => { setCurDur((d) => ({ ...d, tuplet: t })); if (sel.ids.length) mapSelected((e) => ({ ...e, dur: { ...e.dur, tuplet: t } })) }
  const toggleTie = () => {
    if (!selected.length) { setMsg("タイでつなぐ音を選んでください"); return }
    const next = clone(score)
    const nf = next.measures.flatMap((m) => m.elements)
    for (const s of selected) {
      const i = nf.findIndex((e) => e.id === s.el.id)
      const e = nf[i], n = nf[i + 1]
      if (!e || e.kind !== "note") continue
      if (e.tie === "start" || e.tie === "both") {
        e.tie = e.tie === "both" ? "stop" : null
        if (n && (n.tie === "stop" || n.tie === "both")) n.tie = n.tie === "both" ? "start" : null
      } else if (n && n.kind === "note") {
        e.tie = e.tie === "stop" ? "both" : "start"
        n.tie = n.tie === "start" ? "both" : "stop"
        n.heads = e.heads.map((h) => ({ ...h }))   // タイは同じ高さ
      }
    }
    commit(next)
  }
  const slurSelection = () => {
    if (selected.length < 2) { setMsg("スラーは 2 つ以上の音を選んで結びます") ; return }
    const used = flat.flatMap((f) => [...f.el.slurStart, ...f.el.slurStop])
    const n = (used.length ? Math.max(...used) : 0) + 1
    const first = selected[0].el.id, last = selected[selected.length - 1].el.id
    const next = clone(score)
    next.measures.forEach((m) => m.elements.forEach((e) => { if (e.id === first) e.slurStart.push(n); if (e.id === last) e.slurStop.push(n) }))
    commit(next)
  }
  const unslurSelection = () => {
    const nums = new Set(selected.flatMap((s) => [...s.el.slurStart, ...s.el.slurStop]))
    if (!nums.size) { setMsg("選んだ音にスラーはありません"); return }
    const next = clone(score)
    next.measures.forEach((m) => m.elements.forEach((e) => { e.slurStart = e.slurStart.filter((x) => !nums.has(x)); e.slurStop = e.slurStop.filter((x) => !nums.has(x)) }))
    commit(next)
  }
  const addChordHead = () => mapSelected((e, ctx) => {
    if (e.kind !== "note") return e
    const top = e.heads[e.heads.length - 1]
    let p = stepInKey(top.pitch, 1, ctx.key); p = stepInKey(p, 1, ctx.key)
    if (midiOf(p) > 100) return e
    // 使っていない弦の中で、いちばん低いポジションで取れる弦と指
    const used = new Set(e.heads.map((h) => h.string))
    let sf: { string: StringId | null; finger: 0 | 1 | 2 | 3 | 4 | null } = { string: null, finger: null }
    let best = Infinity
    for (const s of STRINGS) { if (used.has(s)) continue; const c = fingerChoices(p, s)[0]; if (c && c.pos < best) { best = c.pos; sf = { string: s, finger: c.finger } } }
    return { ...e, heads: [...e.heads, { pitch: p, ...sf }].sort((a, b) => midiOf(a.pitch) - midiOf(b.pitch)) }
  })
  const removeChordHead = () => {
    if (!sel.head) { setMsg("消す音を符頭で選んでください"); return }
    const h = sel.head
    mapSelected((e) => (e.id === h.id && e.heads.length > 1 ? { ...e, heads: e.heads.filter((_, i) => i !== h.hi) } : e))
    setSel((s) => ({ ...s, head: null }))
  }
  const toggleGrace = () => mapSelected((e) => ({ ...e, grace: !e.grace }))
  /** 異名同音 (F# ⇄ Gb) に書き換える */
  const respellSelected = () => mapSelected((e) => (e.kind === "note" ? { ...e, heads: e.heads.map((h, hi) => (sel.head && sel.ids.length === 1 && hi !== sel.head.hi ? h : { ...h, pitch: respell(h.pitch) })) } : e))
  /** 音名で高さを指定 (例 F#5 ・ Bb4 ・ G3) */
  const setPitchByName = () => {
    const m = pitchText.trim().match(/^([A-Ga-g])(#{1,2}|b{1,2}|x)?(\d)$/)
    if (!m) { setMsg("音名は F#5 ・ Bb4 ・ G3 のように書いてください"); return }
    const alter = (m[2] === "#" ? 1 : m[2] === "##" || m[2] === "x" ? 2 : m[2] === "b" ? -1 : m[2] === "bb" ? -2 : 0) as Pitch["alter"]
    const p: Pitch = { step: m[1].toUpperCase() as Pitch["step"], alter, octave: Number(m[3]) }
    const midi = midiOf(p)
    if (midi < 55 || midi > 100) { setMsg(`${pitchName(p)} はバイオリンの音域 (G3〜E7) の外です`); return }
    if (!sel.ids.length) { addNote(p); return }
    mapSelected((e) => (e.kind === "note" ? { ...e, heads: e.heads.map((h, hi) => (sel.head && sel.ids.length === 1 && hi !== sel.head.hi ? h : { ...h, pitch: p, ...fingerFor(p, null) })) } : e))
  }
  /** 選んだ音の前で小節を分ける */
  const splitMeasureAtSelection = () => {
    if (selected.length !== 1) { setMsg("分ける位置の音を 1 つ選んでください"); return }
    const { mIdx, eIdx } = selected[0]
    if (eIdx === 0) { setMsg("小節の最初の音の前では分けられません"); return }
    const next = clone(score)
    const m = next.measures[mIdx]
    const tail = m.elements.splice(eIdx)
    next.measures.splice(mIdx + 1, 0, emptyMeasure({ elements: tail }))
    commit(next)
    onSelectMeasureNext(mIdx + 1)
  }
  /** 次の小節と結合する */
  const mergeWithNext = () => {
    const i = targetMeasureIdx()
    if (i >= score.measures.length - 1) { setMsg("最後の小節は次と結合できません"); return }
    const next = clone(score)
    const a = next.measures[i], b = next.measures[i + 1]
    a.elements.push(...b.elements)
    a.repeatEnd = a.repeatEnd || b.repeatEnd
    a.endingStop = a.endingStop ?? b.endingStop
    a.direction = a.direction ?? b.direction
    next.measures.splice(i + 1, 1)
    commit(next)
    onSelectMeasureNext(i)
  }
  const toggleRestNote = () => mapSelected((e, ctx) => {
    if (e.kind === "note") return { ...e, kind: "rest", heads: [], tie: null }
    const t = tonicPitchClass(ctx.key)
    return { ...e, kind: "note", heads: [{ pitch: { step: t.step, alter: t.alter, octave: 4 }, string: null, finger: null }] }
  })

  // ───────── 記号 ─────────
  const toggleArt = (a: Element["arts"][number]) => mapSelected((e) => ({ ...e, arts: e.arts.includes(a) ? e.arts.filter((x) => x !== a) : [...e.arts, a] }))
  const setProp = <K extends keyof Element>(k: K, v: Element[K]) => mapSelected((e) => ({ ...e, [k]: e[k] === v ? null : v }))

  // ───────── 弦と指 ─────────
  const setString = (s: StringId | null) => {
    const h = sel.head
    mapSelected((e) => ({ ...e, heads: e.heads.map((hd, hi) => {
      if (h && sel.ids.length === 1 && hi !== h.hi) return hd
      if (!s) return { ...hd, string: null, finger: null }
      const c = fingerChoices(hd.pitch, s)
      const keep = hd.finger != null && c.some((x) => x.finger === hd.finger)
      return { ...hd, string: s, finger: keep ? hd.finger : c[0]?.finger ?? null }
    }) }))
  }
  const setFinger = (f: 0 | 1 | 2 | 3 | 4) => {
    const h = sel.head
    mapSelected((e) => ({ ...e, heads: e.heads.map((hd, hi) => {
      if (h && sel.ids.length === 1 && hi !== h.hi) return hd
      let s = hd.string
      if (!s) { for (const cand of STRINGS) if (positionOf(hd.pitch, cand, f).pos != null) { s = cand; break } }
      return { ...hd, string: s, finger: f }
    }) }))
  }
  const autoFinger = (all: boolean) => {
    const next = clone(score)
    const list = next.measures.flatMap((m) => m.elements)
    const target = all ? list : list.filter((e) => selSet.has(e.id))
    if (!target.length) { setMsg("音を選ぶか「全部」を押してください"); return }
    const fixed = autoFingerAll(all ? list : list)   // 前の音を見るので全体を通して付け直し、選んだ音だけ取り込む
    list.forEach((e, i) => { if (target.includes(e)) e.heads = fixed[i].heads })
    commit(next)
  }

  // ───────── 小節 ─────────
  const targetMeasureIdx = (): number => (sel.measures.length ? sel.measures[sel.measures.length - 1] : selected.length ? selected[selected.length - 1].mIdx : score.measures.length - 1)
  const mapMeasures = (fn: (m: Measure, i: number) => Measure, idxs?: number[]) => {
    const set = new Set(idxs ?? (sel.measures.length ? sel.measures : [targetMeasureIdx()]))
    const next = clone(score)
    next.measures = next.measures.map((m, i) => (set.has(i) ? fn(m, i) : m))
    commit(next)
  }
  const addMeasure = (where: "after" | "before" | "end") => {
    const next = clone(score)
    const m = emptyMeasure()
    const i = where === "end" ? next.measures.length : where === "after" ? targetMeasureIdx() + 1 : Math.max(0, sel.measures[0] ?? targetMeasureIdx())
    next.measures.splice(i, 0, m)
    commit(next)
    onSelectMeasureNext(i)
  }
  const onSelectMeasureNext = (i: number) => setSel({ ids: [], anchor: null, head: null, measures: [i] })
  const deleteMeasures = () => {
    const idxs = sel.measures.length ? sel.measures : [targetMeasureIdx()]
    if (score.measures.length - idxs.length < 1) { setMsg("小節は 1 つ以上残してください"); return }
    const next = clone(score)
    next.measures = next.measures.filter((_, i) => !idxs.includes(i))
    commit(next); clearSel()
  }
  const duplicateMeasures = () => {
    const idxs = sel.measures.length ? sel.measures : [targetMeasureIdx()]
    const next = clone(score)
    const copies = idxs.map((i) => ({ ...clone(next.measures[i]), id: newId(), elements: next.measures[i].elements.map((e) => ({ ...clone(e), id: newId(), slurStart: [], slurStop: [] })) }))
    next.measures.splice(idxs[idxs.length - 1] + 1, 0, ...copies)
    commit(next)
  }
  const fillRests = () => mapMeasures((m, i) => ({ ...m, elements: [...m.elements, ...restsFor(measureQl(effectiveTime(score, i)) - elementsQl(m.elements))] }))
  const copySel = () => { clip.current = selected.map((s) => clone(s.el)); setMsg(`${clip.current.length} 音をコピーしました`) }
  const pasteSel = () => {
    if (!clip.current.length) return
    insertElements(clip.current.map((e) => ({ ...clone(e), id: newId(), slurStart: [], slurStop: [] })))
  }

  // ───────── 並べる ─────────
  const [gen, setGen] = useState<{ kind: ScaleKind | ArpKind; octaves: 1 | 2 | 3; shape: "updown" | "up" | "down" }>({ kind: "major", octaves: 2, shape: "updown" })
  const [shorthand, setShorthand] = useState("D0 D1 D2 D3 A0 A1 A2 A3")
  const applyElements = (els: Element[], mode: "replace" | "append") => {
    if (!els.length) { setMsg("音が作れませんでした"); return }
    const withFingers = autoFingerAll(els)
    const packed = packIntoMeasures(withFingers, score.time)
    const next = clone(score)
    next.measures = mode === "replace" ? packed : [...next.measures, ...packed]
    commit(next); clearSel()
    setMsg(`${els.length} 音を ${packed.length} 小節に並べました`)
  }
  const runGenerate = (mode: "replace" | "append") => {
    const dur = { ...curDur }
    const els = score.category === "arpeggio"
      ? generateArpeggio({ key: score.key, kind: (["major", "minor", "dominant7", "diminished7", "augmented"].includes(gen.kind) ? gen.kind : "major") as ArpKind, octaves: gen.octaves, shape: gen.shape, dur })
      : generateScale({ key: score.key, kind: (["major", "natural", "harmonic", "melodic", "chromatic"].includes(gen.kind) ? gen.kind : "major") as ScaleKind, octaves: gen.octaves, shape: gen.shape, dur })
    applyElements(els, mode)
  }

  // ───────── キー操作 ─────────
  useEffect(() => {
    const h = (ev: KeyboardEvent) => {
      const t = ev.target as HTMLElement
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return
      if (confirm || done) return
      const ctrl = ev.ctrlKey || ev.metaKey
      if (ctrl && ev.key.toLowerCase() === "z") { ev.preventDefault(); if (ev.shiftKey) redo(); else undo(); return }
      if (ctrl && ev.key.toLowerCase() === "y") { ev.preventDefault(); redo(); return }
      if (ctrl && ev.key.toLowerCase() === "c") { ev.preventDefault(); copySel(); return }
      if (ctrl && ev.key.toLowerCase() === "v") { ev.preventDefault(); pasteSel(); return }
      if (ctrl && ev.key.toLowerCase() === "a") { ev.preventDefault(); selectIds(flat.map((f) => f.el.id)); return }
      switch (ev.key) {
        case "ArrowUp": case "ArrowDown": {
          ev.preventDefault()
          if (!sel.ids.length) return
          movePitch(ev.key === "ArrowUp" ? 1 : -1, ev.altKey ? "octave" : ev.shiftKey ? "semi" : "key")
          return
        }
        case "ArrowLeft": case "ArrowRight": {
          ev.preventDefault()
          if (!flat.length) return
          const cur = flat.findIndex((f) => f.el.id === (ev.key === "ArrowRight" ? sel.ids[sel.ids.length - 1] : sel.ids[0]))
          const ni = cur < 0 ? (ev.key === "ArrowRight" ? 0 : flat.length - 1) : Math.max(0, Math.min(flat.length - 1, cur + (ev.key === "ArrowRight" ? 1 : -1)))
          const id = flat[ni].el.id
          if (ev.shiftKey) onSelect(id, 0, "range"); else selectIds([id], id, { id, hi: 0 })
          return
        }
        case "Enter": ev.preventDefault(); addNote(); return
        case "Delete": case "Backspace": ev.preventDefault(); deleteSelected(); return
        case "Escape": clearSel(); return
        case ".": setDots(curDur.dots === 0 ? 1 : curDur.dots === 1 ? 2 : 0); return
        case "r": addRest(); return
        case "t": toggleTie(); return
        case "s": slurSelection(); return
        case "g": toggleGrace(); return
        case "+": case "=": setZoom((z) => Math.min(2.4, z + 0.15)); return
        case "-": setZoom((z) => Math.max(0.6, z - 0.15)); return
      }
      const durIdx = ["1", "2", "3", "4", "5", "6", "7"].indexOf(ev.key)
      if (durIdx >= 0) { setDurBase(DUR_BASES[durIdx].id); return }
    }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  })

  // ───────── 再生 ─────────
  const togglePlay = async () => {
    if (player.current) { player.current.stop(); player.current = null; setPlayingId(null); return }
    try {
      const p = await playScore(score, (id) => { setPlayingId(id); if (id === null) player.current = null })
      player.current = p
    } catch (e) { setMsg(`鳴らせませんでした ・ ${e instanceof Error ? e.message : String(e)}`) }
  }
  useEffect(() => () => player.current?.stop(), [])

  // ───────── 確認 ・ 登録 ─────────
  const openConfirm = () => {
    const ps = validateScore(score)
    let xml = ""
    try { xml = buildMusicXml(score) } catch (e) { setMsg(`MusicXML を作れませんでした ・ ${e instanceof Error ? e.message : String(e)}`); return }
    setConfirm({ xml, problems: ps })
  }
  const submit = async () => {
    setBusy(true); setMsg("")
    try {
      if (initial) {
        const r = await updateAuthoredScore(initial.itemId, score, star)
        if (!r.ok) { setMsg(r.error); return }
        setDone({ itemId: initial.itemId })
      } else {
        const r = await createAuthoredScore({ score, star, joinGroupId: joinGroupId || null, descriptionShort: descShort, description: desc, expandAllKeys, standardArticulations: stdArts, articulationIds: [...artIds] })
        if (!r.ok) { setMsg(r.error); return }
        setDone({ itemId: r.itemId })
        try { localStorage.removeItem(DRAFT_KEY) } catch { /* noop */ }
      }
      setConfirm(null)
    } catch (e) { setMsg(e instanceof Error ? e.message : String(e)) } finally { setBusy(false) }
  }

  const focusProblem = (p: Problem) => {
    if (p.elementId) { selectIds([p.elementId], p.elementId, { id: p.elementId, hi: 0 }); return }
    const idx = score.measures.findIndex((_, i) => (score.measures[0]?.implicit ? i : i + 1) === p.measure)
    if (idx >= 0) onSelectMeasureNext(idx)
  }

  const one = selected.length === 1 ? selected[0].el : null
  const oneHead = one && one.kind === "note" ? one.heads[sel.head?.hi ?? 0] ?? one.heads[0] : null
  const tm = score.measures[targetMeasureIdx()]
  const tmIdx = targetMeasureIdx()
  const groupChoices = groups.filter((g) => g.category === score.category)

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <h1>{initial ? "スコアを直す" : "スコアを自分で作る"}</h1>
        <input placeholder="教材名" value={score.title} onChange={(e) => commit({ ...score, title: e.target.value })} style={{ width: 220 }} />
        <select value={score.category} onChange={(e) => commit({ ...score, category: e.target.value as AuthorCategory })} disabled={!!initial}>
          {CATS.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
        </select>
        <select value={`${score.key.fifths}|${score.key.mode}`} onChange={(e) => { const [f, m] = e.target.value.split("|"); commit({ ...score, key: { fifths: Number(f), mode: m as "major" | "minor" } }) }} title="調">
          {KEY_CHOICES.map((k) => <option key={`M${k.fifths}`} value={`${k.fifths}|major`}>{keyLabel({ fifths: k.fifths, mode: "major" })}</option>)}
          {KEY_CHOICES.map((k) => <option key={`m${k.fifths}`} value={`${k.fifths}|minor`}>{keyLabel({ fifths: k.fifths, mode: "minor" })}</option>)}
        </select>
        <select value={`${score.time.beats}/${score.time.beatType}`} onChange={(e) => { const [b, t] = e.target.value.split("/").map(Number); commit({ ...score, time: { beats: b, beatType: t } }) }} title="拍子">
          {TIME_SIGS.map((t) => <option key={`${t.beats}/${t.beatType}`} value={`${t.beats}/${t.beatType}`}>{t.beats}/{t.beatType}</option>)}
        </select>
        <div className={styles.topRight}>
          <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} onClick={undo} disabled={past.current.length === 0} title="Ctrl+Z">元に戻す</button>
          <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} onClick={redo} disabled={future.current.length === 0} title="Ctrl+Y">やり直す</button>
          <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} onClick={togglePlay}>{player.current ? "止める" : "鳴らす"}</button>
          <button className={`${styles.btn} ${styles.btnPri}`} onClick={openConfirm}>{initial ? "確認して保存" : "確認して登録"}</button>
          <Link href={`/${userId}/admin/practice`} className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`}>教材管理へ</Link>
        </div>
      </header>

      <div className={styles.body}>
        <div className={styles.staffWrap} ref={wrapRef} onPointerDown={(e) => { if (e.target === e.currentTarget) clearSel() }}>
          <div className={styles.staffTools}>
            <span>拡大</span>
            <input type="range" min={0.6} max={2.4} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
            <span>{score.measures.length} 小節 ・ {flat.filter((f) => f.el.kind === "note").length} 音 ・ {sel.ids.length ? `${sel.ids.length} 音を選択` : sel.measures.length ? `${sel.measures.length} 小節を選択` : "選択なし"}</span>
            <span className={styles.sub}>空いた場所を押す=その高さに音を足す ・ 符頭を上下に引く=高さ ・ Shift+押す=範囲 ・ 小節番号を押す=小節を選ぶ</span>
          </div>
          {draft && !initial && (
            <div className={styles.row} style={{ padding: "0 10px 10px" }}>
              <span className={styles.gold}>前回の下書きがあります</span>
              <span className={styles.sub}>{draft.title || "(教材名なし)"} ・ {draft.measures.length} 小節 ・ {draft.measures.reduce((a, m) => a + m.elements.filter((e) => e.kind === "note").length, 0)} 音</span>
              <button className={`${styles.btn} ${styles.btnSm}`} onClick={() => { commit(draft); setDraft(null) }}>続きから開く</button>
              <button className={`${styles.btn} ${styles.btnSm}`} onClick={() => { try { localStorage.removeItem(DRAFT_KEY) } catch { /* noop */ } setDraft(null) }}>下書きを消す</button>
            </div>
          )}
          <StaffCanvas score={score} zoom={zoom} width={wrapW} selection={sel} playingId={playingId} errorMeasures={errorMeasures}
            onSelect={onSelect} onSelectMeasure={onSelectMeasure} onDragSteps={onDragSteps} onDragEnd={onDragEnd} onAddAt={onAddAt} onBackground={clearSel} />
        </div>

        <aside className={styles.side}>
          <div className={styles.tabs}>
            {([["note", "音符"], ["finger", "弦と指"], ["mark", "記号"], ["measure", "小節"], ["arrange", "並べる"], ["register", "登録"]] as [Tab, string][]).map(([k, l]) => (
              <button key={k} className={`${styles.tab} ${tab === k ? styles.tabOn : ""}`} onClick={() => setTab(k)}>{l}</button>
            ))}
          </div>

          {tab === "note" && (
            <div className={styles.panel}>
              <div className={styles.group}>
                <h3>音の長さ <span className={styles.sub}>キー 1〜7</span></h3>
                <div className={styles.row}>{DUR_BASES.map((d, i) => <button key={d.id} className={`${styles.chip} ${curDur.base === d.id ? styles.chipOn : ""}`} onClick={() => setDurBase(d.id)} title={`キー ${i + 1}`}>{d.label}</button>)}</div>
                <div className={styles.row}>
                  <label>付点</label>
                  {([0, 1, 2] as const).map((n) => <button key={n} className={`${styles.chip} ${curDur.dots === n ? styles.chipOn : ""}`} onClick={() => setDots(n)}>{n === 0 ? "なし" : n === 1 ? "付点" : "複付点"}</button>)}
                </div>
                <div className={styles.row}>
                  <label>連符</label>
                  <button className={`${styles.chip} ${!curDur.tuplet ? styles.chipOn : ""}`} onClick={() => setTuplet(null)}>なし</button>
                  {TUPLETS.map((t) => <button key={t.label} className={`${styles.chip} ${curDur.tuplet?.actual === t.actual && curDur.tuplet?.normal === t.normal ? styles.chipOn : ""}`} onClick={() => setTuplet({ actual: t.actual, normal: t.normal })}>{t.label}</button>)}
                </div>
                <div className={styles.row}>
                  <label>任意の連符</label>
                  <input value={tupletN} onChange={(e) => setTupletN(e.target.value)} aria-label="n" style={{ width: 44, border: "1px solid #c9d3e6", borderRadius: 6, padding: "3px 6px" }} />
                  <span>個を</span>
                  <input value={tupletM} onChange={(e) => setTupletM(e.target.value)} aria-label="m" style={{ width: 44, border: "1px solid #c9d3e6", borderRadius: 6, padding: "3px 6px" }} />
                  <span>個分に</span>
                  <button className={`${styles.btn} ${styles.btnSm}`} onClick={() => { const n = Number(tupletN), m = Number(tupletM); if (n >= 2 && m >= 1 && n <= 15 && m <= 15) setTuplet({ actual: n, normal: m }); else setMsg("連符は 2〜15 の整数で") }}>n:m を使う</button>
                </div>
                <p className={styles.hint}>選んだ音があればその音に、無ければ次に足す音に効きます。</p>
              </div>
              <div className={styles.group}>
                <h3>足す ・ 消す</h3>
                <div className={styles.row}>
                  <button className={styles.btn} onClick={() => addNote()}>音を足す <span className={styles.kbd}>Enter</span></button>
                  <button className={styles.btn} onClick={addRest}>休符を足す <span className={styles.kbd}>r</span></button>
                  <button className={styles.btn} onClick={toggleRestNote} disabled={!sel.ids.length}>音 ⇄ 休符</button>
                  <button className={styles.btn} onClick={deleteSelected} disabled={!sel.ids.length && !sel.measures.length}>消す <span className={styles.kbd}>Del</span></button>
                </div>
                <div className={styles.row}>
                  <button className={styles.btn} onClick={copySel} disabled={!sel.ids.length}>コピー <span className={styles.kbd}>Ctrl+C</span></button>
                  <button className={styles.btn} onClick={pasteSel} disabled={!clip.current.length}>貼り付け <span className={styles.kbd}>Ctrl+V</span></button>
                  <button className={styles.btn} onClick={() => selectIds(flat.map((f) => f.el.id))}>全部選ぶ <span className={styles.kbd}>Ctrl+A</span></button>
                </div>
                <p className={styles.hint}>高さ: <span className={styles.kbd}>↑</span><span className={styles.kbd}>↓</span> 調の音で 1 段 ・ <span className={styles.kbd}>Shift</span>+↑↓ 半音 ・ <span className={styles.kbd}>Alt</span>+↑↓ オクターブ。<span className={styles.kbd}>←</span><span className={styles.kbd}>→</span> 隣の音へ。</p>
              </div>
              <div className={styles.group}>
                <h3>タイ ・ スラー ・ 重音 ・ 装飾音符</h3>
                <div className={styles.row}>
                  <button className={styles.btn} onClick={toggleTie} disabled={!sel.ids.length}>タイ <span className={styles.kbd}>t</span></button>
                  <button className={styles.btn} onClick={slurSelection} disabled={selected.length < 2}>スラーで結ぶ <span className={styles.kbd}>s</span></button>
                  <button className={styles.btn} onClick={unslurSelection} disabled={!sel.ids.length}>スラーを外す</button>
                </div>
                <div className={styles.row}>
                  <button className={styles.btn} onClick={addChordHead} disabled={!sel.ids.length}>重音の音を足す</button>
                  <button className={styles.btn} onClick={removeChordHead} disabled={!sel.head}>選んだ符頭を消す</button>
                  <button className={styles.btn} onClick={toggleGrace} disabled={!sel.ids.length}>装飾音符 <span className={styles.kbd}>g</span></button>
                </div>
                <p className={styles.hint}>タイは次の音とつなぎ、次の音を同じ高さにします。重音は上に 3 度の音を足したあと、符頭を選んで上下に動かします。</p>
              </div>
              <div className={styles.group}>
                <h3>高さを音名で ・ 異名同音</h3>
                <div className={styles.row}>
                  <input value={pitchText} onChange={(e) => setPitchText(e.target.value)} placeholder="F#5 ・ Bb4 ・ G3" style={{ width: 120, border: "1px solid #c9d3e6", borderRadius: 6, padding: "5px 8px" }} onKeyDown={(e) => { if (e.key === "Enter") setPitchByName() }} />
                  <button className={styles.btn} onClick={setPitchByName}>{sel.ids.length ? "選んだ音をこの高さに" : "この高さの音を足す"}</button>
                  <button className={styles.btn} onClick={respellSelected} disabled={!sel.ids.length}>異名同音に書き換え (F♯ ⇄ G♭)</button>
                </div>
              </div>
              {one && (
                <div className={styles.group}>
                  <h3>選んだ音</h3>
                  <p className={styles.hint} style={{ color: "#1d2430" }}>
                    {one.kind === "rest" ? "休符" : one.heads.map((h) => `${pitchKana(h.pitch)}${h.pitch.octave} (${pitchName(h.pitch)})`).join(" + ")}
                    {" ・ "}{DUR_BASES.find((d) => d.id === one.dur.base)?.label}{one.dur.dots ? " 付点".repeat(one.dur.dots) : ""}{one.dur.tuplet ? ` ${one.dur.tuplet.actual} 連` : ""}
                    {one.kind === "note" && one.heads.map((h) => (h.string && h.finger != null ? ` ・ ${h.string} 線 指 ${h.finger} 第 ${positionOf(h.pitch, h.string, h.finger).pos ?? "?"}` : " ・ 弦と指は自動")).join("")}
                  </p>
                </div>
              )}
            </div>
          )}

          {tab === "finger" && (
            <div className={styles.panel}>
              <div className={styles.group}>
                <h3>選んだ音の弦と指</h3>
                {!one || one.kind !== "note" ? <p className={styles.hint}>符頭を 1 つ選ぶと、その音で取れる弦と指が出ます。複数選ぶと同じ弦 ・ 指をまとめて付けます。</p> : (
                  <>
                    <p className={styles.hint} style={{ color: "#1d2430" }}>{oneHead ? `${pitchKana(oneHead.pitch)}${oneHead.pitch.octave}` : ""}{one.heads.length > 1 ? ` (重音の ${(sel.head?.hi ?? 0) + 1} 番目)` : ""}</p>
                    <div className={styles.row}>
                      <label>弦</label>
                      {STRINGS.map((s) => { const c = oneHead ? fingerChoices(oneHead.pitch, s) : []; return <button key={s} className={`${styles.chip} ${oneHead?.string === s ? styles.chipOn : ""} ${!c.length ? styles.chipWarn : ""}`} onClick={() => setString(s)} title={c.length ? c.map((x) => `指 ${x.finger} = 第 ${x.pos}`).join(" / ") : "この弦では取れません"}>{s} 線</button> })}
                      <button className={`${styles.chip} ${!oneHead?.string ? styles.chipOn : ""}`} onClick={() => setString(null)}>自動</button>
                    </div>
                    <div className={styles.row}>
                      <label>指</label>
                      {([0, 1, 2, 3, 4] as const).map((f) => {
                        const r = oneHead?.string ? positionOf(oneHead.pitch, oneHead.string, f) : { pos: null, reason: null }
                        return <button key={f} className={`${styles.chip} ${oneHead?.finger === f ? styles.chipOn : ""} ${oneHead?.string && r.pos == null ? styles.chipWarn : ""}`} onClick={() => setFinger(f)} title={r.reason ?? (r.pos != null ? `第 ${r.pos} ポジション` : "")}>{f}{oneHead?.string && r.pos != null ? ` ・ 第${r.pos}` : ""}</button>
                      })}
                    </div>
                    {oneHead?.string && oneHead.finger != null && (() => { const r = positionOf(oneHead.pitch, oneHead.string, oneHead.finger); return <p className={styles.hint} style={{ color: r.pos == null ? "#b3261e" : "#2a6b3a" }}>{r.pos == null ? r.reason : `${oneHead.string} 線 ・ 指 ${oneHead.finger} ・ 第 ${r.pos} ポジション (上限 12)`}</p> })()}
                  </>
                )}
              </div>
              <div className={styles.group}>
                <h3>まとめて</h3>
                <div className={styles.row}>
                  <button className={styles.btn} onClick={() => autoFinger(false)} disabled={!sel.ids.length}>選んだ音に自動で付ける</button>
                  <button className={styles.btn} onClick={() => autoFinger(true)}>全部に自動で付ける</button>
                  <button className={styles.btn} onClick={() => setString(null)} disabled={!sel.ids.length}>選んだ音の弦と指を消す</button>
                </div>
                <p className={styles.hint}>自動は、開放弦 → 前の音と同じ弦 ・ 同じポジション → 同じ弦で移動 → 弦を変える、の順で選びます。解析器の読み方と同じ算術で第 12 ポジションまで。</p>
              </div>
              <div className={styles.group}>
                <h3>弦の指定 (sul)</h3>
                <div className={styles.row}>{STRINGS.map((s) => <button key={s} className={`${styles.chip} ${one?.sul === s ? styles.chipOn : ""}`} onClick={() => setProp("sul", s)} disabled={!sel.ids.length}>sul {s}</button>)}</div>
              </div>
            </div>
          )}

          {tab === "mark" && (
            <div className={styles.panel}>
              <div className={styles.group}>
                <h3>奏法 (音ごと ・ 複数可)</h3>
                <div className={styles.row}>{ARTICULATION_DEFS.map((a) => <button key={a.id} className={`${styles.chip} ${one?.arts.includes(a.id) ? styles.chipOn : ""}`} onClick={() => toggleArt(a.id)} disabled={!sel.ids.length} title={a.note ?? ""}>{a.label}</button>)}</div>
                <p className={styles.hint}>連続スピッカートはスラーの中に置くと解析が拾います。トレモロは符幹に斜線で出ます。</p>
              </div>
              <div className={styles.group}>
                <h3>弓 ・ 装飾 ・ 特殊</h3>
                <div className={styles.row}>
                  <label>弓</label>
                  <button className={`${styles.chip} ${one?.bow === "down" ? styles.chipOn : ""}`} onClick={() => setProp("bow", "down")} disabled={!sel.ids.length}>ダウン ⊓</button>
                  <button className={`${styles.chip} ${one?.bow === "up" ? styles.chipOn : ""}`} onClick={() => setProp("bow", "up")} disabled={!sel.ids.length}>アップ V</button>
                </div>
                <div className={styles.row}>
                  <label>装飾</label>
                  {ORNAMENT_DEFS.map((o) => <button key={o.id} className={`${styles.chip} ${one?.orn === o.id ? styles.chipOn : ""}`} onClick={() => setProp("orn", o.id)} disabled={!sel.ids.length}>{o.label}</button>)}
                </div>
                <div className={styles.row}>
                  <label>特殊</label>
                  {SPECIAL_DEFS.map((s) => <button key={s.id} className={`${styles.chip} ${one?.special === s.id ? styles.chipOn : ""}`} onClick={() => setProp("special", s.id)} disabled={!sel.ids.length}>{s.label}</button>)}
                </div>
              </div>
              <div className={styles.group}>
                <h3>強弱 ・ 松葉</h3>
                <div className={styles.row}>{DYNAMICS.map((d) => <button key={d} className={`${styles.chip} ${one?.dyn === d ? styles.chipOn : ""}`} onClick={() => setProp("dyn", d)} disabled={!sel.ids.length}><i>{d}</i></button>)}</div>
                <div className={styles.row}>
                  <button className={`${styles.chip} ${one?.wedge === "cresc" ? styles.chipOn : ""}`} onClick={() => setProp("wedge", "cresc")} disabled={!sel.ids.length}>cresc. ここから</button>
                  <button className={`${styles.chip} ${one?.wedge === "dim" ? styles.chipOn : ""}`} onClick={() => setProp("wedge", "dim")} disabled={!sel.ids.length}>dim. ここから</button>
                  <button className={`${styles.chip} ${one?.wedge === "stop" ? styles.chipOn : ""}`} onClick={() => setProp("wedge", "stop")} disabled={!sel.ids.length}>ここまで</button>
                </div>
                <p className={styles.hint}>同じ記号をもう一度押すと外れます。</p>
              </div>
            </div>
          )}

          {tab === "measure" && (
            <div className={styles.panel}>
              <div className={styles.group}>
                <h3>小節 {sel.measures.length ? `(選択 ${sel.measures.map((i) => (score.measures[0]?.implicit ? i : i + 1)).join(", ")})` : `(対象 ${score.measures[0]?.implicit ? tmIdx : tmIdx + 1})`}</h3>
                <div className={styles.row}>
                  <button className={styles.btn} onClick={() => addMeasure("after")}>後ろに足す</button>
                  <button className={styles.btn} onClick={() => addMeasure("before")}>前に足す</button>
                  <button className={styles.btn} onClick={() => addMeasure("end")}>最後に足す</button>
                  <button className={styles.btn} onClick={duplicateMeasures}>複製</button>
                  <button className={styles.btn} onClick={deleteMeasures}>消す</button>
                  <button className={styles.btn} onClick={fillRests}>残りを休符で埋める</button>
                </div>
                <div className={styles.row}>
                  <button className={styles.btn} onClick={splitMeasureAtSelection} disabled={selected.length !== 1}>選んだ音の前で分ける</button>
                  <button className={styles.btn} onClick={mergeWithNext}>次の小節と結合</button>
                </div>
                <div className={styles.row}>
                  <button className={`${styles.chip} ${tm?.implicit ? styles.chipOn : ""}`} onClick={() => mapMeasures((m) => ({ ...m, implicit: !m.implicit }), [0])} disabled={tmIdx !== 0 && !(sel.measures.length === 1 && sel.measures[0] === 0)}>弱起 (最初の小節を不完全に)</button>
                </div>
              </div>
              <div className={styles.group}>
                <h3>この小節から変える</h3>
                <div className={styles.row}>
                  <label>拍子</label>
                  <select value={tm?.time ? `${tm.time.beats}/${tm.time.beatType}` : ""} onChange={(e) => { const v = e.target.value; mapMeasures((m) => ({ ...m, time: v ? { beats: Number(v.split("/")[0]), beatType: Number(v.split("/")[1]) } : null })) }}>
                    <option value="">変えない</option>
                    {TIME_SIGS.map((t) => <option key={`${t.beats}/${t.beatType}`} value={`${t.beats}/${t.beatType}`}>{t.beats}/{t.beatType}</option>)}
                  </select>
                  <label>調</label>
                  <select value={tm?.key ? `${tm.key.fifths}|${tm.key.mode}` : ""} onChange={(e) => { const v = e.target.value; mapMeasures((m) => ({ ...m, key: v ? { fifths: Number(v.split("|")[0]), mode: v.split("|")[1] as "major" | "minor" } : null })) }}>
                    <option value="">変えない</option>
                    {KEY_CHOICES.map((k) => <option key={`M${k.fifths}`} value={`${k.fifths}|major`}>{keyLabel({ fifths: k.fifths, mode: "major" })}</option>)}
                    {KEY_CHOICES.map((k) => <option key={`m${k.fifths}`} value={`${k.fifths}|minor`}>{keyLabel({ fifths: k.fifths, mode: "minor" })}</option>)}
                  </select>
                </div>
                <div className={styles.row}>
                  <label>テンポ ♩=</label>
                  <input className={styles.num} type="number" min={20} max={300} value={tm?.tempo ?? ""} placeholder="なし" onChange={(e) => mapMeasures((m) => ({ ...m, tempo: e.target.value ? Number(e.target.value) : null }))} />
                </div>
              </div>
              <div className={styles.group}>
                <h3>反復 ・ 括弧 ・ とび先</h3>
                <div className={styles.row}>
                  <button className={`${styles.chip} ${tm?.repeatStart ? styles.chipOn : ""}`} onClick={() => mapMeasures((m) => ({ ...m, repeatStart: !m.repeatStart }))}>‖: 反復の始まり</button>
                  <button className={`${styles.chip} ${tm?.repeatEnd ? styles.chipOn : ""}`} onClick={() => mapMeasures((m) => ({ ...m, repeatEnd: !m.repeatEnd }))}>:‖ 反復の終わり</button>
                </div>
                <div className={styles.row}>
                  <label>括弧 始まり</label>
                  {[1, 2, 3].map((n) => <button key={n} className={`${styles.chip} ${tm?.endingStart === n ? styles.chipOn : ""}`} onClick={() => mapMeasures((m) => ({ ...m, endingStart: m.endingStart === n ? null : n }))}>{n} 番</button>)}
                  <label>終わり</label>
                  {[1, 2, 3].map((n) => <button key={n} className={`${styles.chip} ${tm?.endingStop === n ? styles.chipOn : ""}`} onClick={() => mapMeasures((m) => ({ ...m, endingStop: m.endingStop === n ? null : n }))}>{n} 番</button>)}
                </div>
                <div className={styles.row}>
                  <label>とび先</label>
                  <select value={tm?.direction ?? ""} onChange={(e) => mapMeasures((m) => ({ ...m, direction: (e.target.value || null) as Direction | null }))}>
                    <option value="">なし</option>
                    {DIRECTION_DEFS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
                  </select>
                </div>
                <p className={styles.hint}>Segno ・ Coda ・ Fine ・ To Coda は目印、D.C. ・ D.S. は戻る指示。組み合わせの不足は下の帯に出ます。</p>
              </div>
            </div>
          )}

          {tab === "arrange" && (
            <div className={styles.panel}>
              {(score.category === "scale" || score.category === "arpeggio") && (
                <div className={styles.group}>
                  <h3>{score.category === "scale" ? "音階" : "アルペジオ"}を並べる ・ {keyLabel(score.key)}</h3>
                  <div className={styles.row}>
                    {(score.category === "scale"
                      ? [["major", "長音階"], ["natural", "自然的短音階"], ["harmonic", "和声的短音階"], ["melodic", "旋律的短音階"], ["chromatic", "半音階"]]
                      : [["major", "長三和音"], ["minor", "短三和音"], ["dominant7", "属七"], ["diminished7", "減七"], ["augmented", "増三和音"]]
                    ).map(([k, l]) => <button key={k} className={`${styles.chip} ${gen.kind === k ? styles.chipOn : ""}`} onClick={() => setGen({ ...gen, kind: k as ScaleKind })}>{l}</button>)}
                  </div>
                  <div className={styles.row}>
                    <label>オクターブ</label>
                    {([1, 2, 3] as const).map((n) => <button key={n} className={`${styles.chip} ${gen.octaves === n ? styles.chipOn : ""}`} onClick={() => setGen({ ...gen, octaves: n })}>{n}</button>)}
                    <label>形</label>
                    {([["updown", "上って下りる"], ["up", "上りだけ"], ["down", "下りだけ"]] as const).map(([k, l]) => <button key={k} className={`${styles.chip} ${gen.shape === k ? styles.chipOn : ""}`} onClick={() => setGen({ ...gen, shape: k })}>{l}</button>)}
                  </div>
                  <div className={styles.row}>
                    <button className={`${styles.btn} ${styles.btnPri}`} onClick={() => runGenerate("replace")}>いまの音の長さで並べる (置き換え)</button>
                    <button className={styles.btn} onClick={() => runGenerate("append")}>後ろに足す</button>
                  </div>
                  <p className={styles.hint}>綴りは調どおり (旋律的短音階は上りと下りで違う)。弦と指は自動で付き、拍子どおりに小節へ入り、余りは休符で埋めます。あとから 1 音ずつ直せます。</p>
                </div>
              )}
              <div className={styles.group}>
                <h3>型で並べる (弦と指の文字)</h3>
                <textarea className={styles.field} value={shorthand} onChange={(e) => setShorthand(e.target.value)} style={{ minHeight: 56, fontFamily: "ui-monospace, monospace" }} />
                <div className={styles.row}>
                  {PRESETS[score.category === "fingering" ? "fingering" : "bowing"].map((p) => <button key={p.id} className={styles.chip} onClick={() => setShorthand(p.text)}>{p.label}</button>)}
                </div>
                <div className={styles.row}>
                  <button className={`${styles.btn} ${styles.btnPri}`} onClick={() => applyElements(parseShorthand(shorthand, curDur, score.key), "replace")}>並べる (置き換え)</button>
                  <button className={styles.btn} onClick={() => applyElements(parseShorthand(shorthand, curDur, score.key), "append")}>後ろに足す</button>
                </div>
                <p className={styles.hint}>D0 = D 線 開放、A1 = A 線 指 1、3p = ここから第 3 ポジション。高さは調の音で綴ります。</p>
              </div>
            </div>
          )}

          {tab === "register" && (
            <div className={styles.panel}>
              <div className={styles.group}>
                <h3>教材の情報</h3>
                <div className={styles.field}><label>教材名</label><input value={score.title} onChange={(e) => commit({ ...score, title: e.target.value })} /></div>
                <div className={styles.field}><label>作曲者 ・ 出典</label><input value={score.composer} onChange={(e) => commit({ ...score, composer: e.target.value })} /></div>
                <div className={styles.two}>
                  <div className={styles.field}><label>★ 難易度 1〜10</label><input type="number" min={1} max={10} value={star} onChange={(e) => setStar(Number(e.target.value))} /></div>
                  <div className={styles.field}><label>奏法の軸 (練習前シートの棚)</label>
                    <select value={score.articulation ?? ""} onChange={(e) => commit({ ...score, articulation: e.target.value || null })}>
                      <option value="">なし</option>
                      {ARTICULATIONS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className={styles.two}>
                  <div className={styles.field}><label>テンポ 下限</label><input type="number" value={score.tempoMin ?? ""} onChange={(e) => commit({ ...score, tempoMin: e.target.value ? Number(e.target.value) : null })} /></div>
                  <div className={styles.field}><label>テンポ 上限</label><input type="number" value={score.tempoMax ?? ""} onChange={(e) => commit({ ...score, tempoMax: e.target.value ? Number(e.target.value) : null })} /></div>
                </div>
                {!initial && (
                  <div className={styles.field}><label>既存のグループに入れる</label>
                    <select value={joinGroupId} onChange={(e) => setJoinGroupId(e.target.value)}>
                      <option value="">新しいグループを作る</option>
                      {groupChoices.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
                    </select>
                  </div>
                )}
                {!initial && <div className={styles.field}><label>短い説明 (200 字)</label><input value={descShort} maxLength={200} onChange={(e) => setDescShort(e.target.value)} /></div>}
                {!initial && <div className={styles.field}><label>説明</label><textarea value={desc} onChange={(e) => setDesc(e.target.value)} /></div>}
              </div>
              {!initial && (
                <div className={styles.group}>
                  <h3>変種の一括生成 (ファイル登録と同じ)</h3>
                  <label className={styles.row}><input type="checkbox" checked={expandAllKeys} disabled={!(EXPAND_CATS.includes(score.category) && score.key.mode === "major")} onChange={(e) => setExpandAllKeys(e.target.checked)} /> 全調に展開する (音階 ・ アルペジオ ・ フィンガリングの長調のみ)</label>
                  <label className={styles.row}><input type="checkbox" checked={stdArts} onChange={(e) => setStdArts(e.target.checked)} /> 通常奏法の変種を作る</label>
                  {stdArts && <div className={styles.row}>{STANDARD_ARTICULATIONS.map((a) => <button key={a.id} className={`${styles.chip} ${artIds.has(a.id) ? styles.chipOn : ""}`} onClick={() => setArtIds((s) => { const n = new Set(s); if (n.has(a.id)) n.delete(a.id); else n.add(a.id); return n })}>{a.label}</button>)}</div>}
                </div>
              )}
              <div className={styles.group}>
                <h3>{initial ? "保存" : "登録"}</h3>
                <p className={styles.hint}>{errors.length ? `直すところが ${errors.length} 件あります。下の帯から直してください。` : "問題はありません。確認して登録へ進めます。"}</p>
                <button className={`${styles.btn} ${styles.btnPri}`} onClick={openConfirm}>{initial ? "確認して保存" : "確認して登録"}</button>
              </div>
            </div>
          )}
        </aside>
      </div>

      <footer className={styles.bottom}>
        <ul className={styles.problems}>
          {problems.length === 0 && <li className={styles.pOk}>問題はありません</li>}
          {problems.slice(0, 40).map((p, i) => (
            <li key={i} className={p.level === "error" ? styles.pErr : styles.pWarn} onClick={() => focusProblem(p)}>
              <span className={`${styles.pill} ${p.level === "error" ? styles.pillErr : styles.pillWarn}`}>{p.level === "error" ? "直す" : "注意"}</span>
              <span>小節 {p.measure}</span>
              <span>{p.text}</span>
            </li>
          ))}
        </ul>
        <div className={styles.status}>{msg}{histN ? "" : ""}</div>
      </footer>

      {confirm && (
        <div className={styles.modalBack} onClick={() => setConfirm(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>登録前の確認 ・ アプリの楽譜エンジンでの見え方</h2>
            <p className={styles.hint}>{score.title || "(教材名なし)"} ・ {CATEGORY_LABELS[score.category]} ・ {keyLabel(score.key)} ・ {score.time.beats}/{score.time.beatType} ・ {score.measures.length} 小節 ・ ★{star}{score.articulation ? ` ・ 奏法の軸 ${ARTICULATIONS.find((a) => a.id === score.articulation)?.label ?? score.articulation}` : ""}</p>
            {confirm.problems.length > 0 && (
              <ul className={styles.problems}>
                {confirm.problems.map((p, i) => <li key={i} className={p.level === "error" ? styles.pErr : styles.pWarn}><span className={`${styles.pill} ${p.level === "error" ? styles.pillErr : styles.pillWarn}`}>{p.level === "error" ? "直す" : "注意"}</span><span>小節 {p.measure}</span><span>{p.text}</span></li>)}
              </ul>
            )}
            <OsmdPreview xml={confirm.xml} />
            <details><summary className={styles.sub}>MusicXML を見る ({(confirm.xml.length / 1024).toFixed(1)} KB)</summary><pre style={{ fontSize: 11, maxHeight: 240, overflow: "auto", background: "#f4f6fa", padding: 8, borderRadius: 6 }}>{confirm.xml}</pre></details>
            <div className={styles.row} style={{ justifyContent: "flex-end" }}>
              {msg && <span className={styles.pErr}>{msg}</span>}
              <button className={styles.btn} onClick={() => setConfirm(null)}>戻って直す</button>
              <button className={`${styles.btn} ${styles.btnPri}`} onClick={submit} disabled={busy || confirm.problems.some((p) => p.level === "error")}>{busy ? "処理中…" : initial ? "この内容で保存する" : "この内容で登録する"}</button>
            </div>
          </div>
        </div>
      )}

      {done && (
        <div className={styles.modalBack}>
          <div className={styles.modal} style={{ width: 520 }}>
            <h2>{initial ? "保存しました" : "登録しました"}</h2>
            <div className={styles.done}>
              <p className={styles.hint} style={{ color: "#1d2430" }}>解析と譜面作りが始まりました。数分で教材管理の一覧に「完了」が出ます。</p>
              <Link href={`/${userId}/admin/practice`}>教材管理の一覧へ</Link>
              <Link href={`/${userId}/admin/author?item=${done.itemId}`}>この教材をもう一度開いて直す</Link>
              {!initial && <button className={styles.btn} onClick={() => { setDone(null); past.current = []; future.current = []; setScore(freshScore()); clearSel(); setMsg("") }}>続けて新しく作る</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
