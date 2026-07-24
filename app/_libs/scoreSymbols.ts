// 譜面の記号ガイド (2026-07-25)
//
// 【正本】語彙は scoreSymbolData.v1.json。母集合は MusicXML 3.1/4.0 の記号要素
// (notations: articulations 17 / ornaments 13 / technical 30、direction-type 24、
//  attributes: key・time・clef・measure-style、note: accidental 13・notehead・dot・
//  grace・cue・tie、barline: bar-style 11・repeat・ending、harmony ほか) で、
// music21 が読める形を実機確認したうえでヴァイオリン学習に出るものを採録してある。
// ここは JSON を読んで「この曲に出てくる記号」に絞り込むだけ (転記禁止)。
// 区分の網羅は PreSonus Notion Mobile 3.2 ユーザーガイド「ツールグリッド」の
// ツール一覧 (記譜ソフトが実際に入力できる記号の区分) と突き合わせ済み。
// 採録しなかった区分は JSON の excluded に理由つきで残してある。
//
// 各記号の supply は供給状態:
//   ready   … analysis.json に情報があり、今すぐ出せる
//   pending … analyze_musicxml.py の出力追加が必要 (フェルマータ・臨時記号など)
//   tag     … 記譜だけでは判別できず、TechniqueTag など DB 側から引く必要がある
// pending/tag はマッチ規則を書いてあっても該当データが無いので自然に出ない。
// 解析側が項目を足せば、この TS を触らずに自動で出るようになる。
//
// 検証: scripts/verify-symbol-data.ts (id 重複・lessonId 実在・glyph 網羅・m21 重複)

import DATA from "./scoreSymbolData.v1.json"

export type SymbolCategoryId = "bow" | "left" | "orn" | "dyn" | "rhythm" | "struct"
export type SymbolSupply = "ready" | "pending" | "tag"

/** グリフの描き分け種別 (SymbolGlyph が解釈する) */
export type SymbolGlyphKind =
  | "staccato" | "staccatissimo" | "accent" | "marcato" | "tenuto" | "portato"
  | "spiccato" | "harmonic" | "upbow" | "downbow" | "pizz" | "snappizz" | "lhpizz"
  | "openstring" | "breath" | "trill" | "mordent" | "turn" | "tremolo" | "tie" | "slur"
  | "chord" | "arpeggio" | "gliss" | "vibrato" | "shift" | "grace" | "fermata"
  | "tuplet" | "dotted" | "rest" | "dynamic" | "cresc" | "dim" | "text" | "metronome"
  | "finger" | "string" | "key" | "time" | "accidental" | "clef" | "ottava"
  | "repeat" | "segno" | "barline" | "dashes" | "sordino" | "tuning" | "beam"
  | "diamond" | "xhead" | "timeC" | "ritard" | "cue" | "measure_repeat"
  | "tremolo2" | "arco" | "sulpont" | "sultasto" | "collegno" | "ghost" | "swing"
  | "doubledot" | "voice" | "doubleacc" | "quarter" | "lyric"
  | "enharmonic" | "finger_sub" | "fall"

type MatchSpec = {
  type: string
  m21?: string[]
  /** articulation が無くてもこのフラグが真なら該当 */
  orFlag?: string
  /** articulation が無くてもこのフィールドが非 null なら該当 */
  orField?: string
  /** flag マッチのフィールド名 */
  field?: string
  /** spanner の analysis.json 上のキー */
  name?: string
  /** hairpin の type */
  hairpin?: string
  /** 重音の音程 (半音) */
  semitones?: number[]
  /** fieldValue マッチの期待値 (例: tremolo_type = "fingered") */
  value?: string
}

/** JSON の1件 (語彙の定義) */
export type SymbolDef = {
  id: string
  cat: SymbolCategoryId
  glyph: SymbolGlyphKind
  label: string
  supply: SymbolSupply
  lessonId?: string
  what: string
  tip?: string
  match: MatchSpec
}

/** 画面に出す1件 (定義 + この曲での出現) */
export type ScoreSymbol = Omit<SymbolDef, "match"> & {
  /** 値つき記号の実値 (強弱の "f"、連符の "3"、調号の "♯1つ") */
  value?: string
  /** この記号が付いている音符の note_index (譜面ハイライト用) */
  noteIndices: number[]
}

export const SYMBOL_CATEGORIES = DATA.categories as Record<SymbolCategoryId, { label: string }>
/** 語彙の全件 (「記号を全部見る」UI や検証で使う) */
export const ALL_SYMBOLS = DATA.symbols as unknown as SymbolDef[]

