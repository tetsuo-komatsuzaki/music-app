/**
 * noteStoreSummary.ts — 明細 (PerformanceNote → ScoreNote → NoteProfile) から、演奏1回ぶんの
 * 「派生サマリ」を組み立てる (2026-09-05 ノート属性ストア 段4-3)。
 *
 * 成長カルテ・成長1行・ほめ文言・先生画面は、これまで analysisSummary.diagnosis.per_subtask と
 * analysisSummary.noteStats (解析時に保存した集計) を読んでいた。この層は同じ形を明細からその場で
 * 作る。保存された集計は読まない。条件の名前 (posshift_1_3 / tech_slur / double_fifth_cont …) は
 * 課題カタログの箱ではなく、1音の属性から決まる「条件の名前」として残す (仕様 §4)。
 *
 *  - 規則は music-analyzer/lib/diagnosis.py の _context_suffixes をそのまま写す
 *    (verify_note_store_parity.py の profile_to_karte で旧新一致を確認済みの変換)
 *  - ミスの帰属: 音程の木 = pitchOk===false、リズムの木 = startOk===false、not_detected は両方ミス
 *  - noteStats は analyze_performance.py の規則を写す。ただし遷移の「2回以上」の間引きはしない (F20)
 */
import {
  TECHS, TECH_COLUMNS, prismaSource,
  type DetailRow, type ProfileRow, type Unit, type NoteStoreSource,
} from "./noteStore"

const UNKNOWN = "unknown"
const NONE = "none"
const POS_UNKNOWN = -1
const STRINGS = ["G", "D", "A", "E"]
const LETTERS = "CDEFGAB"

export type SubEntry = { miss: number; target: number }
export type NoteStat = { target: number; pitch_miss: number; timing_miss: number }
export type NoteStatWithCents = NoteStat & { cents_avg: number | null }
export type DerivedNoteStats = {
  version: 1
  notes: Record<string, NoteStatWithCents>
  registers: Record<string, NoteStat>
  positions: Record<string, NoteStat>
  transitions: Record<string, { target: number; miss: number }>
}
/** analysisSummary と同じ形。読み手 (subMapOf / buildSubMap / praise) がそのまま食べられる */
export type DerivedSummary = {
  diagnosis: { version: "note-store"; map_available: true; per_subtask: Record<string, SubEntry> }
  noteStats: DerivedNoteStats
  /** 明細の音数 (デバッグ・検証用) */
  noteCount: number
}

/** 解析側が「評価した」とみなすステータス (analyze_performance.EVALUATED_STATUSES) */
export const EVALUATED_STATUSES = new Set([
  "evaluated", "pitch_only",
  "double_stop_full", "double_stop_partial", "double_stop_miss",
  "harmonic_ok", "harmonic_normal_tone", "harmonic_miss",
])

