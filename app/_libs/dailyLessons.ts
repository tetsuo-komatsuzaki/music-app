// 「毎日の基礎練」= 4教材の選定 (2026-07-25 Tetsuo確定)。
// ① 音階     : 曲と同じ調+★。同★無ければユーザー★以下で最近接。タグ一致数が最多。
// ② フィンガリング: 曲と同★(調不問)。同★無ければユーザー★以下で最近接。タグ一致数が最多。
// ③④ 推薦上位2 : 弱点推薦(音階はプール除外済)のおすすめ度上位から、未クリア(直近5回平均90点未満)を2つ。
// 表記は「項目名=カテゴリ名」のみ。ホームの曲カードと曲詳細ふりかえりで共通利用。
import { prisma } from "./prisma"
import { formatKey } from "@/app/_libs/musicNotation"
import {
  recommendForPerformance,
  type DiagnosisJson,
  type RecommendContext,
} from "./weaknessRecommendation"
import { SUBTASK_BY_ID } from "./subtaskCatalog.generated"

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
  slot: "scale" | "fingering" | "bowing" | "rec"
  category: string
  /** 項目名 = カテゴリ名 (教材名は出さない) */
  label: string
  itemId: string
  reason: string      // 出し分け理由コード
  detail: string | null  // 差し込む値(調名/奏法名など)
  // モーダルのメタ行 (2026-08-10): ★難易度 ・ 主要な調 ・ 主要なポジション
  star: number | null
  keyTonic: string | null
  keyMode: string | null
  primaryPosition: number | null
  // href はクライアント側で `/${urlUserId}/practice/${category}/${itemId}` を組む
}

const TECH_SUFFIX_LABEL: Record<string, string> = { slur: "スラー", staccato: "スタッカート", portato: "ポルタート", bow_staccato: "連続スタッカート", tremolo: "トレモロ", pizzicato: "ピチカート", spiccato: "スピッカート", ricochet: "リコシェ", trill: "トリル", mordent: "モルデント", vibrato: "ビブラート", glissando: "グリッサンド", harmonic: "ハーモニクス" }
const posBucket = (n: number): string => (n <= 2 ? "2" : n === 3 ? "3" : "4plus")

