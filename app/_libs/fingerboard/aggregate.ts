// 指板ヒートマップ 集計エンジン (ARC-SPEC-FBHM-1.0 §4/§5/§6・2026-08-11 Tetsuo承認)
// 既存演奏履歴のread-only射影。
//
// データ源 (2026-09-05 ノート属性ストア 段4-4 で切替):
// - PerformanceNote (演奏の1音1行): noteIndex / pitchCentsError(符号付き) / pitchOk
// - ScoreNote → NoteProfile (楽譜の1音1行 → かたち): string1("G/D/A/E") / pitch1 → midi / position / finger1
//   comparison_result.json と musicxml_skill_info.json のストレージ直読みはやめた。
//   noteIndex は演奏順 (展開後) なので、繰り返しのある曲でも演奏の音と楽譜の音がずれない。
//
// セル割当 = (string1, midi - 開放弦midi)。判定は方向別ミス率のみ (平均cents禁止 §4-1)。
// n<5 のセルは返さない (無色表示・2026-08-11 Tetsuo確定: 灰色/斜線も出さない)。
// ポジションは R2 (開放弦は直前の手のポジションを引き継ぐ) のかたちの値をそのまま使う。
import { prisma } from "../prisma"
import { prismaSource, pitchToMidi, POS_UNKNOWN, type DetailRow, type ProfileRow, type Unit } from "../noteStore"
import { classifyCell, intensityLevel } from "./colors"
import { cellId, type ViolinString } from "./geometry"
import { posLabel, type HeatCellOut, type CellDetail, type HeatmapData, type TransitionRow } from "./heatmapTypes"

export type { HeatCellOut, CellDetail, HeatmapData, TransitionRow }

export const CLASSIFY_PARAMS = { nMin: 5, thetaOk: 0.2, dominanceK: 2.0 } // §9-B 承認値

const OPEN_MIDI: Record<ViolinString, number> = { G: 55, D: 62, A: 69, E: 76 }

export type SkillNote = { s: ViolinString; n: number; midi: number; isRest: boolean; position: number | null; finger: number | null }

const KANA = ["ド", "ド♯", "レ", "レ♯", "ミ", "ファ", "ファ♯", "ソ", "ソ♯", "ラ", "ラ♯", "シ"] as const
function midiKana(midi: number): string {
  return KANA[((midi % 12) + 12) % 12]
}

/** かたち → 弦/半音セル。弦が不明・音名が読めない・指板の外 (0〜30 以外) は null */
export function profileCell(p: ProfileRow): SkillNote | null {
  const s = p.string1 as ViolinString
  if (!(s in OPEN_MIDI)) return null
  const midi = pitchToMidi(p.pitch1)
  if (midi === null) return null
  const n = midi - OPEN_MIDI[s]
  if (n < 0 || n > 30) return null
  return { s, n, midi, isRest: false, position: p.position === POS_UNKNOWN ? null : p.position, finger: p.finger1 >= 0 ? p.finger1 : null }
}

/**
 * 曲/教材の並び (ScoreNote・演奏順) を noteIndex → 弦/半音セル に変換。
 * 曲の指板の実測塗り (scores/[scoreId], practice/[itemId]) が使う。ownerId は旧 API 互換のため受け取るだけ。
 */
export async function fetchSkillNotes(kind: "score" | "practice", targetId: string, _ownerId?: string | null): Promise<Map<number, SkillNote>> {
  void _ownerId
  const rows = await prisma.$queryRaw<{ noteIndex: number; string1: string; pitch1: string; position: number; finger1: number }[]>`
    SELECT sn."noteIndex", np."string1", np."pitch1", np.position, np."finger1"
    FROM "ScoreNote" sn JOIN "NoteProfile" np ON np.id = sn."profileId"
    WHERE sn."targetType" = ${kind}::"ScoreNoteTarget" AND sn."targetId" = ${targetId}
    ORDER BY sn."noteIndex"`
  const map = new Map<number, SkillNote>()
  for (const r of rows) {
    const cell = profileCell(r as unknown as ProfileRow)
    if (cell) map.set(r.noteIndex, cell)
  }
  return map
}

