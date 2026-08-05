// 表現→合う曲 (2026-08-04): サーバー側の実行部。
// - ensureExprFeatures: 未計算の曲だけ analysis.json を読んで特徴量を計算し Score.exprFeatures に保存
//   (オンデマンドキャッシュ方式。バックフィルは scripts/backfill_expr_features.ts が同関数を使う)
// - matchSongsForExpr: 表現タグ×ユーザー★で「合う曲」top N を返す
import { prisma } from "@/app/_libs/prisma"
import { storageAdmin } from "@/app/_libs/storageAdmin"
import type { SymbolSourceAnalysis } from "@/app/_libs/scoreSymbols"
import {
  computeExprFeatures, rankSongsForExpr, percentileThreshold, EXPR_AXES, type ExprFeatures,
} from "@/app/_libs/exprSongFeatures"

const FEATURE_VERSION = 2

type ScoreRow = {
  id: string
  title: string
  createdById: string
  defaultTempo: number | null
  exprFeatures: unknown
}

function hasCurrentFeatures(v: unknown): v is ExprFeatures {
  return !!v && typeof v === "object" && (v as { v?: number }).v === FEATURE_VERSION
}

/** 未計算 (または旧版) の曲だけ analysis.json から特徴量を計算して保存。失敗した曲はスキップ (次回また試す) */
export async function ensureExprFeatures(rows: ScoreRow[]): Promise<Map<string, ExprFeatures>> {
  const out = new Map<string, ExprFeatures>()
  const todo: ScoreRow[] = []
  for (const r of rows) {
    if (hasCurrentFeatures(r.exprFeatures)) out.set(r.id, r.exprFeatures)
    else todo.push(r)
  }
  // 1リクエストで計算するのは最大12曲 (合う曲の候補数程度。重い初回はバックフィルが担う)
  for (const r of todo.slice(0, 12)) {
    try {
      const signed = await storageAdmin.storage
        .from("musicxml")
        .createSignedUrl(`${r.createdById}/${r.id}/analysis.json`, 60)
      const url = signed.data?.signedUrl
      if (!url) continue
      const res = await fetch(url)
      if (!res.ok) continue
      const analysis = (await res.json()) as SymbolSourceAnalysis
      if (!Array.isArray(analysis?.notes) || analysis.notes.length === 0) continue
      const f = computeExprFeatures(analysis)
      await prisma.score.update({ where: { id: r.id }, data: { exprFeatures: f } })
      out.set(r.id, f)
    } catch (e) {
      console.error("[exprFeatures] compute failed:", r.id, e)
    }
  }
  return out
}

export type ExprSongMatch = { id: string; title: string; star: number | null; cover: string | null; score: number }

/** 表現タグに合う曲 top N (相対順位: カタログ全曲の上位5%のみ・ユーザーの★±1帯から)。未対応語彙は null (=準備中表示) */
export async function matchSongsForExpr(tagId: string, userStar: number, take = 3): Promise<ExprSongMatch[] | null> {
  if (!EXPR_AXES[tagId]) return null // 削除済み旧語彙/自由入力 → 準備中表示
  // しきい値はカタログ全曲で決める (上位5%)。★帯で絞るのは候補側だけ
  const rows = await prisma.score.findMany({
    where: { ownerScope: "admin", isShared: true, deletedAt: null, analysisStatus: "done" },
    orderBy: [{ star: "asc" }, { createdAt: "asc" }],
    select: {
      id: true, title: true, createdById: true, defaultTempo: true, exprFeatures: true,
      star: true, coverImagePath: true, groupId: true,
    },
  })
  // 同一グループの変種は1つに集約
  const seen = new Set<string>()
  const unique = rows.filter((r) => {
    const key = r.groupId ?? r.id
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const features = await ensureExprFeatures(unique)
  const axis = EXPR_AXES[tagId].axis
  const threshold = percentileThreshold(
    unique.filter((r) => features.has(r.id)).map((r) => axis(features.get(r.id)!)),
  )

  // 候補 = ユーザーの★±1帯のみ (しきい値は全カタログ基準)
  const band = unique.filter((r) => {
    const st = r.star ?? 1
    return st >= Math.max(1, userStar - 1) && st <= userStar + 1 && features.has(r.id)
  })
  const ranked = rankSongsForExpr(
    tagId,
    band.map((r) => ({ id: r.id, title: r.title, features: features.get(r.id)! })),
    threshold,
  )
  // 空配列 = 対応語彙だが今の★帯に上位5%の曲が無い (正直に「見つからず」表示)
  const byId = new Map(unique.map((r) => [r.id, r]))
  return ranked.slice(0, take).map((m) => {
    const r = byId.get(m.id)!
    return { id: m.id, title: m.title, star: r.star ?? null, cover: r.coverImagePath ?? null, score: m.value }
  })
}
