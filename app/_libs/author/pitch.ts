/**
 * 音の高さ ・ 綴り ・ 調 ・ 臨時記号 ・ 弦と指とポジション (要件定義 v1 02 03 04 06)。純粋。
 * ポジションの算術は解析器 lib/violin_position.py の position_by_letter と同じ (音名の文字数で数える ・ 一意)。
 */
import { STEPS, STRINGS, OPEN_MIDI, MAX_POSITION, VIOLIN_LOW, VIOLIN_HIGH, type Alter, type KeySig, type Pitch, type Step, type StringId, type NoteHead, type AuthorCategory, type Duration, type Element, newNote } from "./model"

const STEP_SEMI: Record<Step, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
const LETTER_INDEX: Record<Step, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 }
/** 開放弦の音名の通し番号 (octave*7 + 文字) = G3 D4 A4 E5 */
const OPEN_DIATONIC: Record<StringId, number> = { G: 3 * 7 + 4, D: 4 * 7 + 1, A: 4 * 7 + 5, E: 5 * 7 + 2 }

export function midiOf(p: Pitch): number {
  return 12 * (p.octave + 1) + STEP_SEMI[p.step] + p.alter
}
export function diatonicIndex(p: Pitch): number {
  return p.octave * 7 + LETTER_INDEX[p.step]
}
export function pitchName(p: Pitch): string {
  const acc = p.alter === 2 ? "x" : p.alter === 1 ? "#" : p.alter === -1 ? "b" : p.alter === -2 ? "bb" : ""
  return `${p.step}${acc}${p.octave}`
}
const KANA: Record<Step, string> = { C: "ド", D: "レ", E: "ミ", F: "ファ", G: "ソ", A: "ラ", B: "シ" }
export function pitchKana(p: Pitch): string {
  return KANA[p.step] + (p.alter > 0 ? "♯".repeat(p.alter) : p.alter < 0 ? "♭".repeat(-p.alter) : "")
}
export function samePitch(a: Pitch, b: Pitch): boolean {
  return a.step === b.step && a.alter === b.alter && a.octave === b.octave
}

// ───────────────────────── 調 ─────────────────────────
const SHARP_ORDER: Step[] = ["F", "C", "G", "D", "A", "E", "B"]
const FLAT_ORDER: Step[] = ["B", "E", "A", "D", "G", "C", "F"]
/** 調号が各音名に与える変化 */
export function keyAlter(key: KeySig, step: Step): Alter {
  if (key.fifths > 0) return SHARP_ORDER.slice(0, key.fifths).includes(step) ? 1 : 0
  if (key.fifths < 0) return FLAT_ORDER.slice(0, -key.fifths).includes(step) ? -1 : 0
  return 0
}
const MAJOR_TONIC: Record<number, string> = { [-7]: "Cb", [-6]: "Gb", [-5]: "Db", [-4]: "Ab", [-3]: "Eb", [-2]: "Bb", [-1]: "F", 0: "C", 1: "G", 2: "D", 3: "A", 4: "E", 5: "B", 6: "F#", 7: "C#" }
const MINOR_TONIC: Record<number, string> = { [-7]: "Ab", [-6]: "Eb", [-5]: "Bb", [-4]: "F", [-3]: "C", [-2]: "G", [-1]: "D", 0: "A", 1: "E", 2: "B", 3: "F#", 4: "C#", 5: "G#", 6: "D#", 7: "A#" }
export function tonicOf(key: KeySig): string {
  return (key.mode === "minor" ? MINOR_TONIC : MAJOR_TONIC)[key.fifths] ?? "C"
}
/** 教材の keyTonic (アプリの表記 = 管理画面の選択肢に寄せる: Cb→B, G#→Ab, D#→Eb, A#→Bb) */
export function keyTonicForItem(key: KeySig): string {
  const t = tonicOf(key)
  return ({ Cb: "B", "G#": "Ab", "D#": "Eb", "A#": "Bb" } as Record<string, string>)[t] ?? t
}
export const KEY_CHOICES: { fifths: number; major: string; minor: string }[] = Array.from({ length: 15 }, (_, i) => i - 7).map((f) => ({ fifths: f, major: MAJOR_TONIC[f], minor: MINOR_TONIC[f] }))
export const KEY_LABEL_JA: Record<string, string> = { C: "ハ", D: "ニ", E: "ホ", F: "ヘ", G: "ト", A: "イ", B: "ロ" }
export function keyLabel(key: KeySig): string {
  const t = tonicOf(key)
  const acc = t.includes("#") ? "嬰" : t.includes("b") ? "変" : ""
  return `${acc}${KEY_LABEL_JA[t[0]]}${key.mode === "minor" ? "短調" : "長調"} ・ ${t} ${key.mode === "minor" ? "minor" : "major"}`
}
/** 主音の綴り (step, alter) */
export function tonicPitchClass(key: KeySig): { step: Step; alter: Alter } {
  const t = tonicOf(key)
  return { step: t[0] as Step, alter: t.includes("#") ? 1 : t.includes("b") ? -1 : 0 }
}

