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
 *  - verdict: "perfect" (弱点なし+崩壊なし+総ミス率10%以下) / "no_specific" / "weakness" / "unavailable" (明細なし)
 *  - 崩壊判定は analysisSummary.diagnosis.collapse をそのまま受け取る (1音の足し算では作れない・仕様 §2-6)
 */
import { prisma } from "./prisma"
import {
  aggregate, pickWeakest, groupKeysOf, parseKey, prismaSource,
  type DetailRow, type GroupKey, type MissKind, type NoteStoreSource, type TabKey,
} from "./noteStore"
import { movementLabel, fastSwitchLabel, positionMoveLabel, techniqueLabel, TECH_LABELS } from "./conditionName"

// 完璧判定の境界 (仮値・Tetsuo確認待ち): 弱点なし + 崩壊ゼロ + 総ミス率がこの値以下
const PERFECT_MISS_RATE_MAX = 0.1
// 内訳文を出す共起集中度のしきい値
const BREAKDOWN_SHARE_MIN = 0.6
/** 候補に入るのに必要な弾いた音数 ・ 演奏直後の診断 (R4) */
export const DIAG_MIN_TARGET = 3
/** 各側 (音程/リズム) に出す束の数 */
const SLOTS_PER_SIDE = 2

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
  /** 束のキー ("pitch|G4|C5" など)。旧の課題IDの代わり */
  subtaskId: string
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
  verdict: "perfect" | "no_specific" | "weakness" | "unavailable"
  slots: DiagnosisSlotView[]
  collapse: { collapsed: unknown[]; isClean: boolean } | null
  totals: { played: number; pitchMiss: number; rhythmMiss: number } | null
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
  /** analysisSummary.diagnosis.collapse をそのまま */
  collapse?: { collapsed?: unknown[]; is_clean?: boolean } | null
}

export type DiagnosisDeps = {
  source: NoteStoreSource
  materialOf: (itemId: string) => Promise<DiagnosisMaterial | null>
}

async function materialOf(itemId: string): Promise<DiagnosisMaterial | null> {
  const m = await prisma.practiceItem.findUnique({
    where: { id: itemId },
    select: { id: true, title: true, category: true, star: true, keyTonic: true, keyMode: true },
  })
  return m ? { id: m.id, title: m.title, category: m.category, star: m.star, keyTonic: m.keyTonic, keyMode: m.keyMode } : null
}

const defaultDeps: DiagnosisDeps = { source: prismaSource, materialOf }

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
  const slots: DiagnosisSlotView[] = []
  for (const [tree, kind] of [["pitch", "pitch"], ["rhythm", "timing"]] as const) {
    for (const b of weakestBundles(rows, kind, SLOTS_PER_SIDE, DIAG_MIN_TARGET)) {
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
  if (slots.length === 0) {
    const missRate = totals.played > 0 ? Math.max(totals.pitchMiss, totals.rhythmMiss) / totals.played : 0
    verdict = collapse.isClean && missRate <= PERFECT_MISS_RATE_MAX ? "perfect" : "no_specific"
  }
  return { verdict, slots, collapse, totals }
}

// pickWeakest はホームの規則 (1件)。診断は上位2件なので weakestBundles を使う。参照のため残す
void pickWeakest
