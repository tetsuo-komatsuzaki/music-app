/**
 * diagnosisPresentation.ts — 演奏直後の診断の整形層 (2026-09-05 ノート属性ストア版)
 *
 * 役割: その演奏1回の明細 (PerformanceNote → ScoreNote → NoteProfile) を束ね、画面がそのまま
 * 表示できる形に整える。課題カタログ・analysisSummary.diagnosis.per_subtask・miss_patterns は読まない。
 *  - 弱点スロット最大4 ・ 音程側2 + リズム側2。音程側は音程のミス、リズム側は入りのミスで束ねる
 *  - 束は 音程 (前の音名→今の音名)・ポジション移動・わざ・速い指の切り替え の4種から、成功率の低い順
 *  - 足切りはこの読み手の値 3音 (R4)
 *  - 内訳文は、その束でミスした音の中で 移弦 / 奏法 / ポジション移動 が6割以上を占めるときだけ一言
 *    (Tetsuo確定 2026-07-11 の折衷案をそのまま。確信が持てないときは何も言わない)
 *  - verdict: "perfect" (弱点なし+崩壊なし+総ミス率10%以下) / "no_specific" / "weakness" / "overall" / "unavailable" (明細なし)
 *  - 崩壊判定は analysisSummary.diagnosis.collapse をそのまま受け取る (1音の足し算では作れない・仕様 §2-6)
 *
 * F21 対策 (2026-09-05 Tetsuo確定・案A+B):
 *  - B 細かい束 (音の移動など) が足切りに届かない短い曲では、1段粗い束 ・ 移動の種類 (同じ弦で上へ / 隣の弦へ下へ …) と 弦 ・ で
 *    もう一度探す。粗い束の教材は「その人の★と曲の調」に合う音階・アルペジオ (細分化しすぎない)
 *  - A それでも束が無く、総ミス率が半分以上なら verdict "overall" ・ 「全体的に外れている」 ・ にして総数と★と調の基礎練を出す
 */
import { prisma } from "./prisma"
import {
  aggregate, pickWeakest, groupKeysOf, parseKey, prismaSource,
  type DetailRow, type GroupKey, type MissKind, type NoteStoreSource, type TabKey, type Unit,
} from "./noteStore"
import { movementLabel, fastSwitchLabel, positionMoveLabel, techniqueLabel, TECH_LABELS } from "./conditionName"
import { pitchToMidi } from "./noteStore"

// 完璧判定の境界 (仮値・Tetsuo確認待ち): 弱点なし + 崩壊ゼロ + 総ミス率がこの値以下
const PERFECT_MISS_RATE_MAX = 0.1
// 内訳文を出す共起集中度のしきい値
const BREAKDOWN_SHARE_MIN = 0.6
/** 候補に入るのに必要な弾いた音数 ・ 演奏直後の診断 (R4) */
export const DIAG_MIN_TARGET = 3
/** 各側 (音程/リズム) に出す束の数 */
const SLOTS_PER_SIDE = 2
/** 束が無いとき「全体的に外れている」とみなす総ミス率 ・ 音程か入りのどちらかがこれ以上 (F21 案A) */
export const OVERALL_MISS_RATE_MIN = 0.5
/** 全体・粗い束の教材を探す棚 (細分化しすぎない基礎練) */
const BASIC_SHELVES = ["scale", "arpeggio"]
/** 粗い束をスロットにするのに必要なミス数 (仮値)。1回の事故は傾向ではない */
export const COARSE_MIN_MISS = 2

/** 診断で教材を探す棚。ホームの棚より広い (演奏直後はエチュードも候補に入れる) */
export const DIAG_SHELVES: Record<TabKey, string[]> = {
  pitch: ["scale", "arpeggio", "double_stop", "etude"],
  position: ["position_shift", "fingering", "etude"],
  technique: ["etude", "bowing"],
  fingering: ["fingering", "etude"],
}
const TABS: TabKey[] = ["pitch", "position", "technique", "fingering"]

export type DiagnosisMaterial = { id: string; title: string; category: string; star: number | null; keyTonic: string; keyMode: string }

export interface DiagnosisSlotView {
  /** 束のキー ("pitch|G4|C5" など)。旧の課題IDの代わり。粗い束は "coarse|move|same_up" / "coarse|string|A" */
  subtaskId: string
  /** 粗い束 (F21 案B) なら true。細かい束が足切りに届かない短い曲で出る */
  coarse?: boolean
  subtaskName: string
  tree: "pitch" | "rhythm"
  miss: number
  target: number
  missRate: number
  /** その束でミスした音の共起から生成した一言内訳 */
  breakdown: string | null
  materials: DiagnosisMaterial[]
  noStock: boolean
}

