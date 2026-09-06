"use client"
/**
 * 作っている楽譜をその場で鳴らす (要件 10 ・ 確認)。アプリのお手本と同じ音源 (violinSampler)。
 * 反復と括弧は展開して鳴らす。D.C. ・ D.S. ・ Coda は 1 回だけ従う (Fine で止まる)。
 */
import * as Tone from "tone"
import { durQl, type AuthorScore, type Element, type Measure } from "@/app/_libs/author/model"
import { midiOf } from "@/app/_libs/author/pitch"
import { playNote, preloadFor, midiToNoteName, type NoteArticulation } from "@/app/_libs/violinSampler"

/** 演奏順の小節の列 (反復 ・ 括弧 ・ とび先を展開) */
export function playOrder(measures: Measure[]): number[] {
  const out: number[] = []
  // 反復 (括弧つき) を展開
  let i = 0
  let repeatFrom = 0
  let pass = 1
  const guard = measures.length * 8 + 16
  while (i < measures.length && out.length < guard) {
    const m = measures[i]
    if (m.repeatStart) { if (pass === 1) repeatFrom = i }
    if (m.endingStart != null && m.endingStart !== pass) {
      // この括弧は今回の回ではない → 括弧の終わりの次へ
      let j = i
      while (j < measures.length && measures[j].endingStop == null) j++
      i = j + 1
      continue
    }
    out.push(i)
    if (m.repeatEnd && pass === 1) { pass = 2; i = repeatFrom; continue }
    if (m.repeatEnd && pass === 2) { pass = 1 }
    i++
  }
  // とび先 (1 回だけ)
  const idx = (d: string) => measures.findIndex((m) => m.direction === d)
  const dcds = out.find((k) => /^(dc|ds)/.test(measures[k].direction ?? ""))
  if (dcds != null) {
    const dir = measures[dcds].direction!
    const start = dir.startsWith("ds") ? Math.max(0, idx("segno")) : 0
    const fine = idx("fine"), toCoda = idx("toCoda"), coda = idx("coda")
    const head = out.slice(0, out.indexOf(dcds) + 1)
    const tail: number[] = []
    for (let k = start; k < measures.length; k++) {
      if (/alCoda$/.test(dir) && k === toCoda + 1 && toCoda >= 0 && coda >= 0) { for (let c = coda; c < measures.length; c++) tail.push(c); break }
      tail.push(k)
      if (/alFine$/.test(dir) && k === fine) break
      if (k === dcds) break
    }
    return [...head, ...tail]
  }
  return out
}

export type Scheduled = { id: string; at: number; dur: number }

function artOf(e: Element, pizz: boolean, slurOpen: boolean, slurStartsHere: boolean, slurEndsHere: boolean): NoteArticulation {
  const ids: string[] = e.arts.map((a) => (a === "bow_staccato" ? "staccato" : a))
  if (pizz) ids.push("pizzicato")
  return {
    articulations: ids,
    dynamic: e.dyn ?? null,
    is_tremolo: e.arts.includes("tremolo"),
    is_trill: e.orn === "trill",
    is_mordent: e.orn === "mordent",
    slur: slurStartsHere ? "start" : slurEndsHere ? "end" : slurOpen ? "mid" : null,
  }
}

/** 鳴らす。戻り = 止める関数と、時間つきの列 (光らせる用) */
export async function playScore(score: AuthorScore, onTick: (id: string | null) => void): Promise<{ stop: () => void; total: number }> {
  await Tone.start()
  const order = playOrder(score.measures)
  const sched: Scheduled[] = []
  let t = 0.15
  let bpm = score.measures[0]?.tempo ?? score.tempoMin ?? 80
  let pizz = false
  const openSlurs = new Set<number>()
  const notes: { e: Element; at: number; dur: number; art: NoteArticulation }[] = []
  for (const mi of order) {
    const m = score.measures[mi]
    if (m.tempo) bpm = m.tempo
    const spb = 60 / bpm
    for (let k = 0; k < m.elements.length; k++) {
      const e = m.elements[k]
      if (e.special === "pizz") pizz = true
      if (e.special === "arco") pizz = false
      const startsHere = e.slurStart.length > 0
      const endsHere = e.slurStop.length > 0
      const wasOpen = openSlurs.size > 0
      for (const n of e.slurStop) openSlurs.delete(n)
      for (const n of e.slurStart) openSlurs.add(n)
      let dur = durQl(e.dur) * spb
      let at = t
      if (e.grace) { dur = Math.min(0.12, spb * 0.25); at = t - dur; if (at < 0.05) at = 0.05 }
      else t += dur
      sched.push({ id: e.id, at, dur })
      if (e.kind === "note") {
        notes.push({ e, at, dur, art: artOf(e, pizz, wasOpen && !startsHere, startsHere, endsHere) })
      }
    }
  }
  await preloadFor(notes.map((n) => n.art))
  const now = Tone.now()
  for (const n of notes) {
    if (n.e.tie === "stop" || n.e.tie === "both") continue   // タイの続きは前の音で伸ばす
    let dur = n.dur
    if (n.e.tie === "start") {
      // 次の同じ高さの音の長さを足す
      const idx = notes.indexOf(n)
      for (let q = idx + 1; q < notes.length; q++) { const nx = notes[q]; if (nx.e.tie === "stop" || nx.e.tie === "both") { dur += nx.dur; if (nx.e.tie === "stop") break } else break }
    }
    for (const h of n.e.heads) {
      const name = midiToNoteName(midiOf(h.pitch))
      void playNote(name, dur, now + n.at, n.art, null)
    }
  }
  const timers: ReturnType<typeof setTimeout>[] = []
  for (const s of sched) timers.push(setTimeout(() => onTick(s.id), s.at * 1000))
  const total = t + 0.6
  timers.push(setTimeout(() => onTick(null), total * 1000))
  return {
    total,
    stop: () => {
      for (const tm of timers) clearTimeout(tm)
      onTick(null)
      try { Tone.getTransport().stop(); Tone.getTransport().cancel() } catch { /* noop */ }
    },
  }
}
