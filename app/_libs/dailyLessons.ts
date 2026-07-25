// 「毎日の基礎練」= 4教材の選定 (2026-07-25 Tetsuo確定)。
// ① 音階     : 曲と同じ調+★。同★無ければユーザー★以下で最近接。タグ一致数が最多。
// ② フィンガリング: 曲と同★(調不問)。同★無ければユーザー★以下で最近接。タグ一致数が最多。
// ③④ 推薦上位2 : 弱点推薦(音階はプール除外済)のおすすめ度上位から、未クリア(直近5回平均90点未満)を2つ。
// 表記は「項目名=カテゴリ名」のみ。ホームの曲カードと曲詳細ふりかえりで共通利用。
import { prisma } from "./prisma"
import {
  recommendForPerformance,
  type DiagnosisJson,
  type RecommendContext,
} from "./weaknessRecommendation"

const MASTER_RECENT = 5
const MASTER_AVG = 90

const CAT_LABEL: Record<string, string> = {
  scale: "音階",
  arpeggio: "アルペジオ",
  etude: "エチュード",
  fingering: "フィンガリング",
  bowing: "ボウイング",
  position_shift: "ポジション移動",
  double_stop: "重音",
  lesson: "学びレッスン",
}

export type DailyLesson = {
  slot: "scale" | "fingering" | "rec"
  category: string
  /** 項目名 = カテゴリ名 (教材名は出さない) */
  label: string
  itemId: string
  // href はクライアント側で `/${urlUserId}/practice/${category}/${itemId}` を組む
}

/** タグ比較用に整形した教材候補 */
type TaggedItem = {
  id: string
  star: number | null
  category: string
  techNames: string[]
  acqFeatureKeys: string[] // "category:name" (習得系のみ)
}

/** 選定に必要な曲情報 (achievement-status route が渡す) */
export type ScoreForDaily = {
  star: number | null
  keyTonic: string | null
  keyMode: string | null
  defaultTempo: number | null
  positions: number[]
  techNames: string[]
  acqFeatureKeys: string[]
}

function overlapCount(item: TaggedItem, piece: ScoreForDaily): number {
  const t = new Set(piece.techNames)
  const f = new Set(piece.acqFeatureKeys)
  let n = 0
  for (const x of item.techNames) if (t.has(x)) n++
  for (const x of item.acqFeatureKeys) if (f.has(x)) n++
  return n
}

/** 難易度(★)で候補群を絞る: 同★ → 無ければユーザー★以下で一番近い(最大)★ → 最終的に最低★ */
function pickStarGroup(items: TaggedItem[], pieceStar: number | null, userStar: number): TaggedItem[] {
  if (pieceStar != null) {
    const same = items.filter((i) => i.star === pieceStar)
    if (same.length) return same
  }
  const below = items.filter((i) => i.star != null && (i.star as number) <= userStar)
  if (below.length) {
    const maxStar = Math.max(...below.map((i) => i.star as number))
    return below.filter((i) => i.star === maxStar)
  }
  const withStar = items.filter((i) => i.star != null)
  if (withStar.length) {
    const minStar = Math.min(...withStar.map((i) => i.star as number))
    return withStar.filter((i) => i.star === minStar)
  }
  return items
}

/** 群の中からタグ一致数が最多 → ★が近い → id で1つ選ぶ */
function pickBest(items: TaggedItem[], piece: ScoreForDaily, userStar: number): TaggedItem | null {
  const group = pickStarGroup(items, piece.star, userStar)
  if (!group.length) return null
  const target = piece.star ?? userStar
  return group.slice().sort((a, b) =>
    overlapCount(b, piece) - overlapCount(a, piece) ||
    Math.abs((a.star ?? 99) - target) - Math.abs((b.star ?? 99) - target) ||
    a.id.localeCompare(b.id),
  )[0]
}

