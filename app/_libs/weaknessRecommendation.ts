/**
 * weaknessRecommendation.ts — 弱点練習の推薦エンジン（工程C-5・2026-07-11 Tetsuo承認）
 *
 * 役割: 診断（analysisSummary.diagnosis / UserSkillSubScore 累積）の小課題IDを
 * 教材検索に変換し、優先順位付きの推薦を返す。
 *
 * 確定設計（論点1〜5・2026-07-11）:
 *  - 実装場所 = アプリ側オンデマンド計算（案A）。在庫はサーバー内キャッシュ(5分)。
 *    実測: 在庫全量+タグJOIN=444行 12ms / 累積 9ms / star帯 9ms（キャッシュで在庫分は消える）
 *  - 小課題ID→検索条件はカタログ正本（subtaskCatalog.generated.ts の materialQuery）。
 *    手書きの対応表を作らない（C-1 単一ソース原則）。
 *  - ポジションと技術タグは「前提条件」: ポジションは候補の絞り込みに使い、
 *    絞った結果0件なら緩めて全候補に戻す（推薦が空になるよりまし）。
 *  - 順位付け: ①star が基準に近い → ②調一致 → ③テンポが近い（エチュード推薦と同ルール）
 *  - 4スロット（音程2+リズム2）間で教材IDを重複排除し、次点を繰り上げ。
 *  - 在庫0の小課題は推薦スキップ（診断は表示され、教材だけ「準備中」になる想定）。
 *  - 練習済み除外は工程Dで結線（excludeSubtask フックのみ用意。v1は常に含める）。
 *  - 累積窓: 対象音数 >= CUMULATIVE_MIN_TARGET(10) で足切り、ミス率順。
 *    star基準 = ユーザーが演奏実績を持つ曲の最高star（達成記録は工程Dで置換予定）。
 */
import { prisma } from "./prisma"
import {
  SUBTASK_BY_ID,
  type MaterialQuery,
  type SubtaskDef,
} from "./subtaskCatalog.generated"

// ── 型 ──────────────────────────────────────────────────────────────

/** Python lib/diagnosis.py が analysisSummary.diagnosis に保存する形（version 2） */
export interface DiagnosisJson {
  version: number
  map_available: boolean
  per_subtask: Record<string, { miss: number; target: number }>
  diagnosis: { pitch: string[]; rhythm: string[] }
  miss_patterns?: {
    pitch: Array<Record<string, string | number | null>>
    rhythm: Array<Record<string, string | number | null>>
  }
}

/** 推薦の基準となる文脈（演奏直後窓では診断元の曲、累積窓ではユーザー水準） */
export interface RecommendContext {
  star: number | null
  keyTonic: string | null
  keyMode: string | null
  tempo: number | null
  /** 診断元の曲で使うポジション（Score.positions Int[]）。前提条件フィルタに使用 */
  positions: number[] | null
}

export interface MaterialCandidate {
  id: string
  title: string
  category: string
  star: number | null
  keyTonic: string
  keyMode: string
  tempoMin: number | null
  tempoMax: number | null
  positions: number[]
  featureTags: Array<{ category: string; name: string }>
  techniqueNames: string[]
}

export interface RecommendationSlot {
  subtaskId: string
  subtaskName: string
  tree: "pitch" | "rhythm"
  miss: number
  target: number
  missRate: number
  materials: MaterialCandidate[]
  /** 在庫0でスキップされた場合 true（UI は「教材準備中」表示を想定） */
  noStock: boolean
}

// ── 在庫キャッシュ ────────────────────────────────────────────────────

const INVENTORY_TTL_MS = 5 * 60 * 1000
const MATERIALS_PER_SLOT = 2
export const CUMULATIVE_MIN_TARGET = 10

let inventoryCache: { at: number; items: MaterialCandidate[] } | null = null

/** "1st"/"3rd" 形式 → ポジション番号（工程A の Int[] 移行見送りのための変換） */
function parsePosition(p: string): number | null {
  const m = /^(\d+)/.exec(p)
  return m ? parseInt(m[1], 10) : null
}

