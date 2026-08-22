// 指板ヒートマップ 集計エンジン (ARC-SPEC-FBHM-1.0 §4/§5/§6・2026-08-11 Tetsuo承認)
// 既存演奏履歴のread-only射影。DBスキーマ・解析パイプラインは変更しない。
//
// データ源 (2026-08-11 本番実データでフィールド名確認済み):
// - comparison_result.json (performancesバケット, Performance.comparisonResultPath):
//   results[]: note_index / pitch_cents_error(符号付き) / pitch_ok / evaluation_status
// - musicxml_skill_info.json (musicxmlバケット, {owner}/{scoreId}/... 教材=practice/{itemId}/...):
//   notes[]: note_index / string_id("G/D/A/E") / position / midi / is_rest
//
// セル割当 = (string_id, midi - 開放弦midi)。判定は方向別ミス率のみ (平均cents禁止 §4-1)。
// n<5 のセルは返さない (無色表示・2026-08-11 Tetsuo確定: 灰色/斜線も出さない)。
import { prisma } from "../prisma"
import { storageAdmin } from "../storageAdmin"
import { classifyCell, intensityLevel } from "./colors"
import { cellId, type ViolinString } from "./geometry"
import { posLabel, type HeatCellOut, type CellDetail, type HeatmapData, type TransitionRow } from "./heatmapTypes"

export type { HeatCellOut, CellDetail, HeatmapData, TransitionRow }

export const CLASSIFY_PARAMS = { nMin: 5, thetaOk: 0.2, dominanceK: 2.0 } // §9-B 承認値

const OPEN_MIDI: Record<ViolinString, number> = { G: 55, D: 62, A: 69, E: 76 }

type SkillNote = { s: ViolinString; n: number; midi: number; isRest: boolean; position: number | null; finger: number | null }

const KANA = ["ド", "ド♯", "レ", "レ♯", "ミ", "ファ", "ファ♯", "ソ", "ソ♯", "ラ", "ラ♯", "シ"] as const
function midiKana(midi: number): string {
  return KANA[((midi % 12) + 12) % 12]
}

/** skill_info を弦/半音セルの索引に変換。string_id か midi が無い音・休符は除外 */
function toSkillNotes(sj: unknown): Map<number, SkillNote> {
  const notes = (sj as { notes?: unknown[] })?.notes
  const map = new Map<number, SkillNote>()
  if (!Array.isArray(notes)) return map
  for (const raw of notes) {
    const nt = raw as { note_index?: number; string_id?: string | null; midi?: number | null; is_rest?: boolean; position?: number | null; finger?: number | null }
    if (nt.note_index == null || nt.is_rest) continue
    const s = nt.string_id as ViolinString | null | undefined
    if (!s || !(s in OPEN_MIDI) || nt.midi == null) continue
    const n = nt.midi - OPEN_MIDI[s]
    if (n < 0 || n > 30) continue
    map.set(nt.note_index, { s, n, midi: nt.midi, isRest: false, position: nt.position ?? null, finger: nt.finger ?? null })
  }
  return map
}

async function downloadJson(bucket: string, path: string): Promise<unknown | null> {
  try {
    const r = await storageAdmin.storage.from(bucket).download(path)
    if (!r.data) return null
    return JSON.parse(await r.data.text())
  } catch {
    return null
  }
}

/** 曲/教材の skill_info を取得 (リクエスト内キャッシュは呼び出し側の Map で行う) */
export async function fetchSkillNotes(kind: "score" | "practice", targetId: string, ownerId?: string | null): Promise<Map<number, SkillNote>> {
  if (kind === "practice") {
    const sj = await downloadJson("musicxml", `practice/${targetId}/musicxml_skill_info.json`)
    return toSkillNotes(sj)
  }
  let owner = ownerId
  if (!owner) {
    const s = await prisma.score.findUnique({ where: { id: targetId }, select: { createdById: true } })
    owner = s?.createdById ?? null
  }
  if (!owner) return new Map()
  const sj = await downloadJson("musicxml", `${owner}/${targetId}/musicxml_skill_info.json`)
  return toSkillNotes(sj)
}

type CompNote = { note_index?: number; pitch_ok?: boolean | null; pitch_cents_error?: number | null }

function toResults(j: unknown): CompNote[] {
  if (Array.isArray(j)) return j as CompNote[]
  const r = (j as { results?: unknown })?.results
  return Array.isArray(r) ? (r as CompNote[]) : []
}

export type PerfRef = { kind: "score" | "practice"; targetId: string; ownerId?: string | null; comparisonResultPath: string }

/**
 * 演奏群を指板セルに集計する。
 * - 判定不能 (pitch_ok null) は除外 (§25-5 Option A 相当)
 * - ミスの向き: pitch_cents_error の符号 (>0=高い / <0=低い)。符号不明のミスは除外
 * - タップ詳細: 同じ演奏内の直前の評価対象音を遷移元としてグループ化 (§5)
 */
