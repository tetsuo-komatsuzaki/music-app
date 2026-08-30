"use server"

import { prisma } from "@/app/_libs/prisma"
import { storageAdmin } from "@/app/_libs/storageAdmin"
import { requireAuthAction } from "@/app/_libs/requireAuth"
import { isValidCuid } from "@/app/_libs/validators"
import { evaluateRateLimit, rateLimitMessage, RECORDING_LIMIT } from "@/app/_libs/rateLimit"
import { getGradingQuota } from "@/app/_libs/plan"

// flac/wav はアプリ版ネイティブ録音用 (ARC-SPEC-NATIVE-1.0 Phase 0。wavはFLACエンコード不能時のフォールバック)
const ALLOWED_MIME = ["audio/webm", "audio/ogg", "audio/mp4", "audio/flac", "audio/wav"] as const
type AllowedMime = typeof ALLOWED_MIME[number]

const EXT_BY_MIME: Record<AllowedMime, string> = {
  "audio/webm": "webm",
  "audio/ogg":  "ogg",
  "audio/mp4":  "mp4",
  "audio/flac": "flac",
  "audio/wav":  "wav",
}

export type GetSignedUploadUrlParams =
  | { kind: "score";    scoreId: string; mimeType: string }
  | { kind: "practice"; itemId:  string; mimeType: string }

export type GetSignedUploadUrlResult =
  | { ok: true;  signedUrl: string; path: string; token: string; performanceId: string }
  | { ok: false; error: string }

/**
 * 録音アップロード用の Supabase Storage Signed Upload URL を発行する。
 *
 * フロー (v3.3 spec Commit 2):
 *   Step A: Performance (or PracticePerformance) 行を audioPath="" で先行 INSERT
 *   Step B: path 生成 (auth.uid() ベース)
 *   Step C: storageAdmin.createSignedUploadUrl(path) で URL 発行
 *   Step D: ★ audioPath を path で update して確定
 *   Step E: signedUrl + path + token + performanceId を返す
 *
 * エラー時: A〜D いずれかで失敗した場合、Performance 行を delete してロールバック。
 *
 * - 認証: requireAuthAction
 * - mimeType allowlist: audio/webm / audio/ogg / audio/mp4
 * - 所有者検証:
 *     kind='score'    → Score.createdById === dbUser.id または isShared === true、deletedAt: null
 *     kind='practice' → PracticeItem.ownerUserId === dbUser.id
 *                       または (ownerUserId === null AND isPublished === true)
 * - Path 設計 (B 採用、auth.uid() ベース):
 *     Score:    `${supabaseUserId}/${scoreId}/${performanceId}.${ext}`
 *     Practice: `practice/${supabaseUserId}/${itemId}/${performanceId}.${ext}`
 */
