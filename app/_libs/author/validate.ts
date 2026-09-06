/**
 * 作成前の検証 (要件 07 ・ 10)。問題は「どの小節 ・ どの音 ・ なぜ」で返す。純粋。
 */
import { durQl, effectiveTime, elementsQl, measureQl, VIOLIN_HIGH, VIOLIN_LOW, type AuthorScore } from "./model"
import { midiOf, pitchKana, positionOf, samePitch } from "./pitch"

export type Problem = { level: "error" | "warn"; measure: number; elementId: string | null; text: string }

export function validateScore(score: AuthorScore): Problem[] {
  const out: Problem[] = []
  if (!score.title.trim()) out.push({ level: "error", measure: 0, elementId: null, text: "教材名を入れてください" })
  if (score.measures.length === 0) out.push({ level: "error", measure: 0, elementId: null, text: "小節がありません" })
  const openSlurs = new Map<number, number>()   // slur 番号 → 始まった小節
  let openEnding: number | null = null
  let hasSegno = false, hasCoda = false, hasFine = false, hasToCoda = false
  const needs = { segno: false, coda: false, fine: false }
  let prevPitchMidiForTie: number | null = null
  let tieOpen = false
  score.measures.forEach((m, mi) => {
    const no = m.implicit ? 0 : mi + (score.measures[0]?.implicit ? 0 : 1)
    const time = effectiveTime(score, mi)
    const full = measureQl(time)
    const got = elementsQl(m.elements)
    if (m.elements.length === 0) out.push({ level: "error", measure: no, elementId: null, text: "音も休符もありません" })
    else if (m.implicit) { if (got >= full - 1e-6) out.push({ level: "warn", measure: no, elementId: null, text: `弱起の小節なのに拍が満ちています (${got} 拍)` }) }
    else if (Math.abs(got - full) > 1e-6) out.push({ level: "error", measure: no, elementId: null, text: got < full ? `拍が足りません (${got} / ${full} 拍)` : `拍が余っています (${got} / ${full} 拍)` })
    // 連符のまとまり: 同じ連符の音が連続して、合計が普通の音価になること
    let i = 0
    while (i < m.elements.length) {
      const e = m.elements[i]
      if (!e.dur.tuplet) { i++; continue }
      let j = i, sum = 0
      while (j < m.elements.length && m.elements[j].dur.tuplet && m.elements[j].dur.tuplet!.actual === e.dur.tuplet.actual) { sum += durQl(m.elements[j].dur); j++ }
      const groupBaseQl = durQl({ ...e.dur, tuplet: null }) * e.dur.tuplet.normal
      if (Math.abs((sum / groupBaseQl) - Math.round(sum / groupBaseQl)) > 1e-6) out.push({ level: "error", measure: no, elementId: e.id, text: `${e.dur.tuplet.actual} 連符のまとまりが揃っていません (${sum} 拍)` })
      i = j
    }
    m.elements.forEach((e) => {
      if (e.kind === "rest") return
      e.heads.forEach((h, hi) => {
        const midi = midiOf(h.pitch)
        if (midi < VIOLIN_LOW || midi > VIOLIN_HIGH) out.push({ level: "error", measure: no, elementId: e.id, text: `${pitchKana(h.pitch)} はバイオリンの音域 (G3〜E7) の外です` })
        if (h.string && h.finger != null) {
          const r = positionOf(h.pitch, h.string, h.finger)
          if (r.pos == null) out.push({ level: "error", measure: no, elementId: e.id, text: r.reason ?? "弦と指が合いません" })
        } else if ((h.string && h.finger == null) || (!h.string && h.finger != null)) {
          out.push({ level: "warn", measure: no, elementId: e.id, text: hi === 0 ? "弦と指は両方そろえるか、両方とも自動にしてください" : "重音の構成音の弦と指をそろえてください" })
        }
      })
      if (e.heads.length > 1) {
        const strings = e.heads.map((h) => h.string).filter(Boolean)
        if (new Set(strings).size !== strings.length) out.push({ level: "error", measure: no, elementId: e.id, text: "重音の構成音が同じ弦になっています" })
      }
      // タイ: 次の音が同じ高さ
      if (tieOpen) {
        if (e.tie !== "stop" && e.tie !== "both") out.push({ level: "error", measure: no, elementId: e.id, text: "前の音のタイが終わっていません" })
        else if (prevPitchMidiForTie != null && (e.heads.length !== 1 || midiOf(e.heads[0].pitch) !== prevPitchMidiForTie)) out.push({ level: "error", measure: no, elementId: e.id, text: "タイでつなぐ音は同じ高さにしてください" })
      } else if (e.tie === "stop") out.push({ level: "error", measure: no, elementId: e.id, text: "タイの終わりだけがあります" })
      tieOpen = e.tie === "start" || e.tie === "both"
      prevPitchMidiForTie = e.heads.length === 1 ? midiOf(e.heads[0].pitch) : null
      // スラー
      for (const n of e.slurStop) { if (!openSlurs.has(n)) out.push({ level: "error", measure: no, elementId: e.id, text: `スラー ${n} の終わりだけがあります` }); openSlurs.delete(n) }
      for (const n of e.slurStart) { if (openSlurs.has(n)) out.push({ level: "error", measure: no, elementId: e.id, text: `スラー ${n} が二重に始まっています` }); openSlurs.set(n, no) }
      if (e.arts.includes("bow_staccato") && openSlurs.size === 0 && e.slurStart.length === 0) out.push({ level: "warn", measure: no, elementId: e.id, text: "連続スピッカートはスラーの中に置いてください" })
      if (e.grace && durQl(e.dur) > 1) out.push({ level: "warn", measure: no, elementId: e.id, text: "装飾音符は短い音価にしてください" })
    })
    // 括弧 ・ 反復
    if (m.endingStart != null) { if (openEnding != null) out.push({ level: "error", measure: no, elementId: null, text: `${openEnding} 番括弧が閉じないまま ${m.endingStart} 番括弧が始まっています` }); openEnding = m.endingStart }
    if (m.endingStop != null) { if (openEnding !== m.endingStop) out.push({ level: "error", measure: no, elementId: null, text: `${m.endingStop} 番括弧の終わりに対応する始まりがありません` }); openEnding = null }
    if (m.direction === "segno") hasSegno = true
    if (m.direction === "coda") hasCoda = true
    if (m.direction === "fine") hasFine = true
    if (m.direction === "toCoda") { hasToCoda = true; needs.coda = true }
    if (m.direction === "ds" || m.direction === "dsAlFine" || m.direction === "dsAlCoda") needs.segno = true
    if (m.direction === "dcAlFine" || m.direction === "dsAlFine") needs.fine = true
    if (m.direction === "dcAlCoda" || m.direction === "dsAlCoda") needs.coda = true
  })
  if (openSlurs.size) out.push({ level: "error", measure: [...openSlurs.values()][0], elementId: null, text: `スラー ${[...openSlurs.keys()].join(",")} が終わっていません` })
  if (tieOpen) out.push({ level: "error", measure: score.measures.length, elementId: null, text: "最後の音のタイが終わっていません" })
  if (openEnding != null) out.push({ level: "error", measure: score.measures.length, elementId: null, text: `${openEnding} 番括弧が終わっていません` })
  if (needs.segno && !hasSegno) out.push({ level: "error", measure: 0, elementId: null, text: "D.S. があるのに Segno がありません" })
  if (needs.coda && !hasCoda) out.push({ level: "error", measure: 0, elementId: null, text: "Coda へのとび先があるのに Coda がありません" })
  if (needs.fine && !hasFine) out.push({ level: "error", measure: 0, elementId: null, text: "al Fine があるのに Fine がありません" })
  if (hasToCoda && !hasCoda) out.push({ level: "error", measure: 0, elementId: null, text: "To Coda があるのに Coda がありません" })
  const reps = score.measures.filter((m) => m.repeatStart).length, repe = score.measures.filter((m) => m.repeatEnd).length
  if (repe > reps + 1) out.push({ level: "warn", measure: 0, elementId: null, text: "反復の終わりの数が始まりより多いです (曲頭からの反復として扱われます)" })
  return out
}

/** 使わない変数の警告避け (samePitch は将来のタイ検査で使う) */
export const _keep = { samePitch }
