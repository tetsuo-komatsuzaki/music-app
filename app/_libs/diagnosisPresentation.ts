/**
 * diagnosisPresentation.ts — 診断APIの整形層（工程C-6a・2026-07-11）
 *
 * 役割: analysisSummary.diagnosis (Python version 2) + 推薦エンジン(C-5) の出力を、
 * 画面がそのまま表示できる形に整える。
 *  - 弱点スロット最大4（音程2+リズム2）+ 推薦教材 + 内訳文（miss_patterns から生成）
 *  - verdict: "perfect"（完璧な演奏です！）/ "no_specific"（特定の弱点なし）/
 *             "weakness"（弱点あり）/ "unavailable"（診断なし=v65以前の演奏 or 対応表なし）
 *
 * 内訳文（breakdown）の思想（Tetsuo確定 2026-07-11 折衷案）:
 *   「選ぶのは射影（単一タグ）・説明するのは組み合わせ」。
 *   top弱点タグに該当する miss_patterns を絞り、共起する非デフォルト特徴
 *   （移弦 / 奏法 / ポジション移動）が6割以上を占めるときだけ一言添える。
 *   確信が持てないときは何も言わない（誤った説明は無説明より悪い）。
 */
import {
  recommendForPerformance,
  type DiagnosisJson,
  type RecommendContext,
  type RecommendationSlot,
} from "./weaknessRecommendation"
import { SUBTASK_BY_ID } from "./subtaskCatalog.generated"

// 完璧判定の境界（仮値・Tetsuo確認待ち）: 診断空 + 崩壊ゼロ + 総ミス率がこの値以下
const PERFECT_MISS_RATE_MAX = 0.1
// 内訳文を出す共起集中度のしきい値
const BREAKDOWN_SHARE_MIN = 0.6

type MissPattern = Record<string, string | number | null>

export interface DiagnosisSlotView {
  subtaskId: string
  subtaskName: string
  tree: "pitch" | "rhythm"
  miss: number
  target: number
  missRate: number
  /** miss_patterns から生成した一言内訳（確信が持てないとき null） */
  breakdown: string | null
  materials: RecommendationSlot["materials"]
  noStock: boolean
}

export interface DiagnosisView {
  verdict: "perfect" | "no_specific" | "weakness" | "unavailable"
  slots: DiagnosisSlotView[]
  collapse: { collapsed: unknown[]; isClean: boolean } | null
  totals: { played: number; pitchMiss: number; rhythmMiss: number } | null
}

const TECH_NAMES: Record<string, string> = {
  slur: "スラー", portato: "ポルタート", staccato: "スタッカート",
  bow_staccato: "ボウ・スタッカート", spiccato: "スピッカート",
  ricochet: "リコシェ", pizzicato: "ピチカート", tremolo: "トレモロ",
  vibrato: "ビブラート", trill: "トリル", mordent: "モルデント",
  glissando: "グリッサンド", harmonic: "ナチュラル・ハーモニクス",
}

/** 小課題IDに該当する miss_patterns を絞り込む */
function patternsForSubtask(sid: string, patterns: MissPattern[]): MissPattern[] {
  const m = /^(pitch|rhythm)_(posshift|double|tech|interval|value|tuplet|entry)_(.+)$/.exec(sid)
  if (!m) return []
  const [, , family, detail] = m
  switch (family) {
    case "value":
      if (detail === "dotted") {
        return patterns.filter((p) => String(p.value ?? "").startsWith("dotted"))
      }
      return patterns.filter((p) => {
        const v = String(p.value ?? "")
        return v === detail || v === `dotted_${detail}` ||
          (detail === "32nd_plus" && ["32nd", "64th", "128th"].some((x) => v.endsWith(x)))
      })
    case "tech":
      return patterns.filter((p) => String(p.tech ?? "").split(",").includes(detail))
    case "posshift":
      return patterns.filter((p) => p.posshift === detail)
    case "interval": {
      if (detail === "unison_crossing") {
        return patterns.filter((p) => p.move === "unison" && p.string !== "same")
      }
      const im = /^(same|adj|skip)_(up|down)_(step|leap)$/.exec(detail)
      if (!im) return []
      const stringKey = im[1] === "adj" ? "adjacent" : im[1]
      return patterns.filter(
        (p) => p.string === stringKey && p.move === `${im[2]}_${im[3]}`
      )
    }
    default:
      return [] // double/entry: パターン軸に含まれないため内訳なし
  }
}