export async function getInventory(): Promise<MaterialCandidate[]> {
  if (inventoryCache && Date.now() - inventoryCache.at < INVENTORY_TTL_MS) {
    return inventoryCache.items
  }
  const rows = await prisma.practiceItem.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      title: true,
      category: true,
      star: true,
      keyTonic: true,
      keyMode: true,
      tempoMin: true,
      tempoMax: true,
      positions: true,
      featureTags: { select: { featureTag: { select: { category: true, name: true } } } },
      techniques: { select: { techniqueTag: { select: { name: true } } } },
    },
  })
  const items: MaterialCandidate[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    star: r.star,
    keyTonic: r.keyTonic,
    keyMode: r.keyMode,
    tempoMin: r.tempoMin,
    tempoMax: r.tempoMax,
    positions: r.positions
      .map(parsePosition)
      .filter((n): n is number => n !== null),
    featureTags: r.featureTags.map((f) => f.featureTag),
    techniqueNames: r.techniques.map((t) => t.techniqueTag.name),
  }))
  inventoryCache = { at: Date.now(), items }
  return items
}

/** テスト・管理操作用（教材登録直後に即反映したい場合） */
export function invalidateInventoryCache(): void {
  inventoryCache = null
}

// ── 検索と順位付け ────────────────────────────────────────────────────

function matchesQuery(item: MaterialCandidate, q: MaterialQuery): boolean {
  switch (q.type) {
    case "feature":
      return item.featureTags.some((f) => f.category === q.category && f.name === q.name)
    case "technique":
      return item.techniqueNames.includes(q.name)
    case "category":
      return item.category === q.category
    case "basic":
      // 基礎フォールバック: 音階教材（順位付けの調一致・star近さが絞り込みを担う）
      return item.category === "scale"
  }
}

/** 前提条件: 診断元の曲のポジション範囲内で弾ける教材を優先。0件なら緩める */
function applyPositionPrecondition(
  candidates: MaterialCandidate[],
  ctx: RecommendContext
): MaterialCandidate[] {
  if (!ctx.positions || ctx.positions.length === 0) return candidates
  const allowed = new Set(ctx.positions)
  const filtered = candidates.filter(
    (c) => c.positions.length === 0 || c.positions.every((p) => allowed.has(p))
  )
  return filtered.length > 0 ? filtered : candidates
}

/** 順位付け: ①star近い → ②調一致 → ③テンポ近い（小さいほど良いスコア） */
function rankScore(item: MaterialCandidate, ctx: RecommendContext): number {
  const starDist =
    ctx.star !== null && item.star !== null ? Math.abs(item.star - ctx.star) : 5
  const keyMatch =
    ctx.keyTonic !== null &&
    item.keyTonic === ctx.keyTonic &&
    (ctx.keyMode === null || item.keyMode === ctx.keyMode)
      ? 0
      : 1
  let tempoDist = 0.5
  if (ctx.tempo !== null && (item.tempoMin !== null || item.tempoMax !== null)) {
    const lo = item.tempoMin ?? item.tempoMax ?? ctx.tempo
    const hi = item.tempoMax ?? item.tempoMin ?? ctx.tempo
    tempoDist =
      ctx.tempo < lo ? (lo - ctx.tempo) / 200 : ctx.tempo > hi ? (ctx.tempo - hi) / 200 : 0
  }
  return starDist * 100 + keyMatch * 10 + Math.min(tempoDist, 1)
}

function selectMaterials(
  def: SubtaskDef,
  inventory: MaterialCandidate[],
  ctx: RecommendContext,
  usedIds: Set<string>
): MaterialCandidate[] {
  // materialQuery は優先順リスト: 先頭から試し、在庫があった条件を採用
  for (const q of def.materialQuery) {
    let candidates = inventory.filter((it) => matchesQuery(it, q))
    if (candidates.length === 0) continue
    candidates = applyPositionPrecondition(candidates, ctx)
    candidates.sort((a, b) => rankScore(a, ctx) - rankScore(b, ctx))
    const picked: MaterialCandidate[] = []
    for (const c of candidates) {
      if (usedIds.has(c.id)) continue // スロット間の教材重複排除（次点繰り上げ）
      picked.push(c)
      usedIds.add(c.id)
      if (picked.length >= MATERIALS_PER_SLOT) break
    }
    if (picked.length > 0) return picked
  }
  return []
}

// ── 窓①: 演奏直後の推薦 ──────────────────────────────────────────────

