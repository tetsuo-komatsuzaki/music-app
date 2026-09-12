// 課金プラン判定 + 採点クォータ (2026-08-07 課金設計確定: project_pricing_plan)
//
// 設計の要点 (2026-09-12 05_プラン設計 第4版に合わせて改訂):
// - **恒久的な「無料プラン」は存在しない。登録した時点でアルコプラスに入っている。**
//   その最初の 15 日だけが無料期間 (Stripe の trial_period_days) で、明けたら課金される。
//   したがって状態は 3 つ:
//     paid  = 支払いが始まっている (active / past_due) → 無制限・自分の楽譜も使える
//     trial = 無料期間中 (trialing)                    → 量に上限・自分の楽譜は不可
//     none  = まだ加入していない                        → 録音できない (ゲストと同じ)
//   このファイルの上限はすべて「無料期間中の上限」であって「無料プランの上限」ではない。
// - 差は 2 つだけ。①自分の楽譜を取り込めるか ②量の上限。
//   それ以外 (基礎練・学びレッスン・おすすめ練習・部分練習・くわしい数字・推移・カルテ・
//   比べる尺度・報酬・わざ・表現・指板ヒートマップ) は無料でも有料と同じものが出る。
// - 量の上限は「日次」。週次だと使い切った後の 6 日間が死ぬため。
// - 上限は「分」と「本数」の両方。第4版の「1 日 10 分」が分の上限そのもの。
//   実測で 1 本あたり 固定 15.28 秒 + 録音秒 × 0.093 秒 と分かったので、原価は
//   固定(本数) + 変動(分) の 2 項になる。片方だけだともう片方が野放しになる:
//   分だけ → 1 本 10 分 × 8 本 = 80 分、本数だけ → 長い録音が無制限。
//   録音秒数はクライアントが持っているので、署名付き URL の発行時に受け取る。
//   併せてサーバー側でも当日の performanceDuration を合算し、申告値の嘘を次回に反映する。
// - 基礎練は曲の枠に数えない (アプリが「次にやれ」と指示したものを罰するのは自傷)。
//   ただし完全に枠外にすると上限が上限でなくなるので、別枠を持たせる。
// - プラス扱い = Stripe サブスク (trialing/active/past_due) or 既存ユーザー猶予期間。
// - Stripe が正・User テーブルは写し (webhook が plan/planStatus を書く)。

import { prisma } from "@/app/_libs/prisma"

/**
 * 無料の 1 日あたり 曲の録音時間 (秒)。第4版の「1 日 10 分」そのもの。
 * 原価は 固定(本数) + 変動(分) の 2 項なので、本数と分の両方に上限を置く。
 * 分だけだと 1 本 10 分 × 8 本 = 80 分、本数だけだと長い録音が野放しになる。
 */
export const TRIAL_DAILY_SECONDS = 600

/** 無料の 1 日あたり 曲の採点回数。原価の固定費 (1 本 15.28 秒) を抑えるための上限 */
export const TRIAL_DAILY_GRADINGS = 8

/** 無料の 1 日あたり 基礎練・学びレッスンの採点回数 (曲とは別枠・第4版「別枠で 1 日 5 分」) */
export const TRIAL_DAILY_PRACTICE_GRADINGS = 5

/**
 * 無料期間の日数。Stripe の checkout に trial_period_days として渡す値。
 * 期間中か否かの判定は Stripe の subscription.status (trialing / active) が持つので、
 * アプリ側で createdAt から数え直さない (二重になる)。
 */
export const TRIAL_PERIOD_DAYS = 15

/** アルコプラス 月額 (税込・円) */
export const PLUS_PRICE_JPY = 980
/** アルコプラス 年額 (税込・円) = 2ヶ月分お得 */
export const PLUS_PRICE_YEARLY_JPY = 9800

/**
 * 未加入 (Stripe のサブスクが無い) の人に録音させないか。
 *
 * 恒久的な「無料プラン」は存在しないので、本来はこれが true が正。
 * **既定は false。** true にすると、まだ加入していない既存アカウント全員
 * (開発・検証用を含む) がその場で録音できなくなる。
 * 発動するときは RESTRICTION_START に日付を入れて移行の猶予を先に用意すること。
 */
export const REQUIRE_SUBSCRIPTION = false

/**
 * 無料期間中の量の上限の発動スイッチ。
 * false の間はカウント表示のみで、上限に達しても採点をブロックしない。
 */
export const ENFORCE_LIMITS = true // Phase 3発動 (2026-08-16 Tetsuo指示)

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

/** paid = 支払い中 / trial = 無料期間中 / free = 未加入 */
export type EffectivePlan = "plus" | "trial" | "free"

/** 支払いが始まっている status (past_due = 支払いリトライ中は維持) */
const PAYING_STATUSES = new Set(["active", "past_due"])

/**
 * 今いる日の開始時刻 (JST 0:00) を UTC Date で返す。純関数。
 * 例: UTC 15:30 = JST 翌 0:30 → その日の JST 0:00 が起点。
 */
export function jstDayStart(now: Date): Date {
  const shifted = new Date(now.getTime() + JST_OFFSET_MS) // UTC getter = JST の壁時計
  const jstMidnight = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate())
  return new Date(jstMidnight - JST_OFFSET_MS)
}

/**
 * 今いる週の開始時刻 (JST 月曜 0:00) を UTC Date で返す。純関数。
 * 第4版で量の上限は日次になったが、週次の集計 (シェアカード等) がまだ使うので残す。
 */
