/**
 * 自作スコア登録 (2026-09-06 Tetsuo確定): 音階 ・ アルペジオ ・ ボーイング ・ フィンガリングの教材を、
 * ファイルを用意せずに管理画面で組み立てる。
 *   並べる (調 ・ 種類 ・ オクターブ ・ 型から自動生成、弦と指も自動) → 五線譜の上で音を上下させて直す → MusicXML を作って登録。
 * ここは画面とサーバーの両方で使う素の計算。MusicXML は従来のファイル登録と同じ道 (解析 ・ 譜面 ・ 全調生成) に流す。
 * 弦と指は MusicXML の標準 (<technical><string>/<fingering>) で入れる。弦番号は MusicXML の慣例 1=E 2=A 3=D 4=G。
 */
export type StringId = "G" | "D" | "A" | "E"
export type AuthorArt = "" | "staccato" | "accent" | "tenuto"
export type AuthorNote = {
  midi: number
  str: StringId
  fin: number      // 0〜4
  pos: number      // 1〜5
  ql: number       // 4 分音符 = 1
  art: AuthorArt
}
export type AuthorCategory = "scale" | "arpeggio" | "bowing" | "fingering"
export type AuthorMode = "major" | "minor" | "harmonic" | "arpM" | "arpm"

export const STRINGS: StringId[] = ["G", "D", "A", "E"]
export const OPEN_MIDI: Record<StringId, number> = { G: 55, D: 62, A: 69, E: 76 }
export const STRING_NUMBER: Record<StringId, number> = { E: 1, A: 2, D: 3, G: 4 }
export const VIOLIN_LOW = 55
export const VIOLIN_HIGH = 100
export const AUTHOR_ARTS: { id: AuthorArt; label: string }[] = [
  { id: "", label: "なし" }, { id: "staccato", label: "スタッカート" }, { id: "accent", label: "アクセント" }, { id: "tenuto", label: "テヌート" },
]
export const LENGTHS: { ql: number; label: string }[] = [{ ql: 1, label: "4分" }, { ql: 0.5, label: "8分" }, { ql: 0.25, label: "16分" }]

/** ポジションごとの半音のずれ (近似。第 3 = 1 指が第 1 ポジションの 3 指の場所 = +3 半音、第 4 = +5、第 5 = +7) */
const POS_SHIFT: Record<number, number> = { 1: 0, 2: 2, 3: 3, 4: 5, 5: 7 }
/** 第 1 ポジションの 開放弦からの半音 → 指 */
const FIRST_FINGER: Record<number, number> = { 0: 0, 1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 3, 7: 4 }
/** 指板で指を置くときの既定 (全音 ・ 全音 ・ 半音 ・ 全音) */
const FINGER_SEMI = [0, 2, 4, 5, 7]

const SHARP_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
const FLAT_NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"]
export const TONICS = ["C", "G", "D", "A", "E", "B", "F#", "F", "Bb", "Eb", "Ab", "Db"]
const SEMI: Record<string, number> = { C: 0, "C#": 1, Db: 1, D: 2, Eb: 3, E: 4, F: 5, "F#": 6, Gb: 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 }
const FLAT_KEYS = new Set(["F", "Bb", "Eb", "Ab", "Db", "Gb"])
const FIFTHS_MAJOR: Record<string, number> = { C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, "F#": 6, "C#": 7, F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6 }

export const MODE_DEF: Record<AuthorMode, { label: string; iv: number[]; keyMode: "major" | "minor"; categories: AuthorCategory[] }> = {
  major: { label: "長調", iv: [0, 2, 4, 5, 7, 9, 11], keyMode: "major", categories: ["scale"] },
  minor: { label: "自然的短音階", iv: [0, 2, 3, 5, 7, 8, 10], keyMode: "minor", categories: ["scale"] },
  harmonic: { label: "和声的短音階", iv: [0, 2, 3, 5, 7, 8, 11], keyMode: "minor", categories: ["scale"] },
  arpM: { label: "長三和音", iv: [0, 4, 7], keyMode: "major", categories: ["arpeggio"] },
  arpm: { label: "短三和音", iv: [0, 3, 7], keyMode: "minor", categories: ["arpeggio"] },
}

