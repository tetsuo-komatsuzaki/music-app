// ほめフィードバック (2026-08-10 Tetsuo確定・84文面)。
// 演奏後に「今日よくできたこと」を1つだけ具体的にほめる。診断エンジンの"強み側"
// (弱点=推薦の鏡像)。現行の成長1行 (growthLine) を置き換える。
//
// 選抜 (優先 a→c→b):
//   a 苦手突破 : 前<70% かつ (今回-前)>=+10pt        ← 最優先
//   c 伸び     : (今回-前)>=+10pt (苦手突破以外)
//   b 最高     : 今回>=90%
//   どれも無ければ null (でっち上げない)。
// 対象 (同点は ①奏法 > ②ポジション > ③弦):
//   ①奏法      : per_subtask の tech系 (右手7種)
//   ②ポジション: noteStats.positions (2/3/4plus。1stは対象外)
//   ③弦        : noteStats.notes を1stポジの弦(G/D/A/E)ごと集約
// 純関数 (prisma非依存・テスト対象)。now/base の summary 配列を呼び手が渡す。
import { buildSubMap, type SubMap } from "./growthLine"

export type PraiseSituation = "breakthrough" | "growth" | "best" // a / c / b
export type PraiseItemKind = "tech" | "position" | "string"
export interface Praise {
  situation: PraiseSituation
  item: PraiseItemKind
  value: string // 内部値: tech id / "2"|"3"|"4plus" / "G線"..
  text: string  // 表示文 (ランク込みの確定文)
}

// ── 閾値 (確定・2026-08-10) ──
const MIN_N = 8          // まぐれ除け: 対象音 8個以上
const GROWTH_DELTA = 10  // 伸び/苦手突破: +10pt 以上
const WEAK_BASE = 70     // 苦手突破: 前が70%より下
const BEST_PCT = 90      // 最高: 今回90%以上

type Rank = "beg" | "adv" // ★1-3 初級 / ★4+ 中上級

const TECH_IDS = ["staccato", "spiccato", "portato", "bow_staccato", "tremolo", "pizzicato", "ricochet"] as const
type TechId = (typeof TECH_IDS)[number]
const POS_KEYS = ["2", "3", "4plus"] as const
const STR_KEYS = ["G線", "D線", "A線", "E線"] as const

// ── 集計ヘルパ ─────────────────────────────────────────────
type Ax = { target: number; missAxes: number } // target=音数, missAxes=pitch+timing のミス数

/** per_subtask (単軸) の tech 成功率。target<8 は null */
function techPct(m: SubMap, id: TechId): { pct: number; n: number } | null {
  let miss = 0
  let target = 0
  for (const sid of [`pitch_tech_${id}`, `rhythm_tech_${id}`]) {
    const e = m.get(sid)
    if (e) { miss += e.miss; target += e.target }
  }
  if (target < MIN_N) return null
  return { pct: (1 - miss / target) * 100, n: target }
}

/** noteStats (2軸=音程+リズム) の成功率。target<8 は null */
function axPct(e: Ax | undefined): { pct: number; n: number } | null {
  if (!e || e.target < MIN_N) return null
  return { pct: (1 - e.missAxes / (e.target * 2)) * 100, n: e.target }
}

type NoteStat = { target: number; pitch_miss: number; timing_miss: number }

/** noteStats.positions を 2/3/4plus で合算 (1stは②対象外なので除外) */
function buildPos(summaries: unknown[]): Map<string, Ax> {
  const map = new Map<string, Ax>()
  for (const s of summaries) {
    const p = (s as { noteStats?: { positions?: Record<string, NoteStat> } } | null)?.noteStats?.positions
    if (!p) continue
    for (const [k, v] of Object.entries(p)) {
      if (k === "1") continue
      const e = map.get(k) ?? { target: 0, missAxes: 0 }
      e.target += v.target
      e.missAxes += (v.pitch_miss ?? 0) + (v.timing_miss ?? 0)
      map.set(k, e)
    }
  }
  return map
}