const BY_ID = new Map(ALL_SYMBOLS.map((s) => [s.id, s]))
const ORDER = new Map(ALL_SYMBOLS.map((s, i) => [s.id, i]))

// music21 の articulation クラス名 → 定義。派生クラス名も同じ定義に寄せる
// (<harmonic> は StringHarmonic として入るが、ユーザーには同じ「ハーモニクス」)。
const BY_ARTICULATION = new Map<string, SymbolDef>()
const BY_FLAG = new Map<string, SymbolDef>()
const BY_SPANNER = new Map<string, SymbolDef>()
const BY_HAIRPIN = new Map<string, SymbolDef>()
const BY_ORFIELD = new Map<string, SymbolDef>()
const CHORD_INTERVALS: { semitones: number[]; def: SymbolDef }[] = []
let KEY_DEF: SymbolDef | undefined
let TIME_DEF: SymbolDef | undefined
let DYNAMIC_DEF: SymbolDef | undefined
let TUPLET_DEF: SymbolDef | undefined
let CHORD_DEF: SymbolDef | undefined
let REST_DEF: SymbolDef | undefined
/** 特定フィールドが特定値のときだけ該当する定義 (指トレモロなど) */
const BY_FIELD_VALUE: { field: string; value: string; def: SymbolDef }[] = []

for (const d of ALL_SYMBOLS) {
  const m = d.match
  switch (m.type) {
    case "articulation":
      for (const n of m.m21 ?? []) BY_ARTICULATION.set(n, d)
      if (m.orFlag) BY_FLAG.set(m.orFlag, d)
      if (m.orField) BY_ORFIELD.set(m.orField, d)
      break
    case "flag":
      if (m.field === "is_chord") CHORD_DEF = d
      else if (m.field) BY_FLAG.set(m.field, d)
      break
    case "spanner": if (m.name) BY_SPANNER.set(m.name, d); break
    case "hairpin": if (m.hairpin) BY_HAIRPIN.set(m.hairpin, d); break
    case "chordInterval": CHORD_INTERVALS.push({ semitones: m.semitones ?? [], def: d }); break
    case "key": KEY_DEF = d; break
    case "time": TIME_DEF = d; break
    case "dynamic": DYNAMIC_DEF = d; break
    case "tuplet": TUPLET_DEF = d; break
    case "rest": REST_DEF = d; break
    case "fieldValue":
      if (m.field && m.value) BY_FIELD_VALUE.push({ field: m.field, value: m.value, def: d })
      break
    default: break // expression / words / notehead / barline ほか = 解析側の追加待ち
  }
}

// ---------------------------------------------------------------------------
// 値つき記号の補足テキスト
// ---------------------------------------------------------------------------

// MusicXML <dynamics> の子要素 27 種すべて。music21 は shortNames に無い値
// (sfz / fz / n など) もそのまま value に保持することを実機で確認済み。
const DYNAMIC_WHAT: Record<string, string> = {
  pppppp: "考えうるかぎり最も小さく。",
  ppppp: "きわめて小さく。",
  pppp: "ピアニッシシモよりさらに小さく。",
  ppp: "ピアニッシシモ。きわめて小さく。",
  pp: "ピアニッシモ。とても小さく。",
  p: "ピアノ。小さく、やさしく。",
  mp: "メゾピアノ。すこし小さく。",
  mf: "メゾフォルテ。すこし大きく。",
  f: "フォルテ。大きく、はっきりと。",
  ff: "フォルティッシモ。とても大きく。",
  fff: "フォルティッシシモ。きわめて大きく。",
  ffff: "フォルティッシシモよりさらに大きく。",
  fffff: "きわめて大きく。",
  ffffff: "出せるかぎり大きく。",
  n: "ニエンテ。何も無いところまで消えていく。",
  pf: "ピウ・フォルテ。今より大きく。",
  fp: "フォルテピアノ。強く出して、すぐ弱く。",
  sf: "スフォルツァンド。その音だけ突然強く。",
  sfz: "スフォルツァンド。その音だけ突然強く。",
  fz: "フォルツァンド。その音を強く打ち出す。",
  sffz: "スフォルツァンドより、さらに強く突然に。",
  rf: "リンフォルツァンド。数音のあいだ急に強める。",
  rfz: "リンフォルツァンド。数音のあいだ急に強める。",
  sfp: "強く出して、すぐピアノに落とす。",
  sfpp: "強く出して、すぐピアニッシモまで落とす。",
  sfzp: "強く出して、すぐピアノに落とす。",
}

