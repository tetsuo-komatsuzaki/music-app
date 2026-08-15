// 課金プラン判定 + 週次採点クォータ (2026-08-07 課金設計確定: project_pricing_plan)
//
// 設計の要点:
// - フリーミアム。無料 = AI採点 週7回 (JST月曜0時リセット・部分採点も1回)。
// - プラス扱い = Stripe サブスク (trialing/active/past_due) or 既存ユーザー猶予期間。
// - 採点無制限は「プラス」に加えて「先生接続中の生徒」(先生プランの価値の一部)。
// - Stripe が正・User テーブルは写し (webhook が plan/planStatus を書く)。
// - Phase 1 (今): ENFORCE_LIMITS=false でカウント表示のみ。Phase 3 でレジ完成後に true。

import { prisma } from "@/app/_libs/prisma"

/** 無料プランの週あたり AI 採点回数 */
export const FREE_WEEKLY_GRADINGS = 7

/** アルコプラス 月額 (税込・円) */
export const PLUS_PRICE_JPY = 980
/** アルコプラス 年額 (税込・円) = 2ヶ月分お得 */
export const PLUS_PRICE_YEARLY_JPY = 9800

/**
 * 制限の発動スイッチ (Phase 3 で true にする)。
 * false の間はカウント表示のみで、上限に達しても採点をブロックしない。
 */
export const ENFORCE_LIMITS = true // Phase 3発動 (2026-08-16 Tetsuo指示: 無料は週7回まで・8回目以降ブロック)

/**
 * 制限開始日 (Phase 3 リリース時に設定)。
 * これ以前に登録した既存ユーザーは、この日から GRACE_DAYS の間プラス扱い (移行猶予)。
 * null = まだ発動していない。
 */
export const RESTRICTION_START: Date | null = null

/** 既存ユーザーの移行猶予日数 */
export const EXISTING_USER_GRACE_DAYS = 30

const DAY_MS = 24 * 60 * 60 * 1000
const JST_OFFSET_MS = 9 * 60 * 60 * 1000

export type EffectivePlan = "plus" | "free"

/** プラス扱いになる Stripe subscription.status (past_due = 支払いリトライ中は維持) */
const PLUS_STATUSES = new Set(["trialing", "active", "past_due"])

/**
 * 今いる週の開始時刻 (JST 月曜 0:00) を UTC Date で返す。純関数。
 * 例: UTC 日曜 16:00 = JST 月曜 1:00 → その月曜 0:00 JST が週開始。
 */
export function jstWeekStart(now: Date): Date {
  const shifted = new Date(now.getTime() + JST_OFFSET_MS) // UTC getter = JST の壁時計
  const daysSinceMonday = (shifted.getUTCDay() + 6) % 7 // Mon=0 ... Sun=6
  const jstMidnight = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate())
  return new Date(jstMidnight - daysSinceMonday * DAY_MS - JST_OFFSET_MS)
}

/**
 * 課金上の実効プラン。純関数 (テスト用に restrictionStart を注入可能)。
 * - サブスクが trialing/active/past_due → plus
 * - 既存ユーザー猶予: restrictionStart 以前登録 かつ restrictionStart+30日以内 → plus
 */
export function resolveEffectivePlan(input: {
  plan: string | null
  planStatus: string | null
  createdAt: Date
  now?: Date
  restrictionStart?: Date | null
}): EffectivePlan {
  const now = input.now ?? new Date()
  const restrictionStart = input.restrictionStart === undefined ? RESTRICTION_START : input.restrictionStart

  if (input.plan === "plus" && input.planStatus != null && PLUS_STATUSES.has(input.planStatus)) {
    return "plus"
  }
  if (
    restrictionStart != null &&
    input.createdAt.getTime() < restrictionStart.getTime() &&
    now.getTime() < restrictionStart.getTime() + EXISTING_USER_GRACE_DAYS * DAY_MS
  ) {
    return "plus"
  }
  return "free"
}

export type GradingQuota = {
  /** 採点無制限か (プラス or 猶予 or 先生接続) */
  unlimited: boolean
  /** 今週 (JST月曜起点) に消費した採点回数。unlimited でも参考値として返す */
  used: number
  limit: number
  /** 今すぐ採点してよいか。ENFORCE_LIMITS=false の間は常に true */
  allowed: boolean
  plan: EffectivePlan
}

/**
 * 今週の採点消費数。曲 (部分採点含む) + 基礎練 の合算。
 * queued (録音未完・解析未起動) と error (解析失敗 = 回数を返す) は数えない。
 */
export async function countWeeklyGradings(dbUserId: string, now: Date = new Date()): Promise<number> {
  const weekStart = jstWeekStart(now)
  const consumed = { in: ["processing", "done", "retrying"] as ("processing" | "done" | "retrying")[] }
  const [scoreCount, practiceCount] = await Promise.all([
    prisma.performance.count({
      where: { userId: dbUserId, createdAt: { gte: weekStart }, analysisStatus: consumed },
    }),
    prisma.practicePerformance.count({
      where: { userId: dbUserId, uploadedAt: { gte: weekStart }, analysisStatus: consumed },
    }),
  ])
  return scoreCount + practiceCount
}

/**
 * 採点クォータの取得 (サーバー専用)。
 * Phase 1: allowed は常に true (表示のみ)。Phase 3 で ENFORCE_LIMITS=true にすると効き始める。
 */
export async function getGradingQuota(dbUserId: string, now: Date = new Date()): Promise<GradingQuota> {
  const [user, teacherLink, used] = await Promise.all([
    prisma.user.findUnique({
      where: { id: dbUserId },
      select: { plan: true, planStatus: true, createdAt: true },
    }),
    prisma.teacherStudent.findFirst({ where: { studentId: dbUserId }, select: { id: true } }),
    countWeeklyGradings(dbUserId, now),
  ])
  if (!user) {
    return { unlimited: false, used, limit: FREE_WEEKLY_GRADINGS, allowed: !ENFORCE_LIMITS, plan: "free" }
  }
  const plan = resolveEffectivePlan({ ...user, now })
  const unlimited = plan === "plus" || teacherLink != null
  const allowed = !ENFORCE_LIMITS || unlimited || used < FREE_WEEKLY_GRADINGS
  return { unlimited, used, limit: FREE_WEEKLY_GRADINGS, allowed, plan }
}