/** "F#4" → 弦 (1stポジ前提。範囲外/開放より下は null)。growthKarte.noteToHand の弦部分と同ロジック */
export function stringOfNote(name: string): string | null {
  const m = /^([A-G])(#|b)?(\d)$/.exec(name)
  if (!m) return null
  const SEMIS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
  const midi = (parseInt(m[3], 10) + 1) * 12 + SEMIS[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0)
  const OPENS = [{ s: "G線", m: 55 }, { s: "D線", m: 62 }, { s: "A線", m: 69 }, { s: "E線", m: 76 }]
  if (midi < OPENS[0].m) return null
  let open = OPENS[0]
  for (const o of OPENS) if (midi >= o.m) open = o
  if (midi - open.m > 7) return null // 1stポジの範囲外 (上位ポジ)
  return open.s
}

/** noteStats.notes を1stポジの弦ごと合算 */
function buildStr(summaries: unknown[]): Map<string, Ax> {
  const map = new Map<string, Ax>()
  for (const s of summaries) {
    const notes = (s as { noteStats?: { notes?: Record<string, NoteStat> } } | null)?.noteStats?.notes
    if (!notes) continue
    for (const [name, v] of Object.entries(notes)) {
      const st = stringOfNote(name)
      if (!st) continue
      const e = map.get(st) ?? { target: 0, missAxes: 0 }
      e.target += v.target
      e.missAxes += (v.pitch_miss ?? 0) + (v.timing_miss ?? 0)
      map.set(st, e)
    }
  }
  return map
}

// ── 選抜 ───────────────────────────────────────────────────
interface Cand { item: PraiseItemKind; value: string; nowPct: number; basePct: number | null }
const ITEM_ORDER: Record<PraiseItemKind, number> = { tech: 0, position: 1, string: 2 }

export function selectPraise(nowSummaries: unknown[], baseSummaries: unknown[], star: number): Praise | null {
  const nowSub = buildSubMap(nowSummaries)
  const baseSub = buildSubMap(baseSummaries)
  const nowPos = buildPos(nowSummaries)
  const basePos = buildPos(baseSummaries)
  const nowStr = buildStr(nowSummaries)
  const baseStr = buildStr(baseSummaries)

  const cands: Cand[] = []
  for (const id of TECH_IDS) {
    const n = techPct(nowSub, id)
    if (!n) continue
    cands.push({ item: "tech", value: id, nowPct: n.pct, basePct: techPct(baseSub, id)?.pct ?? null })
  }
  for (const k of POS_KEYS) {
    const n = axPct(nowPos.get(k))
    if (!n) continue
    cands.push({ item: "position", value: k, nowPct: n.pct, basePct: axPct(basePos.get(k))?.pct ?? null })
  }
  for (const st of STR_KEYS) {
    const n = axPct(nowStr.get(st))
    if (!n) continue
    cands.push({ item: "string", value: st, nowPct: n.pct, basePct: axPct(baseStr.get(st))?.pct ?? null })
  }
  if (!cands.length) return null

  const rank: Rank = star >= 4 ? "adv" : "beg"
  const delta = (c: Cand) => c.nowPct - (c.basePct ?? 0)
  const byDelta = (a: Cand, b: Cand) => delta(b) - delta(a) || ITEM_ORDER[a.item] - ITEM_ORDER[b.item]
  const byNow = (a: Cand, b: Cand) => b.nowPct - a.nowPct || ITEM_ORDER[a.item] - ITEM_ORDER[b.item]

  const brk = cands.filter((c) => c.basePct != null && c.basePct < WEAK_BASE && c.nowPct - c.basePct >= GROWTH_DELTA)
  const gro = cands.filter((c) => c.basePct != null && c.basePct >= WEAK_BASE && c.nowPct - c.basePct >= GROWTH_DELTA)
  const best = cands.filter((c) => c.nowPct >= BEST_PCT)

  let situation: PraiseSituation
  let pick: Cand
  if (brk.length) { situation = "breakthrough"; pick = brk.sort(byDelta)[0] }
  else if (gro.length) { situation = "growth"; pick = gro.sort(byDelta)[0] }
  else if (best.length) { situation = "best"; pick = best.sort(byNow)[0] }
  else return null

  return { situation, item: pick.item, value: pick.value, text: copyOf(pick.item, pick.value, situation, rank) }
}

// ── 文面 (確定84文面・2026-08-10)。[初級, 中上級] ─────────────
type Triple = { a: [string, string]; c: [string, string]; b: [string, string] }

const COPY_TECH: Record<TechId, Triple> = {
  staccato: {
    a: ["いつもは難しいスタッカート、今日はキレよく短く切れてたね！", "苦手だったスタッカート、今日は音の切れが安定していたね。"],
    c: ["スタッカート、前よりキレよく切れてきたね！", "スタッカートの切れ、上向きだね。"],
    b: ["今日はスタッカート、上手に切れてたね！", "スタッカート、今日はキレよく決まっていたね。"],
  },
  spiccato: {
    a: ["いつもは難しいスピッカート、今日は弓が軽く弾んでたね！", "苦手だったスピッカート、今日は弾みが安定していたね。"],
    c: ["スピッカート、前より弓が弾んできたね！", "スピッカートの弾み、上向きだね。"],
    b: ["今日はスピッカート、弓が軽く弾んでたね！", "スピッカート、今日は軽やかに決まっていたね。"],
  },
  portato: {
    a: ["いつもは難しいポルタート、今日はやわらかく音が分けられてたね！", "苦手だったポルタート、今日は音の分け方が安定していたね。"],
    c: ["ポルタート、前よりやわらかく分けられてきたね！", "ポルタートの分け方、上向きだね。"],
    b: ["今日はポルタート、やわらかく分けられてたね！", "ポルタート、今日はなめらかに決まっていたね。"],
  },
  bow_staccato: {
    a: ["いつもは難しい連続スタッカート、今日は一弓できれいに刻めてたね！", "苦手だった連続スタッカート、今日は刻みが安定していたね。"],
    c: ["連続スタッカート、前よりきれいに刻めてきたね！", "連続スタッカートの刻み、上向きだね。"],
    b: ["今日は連続スタッカート、一弓できれいに刻めてたね！", "連続スタッカート、今日はそろって決まっていたね。"],
  },
  tremolo: {
    a: ["いつもは難しいトレモロ、今日は粒をそろえて速く刻めてたね！", "苦手だったトレモロ、今日は粒立ちが安定していたね。"],
    c: ["トレモロ、前より粒がそろってきたね！", "トレモロの粒立ち、上向きだね。"],
    b: ["今日はトレモロ、速く粒よく刻めてたね！", "トレモロ、今日は粒がそろって決まっていたね。"],
  },
  pizzicato: {
    a: ["いつもは難しいピチカート、今日は指ではっきりはじけてたね！", "苦手だったピチカート、今日は音の張りが安定していたね。"],
    c: ["ピチカート、前よりはっきりはじけてきたね！", "ピチカートの響き、上向きだね。"],
    b: ["今日はピチカート、はっきりはじけてたね！", "ピチカート、今日はよく響いて決まっていたね。"],
  },
  ricochet: {
    a: ["いつもは難しいリコシェ、今日は弓が軽やかに跳ねてたね！", "苦手だったリコシェ、今日は跳ねが安定していたね。"],
    c: ["リコシェ、前より弓が跳ねてきたね！", "リコシェの跳ね、上向きだね。"],
    b: ["今日はリコシェ、弓が軽やかに跳ねてたね！", "リコシェ、今日は軽やかに決まっていたね。"],
  },
}

const COPY_POS: Record<string, Triple> = {
  "2": {
    a: ["いつもは苦手な2ndポジション、今日はよく取れてたね！", "苦手だった2ndポジション、今日は音程が安定していたね。"],
    c: ["2ndポジションの音、前よりよくなってきたね！", "2ndポジションの精度、上向きだね。"],
    b: ["今日は2ndポジションの音、上手に取れてたね！", "2ndポジション、今日はきれいに決まっていたね。"],
  },
  "3": {
    a: ["いつもは難しい3rdポジション、今日はバッチリだったね！", "苦手だった3rdポジション、今日は安定していたね。"],
    c: ["3rdポジション、前よりスッと取れてきたね！", "3rdポジションの精度、伸びているね。"],
    b: ["今日は3rdポジション、よくできたね！", "3rdポジション、今日はきれいに決まっていたね。"],
  },
  "4plus": {
    a: ["いつもは難しい高いポジション、今日はよく届いてたね！", "苦手だった高ポジ、今日は音程が安定していたね。"],
    c: ["高いポジションの音、前よりよくなってきたね！", "高ポジの精度、上向きだね。"],
    b: ["今日は高いポジションの音、よく取れてたね！", "高ポジ、今日はきれいに決まっていたね。"],
  },
}

const COPY_STR: Record<string, Triple> = {
  "G線": {
    a: ["いつもは苦手なG線、今日はよく鳴らせてたね！", "苦手だったG線、今日は音程と響きが安定していたね。"],
    c: ["G線の音、前より良くなってきたね！", "G線の精度、上向きだね。"],
    b: ["今日はG線の音、よく鳴らせてたね！", "G線、今日はきれいに響いていたね。"],
  },
  "D線": {
    a: ["いつもは苦手なD線、今日はよく取れてたね！", "苦手だったD線、今日は音程が安定していたね。"],
    c: ["D線の音、前より良くなってきたね！", "D線の精度、上向きだね。"],
    b: ["今日はD線の音、よく取れてたね！", "D線、今日はきれいに決まっていたね。"],
  },
  "A線": {
    a: ["いつもは苦手なA線、今日はよく取れてたね！", "苦手だったA線、今日は音程が安定していたね。"],
    c: ["A線の音、前より良くなってきたね！", "A線の精度、上向きだね。"],
    b: ["今日はA線の音、よく取れてたね！", "A線、今日はきれいに決まっていたね。"],
  },
  "E線": {
    a: ["いつもは苦手なE線、今日はよく取れてたね！", "苦手だったE線の高音、今日は音程が安定していたね。"],
    c: ["E線の高音、前より良くなってきたね！", "E線の精度、上向きだね。"],
    b: ["今日はE線の高音、よく取れてたね！", "E線、今日はきれいに決まっていたね。"],
  },
}

const SIT_KEY: Record<PraiseSituation, keyof Triple> = { breakthrough: "a", growth: "c", best: "b" }

function copyOf(item: PraiseItemKind, value: string, situation: PraiseSituation, rank: Rank): string {
  const table = item === "tech" ? COPY_TECH[value as TechId] : item === "position" ? COPY_POS[value] : COPY_STR[value]
  const pair = table[SIT_KEY[situation]]
  return pair[rank === "adv" ? 1 : 0]
}
