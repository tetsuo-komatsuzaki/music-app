"use server"

// シェア機能 (2026-08-03): シェアカード作成。
// payload はここ(サーバー)で DB から組み立てる自己完結スナップショット —
// クライアントの数字は信用しない。公開ページ/OG画像は payload だけで描画できる。
import { NINTEI_FACES } from "@/app/_libs/treasureCatalog"
import { randomBytes } from "crypto"
import { prisma } from "@/app/_libs/prisma"
import { requireAuthAction } from "@/app/_libs/requireAuth"
import { isValidCuid } from "@/app/_libs/validators"
import {
  type ShareKind, type SharePayload, isShareKind, fmtMDJst, weekPeriodJst, dayKeyJst,
} from "@/app/_libs/shareCard"

type CreateInput = {
  kind: ShareKind
  /** master/daily の対象: master=scoreId / daily=performanceId */
  refId?: string
  /** シェア時に選んだ表示名 (省略=名前なし) */
  displayName?: string | null
}

type CreateResult = { ok: true; token: string } | { ok: false; error: string }

/** 採点済みの公式演奏 (区間録音は非算入) の where 条件 */
const SCORED = { pitchAccuracy: { not: null }, rangeFromNote: null } as const

export async function createShareCard(input: CreateInput): Promise<CreateResult> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  const dbUser = auth.user.dbUser

  if (!isShareKind(input.kind)) return { ok: false, error: "種類が不正です" }
  const displayName = (input.displayName ?? "").trim().slice(0, 20) || null

  try {
    let payload: SharePayload | null = null

    if (input.kind === "master") {
      if (!input.refId || !isValidCuid(input.refId)) return { ok: false, error: "対象が不正です" }
      const ach = await prisma.userScoreAchievement.findUnique({
        where: { userId_scoreId: { userId: dbUser.id, scoreId: input.refId } },
        select: { masteredAt: true, starAtAchievement: true, score: { select: { title: true } } },
      })
      if (!ach?.masteredAt) return { ok: false, error: "この曲はまだマスターしていません" }
      const attempts = await prisma.performance.count({
        where: { userId: dbUser.id, scoreId: input.refId, ...SCORED },
      })
      payload = { title: ach.score.title, star: ach.starAtAchievement, attempts }
    }

    if (input.kind === "rank_up") {
      const sp = await prisma.userStarProgress.findUnique({ where: { userId: dbUser.id }, select: { currentStar: true } })
      const to = sp?.currentStar ?? 1
      if (to < 2) return { ok: false, error: "まだランクアップしていません" }
      payload = { star: to, fromStar: to - 1 }
    }

    if (input.kind === "weekly") {
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 3600_000)
      const [perfs, pracs, clears] = await Promise.all([
        prisma.performance.findMany({
          where: { userId: dbUser.id, uploadedAt: { gte: weekAgo } },
          select: { uploadedAt: true },
        }),
        prisma.practicePerformance.findMany({
          where: { userId: dbUser.id, uploadedAt: { gte: weekAgo } },
          select: { uploadedAt: true },
        }),
        prisma.userLessonClear.findMany({
          where: { userId: dbUser.id, clearedAt: { gte: weekAgo } },
          select: { tagType: true, tagKey: true },
        }),
      ])
      const all = [...perfs, ...pracs]
      const days = new Set(all.map((r) => dayKeyJst(r.uploadedAt))).size
      const skills = new Set(clears.map((c) => `${c.tagType}:${c.tagKey}`)).size
      if (all.length === 0) return { ok: false, error: "今週の録音がまだありません" }
      payload = { period: weekPeriodJst(now), days, recs: all.length, skills }
    }

    if (input.kind === "daily") {
      if (!input.refId || !isValidCuid(input.refId)) return { ok: false, error: "対象が不正です" }
      const perf = await prisma.performance.findFirst({
        where: { id: input.refId, userId: dbUser.id },
        select: {
          pitchAccuracy: true, timingAccuracy: true, uploadedAt: true, scoreId: true, rangeFromNote: true,
          score: { select: { title: true } },
        },
      })
      if (!perf || perf.pitchAccuracy == null || perf.timingAccuracy == null) {
        return { ok: false, error: "採点済みの演奏が見つかりません" }
      }
      if (perf.rangeFromNote != null) return { ok: false, error: "区間録音はシェア対象外です" }
      const pitch = Math.round(perf.pitchAccuracy)
      const timing = Math.round(perf.timingAccuracy)
      const overall = Math.round((pitch + timing) / 2)
      // 自己ベスト比較: この演奏より前の公式採点の最高総合点
      const prev = await prisma.performance.findMany({
        where: {
          userId: dbUser.id, scoreId: perf.scoreId, ...SCORED,
          id: { not: input.refId }, uploadedAt: { lte: perf.uploadedAt },
        },
        select: { pitchAccuracy: true, timingAccuracy: true },
      })
      const prevBest = prev.length
        ? Math.max(...prev.map((p) => Math.round((Math.round(p.pitchAccuracy as number) + Math.round(p.timingAccuracy as number)) / 2)))
        : null
      const bestDelta = prevBest != null && overall > prevBest ? overall - prevBest : null
      payload = {
        title: perf.score.title, pitch, timing, bestDelta,
        attempts: prev.length + 1, date: fmtMDJst(perf.uploadedAt),
      }
    }

    if (input.kind === "cert") {
      // マスター証明書: マスター済みの曲のみ。番号=マスター順の通し
      if (!input.refId || !isValidCuid(input.refId)) return { ok: false, error: "対象が不正です" }
      const ach = await prisma.userScoreAchievement.findUnique({
        where: { userId_scoreId: { userId: dbUser.id, scoreId: input.refId } },
        select: { masteredAt: true, starAtAchievement: true, score: { select: { title: true } } },
      })
      if (!ach?.masteredAt) return { ok: false, error: "この曲はまだマスターしていません" }
      const masters = await prisma.userScoreAchievement.findMany({
        where: { userId: dbUser.id, masteredAt: { not: null } },
        orderBy: { masteredAt: "asc" }, select: { scoreId: true },
      })
      const certNo = masters.findIndex((m) => m.scoreId === input.refId) + 1
      payload = {
        title: ach.score.title, star: ach.starAtAchievement,
        certNo: certNo > 0 ? certNo : undefined, date: fmtMDJst(ach.masteredAt),
      }
    }

    if (input.kind === "nintei") {
      // アルコの認定証: 最難関クエストのクリアが条件。券面文言はカタログの正
      const face = input.refId ? NINTEI_FACES[input.refId] : undefined
      if (!face) return { ok: false, error: "対象が不正です" }
      const clear = await prisma.userQuestClear.findUnique({
        where: { userId_questId: { userId: dbUser.id, questId: input.refId! } },
        select: { clearedAt: true },
      })
      if (!clear) return { ok: false, error: "この認定証はまだもらっていません" }
      payload = { big: face.big, kindLine: face.kindLine, date: fmtMDJst(clear.clearedAt) }
    }


    if (!payload) return { ok: false, error: "作成できませんでした" }

    const token = randomBytes(12).toString("base64url")
    // シェア系クエストは全廃 (2026-08-31 Tetsuo指示)。フックなし
    await prisma.shareCard.create({
      data: { token, userId: dbUser.id, kind: input.kind, displayName, payload },
    })
    return { ok: true, token }
  } catch (e) {
    console.error("[shareCards] create failed:", e)
    return { ok: false, error: "作成に失敗しました。時間をおいて試してください" }
  }
}