export async function getSignedUploadUrl(
  params: GetSignedUploadUrlParams
): Promise<GetSignedUploadUrlResult> {
  // === 1. 認証 ===
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  const dbUserId       = auth.user.dbUser.id
  const supabaseUserId = auth.user.supabaseUser.id

  // === 1.5 レート制限 (2026-08-08 P0-2: Cloud Run 解析コストの暴走/濫用の安全弁) ===
  // 直近1時間の録音時刻から瞬間的な濫用のみを弾く (実利用は無傷)。
  {
    const since = new Date(Date.now() - RECORDING_LIMIT.windowMs)
    const [perf, prac] = await Promise.all([
      prisma.performance.findMany({ where: { userId: dbUserId, createdAt: { gte: since } }, select: { createdAt: true } }),
      prisma.practicePerformance.findMany({ where: { userId: dbUserId, uploadedAt: { gte: since } }, select: { uploadedAt: true } }),
    ])
    const ts = [...perf.map((p) => p.createdAt.getTime()), ...prac.map((p) => p.uploadedAt.getTime())]
    const rl = evaluateRateLimit(ts, Date.now(), RECORDING_LIMIT)
    if (!rl.ok) return { ok: false, error: rateLimitMessage(rl) }
  }

  // === 1.5 週次採点クォータ (Phase 3・2026-08-16発動): 無料は週7回まで。
  //     UI側でもボタンを畳むが、ここが権威 (直APIやUI飛ばしを防ぐ) ===
  const quota = await getGradingQuota(dbUserId)
  if (!quota.allowed) {
    return { ok: false, error: "今週の無料採点は上限に達しました。月曜日にリセットされます" }
  }

  // === 2. mimeType allowlist (codec suffix を剥がして正規化) ===
  // 例: "audio/webm;codecs=opus" → "audio/webm"
  // 既存の convert-audio/route.ts と同じ正規化パターン
  const normalizedMime = params.mimeType.toLowerCase().split(";")[0].trim()
  if (!ALLOWED_MIME.includes(normalizedMime as AllowedMime)) {
    return { ok: false, error: `対応していないファイル形式です (${params.mimeType})` }
  }
  const ext = EXT_BY_MIME[normalizedMime as AllowedMime]

  // === 3. 所有者検証 ===
  if (params.kind === "score") {
    if (!isValidCuid(params.scoreId)) {
      return { ok: false, error: "scoreId が不正です" }
    }
    const score = await prisma.score.findFirst({
      where: { id: params.scoreId, deletedAt: null },
      select: { id: true, createdById: true, isShared: true },
    })
    // 共有スコア (isShared=true) は誰でも録音可、解析データは録音者本人のみ表示。
    // analyze_performance.py 側で Score.createdById から analysis.json path を解決する。
    if (!score || (score.createdById !== dbUserId && !score.isShared)) {
      return { ok: false, error: "Score が見つかりません" }
    }
  } else {
    if (!isValidCuid(params.itemId)) {
      return { ok: false, error: "itemId が不正です" }
    }
    const item = await prisma.practiceItem.findUnique({
      where: { id: params.itemId },
      select: { id: true, ownerUserId: true, isPublished: true },
    })
    const isOwner          = item?.ownerUserId === dbUserId
    const isPublicPublished = item?.ownerUserId === null && item?.isPublished === true
    if (!item || (!isOwner && !isPublicPublished)) {
      return { ok: false, error: "PracticeItem が見つかりません" }
    }
  }

  // === Step A: Performance 行作成 (audioPath="" で先行 INSERT) ===
  // name 自動命名: 既存の演奏数 + 1 を使って録音回数の連番 "#N" を生成
  let performanceId: string
  if (params.kind === "score") {
    const existingCount = await prisma.performance.count({
      where: { userId: dbUserId, scoreId: params.scoreId },
    })
    const performance = await prisma.performance.create({
      data: {
        userId: dbUserId,
        scoreId: params.scoreId,
        performanceType: "user",
        performanceStatus: "uploaded",
        name: `#${existingCount + 1}`,
        audioPath: "",
        analysisStatus: "queued",
      },
    })
    performanceId = performance.id
  } else {
    const existingCount = await prisma.practicePerformance.count({
      where: { userId: dbUserId, practiceItemId: params.itemId },
    })
    const performance = await prisma.practicePerformance.create({
      data: {
        userId: dbUserId,
        practiceItemId: params.itemId,
        name: `#${existingCount + 1}`,
        audioPath: "",
        analysisStatus: "queued",
      },
    })
    performanceId = performance.id
    // 報酬体系 (骨組み): 基礎練の初回録音クエスト (冪等・2回目以降は無視される)
    const { questEventHook } = await import("@/app/_libs/treasureEngine")
    await questEventHook(dbUserId, "basics_first")
  }

  // === Step B: path 生成 (auth.uid() ベース) ===
  const path = params.kind === "score"
    ? `${supabaseUserId}/${params.scoreId}/${performanceId}.${ext}`
    : `practice/${supabaseUserId}/${params.itemId}/${performanceId}.${ext}`

  // === Step C: signed upload URL 発行 ===
  const { data, error } = await storageAdmin.storage
    .from("performances")
    .createSignedUploadUrl(path)

  if (error || !data) {
    // ロールバック: Performance 行削除
    if (params.kind === "score") {
      await prisma.performance.delete({ where: { id: performanceId } })
    } else {
      await prisma.practicePerformance.delete({ where: { id: performanceId } })
    }
    return { ok: false, error: "アップロード URL の発行に失敗しました" }
  }

  // === Step D: ★ audioPath を path で update して確定 ===
  try {
    if (params.kind === "score") {
      await prisma.performance.update({
        where: { id: performanceId },
        data: { audioPath: path },
      })
    } else {
      await prisma.practicePerformance.update({
        where: { id: performanceId },
        data: { audioPath: path },
      })
    }
  } catch (e) {
    console.error("[getSignedUploadUrl] audioPath update failed:", e)
    // ロールバック: Performance 行削除 (Storage URL は TTL 切れで自動失効)
    if (params.kind === "score") {
      await prisma.performance.delete({ where: { id: performanceId } })
    } else {
      await prisma.practicePerformance.delete({ where: { id: performanceId } })
    }
    return { ok: false, error: "audioPath の確定に失敗しました" }
  }

  // === Step E: return ===
  return {
    ok: true,
    signedUrl: data.signedUrl,
    path,
    token: data.token,
    performanceId,
  }
}