export function jstWeekStart(now: Date): Date {
  const shifted = new Date(now.getTime() + JST_OFFSET_MS)
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

  if (input.plan === "plus" && input.planStatus != null) {
    // 無料期間中 (trialing) は「加入はしているが、まだ払っていない」。
    // 量に上限をかけ、自分の楽譜は使わせない。支払いが始まったら無制限。
    if (PAYING_STATUSES.has(input.planStatus)) return "plus"
    if (input.planStatus === "trialing") return "trial"
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
  /** 今日 (JST) に消費した曲の採点回数。unlimited でも参考値として返す */
  used: number
  limit: number
  /** 今日 (JST) に消費した曲の録音秒数 */
  secondsUsed: number
  secondsLimit: number
  /** 今日 (JST) に消費した基礎練・学びレッスンの採点回数 (曲とは別枠) */
  practiceUsed: number
  practiceLimit: number
  /** 今すぐ曲を採点してよいか。ENFORCE_LIMITS=false の間は常に true */
  allowed: boolean
  /** 今すぐ基礎練を採点してよいか */
  practiceAllowed: boolean
  /** 無料期間中か (Stripe の trialing) */
  isTrial: boolean
  /** まだ加入していないか (録音できない状態) */
  needsSubscription: boolean
  plan: EffectivePlan
}

/**
 * 今日 (JST 0:00 起点) の曲の採点消費数。基礎練は数えない (別枠)。
 * queued (録音未完・解析未起動) と error (解析失敗 = 回数を返す) は数えない。
 */
export async function countDailyGradings(dbUserId: string, now: Date = new Date()): Promise<number> {
  const dayStart = jstDayStart(now)
  return prisma.performance.count({
    where: {
      userId: dbUserId,
      createdAt: { gte: dayStart },
      analysisStatus: { in: ["processing", "done", "retrying"] },
    },
  })
}

/**
 * 今日 (JST 0:00 起点) に消費した曲の録音秒数。
 * performanceDuration は解析後に埋まるため、解析待ちの録音は数えられない。
 * その分は署名付き URL 発行時のクライアント申告 (durationSec) で先に見る。
 */
export async function countDailySeconds(dbUserId: string, now: Date = new Date()): Promise<number> {
  const dayStart = jstDayStart(now)
  const r = await prisma.performance.aggregate({
    _sum: { performanceDuration: true },
    where: {
      userId: dbUserId,
      createdAt: { gte: dayStart },
      analysisStatus: { in: ["processing", "done", "retrying"] },
    },
  })
  return Math.round(r._sum.performanceDuration ?? 0)
}

/** 今日 (JST 0:00 起点) の基礎練・学びレッスンの採点消費数。曲とは別枠。 */
export async function countDailyPracticeGradings(dbUserId: string, now: Date = new Date()): Promise<number> {
  const dayStart = jstDayStart(now)
  return prisma.practicePerformance.count({
    where: {
      userId: dbUserId,
      uploadedAt: { gte: dayStart },
      analysisStatus: { in: ["processing", "done", "retrying"] },
    },
  })
}

/**
 * 採点クォータの取得 (サーバー専用)。
 * 曲と基礎練で別枠。無料期間中かどうかは Stripe の status が正 (resolveEffectivePlan)。
 */
export async function getGradingQuota(dbUserId: string, now: Date = new Date()): Promise<GradingQuota> {
  const [user, teacherLink, used, secondsUsed, practiceUsed] = await Promise.all([
    prisma.user.findUnique({
      where: { id: dbUserId },
      select: { plan: true, planStatus: true, createdAt: true },
    }),
    // 先生接続中の生徒は無制限 (先生プランの価値の一部)。
    // 注意: 先生機能をサービスインする日に必ず見直す。放置すると最大の原価漏れになる。
    prisma.teacherStudent.findFirst({ where: { studentId: dbUserId }, select: { id: true } }),
    countDailyGradings(dbUserId, now),
    countDailySeconds(dbUserId, now),
    countDailyPracticeGradings(dbUserId, now),
  ])

  const base = {
    used,
    limit: TRIAL_DAILY_GRADINGS,
    secondsUsed,
    secondsLimit: TRIAL_DAILY_SECONDS,
    practiceUsed,
    practiceLimit: TRIAL_DAILY_PRACTICE_GRADINGS,
  }

  if (!user) {
    return {
      ...base,
      unlimited: false,
      allowed: !ENFORCE_LIMITS,
      practiceAllowed: !ENFORCE_LIMITS,
      isTrial: false,
      needsSubscription: REQUIRE_SUBSCRIPTION,
      plan: "free",
    }
  }

  const plan = resolveEffectivePlan({ ...user, now })
  // 先生接続中の生徒は無制限 (先生プランの価値の一部)。先生機能の公開時に必ず見直す
  const unlimited = plan === "plus" || teacherLink != null
  const isTrial = plan === "trial"
  const needsSubscription = REQUIRE_SUBSCRIPTION && plan === "free" && teacherLink == null

  return {
    ...base,
    unlimited,
    isTrial,
    needsSubscription,
    // 支払い中は無制限。無料期間中は本数と分の両方を満たしたときだけ通す。未加入は通さない
    allowed:
      !ENFORCE_LIMITS ||
      (unlimited
        ? true
        : !needsSubscription && used < TRIAL_DAILY_GRADINGS && secondsUsed < TRIAL_DAILY_SECONDS),
    practiceAllowed:
      !ENFORCE_LIMITS ||
      (unlimited ? true : !needsSubscription && practiceUsed < TRIAL_DAILY_PRACTICE_GRADINGS),
    plan,
  }
}