// 調号 (tonic + mode → ♯/♭の数)。music21 の tonic 表記は変記号が "-" (B- = 変ロ)。
const FIFTHS_MAJOR: Record<string, number> = {
  C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, "F#": 6, "C#": 7,
  F: -1, "B-": -2, "E-": -3, "A-": -4, "D-": -5, "G-": -6, "C-": -7,
}
const FIFTHS_MINOR: Record<string, number> = {
  A: 0, E: 1, B: 2, "F#": 3, "C#": 4, "G#": 5, "D#": 6, "A#": 7,
  D: -1, G: -2, C: -3, F: -4, "B-": -5, "E-": -6, "A-": -7,
}
/** ♯がつく順 (ファドソレラミシ) / ♭がつく順 (シミラレソドファ) */
const SHARP_ORDER = ["ファ", "ド", "ソ", "レ", "ラ", "ミ", "シ"]
const FLAT_ORDER = ["シ", "ミ", "ラ", "レ", "ソ", "ド", "ファ"]

// ---------------------------------------------------------------------------
// 抽出
// ---------------------------------------------------------------------------

export type SymbolSourceNote = {
  note_index: number
  type?: string
  /** 周波数(Hz)。重音の音程判定に使う */
  pitches?: number[] | null
  articulations?: string[] | null
  dynamic?: string | null
  is_tied?: boolean | null
  is_tremolo?: boolean | null
  is_trill?: boolean | null
  is_mordent?: boolean | null
  is_chord?: boolean | null
  is_harmonic?: boolean | null
  tremolo_type?: string | null
  tuplet_actual?: number | null
  display_finger?: number | null
  display_string_num?: number | null
}

export type SymbolSourceAnalysis = {
  notes: SymbolSourceNote[]
  key?: { tonic?: string | null; mode?: string | null } | null
  time_signature?: { numerator?: number | null; denominator?: number | null } | null
  spanners?: Record<string, { type?: string; start: number; end: number }[] | null | undefined> | null
}

export type ExtractedSymbols = {
  /** 正本の並び順にならんだ記号一覧 (チップ表示用) */
  list: ScoreSymbol[]
  /** note_index → その音符についている記号ID */
  byNote: Map<number, string[]>
}

/**
 * 解析結果から「この曲に出てくる記号」を抽出する。
 * 曲全体にかかる調号・拍子は byNote には含めない (特定の音符にひもづかないため)。
 */