// ───────────────────────── 臨時記号 (要件 02 の 6 規則) ─────────────────────────
export type AccidentalOut = { kind: "sharp" | "flat" | "natural" | "double-sharp" | "flat-flat"; cautionary: boolean } | null
function accName(a: Alter): NonNullable<AccidentalOut>["kind"] {
  return a === 1 ? "sharp" : a === -1 ? "flat" : a === 2 ? "double-sharp" : a === -2 ? "flat-flat" : "natural"
}
/**
 * 小節ごとに呼ぶ。els は小節内の音 (重音は heads を順に)。戻り = 音ごと (heads ごと) の臨時記号。
 * prevState = 前の小節の終わりの状態 (親切な臨時記号のため)。
 *   ① 調号どおりの音には付けない ② 調号と違う音には付ける ③ 同じ小節で同じ音 (同じ高さ) が続けば 2 回目以降は付けない
 *   ④ 小節をまたいだら付け直す ⑤ 打ち消しはナチュラル ⑥ 前の小節で変えた音が調号に戻るとき、最初の 1 回に親切な (括弧の) 臨時記号
 */
export function accidentalsForMeasure(key: KeySig, els: Element[], prevState: Map<string, Alter>): { out: Map<string, AccidentalOut>; state: Map<string, Alter> } {
  const state = new Map<string, Alter>()          // "step@octave" → いま効いている変化
  const courtesyDone = new Set<string>()
  const out = new Map<string, AccidentalOut>()    // `${element.id}#${headIndex}`
  let prevPitchForTie: Pitch | null = null
  for (const el of els) {
    el.heads.forEach((h, hi) => {
      const p = h.pitch
      const k = `${p.step}@${p.octave}`
      const expected = state.has(k) ? state.get(k)! : keyAlter(key, p.step)
      // タイで続く音 (前の音と同じ高さで tie stop/both) には付けない
      const tiedIn = (el.tie === "stop" || el.tie === "both") && prevPitchForTie != null && samePitch(prevPitchForTie, p)
      if (tiedIn) { out.set(`${el.id}#${hi}`, null); state.set(k, p.alter); return }
      if (p.alter !== expected) {
        out.set(`${el.id}#${hi}`, { kind: accName(p.alter), cautionary: false })
      } else if (!state.has(k) && prevState.has(k) && prevState.get(k) !== keyAlter(key, p.step) && !courtesyDone.has(k)) {
        // ⑥ 親切な臨時記号: 前の小節で変えていた音が調号どおりに戻った最初の 1 回
        out.set(`${el.id}#${hi}`, { kind: accName(p.alter), cautionary: true })
        courtesyDone.add(k)
      } else {
        out.set(`${el.id}#${hi}`, null)
      }
      state.set(k, p.alter)
    })
    prevPitchForTie = el.heads.length === 1 ? el.heads[0].pitch : null
  }
  return { out, state }
}