async function fetchTagged(where: Record<string, unknown>): Promise<TaggedItem[]> {
  const rows = await prisma.practiceItem.findMany({
    where: { isPublished: true, ownerUserId: null, analysisStatus: "done", ...where },
    select: {
      id: true,
      star: true,
      category: true,
      techniques: { select: { techniqueTag: { select: { name: true } } } },
      featureTags: { select: { featureTag: { select: { category: true, name: true, isAcquisition: true } } } },
    },
  })
  return rows.map((r) => ({
    id: r.id,
    star: r.star,
    category: r.category,
    techNames: r.techniques.map((t) => t.techniqueTag.name),
    acqFeatureKeys: r.featureTags
      .filter((f) => f.featureTag.isAcquisition)
      .map((f) => `${f.featureTag.category}:${f.featureTag.name}`),
  }))
}

/** その教材が「クリア」= 直近5回の演奏スコア平均90点以上か */
async function isMaterialCleared(userId: string, itemId: string): Promise<boolean> {
  const recent = await prisma.practicePerformance.findMany({
    where: { userId, practiceItemId: itemId, pitchAccuracy: { not: null }, timingAccuracy: { not: null } },
    orderBy: { uploadedAt: "desc" },
    take: MASTER_RECENT,
    select: { pitchAccuracy: true, timingAccuracy: true },
  })
  if (recent.length < MASTER_RECENT) return false
  const avg = recent.reduce((s, p) => s + (((p.pitchAccuracy ?? 0) + (p.timingAccuracy ?? 0)) / 2), 0) / recent.length
  return avg >= MASTER_AVG
}

export async function selectDailyLessons(opts: {
  /** クリア判定など DB クエリに使う内部ユーザーID (dbUserId) */
  userId: string
  score: ScoreForDaily
  userStar: number
  latestPerformanceId: string | null
}): Promise<DailyLesson[]> {
  const { userId, score, userStar, latestPerformanceId } = opts
  const out: DailyLesson[] = []
  const usedIds = new Set<string>()

  const push = (slot: DailyLesson["slot"], item: TaggedItem | { id: string; category: string } | null) => {
    if (!item || usedIds.has(item.id)) return
    usedIds.add(item.id)
    out.push({
      slot,
      category: item.category,
      label: CAT_LABEL[item.category] ?? item.category,
      itemId: item.id,
    })
  }

  // ① 音階 (調+★)。調一致が無ければ調を緩める
  const keyWhere = score.keyTonic
    ? { keyTonic: score.keyTonic, ...(score.keyMode ? { keyMode: score.keyMode } : {}) }
    : {}
  let scale = pickBest(await fetchTagged({ category: "scale", ...keyWhere }), score, userStar)
  if (!scale) scale = pickBest(await fetchTagged({ category: "scale" }), score, userStar)
  push("scale", scale)

  // ② フィンガリング (★のみ)
  push("fingering", pickBest(await fetchTagged({ category: "fingering" }), score, userStar))

  // ③④ 推薦上位2 (音階はプール除外済み・未クリアを上位から2つ)
  if (latestPerformanceId) {
    const perf = await prisma.performance.findUnique({
      where: { id: latestPerformanceId },
      select: { analysisSummary: true },
    })
    const summary = perf?.analysisSummary as { diagnosis?: DiagnosisJson } | null
    const diag = summary?.diagnosis
    if (diag?.diagnosis) {
      const ctx: RecommendContext = {
        star: score.star,
        keyTonic: score.keyTonic,
        keyMode: score.keyMode,
        tempo: score.defaultTempo,
        positions: score.positions,
      }
      const slots = await recommendForPerformance(diag, ctx)
      // おすすめ度順 = スロット順(弱点の重い順) × スロット内の順位
      const flat = slots.flatMap((s) => s.materials)
      let added = 0
      for (const m of flat) {
        if (added >= 2) break
        if (usedIds.has(m.id)) continue
        if (await isMaterialCleared(userId, m.id)) continue
        push("rec", { id: m.id, category: m.category })
        added++
      }
    }
  }

  return out
}