/**
 * 明細 (演奏の時系列順・演奏内は noteIndex 順) を指板セルに集計する。純関数。
 * - 判定不能 (pitchOk null) は除外 (§25-5 Option A 相当)
 * - ミスの向き: pitchCentsError の符号 (>0=高い / <0=低い)。符号不明のミスは除外
 * - タップ詳細: 同じ演奏内の直前の評価対象音を遷移元としてグループ化 (§5)
 */
export function aggregateHeatmapRows(rows: DetailRow[]): HeatmapData {
  type TransAgg = { n: number; miss: number; high: number; low: number; label: string; badge: string | null; badgeKind: "shift" | "info" | null; from: { s: string; n: number } | null }
  type PosAgg = { position: number; finger: number | null; n: number; miss: number; high: number; low: number }
  type Agg = {
    n: number; high: number; low: number; midi: number
    trans: Map<string, TransAgg>
    pos: Map<string, PosAgg>
    shiftAfter: { n: number; miss: number; high: number; low: number }
    shiftNormal: { n: number; miss: number }
  }
  const agg = new Map<string, Agg>()
  const usedPerfs = new Set<string>()

  let lastPerf: string | null = null
  let prev: { sk: SkillNote; idx: number } | null = null
  for (const r of rows) {
    if (r.performanceId !== lastPerf) { prev = null; lastPerf = r.performanceId }
    const sk = profileCell(r.cur)
    if (!sk) { prev = null; continue } // 弦不明などで遷移も切る
    if (r.pitchOk == null) { prev = { sk, idx: r.noteIndex }; continue } // 判定不能は集計除外(遷移元にはなる)
    usedPerfs.add(r.performanceId)
    const id = cellId(sk.s, sk.n)
    let e = agg.get(id)
    if (!e) {
      e = { n: 0, high: 0, low: 0, midi: sk.midi, trans: new Map(), pos: new Map(), shiftAfter: { n: 0, miss: 0, high: 0, low: 0 }, shiftNormal: { n: 0, miss: 0 } }
      agg.set(id, e)
    }
    const cents = r.pitchCentsError ?? null
    const miss = r.pitchOk === false
    const dirHigh = miss && cents != null && cents > 0
    const dirLow = miss && cents != null && cents < 0
    const counted = !miss || dirHigh || dirLow // 向き不明のミスは全カウントから除外 (方向別ミス率の定義)
    e.n++
    if (dirHigh) e.high++
    if (dirLow) e.low++
    // ポジションべつの精度 (タップ詳細v2)
    if (sk.position != null && counted) {
      const pk = `${sk.position}|${sk.finger ?? ""}`
      let pe = e.pos.get(pk)
      if (!pe) { pe = { position: sk.position, finger: sk.finger, n: 0, miss: 0, high: 0, low: 0 }; e.pos.set(pk, pe) }
      pe.n++
      if (dirHigh || dirLow) { pe.miss++; if (dirHigh) pe.high++; else pe.low++ }
    }
    // 遷移の判定材料 (直前音が同一演奏内で連続している場合のみ)
    const contiguous = prev != null && prev.idx === r.noteIndex - 1
    const shift = contiguous && prev!.sk.position != null && sk.position != null && prev!.sk.position !== sk.position
    // シフト直後 vs 移動なし (弾き始め・休符あとは比較から除外)
    if (contiguous && counted) {
      if (shift) {
        e.shiftAfter.n++
        if (dirHigh || dirLow) { e.shiftAfter.miss++; if (dirHigh) e.shiftAfter.high++; else e.shiftAfter.low++ }
      } else {
        e.shiftNormal.n++
        if (dirHigh || dirLow) e.shiftNormal.miss++
      }
    }
    // 遷移元グループ (ポジション差分バッジつき)
    const fromKey = contiguous ? `${prev!.sk.s}:${prev!.sk.n}` : "__start__"
    let label = "弾き始め・休符のあと"
    let badge: string | null = null
    let badgeKind: "shift" | "info" | null = null
    if (contiguous) {
      const pv = prev!.sk
      label = `${midiKana(pv.midi)}・${pv.s}線${pv.n === 0 ? "・開放" : pv.position != null ? `・${posLabel(pv.position)}` : ""}`
      if (shift) { badge = `${posLabel(pv.position!)}→${posLabel(sk.position!)}`; badgeKind = "shift" }
      else if (pv.s !== sk.s) { badge = "移弦のみ"; badgeKind = "info" }
      else { badge = "同じ弦"; badgeKind = "info" }
    }
    let t = e.trans.get(fromKey)
    if (!t) { t = { n: 0, miss: 0, high: 0, low: 0, label, badge, badgeKind, from: contiguous ? { s: prev!.sk.s, n: prev!.sk.n } : null }; e.trans.set(fromKey, t) }
    t.n++
    if (miss && (dirHigh || dirLow)) { t.miss++; if (dirHigh) t.high++; else t.low++ }
    prev = { sk, idx: r.noteIndex }
  }

  const cells: Record<string, HeatCellOut> = {}
  const details: Record<string, CellDetail> = {}
  for (const [id, e] of agg) {
    const status = classifyCell({ n: e.n, high: e.high, low: e.low }, CLASSIFY_PARAMS)
    if (status === "insufficient") continue // n<5 は無色 (返さない)
    const rMiss = (e.high + e.low) / e.n
    cells[id] = { status, level: status === "stable" ? 0 : intensityLevel(rMiss, CLASSIFY_PARAMS.thetaOk) }
    details[id] = {
      n: e.n, high: e.high, low: e.low, kana: midiKana(e.midi),
      // ポジションべつ: 3回以上のポジションだけ (少数サンプルの断定を防ぐ)。回数の多い順
      positions: [...e.pos.values()]
        .filter((p) => p.n >= 3)
        .map((p) => ({ position: p.position, finger: p.finger, n: p.n, miss: p.miss, dir: dirOf(p.high, p.low) }))
        .sort((a, b) => b.n - a.n),
      // シフト直後 vs 移動なし: シフト直後が2回以上ある時だけ
      shiftSplit: e.shiftAfter.n >= 2
        ? { after: { n: e.shiftAfter.n, miss: e.shiftAfter.miss, dir: dirOf(e.shiftAfter.high, e.shiftAfter.low) }, normal: { n: e.shiftNormal.n, miss: e.shiftNormal.miss } }
        : null,
      transitions: [...e.trans.values()]
        .filter((t) => t.n >= 2)
        .map((t) => ({
          fromLabel: t.label, from: t.from ?? null, badge: t.badge, badgeKind: t.badgeKind, n: t.n, miss: t.miss,
          dir: dirOf(t.high, t.low),
        }))
        .sort((a, b) => b.miss / b.n - a.miss / a.n)
        .slice(0, 6),
    }
  }
  return { cells, details, perfCount: usedPerfs.size }
}