// ───────────────────────── 弦 ・ 指 ・ ポジション (解析器と同じ算術) ─────────────────────────
/** 弦と指からポジション。取れなければ null。理由も返す */
export function positionOf(p: Pitch, string: StringId, finger: number): { pos: number | null; reason: string | null } {
  const midi = midiOf(p)
  const open = OPEN_MIDI[string]
  if (midi < open) return { pos: null, reason: `${string} 線では ${pitchKana(p)} (開放弦より低い音) は取れません` }
  if (finger === 0) return midi === open ? { pos: 0, reason: null } : { pos: null, reason: `${string} 線の開放弦は ${pitchKana({ step: openPitch(string).step, alter: 0, octave: openPitch(string).octave })} です ・ 指 0 はその音だけ` }
  if (finger < 1 || finger > 4) return { pos: null, reason: "指は 0〜4" }
  const di = diatonicIndex(p)
  let pos = (di - (finger - 1)) - OPEN_DIATONIC[string]
  if (pos === 0 && finger === 1) pos = 1   // ハーフポジション → 第 1
  if (pos < 1) return { pos: null, reason: `${string} 線で ${pitchKana(p)} を指 ${finger} で取ると手が開放弦より下になります ・ 指を小さく` }
  if (pos > MAX_POSITION) return { pos: null, reason: `第 ${pos} ポジションになります ・ 上限は第 ${MAX_POSITION}` }
  return { pos, reason: null }
}
export function openPitch(string: StringId): Pitch {
  return ({ G: { step: "G", alter: 0, octave: 3 }, D: { step: "D", alter: 0, octave: 4 }, A: { step: "A", alter: 0, octave: 4 }, E: { step: "E", alter: 0, octave: 5 } } as Record<StringId, Pitch>)[string]
}
/** その弦でその音を取る指の候補 (ポジション付き ・ 低いポジション順) */
export function fingerChoices(p: Pitch, string: StringId): { finger: 0 | 1 | 2 | 3 | 4; pos: number }[] {
  const out: { finger: 0 | 1 | 2 | 3 | 4; pos: number }[] = []
  for (const f of [0, 1, 2, 3, 4] as const) {
    const r = positionOf(p, string, f)
    if (r.pos != null) out.push({ finger: f, pos: r.pos })
  }
  return out.sort((a, b) => a.pos - b.pos)
}
/**
 * 自動付与: 低い弦から第 1 ポジションで取れる弦を探し、無ければポジションを上げる。
 * 前の音の弦とポジションがあれば「同じ弦 ・ 同じポジション」を優先 (解析器の _pick_candidate と同じ優先順)。
 */
export function autoStringFinger(p: Pitch, prev?: { string: StringId; pos: number } | null): { string: StringId; finger: 0 | 1 | 2 | 3 | 4; pos: number } | null {
  const midi = midiOf(p)
  if (midi < VIOLIN_LOW || midi > VIOLIN_HIGH) return null
  const cands: { string: StringId; finger: 0 | 1 | 2 | 3 | 4; pos: number }[] = []
  for (const s of STRINGS) for (const c of fingerChoices(p, s)) cands.push({ string: s, ...c })
  if (cands.length === 0) return null
  const order = (s: StringId) => STRINGS.indexOf(s)
  // 並べるときの優先: 開放弦があれば開放弦 (音階の D0 A0 E0) → 前の音と同じ弦 ・ 同じポジション → 同じ弦でシフト → 弦を変える
  // (解析器 _pick_candidate の優先順に「開放弦を先に」を足したもの)。文脈なしは低いポジション ・ 同点は高い弦
  const rank = (c: { string: StringId; finger: number; pos: number }): number[] => {
    const eff = c.pos === 0 ? 1 : c.pos   // 開放弦は第 1 とみなす
    const open = c.finger === 0 ? 0 : 1
    if (!prev) return [eff, open, order(c.string) * -1]
    const same = c.string === prev.string, samePos = eff === prev.pos
    const tier = open === 0 && Math.abs(eff - prev.pos) <= 1 ? 0 : same && samePos ? 1 : same ? 2 : 3
    return [tier, tier === 3 && !samePos ? 1 : 0, Math.abs(eff - prev.pos) * 2 + Math.abs(order(c.string) - order(prev.string)), eff, -order(c.string)]
  }
  cands.sort((a, b) => { const ra = rank(a), rb = rank(b); for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) return ra[i] - rb[i]; return 0 })
  return cands[0]
}

