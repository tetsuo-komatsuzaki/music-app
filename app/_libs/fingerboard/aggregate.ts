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
import type { HeatCellOut, CellDetail, HeatmapData, TransitionRow } from "./heatmapTypes"

export type { HeatCellOut, CellDetail, HeatmapData, TransitionRow }

export const CLASSIFY_PARAMS = { nMin: 5, thetaOk: 0.2, dominanceK: 2.0 } // §9-B 承認値

const OPEN_MIDI: Record<ViolinString, number> = { G: 55, D: 62, A: 69, E: 76 }

type SkillNote = { s: ViolinString; n: number; midi: number; isRest: boolean; position: number | null }

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
    const nt = raw as { note_index?: number; string_id?: string | null; midi?: number | null; is_rest?: boolean; position?: number | null }
    if (nt.note_index == null || nt.is_rest) continue
    const s = nt.string_id as ViolinString | null | undefined
    if (!s || !(s in OPEN_MIDI) || nt.midi == null) continue
    const n = nt.midi - OPEN_MIDI[s]
    if (n < 0 || n > 30) continue
    map.set(nt.note_index, { s, n, midi: nt.midi, isRest: false, position: nt.position ?? null })
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
  type Agg = { n: number; high: number; low: number; midi: number; trans: Map<string, { n: number; miss: number; high: number; low: number; label: string; shift: boolean }> }
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
        if (!e) { e = { n: 0, high: 0, low: 0, midi: sk.midi, trans: new Map() }; agg.set(id, e) }
        const cents = r.pitch_cents_error
        const miss = r.pitch_ok === false
        const dirHigh = miss && cents != null && cents > 0
        const dirLow = miss && cents != null && cents < 0
        e.n++
        if (dirHigh) e.high++
        if (dirLow) e.low++
        // 遷移元グループ (直前音が同一演奏内で連続している場合のみ)
        const fromKey = prev && prev.idx === r.note_index - 1
          ? `${prev.sk.s}:${prev.sk.n}`
          : "__start__"
        const label = prev && prev.idx === r.note_index - 1
          ? `${midiKana(prev.sk.midi)}（${prev.sk.s}線${prev.sk.n === 0 ? "・開放" : ""}）`
          : "弾き始め・休符のあと"
        const shift = prev != null && prev.idx === r.note_index - 1 && prev.sk.position != null && sk.position != null && prev.sk.position !== sk.position
        let t = e.trans.get(fromKey)
        if (!t) { t = { n: 0, miss: 0, high: 0, low: 0, label, shift }; e.trans.set(fromKey, t) }
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
      transitions: [...e.trans.values()]
        .filter((t) => t.n >= 2)
        .map((t) => ({
          fromLabel: t.label, shift: t.shift, n: t.n, miss: t.miss,
          dir: (t.high >= 2 * t.low ? "high" : t.low >= 2 * t.high ? "low" : "mixed") as "high" | "low" | "mixed",
        }))
        .sort((a, b) => b.miss / b.n - a.miss / a.n)
        .slice(0, 6),
    }
  }
  return { cells, details, perfCount: used }
}

/** 生徒の直近期間の演奏 (曲+教材) を集計 — 記録の分析(期間タブ)・先生診断レポート用 */
export async function buildUserHeatmap(userId: string, sinceDays: number, maxPerfs = 30): Promise<HeatmapData> {
  const since = new Date(Date.now() - sinceDays * 864e5)
  const [scorePerfs, pracPerfs] = await Promise.all([
    prisma.performance.findMany({
      where: { userId, uploadedAt: { gte: since }, comparisonResultPath: { not: null }, pitchAccuracy: { not: null } },
      orderBy: { uploadedAt: "desc" }, take: maxPerfs,
      select: { comparisonResultPath: true, scoreId: true, score: { select: { createdById: true } } },
    }),
    prisma.practicePerformance.findMany({
      where: { userId, uploadedAt: { gte: since }, comparisonResultPath: { not: null }, pitchAccuracy: { not: null } },
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

/** その曲/教材の全演奏を集計 — 先生カルテ入力画面用 (上限50演奏) */
export async function buildTargetHeatmap(userId: string, kind: "score" | "practice", targetId: string): Promise<HeatmapData> {
  if (kind === "score") {
    const perfs = await prisma.performance.findMany({
      where: { userId, scoreId: targetId, comparisonResultPath: { not: null }, pitchAccuracy: { not: null } },
      orderBy: { uploadedAt: "desc" }, take: 50,
      select: { comparisonResultPath: true, scoreId: true, score: { select: { createdById: true } } },
    })
    return aggregateHeatmap(perfs.map((p) => ({ kind: "score" as const, targetId: p.scoreId, ownerId: p.score?.createdById, comparisonResultPath: p.comparisonResultPath! })))
  }
  const perfs = await prisma.practicePerformance.findMany({
    where: { userId, practiceItemId: targetId, comparisonResultPath: { not: null }, pitchAccuracy: { not: null } },
    orderBy: { uploadedAt: "desc" }, take: 50,
    select: { comparisonResultPath: true, practiceItemId: true },
  })
  return aggregateHeatmap(perfs.map((p) => ({ kind: "practice" as const, targetId: p.practiceItemId, comparisonResultPath: p.comparisonResultPath! })))
}