export interface DiagnosisView {
  verdict: "perfect" | "no_specific" | "weakness" | "overall" | "unavailable"
  slots: DiagnosisSlotView[]
  collapse: { collapsed: unknown[]; isClean: boolean } | null
  totals: { played: number; pitchMiss: number; rhythmMiss: number } | null
  /** verdict "overall" のとき: ★と調に合う基礎練 (F21 案A) */
  overall?: { materials: DiagnosisMaterial[] } | null
}

// ── 粗い束 (F21 案B) ──
const STRINGS = ["G", "D", "A", "E"]
const MOVE_LABELS: Record<string, string> = {
  same_up: "同じ弦で上の音へ進む移動", same_down: "同じ弦で下の音へ進む移動",
  adj_up: "隣の弦へ上がる移動", adj_down: "隣の弦へ下がる移動",
  skip_up: "弦をとばして上がる移動", skip_down: "弦をとばして下がる移動",
  unison_cross: "同じ音を別の弦へ移す",
}
/** 1音が入る粗い束: 移動の種類 (弦の関係 × 上下) と 弦 */
export function coarseKeysOf(r: DetailRow): GroupKey[] {
  const out: GroupKey[] = []
  const cur = r.cur, prev = r.prev
  if (STRINGS.includes(cur.string1)) out.push(`coarse|string|${cur.string1}`)
  if (prev && STRINGS.includes(prev.string1) && STRINGS.includes(cur.string1)) {
    const a = pitchToMidi(prev.pitch1), b = pitchToMidi(cur.pitch1)
    if (a !== null && b !== null) {
      const d = Math.abs(STRINGS.indexOf(prev.string1) - STRINGS.indexOf(cur.string1))
      const kind = d === 0 ? "same" : d === 1 ? "adj" : "skip"
      if (a === b) { if (d > 0) out.push("coarse|move|unison_cross") }
      else out.push(`coarse|move|${kind}_${b > a ? "up" : "down"}`)
    }
  }
  return out
}
export function coarseName(key: GroupKey): string {
  const [, kind, v] = key.split("|")
  if (kind === "string") return `${v}線の音`
  return MOVE_LABELS[v] ?? key
}
function aggregateCoarse(rows: DetailRow[], kind: MissKind): Map<GroupKey, { target: number; miss: number }> {
  const agg = new Map<GroupKey, { target: number; miss: number }>()
  for (const r of rows) {
    for (const k of coarseKeysOf(r)) {
      const a = agg.get(k) ?? { target: 0, miss: 0 }
      a.target += 1
      if (isMissRow(r, kind)) a.miss += 1
      agg.set(k, a)
    }
  }
  return agg
}
/** 粗い束を成功率の低い順に最大 n 件 (足切りは細かい束と同じ) */
export function weakestCoarseBundles(rows: DetailRow[], kind: MissKind, n: number, minTarget: number): { key: GroupKey; miss: number; target: number }[] {
  const all: { key: GroupKey; miss: number; target: number; pct: number }[] = []
  for (const [key, v] of aggregateCoarse(rows, kind).entries()) {
    if (v.target < minTarget || v.miss < COARSE_MIN_MISS) continue
    all.push({ key, miss: v.miss, target: v.target, pct: Math.round((1 - v.miss / v.target) * 100) })
  }
  all.sort((a, b) => a.pct - b.pct || b.target - a.target || a.key.localeCompare(b.key))
  return all.slice(0, n).map(({ key, miss, target }) => ({ key, miss, target }))
}

export function bundleName(key: GroupKey): string {
  const { tab, a, b } = parseKey(key)
  switch (tab) {
    case "pitch": return movementLabel(a, b)
    case "fingering": return fastSwitchLabel(a, b)
    case "position": return positionMoveLabel(parseInt(a, 10), parseInt(b, 10))
    case "technique": return techniqueLabel(a)
  }
}

function isMissRow(r: DetailRow, kind: MissKind): boolean {
  if (r.evaluationStatus === "not_detected") return true
  if (kind === "any") return r.pitchOk === false || r.startOk === false
  return kind === "pitch" ? r.pitchOk === false : r.startOk === false
}