/** 短調は平行長調の調号で綴る */
export function usesFlats(tonic: string, keyMode: "major" | "minor"): boolean {
  if (keyMode === "major") return FLAT_KEYS.has(tonic)
  const rel = (SEMI[tonic] + 3) % 12
  return FLAT_KEYS.has(FLAT_NAMES[rel]) && !["C", "G", "D", "A", "E", "B"].includes(SHARP_NAMES[rel])
}
export function fifthsOf(tonic: string, keyMode: "major" | "minor"): number {
  if (keyMode === "major") return FIFTHS_MAJOR[tonic] ?? 0
  const rel = (SEMI[tonic] + 3) % 12
  const name = FIFTHS_MAJOR[SHARP_NAMES[rel]] != null && Math.abs(FIFTHS_MAJOR[SHARP_NAMES[rel]]) <= Math.abs(FIFTHS_MAJOR[FLAT_NAMES[rel]] ?? 99) ? SHARP_NAMES[rel] : FLAT_NAMES[rel]
  return FIFTHS_MAJOR[name] ?? 0
}
export function noteName(midi: number, flats: boolean): string {
  return (flats ? FLAT_NAMES : SHARP_NAMES)[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1)
}

/** 弦と指の自動付与: 低い弦から第 1 ポジションで届く弦。届かなければ E 弦で高いポジション */
export function autoStringFinger(midi: number): { str: StringId; fin: number; pos: number } {
  for (const s of STRINGS) {
    const off = midi - OPEN_MIDI[s]
    if (off >= 0 && off <= 7) return { str: s, fin: FIRST_FINGER[off], pos: 1 }
  }
  for (let p = 2; p <= 5; p++) {
    const off = midi - OPEN_MIDI.E - POS_SHIFT[p]
    if (off >= 1 && off <= 7) return { str: "E", fin: FIRST_FINGER[off], pos: p }
  }
  return { str: "E", fin: 4, pos: 5 }
}
/** 弦を指定して同じ高さを取る指とポジション。その弦で取れなければ null */
export function refitToString(midi: number, str: StringId): { str: StringId; fin: number; pos: number } | null {
  const off = midi - OPEN_MIDI[str]
  if (off < 0) return null
  if (off <= 7) return { str, fin: FIRST_FINGER[off], pos: 1 }
  for (let p = 2; p <= 5; p++) {
    const o = off - POS_SHIFT[p]
    if (o >= 1 && o <= 7) return { str, fin: FIRST_FINGER[o], pos: p }
  }
  return null
}
export function midiOfFinger(str: StringId, fin: number, pos: number): number {
  if (fin === 0) return OPEN_MIDI[str]
  return OPEN_MIDI[str] + (POS_SHIFT[pos] ?? 0) + FINGER_SEMI[Math.max(1, Math.min(4, fin))]
}

/** 調の音の集合 (音階以外の種類は長調の音で動かす) */
function scaleSet(tonic: string, mode: AuthorMode): Set<number> {
  const iv = MODE_DEF[mode].iv.length >= 7 ? MODE_DEF[mode].iv : MODE_DEF.major.iv
  const root = SEMI[tonic] ?? 0
  return new Set(iv.map((i) => (root + i) % 12))
}
/** 五線譜の段 1 つ = 調の隣の音。音域の外には出ない */
export function stepInKey(midi: number, n: number, tonic: string, mode: AuthorMode): number {
  const set = scaleSet(tonic, mode)
  let m = midi
  const d = Math.sign(n)
  for (let k = 0; k < Math.abs(n); k++) {
    let next = m
    do { next += d } while (!set.has(((next % 12) + 12) % 12) && next > VIOLIN_LOW - 12 && next < VIOLIN_HIGH + 12)
    if (next < VIOLIN_LOW || next > VIOLIN_HIGH) break
    m = next
  }
  return m
}