export async function aggregateHeatmap(perfs: PerfRef[]): Promise<HeatmapData> {
  const skillCache = new Map<string, Map<number, SkillNote>>()
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

  let used = 0
  // 直列だと20演奏×DLで遅い → 6並列で処理
  const queue = [...perfs]
  const workers = Array.from({ length: 6 }, async () => {
    for (;;) {
      const p = queue.shift()
      if (!p) return
      const skillKey = `${p.kind}:${p.targetId}`
      let skill = skillCache.get(skillKey)
      if (!skill) {
        skill = await fetchSkillNotes(p.kind, p.targetId, p.ownerId)
        skillCache.set(skillKey, skill)
      }
      if (skill.size === 0) continue
      const results = toResults(await downloadJson("performances", p.comparisonResultPath))
      if (!results.length) continue
      used++
      // note_index 順に走査し、直前の評価対象音を遷移元として保持
      const sorted = [...results].sort((a, b) => (a.note_index ?? 0) - (b.note_index ?? 0))
      let prev: { sk: SkillNote; idx: number } | null = null
      for (const r of sorted) {
        if (r.note_index == null) continue
        const sk = skill.get(r.note_index)
        if (!sk) { prev = null; continue } // 休符・弦不明で遷移も切る
        if (r.pitch_ok == null) { prev = { sk, idx: r.note_index }; continue } // 判定不能は集計除外(遷移元にはなる)
        const id = cellId(sk.s, sk.n)
        let e = agg.get(id)
        if (!e) {
          e = { n: 0, high: 0, low: 0, midi: sk.midi, trans: new Map(), pos: new Map(), shiftAfter: { n: 0, miss: 0, high: 0, low: 0 }, shiftNormal: { n: 0, miss: 0 } }
          agg.set(id, e)
        }
        const cents = r.pitch_cents_error
        const miss = r.pitch_ok === false
        const dirHigh = miss && cents != null && cents > 0
        const dirLow = miss && cents != null && cents < 0
        const counted = !miss || dirHigh || dirLow // 向き不明のミスは全カウントから除外 (方向別ミス率の定義)
        e.n++
        if (dirHigh) e.high++
        if (dirLow) e.low++
        // ポジションべつの安定度 (タップ詳細v2)
        if (sk.position != null && counted) {
          const pk = `${sk.position}|${sk.finger ?? ""}`
          let pe = e.pos.get(pk)
          if (!pe) { pe = { position: sk.position, finger: sk.finger, n: 0, miss: 0, high: 0, low: 0 }; e.pos.set(pk, pe) }
          pe.n++
          if (dirHigh || dirLow) { pe.miss++; if (dirHigh) pe.high++; else pe.low++ }
        }
        // 遷移の判定材料 (直前音が同一演奏内で連続している場合のみ)
        const contiguous = prev != null && prev.idx === r.note_index - 1
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
        prev = { sk, idx: r.note_index }
      }
    }
  })
  await Promise.all(workers)

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
  return { cells, details, perfCount: used }
}

function dirOf(high: number, low: number): "high" | "low" | "mixed" {
  return high >= 2 * low ? "high" : low >= 2 * high ? "low" : "mixed"
}

/** 生徒の直近期間の演奏 (曲+教材) を集計 — 記録の分析(期間タブ)・先生診断レポート用 */
export async function buildUserHeatmap(userId: string, sinceDays: number, maxPerfs = 30): Promise<HeatmapData> {
  return buildUserHeatmapRange(userId, new Date(Date.now() - sinceDays * 864e5), null, maxPerfs)
}

/** 期間 [from, to) 指定版 — 週間サマリーの週次差分用 (2026-08-11) */
export async function buildUserHeatmapRange(userId: string, from: Date, to: Date | null, maxPerfs = 30): Promise<HeatmapData> {
  const uploadedAt = to ? { gte: from, lt: to } : { gte: from }
  const [scorePerfs, pracPerfs] = await Promise.all([
    prisma.performance.findMany({
      where: { userId, uploadedAt, comparisonResultPath: { not: null }, pitchAccuracy: { not: null } },
      orderBy: { uploadedAt: "desc" }, take: maxPerfs,
      select: { comparisonResultPath: true, scoreId: true, score: { select: { createdById: true } } },
    }),
    prisma.practicePerformance.findMany({
      where: { userId, uploadedAt, comparisonResultPath: { not: null }, pitchAccuracy: { not: null } },
      orderBy: { uploadedAt: "desc" }, take: maxPerfs,
      select: { comparisonResultPath: true, practiceItemId: true },
    }),
  ])
  const refs: PerfRef[] = [
    ...scorePerfs.map((p) => ({ kind: "score" as const, targetId: p.scoreId, ownerId: p.score?.createdById, comparisonResultPath: p.comparisonResultPath! })),
    ...pracPerfs.map((p) => ({ kind: "practice" as const, targetId: p.practiceItemId, comparisonResultPath: p.comparisonResultPath! })),
  ]
  return aggregateHeatmap(refs)
}

/** その曲/教材の全演奏を集計 — 先生カルテ入力画面・曲ふりかえりタブ用 */
export async function buildTargetHeatmap(userId: string, kind: "score" | "practice", targetId: string, maxPerfs = 50): Promise<HeatmapData> {
  if (kind === "score") {
    const perfs = await prisma.performance.findMany({
      where: { userId, scoreId: targetId, comparisonResultPath: { not: null }, pitchAccuracy: { not: null } },
      orderBy: { uploadedAt: "desc" }, take: maxPerfs,
      select: { comparisonResultPath: true, scoreId: true, score: { select: { createdById: true } } },
    })
    return aggregateHeatmap(perfs.map((p) => ({ kind: "score" as const, targetId: p.scoreId, ownerId: p.score?.createdById, comparisonResultPath: p.comparisonResultPath! })))
  }
  const perfs = await prisma.practicePerformance.findMany({
    where: { userId, practiceItemId: targetId, comparisonResultPath: { not: null }, pitchAccuracy: { not: null } },
    orderBy: { uploadedAt: "desc" }, take: maxPerfs,
    select: { comparisonResultPath: true, practiceItemId: true },
  })
  return aggregateHeatmap(perfs.map((p) => ({ kind: "practice" as const, targetId: p.practiceItemId, comparisonResultPath: p.comparisonResultPath! })))
}