// ───────────────────────── 綴りと音の上下 ─────────────────────────
/** 調の音を 1 段 (文字 1 つ) 上下する。調号の変化を付けた綴りにする */
export function stepInKey(p: Pitch, dir: 1 | -1, key: KeySig): Pitch {
  let li = LETTER_INDEX[p.step] + dir, oct = p.octave
  if (li > 6) { li = 0; oct++ } else if (li < 0) { li = 6; oct-- }
  const step = STEPS[li]
  const next: Pitch = { step, alter: keyAlter(key, step), octave: oct }
  const m = midiOf(next)
  return m < VIOLIN_LOW || m > VIOLIN_HIGH ? p : next
}
/** 半音上下 (綴りは同じ文字で alter を動かし、±2 を超えるなら隣の文字に) */
export function semitone(p: Pitch, dir: 1 | -1): Pitch {
  const m = midiOf(p) + dir
  if (m < VIOLIN_LOW || m > VIOLIN_HIGH) return p
  const a = (p.alter + dir) as number
  if (a >= -1 && a <= 1) return { ...p, alter: a as Alter }
  return spellMidi(m, dir > 0 ? "sharp" : "flat")
}
/** MIDI → 綴り (♯系 か ♭系) */
export function spellMidi(midi: number, prefer: "sharp" | "flat"): Pitch {
  const pc = ((midi % 12) + 12) % 12
  const octave = Math.floor(midi / 12) - 1
  const sharp: [Step, Alter][] = [["C", 0], ["C", 1], ["D", 0], ["D", 1], ["E", 0], ["F", 0], ["F", 1], ["G", 0], ["G", 1], ["A", 0], ["A", 1], ["B", 0]]
  const flat: [Step, Alter][] = [["C", 0], ["D", -1], ["D", 0], ["E", -1], ["E", 0], ["F", 0], ["G", -1], ["G", 0], ["A", -1], ["A", 0], ["B", -1], ["B", 0]]
  const [step, alter] = (prefer === "sharp" ? sharp : flat)[pc]
  return { step, alter, octave }
}
/** 異名同音に付け替える (F# ↔ Gb など) */
export function respell(p: Pitch): Pitch {
  const m = midiOf(p)
  const alt = p.alter > 0 ? spellMidi(m, "flat") : p.alter < 0 ? spellMidi(m, "sharp") : p
  return samePitch(alt, p) ? p : alt
}

// ───────────────────────── 並べる (音階 ・ アルペジオ) ─────────────────────────
export type ScaleKind = "major" | "natural" | "harmonic" | "melodic" | "chromatic"
export type ArpKind = "major" | "minor" | "dominant7" | "diminished7" | "augmented"
export const SCALE_KINDS: { id: ScaleKind; label: string; mode: "major" | "minor" }[] = [
  { id: "major", label: "長音階", mode: "major" }, { id: "natural", label: "自然的短音階", mode: "minor" }, { id: "harmonic", label: "和声的短音階", mode: "minor" }, { id: "melodic", label: "旋律的短音階", mode: "minor" }, { id: "chromatic", label: "半音階", mode: "major" },
]
export const ARP_KINDS: { id: ArpKind; label: string; mode: "major" | "minor" }[] = [
  { id: "major", label: "長三和音", mode: "major" }, { id: "minor", label: "短三和音", mode: "minor" }, { id: "dominant7", label: "属七の和音", mode: "major" }, { id: "diminished7", label: "減七の和音", mode: "minor" }, { id: "augmented", label: "増三和音", mode: "major" },
]
// scripts/generate_scale_mxl.py ・ generate_arpeggio_mxl.py と同じ半音の並び
const SCALE_IV: Record<Exclude<ScaleKind, "chromatic">, number[]> = { major: [0, 2, 4, 5, 7, 9, 11], natural: [0, 2, 3, 5, 7, 8, 10], harmonic: [0, 2, 3, 5, 7, 8, 11], melodic: [0, 2, 3, 5, 7, 9, 11] }
const MELODIC_DOWN = [0, 2, 3, 5, 7, 8, 10]
const ARP_IV: Record<ArpKind, number[]> = { major: [0, 4, 7], minor: [0, 3, 7], augmented: [0, 4, 8], dominant7: [0, 4, 7, 10], diminished7: [0, 3, 6, 9] }
const ARP_LETTERS: Record<ArpKind, number[]> = { major: [0, 2, 4], minor: [0, 2, 4], augmented: [0, 2, 4], dominant7: [0, 2, 4, 6], diminished7: [0, 2, 4, 6] }

/** 主音の綴りから、文字を degree だけ進めて 半音 semis の音を綴る */
function spellDegree(root: { step: Step; alter: Alter; octave: number }, letterSteps: number, semis: number): Pitch {
  const li = LETTER_INDEX[root.step] + letterSteps
  const step = STEPS[li % 7]
  const octave = root.octave + Math.floor(li / 7)
  const natural = 12 * (octave + 1) + STEP_SEMI[step]
  const target = midiOf({ step: root.step, alter: root.alter, octave: root.octave }) + semis
  const alter = target - natural
  if (alter > 2 || alter < -2) return spellMidi(target, alter > 0 ? "sharp" : "flat")   // 綴りが破綻するときは実用の綴りに
  return { step, alter: alter as Alter, octave }
}
function lowestRoot(key: KeySig): { step: Step; alter: Alter; octave: number } {
  const t = tonicPitchClass(key)
  let octave = 3
  while (midiOf({ ...t, octave }) < VIOLIN_LOW) octave++
  return { ...t, octave }
}