/** 束に入る行 (フィンガリングの実時間は同じ演奏の直前の行との差) */
function rowsInBundle(tab: TabKey, key: GroupKey, rows: DetailRow[]): DetailRow[] {
  const out: DetailRow[] = []
  let lastPerf: string | null = null
  let lastStart: number | null = null
  for (const r of rows) {
    let gap: number | null = null
    if (r.performanceId === lastPerf && lastStart !== null && r.expectedStartSec !== null) gap = r.expectedStartSec - lastStart
    if (groupKeysOf(tab, r, gap).includes(key)) out.push(r)
    lastPerf = r.performanceId
    lastStart = r.expectedStartSec
  }
  return out
}

/** その束でミスした音の共起から一言。移弦 / 奏法 / ポジション移動。束自身の種類は言わない */
export function buildBreakdown(key: GroupKey, missed: DetailRow[]): string | null {
  const total = missed.length
  if (total < 2) return null
  const { tab } = parseKey(key)
  const candidates: Array<{ text: string; count: number }> = []
  if (tab !== "pitch" && tab !== "fingering") {
    const n = missed.filter((r) => r.prev && r.prev.string1 !== "unknown" && r.cur.string1 !== "unknown" && r.prev.string1 !== r.cur.string1).length
    if (n > 0) candidates.push({ text: `うち${n}回は移弦を伴う音`, count: n })
  }
  if (tab !== "technique") {
    const byTech = new Map<string, number>()
    for (const r of missed) {
      for (const [t, col] of Object.entries({ slur: "techSlur", portato: "techPortato", staccato: "techStaccato", bow_staccato: "techBowStaccato", spiccato: "techSpiccato", ricochet: "techRicochet", pizzicato: "techPizzicato", tremolo: "techTremolo", vibrato: "techVibrato", trill: "techTrill", mordent: "techMordent", glissando: "techGlissando", harmonic: "techHarmonic" })) {
        if ((r.cur as unknown as Record<string, boolean>)[col]) byTech.set(t, (byTech.get(t) ?? 0) + 1)
      }
    }
    for (const [t, n] of byTech) candidates.push({ text: `うち${n}回は${TECH_LABELS[t] ?? t}の音`, count: n })
  }
  if (tab !== "position") {
    const n = missed.filter((r) => r.prev && r.prev.position > 0 && r.cur.position > 0 && r.prev.position !== r.cur.position).length
    if (n > 0) candidates.push({ text: `うち${n}回はポジション移動を伴う音`, count: n })
  }
  candidates.sort((a, b) => b.count - a.count)
  const top = candidates[0]
  if (!top || top.count / total < BREAKDOWN_SHARE_MIN) return null
  return top.text
}

/** 片側 (音程 or リズム) の弱点束を、成功率の低い順に最大 n 件 */
export function weakestBundles(rows: DetailRow[], kind: MissKind, n: number, minTarget: number): { key: GroupKey; miss: number; target: number }[] {
  const all: { key: GroupKey; miss: number; target: number; pct: number }[] = []
  for (const tab of TABS) {
    for (const [key, v] of aggregate(tab, rows, kind).entries()) {
      if (v.target < minTarget || v.miss === 0) continue
      all.push({ key, miss: v.miss, target: v.target, pct: Math.round((1 - v.miss / v.target) * 100) })
    }
  }
  all.sort((a, b) => a.pct - b.pct || b.target - a.target || a.key.localeCompare(b.key))
  return all.slice(0, n).map(({ key, miss, target }) => ({ key, miss, target }))
}

export type DiagnosisInput = {
  kind: "score" | "practice"
  performanceId: string
  userId: string
  targetId: string
  /** 教材を ★以下 で絞る基準。null なら絞らない */
  star: number | null
  /** 曲・教材の調。全体・粗い束の基礎練を「同じ調」から選ぶ (F21) */
  key?: { tonic: string | null; mode: string | null } | null
  /** analysisSummary.diagnosis.collapse をそのまま */
  collapse?: { collapsed?: unknown[]; is_clean?: boolean } | null
}

export type DiagnosisDeps = {
  source: NoteStoreSource
  materialOf: (itemId: string) => Promise<DiagnosisMaterial | null>
  /** その人の★ (ランク)。全体・粗い束の基礎練はこの★以下から。無ければ曲の★ */
  userStarOf?: (userId: string) => Promise<number | null>
  /** ★以下・同じ調を優先した音階・アルペジオを limit 件 */
  basicMaterials?: (key: DiagnosisInput["key"], star: number, limit: number) => Promise<DiagnosisMaterial[]>
}

