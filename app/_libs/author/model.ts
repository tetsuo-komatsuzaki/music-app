/**
 * スコアを自分で作る ・ 楽譜の型と語彙 (要件定義 v1 ・ 2026-09-07)。
 * 画面 (クライアント) とサーバーの両方で使う素の型。DB や storage はここに置かない。
 */
export type Step = "C" | "D" | "E" | "F" | "G" | "A" | "B"
export const STEPS: Step[] = ["C", "D", "E", "F", "G", "A", "B"]
export type Alter = -2 | -1 | 0 | 1 | 2
export type Pitch = { step: Step; alter: Alter; octave: number }

export type StringId = "G" | "D" | "A" | "E"
export const STRINGS: StringId[] = ["G", "D", "A", "E"]
/** MusicXML の弦番号 (E=1 A=2 D=3 G=4) */
export const STRING_NUMBER: Record<StringId, number> = { E: 1, A: 2, D: 3, G: 4 }
export const OPEN_MIDI: Record<StringId, number> = { G: 55, D: 62, A: 69, E: 76 }
/** バイオリンの音域 (解析器と同じ G3〜E7) */
export const VIOLIN_LOW = 55
export const VIOLIN_HIGH = 100
/** 解析器の物理上限 (lib/violin_position.py MAX_POSITION) */
export const MAX_POSITION = 12

/** 音価。x = 64 分 */
export type DurBase = "w" | "h" | "q" | "e" | "s" | "t" | "x"
export const DUR_BASES: { id: DurBase; label: string; type: string; ql: number }[] = [
  { id: "w", label: "全", type: "whole", ql: 4 },
  { id: "h", label: "2分", type: "half", ql: 2 },
  { id: "q", label: "4分", type: "quarter", ql: 1 },
  { id: "e", label: "8分", type: "eighth", ql: 0.5 },
  { id: "s", label: "16分", type: "16th", ql: 0.25 },
  { id: "t", label: "32分", type: "32nd", ql: 0.125 },
  { id: "x", label: "64分", type: "64th", ql: 0.0625 },
]
export type Tuplet = { actual: number; normal: number }
export type Duration = { base: DurBase; dots: 0 | 1 | 2; tuplet?: Tuplet | null }
export const TUPLETS: { label: string; actual: number; normal: number }[] = [
  { label: "3 連", actual: 3, normal: 2 }, { label: "5 連", actual: 5, normal: 4 }, { label: "6 連", actual: 6, normal: 4 }, { label: "7 連", actual: 7, normal: 4 }, { label: "2 連 (複合拍子)", actual: 2, normal: 3 },
]

/** 奏法 (音ごと)。アプリの奏法一覧 (materialVariant.ARTICULATIONS) をすべて含む。MusicXML の要素は musicxml.ts で決める */
export type ArticulationId = "legato" | "staccato" | "staccatissimo" | "spiccato" | "martele" | "portato" | "tenuto" | "accent" | "tremolo" | "bow_staccato"
export const ARTICULATION_DEFS: { id: ArticulationId; label: string; note?: string }[] = [
  { id: "legato", label: "レガート" },
  { id: "staccato", label: "スタッカート" },
  { id: "staccatissimo", label: "スタッカーティッシモ" },
  { id: "spiccato", label: "スピッカート" },
  { id: "martele", label: "マルテレ" },
  { id: "portato", label: "ポルタート" },
  { id: "tenuto", label: "テヌート" },
  { id: "accent", label: "アクセント" },
  { id: "tremolo", label: "トレモロ" },
  { id: "bow_staccato", label: "連続スピッカート", note: "スラーの中のスタッカート点。スラーと一緒に付ける" },
]
export type Ornament = "trill" | "mordent" | "turn"
export const ORNAMENT_DEFS: { id: Ornament; label: string }[] = [{ id: "trill", label: "トリル" }, { id: "mordent", label: "モルデント" }, { id: "turn", label: "ターン" }]
export type Bow = "up" | "down"
export type Dynamic = "pp" | "p" | "mp" | "mf" | "f" | "ff"
export const DYNAMICS: Dynamic[] = ["pp", "p", "mp", "mf", "f", "ff"]
export type Wedge = "cresc" | "dim" | "stop"
export type Special = "harmonic" | "pizz" | "arco" | "gliss"
export const SPECIAL_DEFS: { id: Special; label: string }[] = [{ id: "harmonic", label: "ハーモニクス" }, { id: "pizz", label: "pizz." }, { id: "arco", label: "arco" }, { id: "gliss", label: "グリッサンド" }]

export type NoteHead = { pitch: Pitch; string: StringId | null; finger: 0 | 1 | 2 | 3 | 4 | null }

export type Element = {
  id: string
  kind: "note" | "rest"
  dur: Duration
  /** 単音 = 1 つ、重音 = 2〜4 つ (低い順)。休符は空 */
  heads: NoteHead[]
  tie: "start" | "stop" | "both" | null
  grace: boolean
  arts: ArticulationId[]
  /** このスラーで始まる / 終わる スラーの番号 */
  slurStart: number[]
  slurStop: number[]
  bow: Bow | null
  orn: Ornament | null
  special: Special | null
  dyn: Dynamic | null
  wedge: Wedge | null
  /** sul G などの弦指定テキスト */
  sul: StringId | null
}