export function makeNote(midi: number, ql: number, sf?: { str: StringId; fin: number; pos: number }): AuthorNote {
  const s = sf ?? autoStringFinger(midi)
  return { midi, str: s.str, fin: s.fin, pos: s.pos, ql, art: "" }
}
export function withPitch(n: AuthorNote, midi: number): AuthorNote {
  const s = autoStringFinger(midi)
  return { ...n, midi, str: s.str, fin: s.fin, pos: s.pos }
}

/** 音階 ・ アルペジオを並べる。出発は音域内でいちばん低い主音 */
export function generateSequence(o: { tonic: string; mode: AuthorMode; octaves: number; shape: "updown" | "up"; ql: number }): AuthorNote[] {
  let start = 48 + (SEMI[o.tonic] ?? 0)
  while (start < VIOLIN_LOW) start += 12
  const iv = MODE_DEF[o.mode].iv
  const up: number[] = []
  for (let oc = 0; oc < o.octaves; oc++) iv.forEach((i) => up.push(start + oc * 12 + i))
  up.push(start + o.octaves * 12)
  const seq = o.shape === "updown" ? up.concat(up.slice(0, -1).reverse()) : up
  return seq.filter((m) => m <= VIOLIN_HIGH).map((m) => makeNote(m, o.ql))
}

/** ボーイング ・ フィンガリングの出発点の型 (弦と指の短い並び) */
export const PRESETS: Record<"bowing" | "fingering", { id: string; label: string; text: string }[]> = {
  bowing: [
    { id: "open", label: "開放弦の往復 D A D A", text: "D0 A0 D0 A0 D0 A0 D0 A0" },
    { id: "cross", label: "隣の弦へ移る D0 A0 D1 A1", text: "D0 A0 D1 A1 D2 A2 D3 A3" },
    { id: "four", label: "1 弦で 4 音 D0 D1 D2 D3", text: "D0 D1 D2 D3 D3 D2 D1 D0" },
  ],
  fingering: [
    { id: "four", label: "1 弦で 4 音 D0 D1 D2 D3", text: "D0 D1 D2 D3 D3 D2 D1 D0" },
    { id: "shift", label: "ポジション移動 A1 A2 A3 → 3p A1 A2", text: "A1 A2 A3 3p A1 A2 A3 1p A1" },
    { id: "ladder", label: "指の階段 G0 G1 G2 G3 D0 D1 D2 D3", text: "G0 G1 G2 G3 D0 D1 D2 D3" },
  ],
}
/** 「D0 D1 3p A1」の並びを音にする (画面の型と、検証用) */
export function parseShorthand(text: string, ql: number): AuthorNote[] {
  let pos = 1
  const out: AuthorNote[] = []
  for (const tok of text.trim().split(/\s+/).filter(Boolean)) {
    const pm = tok.match(/^(\d)p$/i)
    if (pm) { pos = Math.max(1, Math.min(5, Number(pm[1]))); continue }
    const m = tok.match(/^([GDAE])([0-4])$/i)
    if (!m) continue
    const str = m[1].toUpperCase() as StringId
    const fin = Number(m[2])
    out.push(makeNote(midiOfFinger(str, fin, pos), ql, { str, fin, pos: fin === 0 ? 1 : pos }))
  }
  return out
}

export function totalBeats(notes: AuthorNote[]): number {
  return Math.round(notes.reduce((a, n) => a + n.ql, 0) * 1000) / 1000
}

// ---------- MusicXML ----------
const DIVISIONS = 4   // 4 分音符 = 4
const TYPE_OF: Record<number, string> = { 4: "whole", 2: "half", 1: "quarter", 0.5: "eighth", 0.25: "16th", 0.125: "32nd" }
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

