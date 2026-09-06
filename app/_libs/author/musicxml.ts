/**
 * AuthorScore → MusicXML (partwise 4.0)。要件定義 v1 09。
 * 解析器 (music21) と譜面 (OSMD) が読む標準要素だけを使う。奏法の要素は解析器の生成側 (_ART_CLS) と同じ。
 */
import { DUR_BASES, durQl, effectiveKey, effectiveTime, measureQl, STRING_NUMBER, type AuthorScore, type Element, type ArticulationId } from "./model"
import { accidentalsForMeasure, type AccidentalOut } from "./pitch"

/** 4 分音符 = 960 (64 分 = 60、3 連 ・ 5 連 ・ 7 連 が整数になる) */
export const DIVISIONS = 960
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

const ART_XML: Record<ArticulationId, string | null> = {
  legato: "<tenuto/>",            // 解析器: Tenuto
  tenuto: "<tenuto/>",
  staccato: "<staccato/>",
  staccatissimo: "<staccatissimo/>",
  spiccato: "<spiccato/>",
  martele: "<strong-accent/>",    // 解析器: StrongAccent
  portato: "<detached-legato/>",  // 解析器: DetachedLegato
  accent: "<accent/>",
  tremolo: null,                  // ornaments の tremolo
  bow_staccato: "<staccato/>",    // 点 + スラー (スラーは slurStart/Stop で付ける)
}
const DIRECTION_XML: Record<string, string> = {
  segno: `<direction placement="above"><direction-type><segno/></direction-type><sound segno="segno1"/></direction>`,
  coda: `<direction placement="above"><direction-type><coda/></direction-type><sound coda="coda1"/></direction>`,
  fine: `<direction placement="above"><direction-type><words>Fine</words></direction-type><sound fine="yes"/></direction>`,
  toCoda: `<direction placement="above"><direction-type><words>To Coda</words></direction-type><sound tocoda="coda1"/></direction>`,
  dc: `<direction placement="above"><direction-type><words>D.C.</words></direction-type><sound dacapo="yes"/></direction>`,
  dcAlFine: `<direction placement="above"><direction-type><words>D.C. al Fine</words></direction-type><sound dacapo="yes"/></direction>`,
  dcAlCoda: `<direction placement="above"><direction-type><words>D.C. al Coda</words></direction-type><sound dacapo="yes"/></direction>`,
  ds: `<direction placement="above"><direction-type><words>D.S.</words></direction-type><sound dalsegno="segno1"/></direction>`,
  dsAlFine: `<direction placement="above"><direction-type><words>D.S. al Fine</words></direction-type><sound dalsegno="segno1"/></direction>`,
  dsAlCoda: `<direction placement="above"><direction-type><words>D.S. al Coda</words></direction-type><sound dalsegno="segno1"/></direction>`,
}
/** とび先の指示のうち、小節の終わりに置くもの (それ以外は頭) */
const AT_END = new Set(["fine", "toCoda", "dc", "dcAlFine", "dcAlCoda", "ds", "dsAlFine", "dsAlCoda"])

function pitchXml(step: string, alter: number, octave: number): string {
  return `<pitch><step>${step}</step>${alter ? `<alter>${alter}</alter>` : ""}<octave>${octave}</octave></pitch>`
}
function durXml(el: Element): string {
  const base = DUR_BASES.find((b) => b.id === el.dur.base)!
  const dots = el.dur.dots === 1 ? "<dot/>" : el.dur.dots === 2 ? "<dot/><dot/>" : ""
  const tm = el.dur.tuplet ? `<time-modification><actual-notes>${el.dur.tuplet.actual}</actual-notes><normal-notes>${el.dur.tuplet.normal}</normal-notes></time-modification>` : ""
  return `<type>${base.type}</type>${dots}${tm}`
}
function accXml(a: AccidentalOut): string {
  if (!a) return ""
  return `<accidental${a.cautionary ? ' cautionary="yes" parentheses="yes"' : ""}>${a.kind}</accidental>`
}