async function materialOf(itemId: string): Promise<DiagnosisMaterial | null> {
  const m = await prisma.practiceItem.findUnique({
    where: { id: itemId },
    select: { id: true, title: true, category: true, star: true, keyTonic: true, keyMode: true },
  })
  return m ? { id: m.id, title: m.title, category: m.category, star: m.star, keyTonic: m.keyTonic, keyMode: m.keyMode } : null
}

async function userStarOf(userId: string): Promise<number | null> {
  const r = await prisma.userStarProgress.findUnique({ where: { userId }, select: { currentStar: true } })
  return r?.currentStar ?? null
}

/** ★以下の公開された音階・アルペジオを、同じ調 → 音階が先 → ★が近い順 で limit 件 */
async function basicMaterials(key: DiagnosisInput["key"], star: number, limit: number): Promise<DiagnosisMaterial[]> {
  const rows = await prisma.practiceItem.findMany({
    where: { isPublished: true, ownerUserId: null, analysisStatus: "done", category: { in: BASIC_SHELVES as never[] }, star: { not: null, lte: star } },
    select: { id: true, title: true, category: true, star: true, keyTonic: true, keyMode: true, articulation: true },
    take: 400,
  })
  const sameKey = (m: { keyTonic: string; keyMode: string }) => !!key?.tonic && m.keyTonic === key.tonic && (!key.mode || m.keyMode === key.mode)
  // 全体が外れている人に出す基礎練は素の弾き方 (レガート) を先に。奏法の変種 (スピッカート等) は後
  const plain = (m: { articulation: string | null }) => m.articulation == null || m.articulation === "legato"
  rows.sort((a, b) =>
    Number(sameKey(b)) - Number(sameKey(a))
    || Number(plain(b)) - Number(plain(a))
    || (b.star ?? 0) - (a.star ?? 0)
    || a.title.localeCompare(b.title))
  // 音階1つ、次にアルペジオ1つ … と棚を回して、同じ音階の変種ばかり並ばないようにする
  const out: typeof rows = []
  for (let round = 0; out.length < limit && round < limit; round++) {
    for (const shelf of BASIC_SHELVES) {
      const m = rows.find((r) => r.category === shelf && !out.includes(r))
      if (m) out.push(m)
      if (out.length >= limit) break
    }
    if (!BASIC_SHELVES.some((shelf) => rows.some((r) => r.category === shelf && !out.includes(r)))) break
  }
  return out.map((m) => ({ id: m.id, title: m.title, category: m.category, star: m.star, keyTonic: m.keyTonic, keyMode: m.keyMode }))
}

const defaultDeps: DiagnosisDeps = { source: prismaSource, materialOf, userStarOf, basicMaterials }