function pitchXml(name: string): string {
  const m = name.match(/^([A-G])([#b]?)(-?\d+)$/)
  if (!m) throw new Error(`bad note name ${name}`)
  const alter = m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0
  return `<pitch><step>${m[1]}</step>${alter ? `<alter>${alter}</alter>` : ""}<octave>${m[3]}</octave></pitch>`
}
function typeOf(ql: number): string {
  if (TYPE_OF[ql]) return TYPE_OF[ql]
  // 小節をまたいで割った端数などは、いちばん近い音価に倒す (表示用。長さは duration が正)
  const keys = Object.keys(TYPE_OF).map(Number).sort((a, b) => Math.abs(a - ql) - Math.abs(b - ql))
  return TYPE_OF[keys[0]]
}

export type BuildInput = { title: string; tonic: string; keyMode: "major" | "minor"; beats: number; notes: AuthorNote[] }

/** 入力から MusicXML を組み立てる。小節をまたぐ音はタイで割り、最後の小節の残りは休符で埋める */
export function buildMusicXml(input: BuildInput): string {
  const flats = usesFlats(input.tonic, input.keyMode)
  const fifths = fifthsOf(input.tonic, input.keyMode)
  const measures: string[][] = [[]]
  let acc = 0
  const pushNote = (n: AuthorNote, ql: number, tie: "start" | "stop" | "both" | null) => {
    const name = noteName(n.midi, flats)
    const artXml = n.art === "staccato" ? "<articulations><staccato/></articulations>" : n.art === "accent" ? "<articulations><accent/></articulations>" : n.art === "tenuto" ? "<articulations><tenuto/></articulations>" : ""
    const tieXml = tie === null ? "" : tie === "both" ? `<tie type="stop"/><tie type="start"/>` : `<tie type="${tie}"/>`
    const tiedXml = tie === null ? "" : tie === "both" ? `<tied type="stop"/><tied type="start"/>` : `<tied type="${tie}"/>`
    const tech = `<technical><string>${STRING_NUMBER[n.str]}</string><fingering>${n.fin}</fingering></technical>`
    measures[measures.length - 1].push(
      `<note>${pitchXml(name)}<duration>${Math.round(ql * DIVISIONS)}</duration>${tieXml}<voice>1</voice><type>${typeOf(ql)}</type><notations>${tiedXml}${tech}${artXml}</notations></note>`,
    )
  }
  for (const n of input.notes) {
    let rest = n.ql
    let first = true
    while (rest > 1e-9) {
      const room = input.beats - acc
      const take = Math.min(rest, room)
      const tie = take < rest ? (first ? "start" : "both") : first ? null : "stop"
      pushNote(n, take, tie)
      acc += take
      rest -= take
      first = false
      if (acc >= input.beats - 1e-9) { acc = 0; if (rest > 1e-9 || n !== input.notes[input.notes.length - 1]) measures.push([]) }
    }
  }
  // 最後の小節が埋まらないときは休符で埋める (音階の音数は小節と合わないのがふつう)
  if (acc > 1e-9) {
    const rest = input.beats - acc
    measures[measures.length - 1].push(`<note><rest/><duration>${Math.round(rest * DIVISIONS)}</duration><voice>1</voice><type>${typeOf(rest)}</type></note>`)
  }
  if (measures[measures.length - 1].length === 0) measures.pop()
  const attrs = `<attributes><divisions>${DIVISIONS}</divisions><key><fifths>${fifths}</fifths><mode>${input.keyMode}</mode></key><time><beats>${input.beats}</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes>`
  const body = measures.map((m, i) => `<measure number="${i + 1}">${i === 0 ? attrs : ""}${m.join("")}</measure>`).join("\n")
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
<work><work-title>${esc(input.title)}</work-title></work>
<part-list><score-part id="P1"><part-name>Violin</part-name></score-part></part-list>
<part id="P1">
${body}
</part>
</score-partwise>
`
}