export function generateScale(o: { key: KeySig; kind: ScaleKind; octaves: 1 | 2 | 3; shape: "updown" | "up" | "down"; dur: Duration }): Element[] {
  const root = lowestRoot(o.key)
  const up: Pitch[] = []
  if (o.kind === "chromatic") {
    for (let i = 0; i <= 12 * o.octaves; i++) up.push(spellMidi(midiOf(root) + i, "sharp"))
  } else {
    const iv = SCALE_IV[o.kind]
    for (let oc = 0; oc < o.octaves; oc++) iv.forEach((s, d) => up.push(spellDegree(root, d + 7 * oc, s + 12 * oc)))
    up.push(spellDegree(root, 7 * o.octaves, 12 * o.octaves))
  }
  let down: Pitch[]
  if (o.kind === "melodic") {
    down = []
    for (let oc = o.octaves - 1; oc >= 0; oc--) [...MELODIC_DOWN].reverse().forEach((s, i) => { const d = 6 - i; down.push(spellDegree(root, d + 7 * oc, s + 12 * oc)) })
    down = [up[up.length - 1], ...down]
  } else if (o.kind === "chromatic") {
    down = up.slice().reverse().map((p) => spellMidi(midiOf(p), "flat"))
  } else {
    down = up.slice().reverse()
  }
  const seq = o.shape === "up" ? up : o.shape === "down" ? down : [...up, ...down.slice(1)]
  return seq.filter((p) => midiOf(p) <= VIOLIN_HIGH).map((p) => newNote(p, { ...o.dur }))
}
export function generateArpeggio(o: { key: KeySig; kind: ArpKind; octaves: 1 | 2 | 3; shape: "updown" | "up" | "down"; dur: Duration }): Element[] {
  const root = lowestRoot(o.key)
  const iv = ARP_IV[o.kind], letters = ARP_LETTERS[o.kind]
  const up: Pitch[] = []
  for (let oc = 0; oc < o.octaves; oc++) iv.forEach((s, d) => up.push(spellDegree(root, letters[d] + 7 * oc, s + 12 * oc)))
  up.push(spellDegree(root, 7 * o.octaves, 12 * o.octaves))
  const down = up.slice().reverse()
  const seq = o.shape === "up" ? up : o.shape === "down" ? down : [...up, ...down.slice(1)]
  return seq.filter((p) => midiOf(p) <= VIOLIN_HIGH).map((p) => newNote(p, { ...o.dur }))
}
/** 並べた音に弦と指を自動で付ける (前の音の弦 ・ ポジションを見て滑らかに) */
export function autoFingerAll(els: Element[]): Element[] {
  let prev: { string: StringId; pos: number } | null = null
  return els.map((e) => {
    if (e.kind !== "note") return e
    const heads = e.heads.map((h) => {
      const a = autoStringFinger(h.pitch, prev)
      if (!a) return h
      prev = { string: a.string, pos: a.pos === 0 ? 1 : a.pos }
      return { ...h, string: a.string, finger: a.finger }
    })
    return { ...e, heads }
  })
}
/** 型の文字列 (D0 D1 3p A1 …) を音にする。ボーイング ・ フィンガリングの出発点用 */
export function parseShorthand(text: string, dur: Duration, key: KeySig): Element[] {
  let pos = 1
  const out: Element[] = []
  for (const tok of text.trim().split(/\s+/).filter(Boolean)) {
    const pm = tok.match(/^(\d{1,2})p$/i)
    if (pm) { pos = Math.max(1, Math.min(MAX_POSITION, Number(pm[1]))); continue }
    const m = tok.match(/^([GDAE])([0-4])$/i)
    if (!m) continue
    const string = m[1].toUpperCase() as StringId
    const finger = Number(m[2]) as 0 | 1 | 2 | 3 | 4
    const p = pitchAt(string, finger, pos, key)
    if (p) out.push(newNote(p, { ...dur }, { string, finger }))
  }
  return out
}
/** 弦 ・ 指 ・ ポジション → 音 (調の音で綴る)。逆算: 文字番号 = 開放 + pos + finger - 1 */
export function pitchAt(string: StringId, finger: 0 | 1 | 2 | 3 | 4, pos: number, key: KeySig): Pitch | null {
  if (finger === 0) return openPitch(string)
  const di = OPEN_DIATONIC[string] + pos + (finger - 1)
  const step = STEPS[di % 7], octave = Math.floor(di / 7)
  const p: Pitch = { step, alter: keyAlter(key, step), octave }
  const m = midiOf(p)
  return m < VIOLIN_LOW || m > VIOLIN_HIGH ? null : p
}
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
export type { AuthorCategory, NoteHead }