/** タグ比較用に整形した教材候補 */
type TaggedItem = {
  id: string
  star: number | null
  category: string
  techNames: string[]
  acqFeatureKeys: string[] // "category:name" (習得系のみ)
  primaryBowing: string | null
  primaryPosition: number | null
  keyTonic: string | null
  keyMode: string | null
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
  /** 主属性 (2026-08-10): ②③の照合に使う */
  primaryBowing: string | null
  primaryPosition: number | null
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
      keyTonic: true,
      keyMode: true,
      primaryBowing: true,
      primaryPosition: true,
      techniques: { select: { techniqueTag: { select: { name: true } } } },
      featureTags: { select: { featureTag: { select: { category: true, name: true, isAcquisition: true } } } },
    },
  })
  return rows.map((r) => ({
    id: r.id,
    star: r.star,
    category: r.category,
    keyTonic: r.keyTonic,
    keyMode: r.keyMode,
    primaryBowing: r.primaryBowing,
    primaryPosition: r.primaryPosition,
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

// ④ 診断おすすめ (2026-08-10): 直近3回の通し演奏を集計して固定(ピン)する。
const AGG_RECENT = 3     // 集計する通し演奏の回数
const AGG_MIN_TARGET = 3 // 合算 target がこの値未満の小課題は選抜対象外

/** 推薦スロットの subtaskId + 教材カテゴリ → ④の理由コードと差し込み値。
 *  ピン解決・再計算の両方で使う (旧④の出し分けと同一ロジック)。 */
function subtaskToReason(sid: string, category: string): { reason: string; detail: string | null } {
  if (category === "double_stop") return { reason: "rec_double", detail: null }
  if (sid.includes("_tech_")) {
    return { reason: "rec_tech", detail: TECH_SUFFIX_LABEL[sid.replace(/^(pitch|rhythm)_tech_/, "")] ?? "その奏法" }
  }
  if (sid.includes("_posshift_")) return { reason: "rec_posshift", detail: null }
  if (sid.includes("_interval_")) return { reason: "rec_interval", detail: null }
  if (sid.includes("_value_") || sid.includes("_tuplet_") || sid.includes("_entry_")) {
    return { reason: "rec_rhythm", detail: null }
  }
  return { reason: "rec_etude", detail: null }
}

/** 直近3回の通し演奏(rangeFromNote=null)の per_subtask を合算し、
 *  各tree(pitch/rhythm)のミス率上位2件(diagnosable かつ 合算target>=3)で合成 DiagnosisJson を作る。
 *  両treeとも空なら null (=④を出さない)。 */
async function buildAggregatedDiag(userId: string, scoreId: string): Promise<DiagnosisJson | null> {
  const perfs = await prisma.performance.findMany({
    where: { userId, scoreId, rangeFromNote: null },
    orderBy: { uploadedAt: "desc" },
    take: AGG_RECENT,
    select: { analysisSummary: true },
  })
  const agg: Record<string, { miss: number; target: number }> = {}
  for (const p of perfs) {
    const summary = p.analysisSummary as { diagnosis?: DiagnosisJson } | null
    const per = summary?.diagnosis?.per_subtask
    if (!per) continue
    for (const [sid, v] of Object.entries(per)) {
      if (!v) continue
      const cur = agg[sid] ?? { miss: 0, target: 0 }
      cur.miss += v.miss ?? 0
      cur.target += v.target ?? 0
      agg[sid] = cur
    }
  }
  const byTree: Record<"pitch" | "rhythm", string[]> = { pitch: [], rhythm: [] }
  for (const tree of ["pitch", "rhythm"] as const) {
    byTree[tree] = Object.entries(agg)
      .filter(([sid, v]) => {
        const def = SUBTASK_BY_ID[sid]
        return def?.diagnosable === true && def.tree === tree && v.target >= AGG_MIN_TARGET
      })
      .map(([sid, v]) => ({ sid, rate: v.miss / v.target }))
      .sort((a, b) => b.rate - a.rate || a.sid.localeCompare(b.sid))
      .slice(0, 2)
      .map((c) => c.sid)
  }
  if (byTree.pitch.length === 0 && byTree.rhythm.length === 0) return null
  return {
    version: 1,
    map_available: true,
    per_subtask: agg,
    diagnosis: { pitch: byTree.pitch, rhythm: byTree.rhythm },
  }
}

/** ② フィンガリング: 曲の主ポジション駆動 (2026-08-10)。
 *  優先: 主ポジション一致 → ★近 → 主ポジション近さ → 調一致 → id。
 *  曲が1st前提(primaryPosition=null)なら、1st前提(primaryPosition=null)の基本フィンガリングを優先。 */
async function pickFingering(score: ScoreForDaily, userStar: number): Promise<{ item: TaggedItem; reason: string; detail: string | null } | null> {
  const pool = await fetchTagged({ category: "fingering" })
  if (!pool.length) return null
  const target = score.star ?? userStar
  const wp = score.primaryPosition
  const posMatch = (p: TaggedItem) =>
    wp != null ? (p.primaryPosition === wp ? 0 : 1) : (p.primaryPosition == null ? 0 : 1)
  const item = pool.slice().sort((a, b) =>
    posMatch(a) - posMatch(b) ||
    Math.abs((a.star ?? 99) - target) - Math.abs((b.star ?? 99) - target) ||
    Math.abs((a.primaryPosition ?? 1) - (wp ?? 1)) - Math.abs((b.primaryPosition ?? 1) - (wp ?? 1)) ||
    (a.keyTonic === score.keyTonic ? 0 : 1) - (b.keyTonic === score.keyTonic ? 0 : 1) ||
    a.id.localeCompare(b.id),
  )[0]
  if (wp != null && item.primaryPosition === wp) return { item, reason: "fing_exact", detail: posBucket(wp) }
  if (wp != null && item.primaryPosition !== wp) return { item, reason: "fing_near", detail: null }
  return { item, reason: "fing_basic", detail: null }
}

/** ③ ボーイング: 曲の主弓奏法駆動 (2026-08-10)。曲に主弓奏法が無ければ出さない(null)。
 *  優先: 主弓奏法一致 → ★近 → id。在庫ゼロなら 別の弓技法(スラー由来=null除く) → ★近。無ければ null。 */
async function pickBowing(score: ScoreForDaily, userStar: number): Promise<{ item: TaggedItem; reason: string; detail: string | null } | null> {
  const wb = score.primaryBowing
  if (!wb) return null
  const pool = await fetchTagged({ category: "bowing" })
  if (!pool.length) return null
  const target = score.star ?? userStar
  const byStar = (a: TaggedItem, b: TaggedItem) =>
    Math.abs((a.star ?? 99) - target) - Math.abs((b.star ?? 99) - target) || a.id.localeCompare(b.id)
  const match = pool.filter((p) => p.primaryBowing === wb)
  if (match.length) return { item: match.sort(byStar)[0], reason: "bow_match", detail: score.primaryBowing }
  const alt = pool.filter((p) => p.primaryBowing != null && p.primaryBowing !== "スラー")
  return alt.length ? { item: alt.sort(byStar)[0], reason: "bow_alt", detail: null } : null
}

export async function selectDailyLessons(opts: {
  /** クリア判定など DB クエリに使う内部ユーザーID (dbUserId) */
  userId: string
  score: ScoreForDaily
  userStar: number
  /** ④診断の集計・ピン保存のキー */
  scoreId: string
  /** 曲マスター済みなら④(診断おすすめ)を抑制する */
  songMastered: boolean
}): Promise<DailyLesson[]> {
  const { userId, score, userStar, scoreId, songMastered } = opts
  const out: DailyLesson[] = []
  const usedIds = new Set<string>()

  const push = (
    slot: DailyLesson["slot"],
    item:
      | TaggedItem
      | { id: string; category: string; star?: number | null; keyTonic?: string | null; keyMode?: string | null; primaryPosition?: number | null }
      | null,
    reason: string,
    detail: string | null,
  ) => {
    if (!item || usedIds.has(item.id)) return
    usedIds.add(item.id)
    const meta = item as {
      star?: number | null; keyTonic?: string | null; keyMode?: string | null; primaryPosition?: number | null
    }
    out.push({
      slot,
      category: item.category,
      label: CAT_LABEL[item.category] ?? item.category,
      itemId: item.id,
      reason,
      detail,
      star: meta.star ?? null,
      keyTonic: meta.keyTonic ?? null,
      keyMode: meta.keyMode ?? null,
      primaryPosition: meta.primaryPosition ?? null,
    })
  }

  // ① 音階 (調+★)。調一致が無ければ調を緩める
  const keyWhere = score.keyTonic
    ? { keyTonic: score.keyTonic, ...(score.keyMode ? { keyMode: score.keyMode } : {}) }
    : {}
  const scaleKeyed = pickBest(await fetchTagged({ category: "scale", ...keyWhere }), score, userStar)
  if (scaleKeyed) {
    push("scale", scaleKeyed, "scale_key", formatKey(score.keyTonic, score.keyMode))
  } else {
    const scaleAny = pickBest(await fetchTagged({ category: "scale" }), score, userStar)
    push("scale", scaleAny, "scale_nokey", null)
  }

  // ② フィンガリング (曲の主ポジション駆動・2026-08-10)
  const f = await pickFingering(score, userStar)
  if (f) push("fingering", f.item, f.reason, f.detail)

  // ③ ボーイング (曲の主弓奏法駆動・常時。主弓奏法が無ければ出さない)
  const b = await pickBowing(score, userStar)
  if (b) push("bowing", b.item, b.reason, b.detail)

  // ④ 診断 (1つ): 直近3回集計の弱点に効く エチュード or 重音 のみ。未クリアを1つ。
  // 曲マスター時は抑制。ピン(userId×scoreId)で固定し、録音しても変わらない。
  // クリア/非公開・削除でピンが無効になったら削除→直近3回から再計算して新ピン保存。
  if (!songMastered) {
    const ctx: RecommendContext = {
      star: score.star,
      keyTonic: score.keyTonic,
      keyMode: score.keyMode,
      tempo: score.defaultTempo,
      positions: score.positions,
    }

    // (1) ピン解決: 未クリアの間はピンを優先表示
    let pinned = false
    const pin = await prisma.scoreRecPin.findUnique({
      where: { userId_scoreId: { userId, scoreId } },
    })
    if (pin) {
      const item = await prisma.practiceItem.findFirst({
        where: {
          id: pin.practiceItemId,
          isPublished: true,
          ownerUserId: null,
          analysisStatus: "done",
          category: { in: ["etude", "double_stop"] },
        },
        select: { id: true, category: true, star: true, keyTonic: true, keyMode: true },
      })
      if (item && !(await isMaterialCleared(userId, item.id))) {
        const { reason, detail } = subtaskToReason(pin.subtaskId ?? "", item.category)
        push("rec", { id: item.id, category: item.category, star: item.star, keyTonic: item.keyTonic, keyMode: item.keyMode }, reason, detail)
        pinned = true
      } else {
        // クリア済み or 非公開/削除 → ピンを外して再計算へ
        await prisma.scoreRecPin.delete({ where: { userId_scoreId: { userId, scoreId } } })
      }
    }

    // (2) 再計算: 直近3回集計→合成diag→推薦→最初の未クリア etude/double_stop をピン保存
    if (!pinned) {
      const aggDiag = await buildAggregatedDiag(userId, scoreId)
      if (aggDiag) {
        const slots = await recommendForPerformance(aggDiag, ctx)
        let done = false
        for (const slot of slots) {
          if (done) break
          for (const m of slot.materials) {
            if (m.category !== "etude" && m.category !== "double_stop") continue
            if (usedIds.has(m.id)) continue
            if (await isMaterialCleared(userId, m.id)) continue
            const { reason, detail } = subtaskToReason(slot.subtaskId, m.category)
            await prisma.scoreRecPin.upsert({
              where: { userId_scoreId: { userId, scoreId } },
              create: { userId, scoreId, practiceItemId: m.id, subtaskId: slot.subtaskId },
              update: { practiceItemId: m.id, subtaskId: slot.subtaskId },
            })
            push("rec", { id: m.id, category: m.category, star: m.star, keyTonic: m.keyTonic, keyMode: m.keyMode }, reason, detail)
            done = true
            break // 1つだけ
          }
        }
      }
    }
  }

  return out
}

// ── 先生カルテv3 (2026-08-11): ある生徒×曲の「毎日の基礎練」をサーバー側から取得 ──
// achievement-status route (app/api/scores/[scoreId]/achievement-status) と同じ配線。
// 生徒のホームに実際に出ている4教材と同一の結果を返す。route側の配線を変えたらここも同期。
export async function getDailyLessonsForUserScore(
  dbUserId: string, scoreId: string,
): Promise<DailyLesson[]> {
  const score = await prisma.score.findUnique({
    where: { id: scoreId },
    select: {
      star: true, keyTonic: true, keyMode: true, defaultTempo: true,
      positions: true, primaryBowing: true, primaryPosition: true,
      scoreTechniqueTags: { select: { techniqueTag: { select: { name: true } } } },
      featureTags: { select: { featureTag: { select: { category: true, name: true, isAcquisition: true } } } },
    },
  })
  if (!score) return []
  const [starProgress, achievement] = await Promise.all([
    prisma.userStarProgress.findUnique({ where: { userId: dbUserId }, select: { currentStar: true } }),
    prisma.userScoreAchievement.findUnique({
      where: { userId_scoreId: { userId: dbUserId, scoreId } },
      select: { masteredAt: true },
    }),
  ])
  return selectDailyLessons({
    userId: dbUserId,
    userStar: starProgress?.currentStar ?? score.star ?? 1,
    scoreId,
    songMastered: achievement?.masteredAt != null,
    score: {
      star: score.star, keyTonic: score.keyTonic, keyMode: score.keyMode,
      defaultTempo: score.defaultTempo,
      positions: score.positions.filter((n) => n >= 2),
      primaryBowing: score.primaryBowing, primaryPosition: score.primaryPosition,
      techNames: score.scoreTechniqueTags.map((t) => t.techniqueTag.name),
      acqFeatureKeys: score.featureTags
        .filter((f) => f.featureTag.isAcquisition)
        .map((f) => `${f.featureTag.category}:${f.featureTag.name}`),
    },
  })
}