export function buildMusicXml(score: AuthorScore): string {
  const measures: string[] = []
  let prevAccState = new Map<string, -2 | -1 | 0 | 1 | 2>()
  let tupletOpen = false
  let number = score.measures[0]?.implicit ? 0 : 1
  score.measures.forEach((m, mi) => {
    const key = effectiveKey(score, mi)
    const time = effectiveTime(score, mi)
    const acc = accidentalsForMeasure(key, m.elements, prevAccState)
    prevAccState = acc.state
    const parts: string[] = []
    // attributes: 最初の小節と、拍子 ・ 調が変わる小節
    const attrs: string[] = []
    if (mi === 0) attrs.push(`<divisions>${DIVISIONS}</divisions>`)
    if (mi === 0 || m.key) attrs.push(`<key><fifths>${key.fifths}</fifths><mode>${key.mode}</mode></key>`)
    if (mi === 0 || m.time) attrs.push(`<time><beats>${time.beats}</beats><beat-type>${time.beatType}</beat-type></time>`)
    if (mi === 0) attrs.push(`<clef><sign>G</sign><line>2</line></clef>`)
    if (attrs.length) parts.push(`<attributes>${attrs.join("")}</attributes>`)
    // 左の縦線 (反復の始まり ・ 括弧の始まり)
    if (m.repeatStart || m.endingStart != null) {
      parts.push(`<barline location="left">${m.repeatStart ? `<bar-style>heavy-light</bar-style><repeat direction="forward"/>` : ""}${m.endingStart != null ? `<ending number="${m.endingStart}" type="start"/>` : ""}</barline>`)
    }
    // 頭のテンポ ・ 指示
    if (mi === 0 && score.tempoMin && !m.tempo) parts.push(metronome(score.tempoMin))
    if (m.tempo) parts.push(metronome(m.tempo))
    if (m.direction && !AT_END.has(m.direction)) parts.push(DIRECTION_XML[m.direction])
    // 音
    let lastSlurStopPending: number[] = []
    m.elements.forEach((el, ei) => {
      // 強弱 ・ 松葉は音の前の direction
      if (el.dyn) parts.push(`<direction placement="below"><direction-type><dynamics><${el.dyn}/></dynamics></direction-type><sound dynamics="${DYN_VALUE[el.dyn]}"/></direction>`)
      if (el.wedge) parts.push(`<direction placement="below"><direction-type><wedge type="${el.wedge === "cresc" ? "crescendo" : el.wedge === "dim" ? "diminuendo" : "stop"}"/></direction-type></direction>`)
      if (el.special === "pizz" || el.special === "arco") parts.push(`<direction placement="above"><direction-type><words>${el.special === "pizz" ? "pizz." : "arco"}</words></direction-type>${el.special === "pizz" ? `<sound pizzicato="yes"/>` : `<sound pizzicato="no"/>`}</direction>`)
      if (el.sul) parts.push(`<direction placement="above"><direction-type><words>sul ${el.sul}</words></direction-type></direction>`)
      const ql = durQl(el.dur)
      const duration = Math.round(ql * DIVISIONS)
      if (el.kind === "rest") {
        const full = Math.abs(ql - measureQl(time)) < 1e-6 && m.elements.length === 1
        parts.push(`<note><rest${full ? ' measure="yes"' : ""}/><duration>${duration}</duration><voice>1</voice>${full ? "" : durXml(el)}</note>`)
        return
      }
      // 連符の start / stop
      const nextEl = m.elements[ei + 1]
      const tupletStart = !!el.dur.tuplet && !tupletOpen
      const tupletStop = !!el.dur.tuplet && !(nextEl?.dur.tuplet && nextEl.dur.tuplet.actual === el.dur.tuplet!.actual)
      if (el.dur.tuplet) tupletOpen = !tupletStop
      el.heads.forEach((h, hi) => {
        const notations: string[] = []
        if (hi === 0) {
          if (el.tie === "stop" || el.tie === "both") notations.push(`<tied type="stop"/>`)
          if (el.tie === "start" || el.tie === "both") notations.push(`<tied type="start"/>`)
          for (const n of el.slurStop) notations.push(`<slur type="stop" number="${n}"/>`)
          for (const n of el.slurStart) notations.push(`<slur type="start" number="${n}" placement="above"/>`)
          if (tupletStart) notations.push(`<tuplet type="start" bracket="yes"/>`)
          if (tupletStop) notations.push(`<tuplet type="stop"/>`)
          if (el.special === "gliss") notations.push(`<glissando type="start" line-type="wavy"/>`)
          if (lastSlurStopPending.length) lastSlurStopPending = []
          const arts = el.arts.map((a) => ART_XML[a]).filter(Boolean) as string[]
          if (arts.length) notations.push(`<articulations>${arts.join("")}</articulations>`)
          const orn: string[] = []
          if (el.orn === "trill") orn.push("<trill-mark/>")
          if (el.orn === "mordent") orn.push("<mordent/>")
          if (el.orn === "turn") orn.push("<turn/>")
          if (el.arts.includes("tremolo")) orn.push(`<tremolo type="single">2</tremolo>`)
          if (orn.length) notations.push(`<ornaments>${orn.join("")}</ornaments>`)
        }
        const tech: string[] = []
        if (h.string) tech.push(`<string>${STRING_NUMBER[h.string]}</string>`)
        if (h.finger != null) tech.push(`<fingering>${h.finger}</fingering>`)
        if (hi === 0 && el.bow === "up") tech.push("<up-bow/>")
        if (hi === 0 && el.bow === "down") tech.push("<down-bow/>")
        if (hi === 0 && el.special === "harmonic") tech.push("<harmonic><natural/></harmonic>")
        if (tech.length) notations.push(`<technical>${tech.join("")}</technical>`)
        const tieXml = hi === 0 ? (el.tie === "both" ? `<tie type="stop"/><tie type="start"/>` : el.tie ? `<tie type="${el.tie}"/>` : "") : ""
        const graceXml = el.grace ? `<grace slash="yes"/>` : ""
        const durationXml = el.grace ? "" : `<duration>${duration}</duration>`
        parts.push(`<note>${graceXml}${hi > 0 ? "<chord/>" : ""}${pitchXml(h.pitch.step, h.pitch.alter, h.pitch.octave)}${durationXml}${tieXml}<voice>1</voice>${durXml(el)}${accXml(acc.out.get(`${el.id}#${hi}`) ?? null)}${notations.length ? `<notations>${notations.join("")}</notations>` : ""}</note>`)
      })
    })
    // 終わりの指示 ・ 右の縦線
    if (m.direction && AT_END.has(m.direction)) parts.push(DIRECTION_XML[m.direction])
    if (m.repeatEnd || m.endingStop != null) {
      const endingStopType = m.endingStop != null && !m.repeatEnd ? "discontinue" : "stop"
      parts.push(`<barline location="right">${m.repeatEnd ? `<bar-style>light-heavy</bar-style>` : ""}${m.endingStop != null ? `<ending number="${m.endingStop}" type="${endingStopType}"/>` : ""}${m.repeatEnd ? `<repeat direction="backward"/>` : ""}</barline>`)
    } else if (mi === score.measures.length - 1) {
      parts.push(`<barline location="right"><bar-style>light-heavy</bar-style></barline>`)
    }
    measures.push(`<measure number="${number}"${m.implicit ? ' implicit="yes"' : ""}>${parts.join("")}</measure>`)
    number++
  })
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
<work><work-title>${esc(score.title)}</work-title></work>
<identification>${score.composer ? `<creator type="composer">${esc(score.composer)}</creator>` : ""}<encoding><software>Arcoda score author</software></encoding></identification>
<part-list><score-part id="P1"><part-name>Violin</part-name><score-instrument id="P1-I1"><instrument-name>Violin</instrument-name></score-instrument></score-part></part-list>
<part id="P1">
${measures.join("\n")}
</part>
</score-partwise>
`
}
const DYN_VALUE: Record<string, number> = { pp: 40, p: 54, mp: 64, mf: 76, f: 90, ff: 104 }
function metronome(bpm: number): string {
  return `<direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${bpm}</per-minute></metronome></direction-type><sound tempo="${bpm}"/></direction>`
}