function dirOf(high: number, low: number): "high" | "low" | "mixed" {
  return high >= 2 * low ? "high" : low >= 2 * high ? "low" : "mixed"
}

/** 単位 (ユーザー・期間・曲…) の明細を引いて集計する */
export async function aggregateHeatmap(unit: Unit): Promise<HeatmapData> {
  return aggregateHeatmapRows(await prismaSource.fetchDetail(unit))
}

/** 生徒の直近期間の演奏 (曲+教材) を集計 — 記録の分析(期間タブ)・先生診断レポート用 */
export async function buildUserHeatmap(userId: string, sinceDays: number, maxPerfs = 30): Promise<HeatmapData> {
  return buildUserHeatmapRange(userId, new Date(Date.now() - sinceDays * 864e5), null, maxPerfs)
}

/** 期間 [from, to) 指定版 — 週間サマリーの週次差分用 (2026-08-11)。maxPerfs は曲+教材あわせて直近 2×maxPerfs 本 (旧は種別ごと maxPerfs 本) */
export async function buildUserHeatmapRange(userId: string, from: Date, to: Date | null, maxPerfs = 30): Promise<HeatmapData> {
  return aggregateHeatmap({ userId, since: from, until: to ?? undefined, lastN: maxPerfs * 2 })
}

/** その曲/教材の全演奏を集計 — 先生カルテ入力画面・曲ふりかえりタブ用 */
export async function buildTargetHeatmap(userId: string, kind: "score" | "practice", targetId: string, maxPerfs = 50, since?: Date | null): Promise<HeatmapData> {
  return aggregateHeatmap({ userId, target: { type: kind, id: targetId }, since: since ?? undefined, lastN: maxPerfs })
}