/** 演奏1回の明細 → 画面表示用の形 */
export async function buildDiagnosisView(input: DiagnosisInput, deps: DiagnosisDeps = defaultDeps): Promise<DiagnosisView> {
  let rows: DetailRow[]
  try {
    rows = await deps.source.fetchDetail({
      userId: input.userId, performanceId: input.performanceId, target: { type: input.kind, id: input.targetId },
    })
  } catch {
    rows = []
  }
  if (rows.length === 0) {
    return { verdict: "unavailable", slots: [], collapse: null, totals: null }
  }
  const totals = {
    played: rows.length,
    pitchMiss: rows.filter((r) => isMissRow(r, "pitch")).length,
    rhythmMiss: rows.filter((r) => isMissRow(r, "timing")).length,
  }
  const collapse = {
    collapsed: input.collapse?.collapsed ?? [],
    isClean: input.collapse?.is_clean ?? true,
  }
  const star = input.star ?? 99
  // 全体・粗い束の基礎練は「その人の★」(ランク) と「曲の調」で選ぶ ・ Tetsuo 2026-09-05
  let userStar: number | null = null
  try { userStar = (await deps.userStarOf?.(input.userId)) ?? null } catch { userStar = null }
  const basicStar = userStar ?? input.star ?? 99
  const basics = async (limit: number): Promise<DiagnosisMaterial[]> => {
    try { return (await deps.basicMaterials?.(input.key ?? null, basicStar, limit)) ?? [] } catch { return [] }
  }
  const slots: DiagnosisSlotView[] = []
  const SIDES = [["pitch", "pitch"], ["rhythm", "timing"]] as const
  const fineBySide = SIDES.map(([, kind]) => weakestBundles(rows, kind, SLOTS_PER_SIDE, DIAG_MIN_TARGET))
  const missRate = totals.played > 0 ? Math.max(totals.pitchMiss, totals.rhythmMiss) / totals.played : 0
  // A 細かい束がどちらの側にも無く、半分以上外れている → 1か所の話ではないので粗い束にも落とさず「全体」
  const overallFirst = fineBySide.every((f) => f.length === 0) && missRate >= OVERALL_MISS_RATE_MIN
  for (const [i, [tree, kind]] of SIDES.entries()) {
    const fine = fineBySide[i]
    if (fine.length === 0) {
      if (overallFirst) continue
      // B 細かい束が足切りに届かない (短い曲) → 1段粗い束で探す。教材は★と調の基礎練
      const coarse = weakestCoarseBundles(rows, kind, SLOTS_PER_SIDE, DIAG_MIN_TARGET)
      const mats = coarse.length ? await basics(1) : []
      for (const b of coarse) {
        slots.push({
          subtaskId: b.key, subtaskName: coarseName(b.key), tree, coarse: true,
          miss: b.miss, target: b.target, missRate: b.miss / b.target,
          breakdown: null, materials: mats, noStock: mats.length === 0,
        })
      }
      continue
    }
    for (const b of fine) {
      const { tab } = parseKey(b.key)
      const missed = rowsInBundle(tab, b.key, rows).filter((r) => isMissRow(r, kind))
      const hit = await deps.source.findMaterial(b.key, star, DIAG_SHELVES[tab])
      const m = hit ? await deps.materialOf(hit.itemId) : null
      slots.push({
        subtaskId: b.key,
        subtaskName: bundleName(b.key),
        tree,
        miss: b.miss,
        target: b.target,
        missRate: b.miss / b.target,
        breakdown: buildBreakdown(b.key, missed),
        materials: m ? [m] : [],
        noStock: !m,
      })
    }
  }
  let verdict: DiagnosisView["verdict"] = "weakness"
  let overall: DiagnosisView["overall"] = null
  if (slots.length === 0) {
    if (collapse.isClean && missRate <= PERFECT_MISS_RATE_MAX) verdict = "perfect"
    else if (missRate >= OVERALL_MISS_RATE_MIN) {
      // A 束は無いが半分以上外れている → 「全体的に外れている」。★と調の基礎練を2件
      verdict = "overall"
      overall = { materials: await basics(2) }
    } else verdict = "no_specific"
  }
  return { verdict, slots, collapse, totals, overall }
}

/** 先生画面の一覧・練習後カルテ用の軽い弱点行 (旧 topWeak と同じ形) */
export type WeakSlotLite = { name: string; tree: "音程" | "リズム"; miss: number; target: number }

/** 演奏1回の明細 → 弱点行 (音程側→リズム側の順・最大 limit 件)。診断と同じ束・同じ足切り */
export function weakSlotsFromRows(rows: DetailRow[], limit = 4): WeakSlotLite[] {
  const out: WeakSlotLite[] = []
  for (const [tree, kind] of [["音程", "pitch"], ["リズム", "timing"]] as const) {
    for (const b of weakestBundles(rows, kind, SLOTS_PER_SIDE, DIAG_MIN_TARGET)) {
      out.push({ name: bundleName(b.key), tree, miss: b.miss, target: b.target })
    }
  }
  return out.slice(0, limit)
}

/**
 * 単位 (ユーザー・期間・曲・演奏1回…) の明細を1回引き、演奏ごとに弱点行を作る。
 * 先生の生徒ページ (直近72演奏) のように演奏が多くても、明細の読みは1回で済む。
 */
export async function weakSlotsByPerformance(userId: string, unit: Omit<Unit, "userId"> = {}, limit = 4, source: NoteStoreSource = prismaSource): Promise<Map<string, WeakSlotLite[]>> {
  let rows: DetailRow[]
  try { rows = await source.fetchDetail({ userId, ...unit }) } catch { rows = [] }
  const byPerf = new Map<string, DetailRow[]>()
  for (const r of rows) {
    const list = byPerf.get(r.performanceId)
    if (list) list.push(r); else byPerf.set(r.performanceId, [r])
  }
  const out = new Map<string, WeakSlotLite[]>()
  for (const [id, list] of byPerf) out.set(id, weakSlotsFromRows(list, limit))
  return out
}

// pickWeakest はホームの規則 (1件)。診断は上位2件なので weakestBundles を使う。参照のため残す
void pickWeakest