export type Direction = "segno" | "coda" | "fine" | "toCoda" | "dc" | "dcAlFine" | "dcAlCoda" | "ds" | "dsAlFine" | "dsAlCoda"
export const DIRECTION_DEFS: { id: Direction; label: string }[] = [
  { id: "segno", label: "Segno" }, { id: "coda", label: "Coda" }, { id: "fine", label: "Fine" }, { id: "toCoda", label: "To Coda" },
  { id: "dc", label: "D.C." }, { id: "dcAlFine", label: "D.C. al Fine" }, { id: "dcAlCoda", label: "D.C. al Coda" },
  { id: "ds", label: "D.S." }, { id: "dsAlFine", label: "D.S. al Fine" }, { id: "dsAlCoda", label: "D.S. al Coda" },
]

export type TimeSig = { beats: number; beatType: number }
export const TIME_SIGS: TimeSig[] = [{ beats: 4, beatType: 4 }, { beats: 3, beatType: 4 }, { beats: 2, beatType: 4 }, { beats: 6, beatType: 8 }, { beats: 3, beatType: 8 }, { beats: 2, beatType: 2 }, { beats: 5, beatType: 4 }, { beats: 12, beatType: 8 }]
export type KeySig = { fifths: number; mode: "major" | "minor" }

export type Measure = {
  id: string
  /** 弱起 (不完全小節)。番号は 0 で implicit */
  implicit: boolean
  /** この小節から変わる拍子 / 調 (無ければ前の小節を継ぐ) */
  time: TimeSig | null
  key: KeySig | null
  /** メトロノーム記号 (この小節の頭) */
  tempo: number | null
  repeatStart: boolean
  repeatEnd: boolean
  /** 1 番括弧 2 番括弧: この小節で始まる / 終わる */
  endingStart: number | null
  endingStop: number | null
  direction: Direction | null
  elements: Element[]
}

export type AuthorCategory = "scale" | "arpeggio" | "bowing" | "fingering"
export type AuthorScore = {
  version: 1
  title: string
  composer: string
  category: AuthorCategory
  time: TimeSig
  key: KeySig
  tempoMin: number | null
  tempoMax: number | null
  /** 教材全体の奏法の軸 (練習前シートの棚)。null = なし */
  articulation: string | null
  measures: Measure[]
}

let seq = 0
export const newId = () => `a${Date.now().toString(36)}${(seq++).toString(36)}`

export function emptyMeasure(over: Partial<Measure> = {}): Measure {
  return { id: newId(), implicit: false, time: null, key: null, tempo: null, repeatStart: false, repeatEnd: false, endingStart: null, endingStop: null, direction: null, elements: [], ...over }
}
export function newNote(pitch: Pitch, dur: Duration, sf: { string: StringId | null; finger: 0 | 1 | 2 | 3 | 4 | null } = { string: null, finger: null }): Element {
  return { id: newId(), kind: "note", dur, heads: [{ pitch, string: sf.string, finger: sf.finger }], tie: null, grace: false, arts: [], slurStart: [], slurStop: [], bow: null, orn: null, special: null, dyn: null, wedge: null, sul: null }
}
export function newRest(dur: Duration): Element {
  return { id: newId(), kind: "rest", dur, heads: [], tie: null, grace: false, arts: [], slurStart: [], slurStop: [], bow: null, orn: null, special: null, dyn: null, wedge: null, sul: null }
}

/** 音価 → 4 分音符 = 1 の長さ */
export function durQl(d: Duration): number {
  const base = DUR_BASES.find((b) => b.id === d.base)?.ql ?? 1
  const dotted = d.dots === 1 ? base * 1.5 : d.dots === 2 ? base * 1.75 : base
  return d.tuplet ? (dotted * d.tuplet.normal) / d.tuplet.actual : dotted
}
/** 拍子 → 小節の長さ (4 分音符 = 1) */
export function measureQl(t: TimeSig): number {
  return (t.beats * 4) / t.beatType
}
/** 小節の実効の拍子 ・ 調 (前の小節から継ぐ) */
export function effectiveTime(score: AuthorScore, i: number): TimeSig {
  for (let k = i; k >= 0; k--) { const t = score.measures[k]?.time; if (t) return t }
  return score.time
}
export function effectiveKey(score: AuthorScore, i: number): KeySig {
  for (let k = i; k >= 0; k--) { const t = score.measures[k]?.key; if (t) return t }
  return score.key
}
export function elementsQl(els: Element[]): number {
  return Math.round(els.filter((e) => !e.grace).reduce((a, e) => a + durQl(e.dur), 0) * 1e6) / 1e6
}

/** 登録の入力 (画面 → サーバー)。星 ・ グループ ・ 説明 ・ 一括生成の指定 */
export type AuthorRegisterInput = {
  score: AuthorScore
  star: number
  joinGroupId?: string | null
  descriptionShort?: string
  description?: string
  expandAllKeys?: boolean
  standardArticulations?: boolean
  articulationIds?: string[]
}