/** 絞ったパターン群から、支配的な共起特徴を一言にする */
function buildBreakdown(sid: string, patterns: MissPattern[]): string | null {
  const filtered = patternsForSubtask(sid, patterns)
  const total = filtered.reduce((s, p) => s + Number(p.count ?? 0), 0)
  if (total < 2) return null

  const family = sid.split("_")[1]
  const candidates: Array<{ text: string; count: number }> = []

  // 移弦共起（interval系の弱点自体には言わない）
  if (family !== "interval") {
    const n = filtered
      .filter((p) => p.string === "adjacent" || p.string === "skip")
      .reduce((s, p) => s + Number(p.count ?? 0), 0)
    if (n > 0) candidates.push({ text: `うち${n}回は移弦を伴う音`, count: n })
  }
  // 奏法共起（tech系の弱点自体には言わない）
  if (family !== "tech") {
    const byTech = new Map<string, number>()
    for (const p of filtered) {
      for (const t of String(p.tech ?? "").split(",").filter(Boolean)) {
        byTech.set(t, (byTech.get(t) ?? 0) + Number(p.count ?? 0))
      }
    }
    for (const [t, n] of byTech) {
      const name = TECH_NAMES[t]
      if (name) candidates.push({ text: `うち${n}回は${name}の音`, count: n })
    }
  }
  // ポジション移動共起（posshift系の弱点自体には言わない）
  if (family !== "posshift") {
    const n = filtered
      .filter((p) => {
        const ps = String(p.posshift ?? "")
        const [f, t] = ps.split("_")
        return f && t && f !== t
      })
      .reduce((s, p) => s + Number(p.count ?? 0), 0)
    if (n > 0) candidates.push({ text: `うち${n}回はポジション移動を伴う音`, count: n })
  }

  candidates.sort((a, b) => b.count - a.count)
  const top = candidates[0]
  if (!top || top.count / total < BREAKDOWN_SHARE_MIN) return null
  return top.text
}

/** 診断JSON + 推薦文脈 → 画面表示用の形（演奏直後窓①） */
export async function buildDiagnosisView(
  diagnosis: DiagnosisJson | null | undefined,
  ctx: RecommendContext
): Promise<DiagnosisView> {
  if (!diagnosis || !diagnosis.map_available) {
    return { verdict: "unavailable", slots: [], collapse: null, totals: null }
  }

  const rawTotals = (diagnosis as unknown as {
    totals?: { played?: number; pitch_miss?: number; rhythm_miss?: number }
  }).totals
  const totals = {
    played: rawTotals?.played ?? 0,
    pitchMiss: rawTotals?.pitch_miss ?? 0,
    rhythmMiss: rawTotals?.rhythm_miss ?? 0,
  }
  const rawCollapse = (diagnosis as unknown as {
    collapse?: { collapsed?: unknown[]; is_clean?: boolean }
  }).collapse
  const collapse = {
    collapsed: rawCollapse?.collapsed ?? [],
    isClean: rawCollapse?.is_clean ?? true,
  }

  const recSlots = await recommendForPerformance(diagnosis, ctx)
  const missPatterns = diagnosis.miss_patterns ?? { pitch: [], rhythm: [] }
  const slots: DiagnosisSlotView[] = recSlots.map((s) => ({
    subtaskId: s.subtaskId,
    subtaskName: s.subtaskName,
    tree: s.tree,
    miss: s.miss,
    target: s.target,
    missRate: s.missRate,
    breakdown: buildBreakdown(s.subtaskId, missPatterns[s.tree] ?? []),
    materials: s.materials,
    noStock: s.noStock,
  }))

  let verdict: DiagnosisView["verdict"] = "weakness"
  if (slots.length === 0) {
    const missRate =
      totals.played > 0
        ? Math.max(totals.pitchMiss, totals.rhythmMiss) / totals.played
        : 0
    verdict =
      collapse.isClean && missRate <= PERFECT_MISS_RATE_MAX ? "perfect" : "no_specific"
  }
  return { verdict, slots, collapse, totals }
}

/** 累積スロット（窓②）を同じ画面形に整形（内訳は演奏単位の情報なので無し） */
export function toSlotViews(recSlots: RecommendationSlot[]): DiagnosisSlotView[] {
  return recSlots
    .filter((s) => SUBTASK_BY_ID[s.subtaskId])
    .map((s) => ({
      subtaskId: s.subtaskId,
      subtaskName: s.subtaskName,
      tree: s.tree,
      miss: s.miss,
      target: s.target,
      missRate: s.missRate,
      breakdown: null,
      materials: s.materials,
      noStock: s.noStock,
    }))
}