function parsePitch(p: string): { letter: string; octave: number; diatonic: number } | null {
  if (!p || p === UNKNOWN || p === NONE) return null
  const m = /^([A-G])([#b]*)(-?\d+)$/.exec(p)
  if (!m) return null
  const octave = parseInt(m[3], 10)
  return { letter: m[1], octave, diatonic: LETTERS.indexOf(m[1]) + 7 * octave }
}

function posBucket(p: number): string | null {
  if (p === POS_UNKNOWN) return null
  return p <= 4 ? String(p) : "5plus"
}

const DOUBLE_KIND: Record<number, string> = { 3: "third", 4: "fourth", 5: "fifth", 6: "sixth", 8: "octave" }
const VALUE_MAP: Record<string, string> = {
  whole: "whole", half: "half", quarter: "quarter", eighth: "eighth", "16th": "16th",
  "32nd": "32nd_plus", "64th": "32nd_plus", "128th": "32nd_plus",
}

/**
 * 1音の属性 (今のかたち・前のかたち) から条件の名前を出す。
 * 戻り値は接尾辞: pitchCtx は音程の木・リズムの木の両方、rhythmOnlyCtx はリズムの木だけ。
 */
export function conditionSuffixes(cur: ProfileRow, prev: ProfileRow | null): { pitchCtx: string[]; rhythmOnlyCtx: string[] } {
  const ctx: string[] = []
  const lowConf = cur.position === POS_UNKNOWN

  // posshift (同ポジ含む。弦/ポジ依存 → 低信頼は除外)
  if (!lowConf && prev) {
    const f = posBucket(prev.position)
    const t = posBucket(cur.position)
    if (f !== null && t !== null) ctx.push(`posshift_${f}_${t}`)
  }

  // double (重音種別 × 連続/単発)。構成音の隣接ペアの度数
  if (cur.noteCount > 1) {
    const cont = cur.chordCont ? "cont" : "single"
    const pitches = [cur.pitch1, cur.pitch2, cur.pitch3, cur.pitch4].slice(0, cur.noteCount).map(parsePitch)
    for (let i = 0; i + 1 < pitches.length; i++) {
      const a = pitches[i], b = pitches[i + 1]
      if (!a || !b) continue
      const deg = Math.abs(b.diatonic - a.diatonic) + 1
      ctx.push(`double_${DOUBLE_KIND[deg] ?? "other"}_${cont}`)
    }
  }

  // tech (13 と 1:1)
  for (const t of TECHS) {
    if ((cur as unknown as Record<string, boolean>)[TECH_COLUMNS[t]]) ctx.push(`tech_${t}`)
  }

  // interval (弦遷移 × 方向 × 距離。弦依存 → 低信頼は除外)
  if (!lowConf && prev) {
    const sa = prev.string1, sb = cur.string1
    let kind: string | null = null
    if (sa !== UNKNOWN && sa !== NONE && sb !== UNKNOWN && sb !== NONE && STRINGS.includes(sa) && STRINGS.includes(sb)) {
      const d = Math.abs(STRINGS.indexOf(sa) - STRINGS.indexOf(sb))
      kind = d === 0 ? "same" : d === 1 ? "adj" : "skip"
    }
    const pp = parsePitch(cur.pitch1), q = parsePitch(prev.pitch1)
    if (kind !== null && pp && q) {
      const d = pp.diatonic - q.diatonic
      const deg = (Math.abs(d) + 1) * (d > 0 ? 1 : d < 0 ? -1 : 1)
      if (Math.abs(deg) === 1) {
        if (kind !== "same") ctx.push("interval_unison_crossing")
      } else {
        ctx.push(`interval_${kind}_${deg > 0 ? "up" : "down"}_${Math.abs(deg) <= 2 ? "step" : "leap"}`)
      }
    }
  }

  // リズムの木だけの文脈
  const rctx: string[] = []
  const nt = cur.noteType1
  if (nt in VALUE_MAP) rctx.push(`value_${VALUE_MAP[nt]}`)
  if (cur.dotted1) rctx.push("value_dotted")
  if (cur.tupletActual > 0) {
    const ta = cur.tupletActual
    if (ta === 3 || ta === 5 || ta === 6) rctx.push(`tuplet_${ta}`)
    else if (ta >= 7) rctx.push("tuplet_7plus")
  }
  if (cur.restBefore > 0) {
    const rb = cur.restBefore
    const length = rb <= 0.5 ? "short" : rb <= 2 ? "mid" : "long"
    rctx.push(`entry_${length}_${cur.onBeat ? "onbeat" : "offbeat"}`)
  }
  return { pitchCtx: ctx, rhythmOnlyCtx: rctx }
}

/** 明細から per_subtask (条件の名前 → {miss,target}) を合算する */
export function perSubtaskOf(rows: DetailRow[]): Map<string, SubEntry> {
  const per = new Map<string, SubEntry>()
  const bump = (sid: string, miss: boolean) => {
    const e = per.get(sid) ?? { miss: 0, target: 0 }
    e.target += 1
    if (miss) e.miss += 1
    per.set(sid, e)
  }
  for (const r of rows) {
    const und = r.evaluationStatus === "not_detected"
    const pm = und || r.pitchOk === false
    const rm = und || r.startOk === false
    const cx = conditionSuffixes(r.cur, r.prev)
    for (const s of cx.pitchCtx) { bump(`pitch_${s}`, pm); bump(`rhythm_${s}`, rm) }
    for (const s of cx.rhythmOnlyCtx) bump(`rhythm_${s}`, rm)
  }
  return per
}

/** 明細から noteStats (音名別・音域帯・ポジション別・遷移) を組む。演奏をまたぐ遷移は作らない */
export function noteStatsOf(rows: DetailRow[]): DerivedNoteStats {
  const notes = new Map<string, NoteStat & { cents_sum: number; cents_n: number }>()
  const registers: Record<string, NoteStat> = {}
  const positions: Record<string, NoteStat> = {}
  const transitions: Record<string, { target: number; miss: number }> = {}
  const bump = (m: Record<string, NoteStat>, k: string, pm: boolean, tm: boolean) => {
    const e = m[k] ?? (m[k] = { target: 0, pitch_miss: 0, timing_miss: 0 })
    e.target += 1
    if (pm) e.pitch_miss += 1
    if (tm) e.timing_miss += 1
  }
  let lastPerf: string | null = null
  let prevName: string | null = null
  for (const r of rows) {
    if (r.performanceId !== lastPerf) { prevName = null; lastPerf = r.performanceId }
    const name = r.noteName ?? (r.cur.pitch1 !== UNKNOWN ? r.cur.pitch1 : null)
    if (!name) { prevName = null; continue }
    if (EVALUATED_STATUSES.has(r.evaluationStatus)) {
      const pm = r.pitchOk === false, tm = r.startOk === false
      const n = notes.get(name) ?? { target: 0, pitch_miss: 0, timing_miss: 0, cents_sum: 0, cents_n: 0 }
      n.target += 1
      if (pm) n.pitch_miss += 1
      if (tm) n.timing_miss += 1
      if (r.pitchCentsError != null) { n.cents_sum += r.pitchCentsError; n.cents_n += 1 }
      notes.set(name, n)
      const hz = r.expectedPitchHz
      if (hz) bump(registers, hz < 440 ? "low" : hz < 659 ? "mid" : "high", pm, tm)
      const pos = r.cur.position
      if (pos !== POS_UNKNOWN) bump(positions, pos <= 1 ? "1" : pos === 2 ? "2" : pos === 3 ? "3" : "4plus", pm, tm)
      if (prevName) {
        const key = `${prevName}>${name}`
        const t = transitions[key] ?? (transitions[key] = { target: 0, miss: 0 })
        t.target += 1
        if (pm || tm) t.miss += 1
      }
    }
    prevName = name
  }
  const outNotes: Record<string, NoteStatWithCents> = {}
  for (const [k, n] of notes) {
    outNotes[k] = { target: n.target, pitch_miss: n.pitch_miss, timing_miss: n.timing_miss, cents_avg: n.cents_n ? Math.round((n.cents_sum / n.cents_n) * 10) / 10 : null }
  }
  return { version: 1, notes: outNotes, registers, positions, transitions }
}

/** 明細 (1演奏でも複数でも) → analysisSummary と同じ形 */
export function derivedSummaryOf(rows: DetailRow[]): DerivedSummary {
  return {
    diagnosis: { version: "note-store", map_available: true, per_subtask: Object.fromEntries(perSubtaskOf(rows)) },
    noteStats: noteStatsOf(rows),
    noteCount: rows.length,
  }
}

/** 単位 (ユーザー・期間・曲…) の明細を演奏ごとに分け、演奏ID → 派生サマリ を返す */
export async function derivedSummariesByPerformance(unit: Unit, source: NoteStoreSource = prismaSource): Promise<Map<string, DerivedSummary>> {
  // 表が無い・読めない環境でも呼び手 (カルテ等) を落とさない: 明細なし = 空
  let rows: DetailRow[]
  try { rows = await source.fetchDetail(unit) } catch (e) { console.error("[noteStoreSummary] fetchDetail failed:", e); rows = [] }
  return derivedSummariesFromRows(rows)
}

/** 既に引いた明細から 演奏ID → 派生サマリ (同じ明細を別の集計にも使う読み手向け) */
export function derivedSummariesFromRows(rows: DetailRow[]): Map<string, DerivedSummary> {
  const byPerf = new Map<string, DetailRow[]>()
  for (const r of rows) {
    const list = byPerf.get(r.performanceId)
    if (list) list.push(r); else byPerf.set(r.performanceId, [r])
  }
  const out = new Map<string, DerivedSummary>()
  for (const [id, list] of byPerf) out.set(id, derivedSummaryOf(list))
  return out
}

/**
 * 演奏の行に派生サマリを差し込む。明細の無い演奏は null (保存された集計には戻らない)。
 * 既存の読み手が analysisSummary を読む形のまま、中身だけを明細由来に替えるための橋。
 */
export function withDerived<T extends { id: string }>(rows: T[], derived: Map<string, DerivedSummary>): Array<T & { analysisSummary: DerivedSummary | null }> {
  return rows.map((r) => ({ ...r, analysisSummary: derived.get(r.id) ?? null }))
}