/**
 * 1演奏の診断（analysisSummary.diagnosis）から推薦を組み立てる。
 * excludeSubtask: 練習済み除外フック（工程Dでクリア記録に結線。v1 は未指定=全件対象）
 */
export async function recommendForPerformance(
  diagnosis: DiagnosisJson,
  ctx: RecommendContext,
  excludeSubtask?: (subtaskId: string) => boolean
): Promise<RecommendationSlot[]> {
  const inventory = await getInventory()
  const usedIds = new Set<string>()
  const slots: RecommendationSlot[] = []
  for (const tree of ["pitch", "rhythm"] as const) {
    for (const sid of diagnosis.diagnosis?.[tree] ?? []) {
      if (excludeSubtask?.(sid)) continue
      const def = SUBTASK_BY_ID[sid]
      if (!def) continue
      // 防御: version 1 期(v65)に保存された診断は「変化なし箱」(posshift_1_1等)を
      // 含みうる。診断不可タグは推薦スロットにしない
      if (!def.diagnosable) continue
      const counts = diagnosis.per_subtask?.[sid] ?? { miss: 0, target: 0 }
      const materials = selectMaterials(def, inventory, ctx, usedIds)
      slots.push({
        subtaskId: sid,
        subtaskName: def.name,
        tree,
        miss: counts.miss,
        target: counts.target,
        missRate: counts.target > 0 ? counts.miss / counts.target : 0,
        materials,
        noStock: materials.length === 0,
      })
    }
  }
  return slots
}

// ── 窓②: 累積の弱点と推薦 ────────────────────────────────────────────

/**
 * ユーザーの累積カウンタ（UserSkillSubScore・217系ID）から累積弱点 top-2×2木を出し、
 * ユーザーの star 帯（演奏実績のある曲の最高star）を基準に教材を推薦する。
 */
export async function recommendCumulative(
  userId: string,
  excludeSubtask?: (subtaskId: string) => boolean
): Promise<RecommendationSlot[]> {
  const [rows, starRow] = await Promise.all([
    prisma.userSkillSubScore.findMany({
      where: { userId },
      select: { skillSubTaskId: true, matchedCount: true, totalCount: true },
    }),
    // TODO(工程D): 達成記録テーブル完成後は「達成済み曲の最高star」に置換
    prisma.performance.findFirst({
      where: { userId, score: { star: { not: null } } },
      orderBy: { score: { star: "desc" } },
      select: { score: { select: { star: true } } },
    }),
  ])
  const userStar = starRow?.score.star ?? 1

  type Cand = { def: SubtaskDef; miss: number; target: number; rate: number }
  const byTree: Record<"pitch" | "rhythm", Cand[]> = { pitch: [], rhythm: [] }
  for (const r of rows) {
    const def = SUBTASK_BY_ID[r.skillSubTaskId]
    // 旧55体系のID・診断不可(変化なし箱)・音色の木はスキップ
    if (!def || !def.diagnosable || !def.v1Active) continue
    if (def.tree !== "pitch" && def.tree !== "rhythm") continue
    if (r.totalCount < CUMULATIVE_MIN_TARGET || r.matchedCount <= 0) continue
    if (excludeSubtask?.(def.id)) continue
    byTree[def.tree].push({
      def,
      miss: r.matchedCount,
      target: r.totalCount,
      rate: r.matchedCount / r.totalCount,
    })
  }

  const inventory = await getInventory()
  const ctx: RecommendContext = {
    star: userStar,
    keyTonic: null,
    keyMode: null,
    tempo: null,
    positions: null,
  }
  const usedIds = new Set<string>()
  const slots: RecommendationSlot[] = []
  for (const tree of ["pitch", "rhythm"] as const) {
    byTree[tree].sort(
      (a, b) => b.rate - a.rate || b.miss - a.miss || a.def.id.localeCompare(b.def.id)
    )
    for (const c of byTree[tree].slice(0, 2)) {
      const materials = selectMaterials(c.def, inventory, ctx, usedIds)
      slots.push({
        subtaskId: c.def.id,
        subtaskName: c.def.name,
        tree,
        miss: c.miss,
        target: c.target,
        missRate: c.rate,
        materials,
        noStock: materials.length === 0,
      })
    }
  }
  return slots
}