export function extractScoreSymbols(
  analysis: SymbolSourceAnalysis | null | undefined,
): ExtractedSymbols {
  if (!analysis?.notes?.length) return { list: [], byNote: new Map() }

  const byNote = new Map<number, string[]>()
  const found = new Map<string, ScoreSymbol>()

  const add = (
    def: SymbolDef | undefined,
    noteIndex: number | null,
    over?: { id?: string; label?: string; what?: string; tip?: string; value?: string },
  ) => {
    if (!def) return
    const id = over?.id ?? def.id
    let s = found.get(id)
    if (!s) {
      const { match: _m, ...rest } = def
      void _m
      s = { ...rest, ...over, id, noteIndices: [] }
      found.set(id, s)
    }
    if (noteIndex === null) return
    // 同じ音符に同じ記号が二重に来ることがある
    // (例: articulations に Harmonic があり、かつ is_harmonic も真)。
    const arr = byNote.get(noteIndex)
    if (arr) {
      if (arr.includes(id)) return
      arr.push(id)
    } else {
      byNote.set(noteIndex, [id])
    }
    s.noteIndices.push(noteIndex)
  }

  // --- 曲全体: 調号 ---
  // 注意: analysis.key の tonic/mode は「記譜された調号(fifths)」を正とするが、
  // 長調/短調の別は music21 の音高推定に依存し、平行調 (ト長調⇄ホ短調のように
  // ♯の数が同じ組) で入れ替わることが実測で確認されている。
  // そのため調名は断定せず、確実に正しい「♯/♭が何個・どの音につくか」を見せる。
  const tonic = analysis.key?.tonic
  if (tonic && KEY_DEF) {
    const minor = String(analysis.key?.mode ?? "").includes("minor")
    const fifths = (minor ? FIFTHS_MINOR : FIFTHS_MAJOR)[tonic]
    if (fifths !== undefined) {
      const n = Math.abs(fifths)
      const names = (fifths >= 0 ? SHARP_ORDER : FLAT_ORDER).slice(0, n)
      const sign = fifths >= 0 ? "♯" : "♭"
      add(KEY_DEF, null, {
        value: n === 0 ? "♯♭なし" : `${sign}${n}つ`,
        what: n === 0
          ? "曲の最初に ♯ も ♭ もついていない曲だよ。臨時記号が書かれた音だけ、その場で上げ下げする。"
          : `曲の最初についている ${sign} は ${n}つ（${names.join("・")}）。楽譜に書かれていなくても、この音はいつも ${sign} で弾くよ。`,
        tip: n === 0 ? undefined : `弾く前に「${names.join("・")}は${sign}」と口に出しておくと、音程が崩れにくい。`,
      })
    }
  }

  // --- 曲全体: 拍子 ---
  const num = analysis.time_signature?.numerator
  const den = analysis.time_signature?.denominator
  if (num && den && TIME_DEF) {
    add(TIME_DEF, null, {
      value: `${num}/${den}`,
      what: `この曲は ${den}分の${num}拍子。1小節に ${den}分音符が ${num}つ入る、という意味だよ。`,
      tip: `${num}拍をひとまとまりに感じて、1拍目を少しはっきり弾くとリズムが立つ。`,
    })
  }

  // --- 音符ごと ---
  for (const n of analysis.notes) {
    const i = n.note_index
    if (n.type === "rest") { add(REST_DEF, i); continue }
    const rec = n as unknown as Record<string, unknown>

    for (const a of n.articulations ?? []) add(BY_ARTICULATION.get(a), i)

    // 値つき判定 (例: tremolo_type="fingered" の指トレモロ)。
    // 該当したら、同じ現象を指す汎用フラグ側 (is_tremolo) は出さない。
    const suppressed = new Set<string>()
    for (const fv of BY_FIELD_VALUE) {
      if (rec[fv.field] === fv.value) {
        add(fv.def, i)
        if (fv.field === "tremolo_type") suppressed.add("is_tremolo")
      }
    }
    // フラグ (is_trill / is_tied / is_tremolo / is_mordent / is_harmonic …)
    for (const [field, def] of BY_FLAG) if (rec[field] && !suppressed.has(field)) add(def, i)
    // 解析側の表示値 (display_finger / display_string_num) からの補完
    for (const [field, def] of BY_ORFIELD) if (rec[field] != null) add(def, i)

    // 重音: 音程が判定できれば度数別 (レッスン付き)、できなければ総称
    if (n.is_chord) {
      const ps = n.pitches ?? []
      let semis: number | null = null
      if (ps.length >= 2) {
        const lo = Math.min(...ps), hi = Math.max(...ps)
        if (lo > 0) semis = Math.round(12 * Math.log2(hi / lo))
      }
      const hit = semis === null ? undefined : CHORD_INTERVALS.find((c) => c.semitones.includes(semis))
      add(hit ? hit.def : CHORD_DEF, i)
    }

    if (n.dynamic && DYNAMIC_DEF) {
      add(DYNAMIC_DEF, i, {
        id: `dynamic:${n.dynamic}`,
        label: `強弱記号 ${n.dynamic}`,
        value: n.dynamic,
        what: DYNAMIC_WHAT[n.dynamic] ?? DYNAMIC_DEF.what,
      })
    }

    const tup = n.tuplet_actual
    if (tup && tup >= 2 && TUPLET_DEF) {
      add(TUPLET_DEF, i, {
        id: `tuplet:${tup}`,
        label: `${tup}連符`,
        value: String(tup),
        what: `本来2つ分の長さに、音符を${tup}つ均等に入れる記号。数字の「${tup}」が目印。`,
      })
    }
  }

  // --- スパナー (スラー / グリッサンド / クレッシェンド・デクレッシェンド) ---
  for (const [name, def] of BY_SPANNER) {
    for (const sp of analysis.spanners?.[name] ?? []) {
      for (let k = sp.start; k <= sp.end; k++) add(def, k)
    }
  }
  for (const hp of analysis.spanners?.hairpins ?? []) {
    const def = BY_HAIRPIN.get(String(hp.type))
    if (!def) continue
    for (let k = hp.start; k <= hp.end; k++) add(def, k)
  }

  // 並びは正本 (JSON) の宣言順。値つき記号 (dynamic:f 等) は基底IDの位置に寄せる。
  const rank = (s: ScoreSymbol) => ORDER.get(s.id) ?? ORDER.get(s.id.split(":")[0]) ?? 999
  const list = [...found.values()].sort((a, b) => rank(a) - rank(b) || a.id.localeCompare(b.id))
  return { list, byNote }
}

/** 語彙の1件を id で引く (「記号を全部見る」UI 用) */
export function getSymbolDef(id: string): SymbolDef | undefined {
  return BY_ID.get(id) ?? BY_ID.get(id.split(":")[0])
}
