// ============================================================
// 報酬体系「ギャラリー」宝物エンジン (骨組み・2026-08-30 実装仕様v1.3)
//
// 責務: ①クエストクリアの刻印+宝物の同時発行 (冪等) ②カウンター評価器
// (ホーム読込時・未クリア分をまとめて判定) ③メダル (カード枚数の節目)
// ④マスター/称号の遅延発行 ⑤帰着キューの構築。
// 規則: 宝物は没収しない / 初回評価 (treasureEvaluatedAt null) は遡及=演出なしで棚へ /
// 先生ロールと退会受付中 (deletedAt) は対象外 (呼び手が保証+本体でも防御)。
// 点灯前はキルスイッチ既定OFF: REWARD_SYSTEM_LIT=1 のときだけ動く (観点10/11)。
// ============================================================

import { prisma } from "./prisma"
import {
  COUNTER_QUESTS, MEDAL_MILESTONES, QUEST_BY_ID,
  type CounterMetric, type QuestDef,
} from "./treasureCatalog"
import { LESSONS } from "@/app/[userId]/lessons/_lib/content"

/** キルスイッチ (観点11)。未設定=消灯。骨組み検証は環境変数で点ける */
export function rewardSystemLit(): boolean {
  return process.env.REWARD_SYSTEM_LIT === "1"
}

/** クエストクリア+宝物発行 (冪等)。silent=遡及: 演出なしで棚へ直行 */
export async function grantQuest(
  userId: string,
  questId: string,
  opts?: { silent?: boolean },
): Promise<boolean> {
  const q = QUEST_BY_ID.get(questId)
  if (!q) return false
  const now = new Date()
  try {
    await prisma.$transaction([
      prisma.userQuestClear.createMany({
        data: [{ userId, questId }],
        skipDuplicates: true,
      }),
      prisma.userTreasure.createMany({
        data: [{
          userId,
          kind: q.grade === "cert" ? "cert" : "card",
          sourceType: "quest",
          sourceId: questId,
          catalogNo: q.no,
          earnedAt: now,
          awardedAt: opts?.silent ? now : null,
        }],
        skipDuplicates: true,
      }),
    ])
    return true
  } catch (e) {
    console.error("[treasure] grantQuest failed:", questId, e instanceof Error ? e.message : e)
    return false
  }
}

/** イベント型のサーバーフックから呼ぶ1行API。失敗しても呼び手を止めない */
export async function questEventHook(userId: string, questId: string): Promise<void> {
  if (!rewardSystemLit()) return
  await grantQuest(userId, questId)
}

/** 行動カウントのサーバーフック (userId既知のページ/action用。カルテ閲覧など) */
export async function actionCountHook(userId: string, action: string): Promise<void> {
  if (!rewardSystemLit()) return
  try {
    await prisma.userActionCount.upsert({
      where: { userId_action: { userId, action } },
      create: { userId, action, count: 1 },
      update: { count: { increment: 1 } },
    })
  } catch (e) {
    console.error("[treasure] actionCountHook failed:", action, e instanceof Error ? e.message : e)
  }
}

// ── カウンター評価器 ─────────────────────────────────────────

type Metrics = Partial<Record<CounterMetric, number>> & { actions: Map<string, number> }

const dayMs = 86400_000

/** JSTの日付文字列 */
function jstDate(d: Date): string {
  return new Date(d.getTime() + 9 * 3600_000).toISOString().slice(0, 10)
}

/** 練習日集合から streak / week5 / month20 / total_days を導出 */
function dayMetrics(dates: Set<string>): { streak: number; week5: number; week5Streak: number; month20: number; totalDays: number } {
  const days = [...dates].sort()
  const totalDays = days.length
  // streak: 今日または昨日から遡る連続日数
  const todayJst = jstDate(new Date())
  const yesterdayJst = jstDate(new Date(Date.now() - dayMs))
  let streak = 0
  if (dates.has(todayJst) || dates.has(yesterdayJst)) {
    let cur = dates.has(todayJst) ? todayJst : yesterdayJst
    while (dates.has(cur)) {
      streak++
      cur = jstDate(new Date(new Date(cur + "T00:00:00Z").getTime() - dayMs + 12 * 3600_000))
    }
  }
  // 週 (月曜起点) ごとの練習日数
  const weekCount = new Map<string, number>()
  const monthCount = new Map<string, number>()
  for (const d of days) {
    const dt = new Date(d + "T00:00:00Z")
    const dow = (dt.getUTCDay() + 6) % 7 // 月=0
    const monday = new Date(dt.getTime() - dow * dayMs).toISOString().slice(0, 10)
    weekCount.set(monday, (weekCount.get(monday) ?? 0) + 1)
    const month = d.slice(0, 7)
    monthCount.set(month, (monthCount.get(month) ?? 0) + 1)
  }
  const week5 = [...weekCount.values()].filter((n) => n >= 5).length
  // 週5日の連続週数 (最大)
  const mondays = [...weekCount.keys()].sort()
  let week5Streak = 0
  let run = 0
  let prev: string | null = null
  for (const m of mondays) {
    const ok = (weekCount.get(m) ?? 0) >= 5
    const consecutive = prev != null && new Date(m).getTime() - new Date(prev).getTime() === 7 * dayMs
    run = ok ? (consecutive && run > 0 ? run + 1 : 1) : 0
    week5Streak = Math.max(week5Streak, run)
    prev = ok ? m : null
  }
  const month20 = [...monthCount.values()].filter((n) => n >= 20).length
  return { streak, week5, week5Streak, month20, totalDays }
}

/** 未クリアのカウンター型に必要なメトリクスだけをまとめて集計する */
async function collectMetrics(userId: string, needed: Set<CounterMetric>, neededActions: Set<string>): Promise<Metrics> {
  const m: Metrics = { actions: new Map() }
  const jobs: Promise<void>[] = []

  if (needed.has("recordings")) {
    jobs.push(prisma.performance.count({ where: { userId, rangeFromNote: null } }).then((n) => { m.recordings = n }))
  }
  if (needed.has("practice_runs")) {
    jobs.push(prisma.practicePerformance.count({ where: { userId } }).then((n) => { m.practice_runs = n }))
  }
  if (needed.has("lessons_cleared") || needed.has("lessons_all")) {
    jobs.push(prisma.userLessonClear.count({ where: { userId } }).then((n) => { m.lessons_cleared = n; m.lessons_all = n }))
  }
  if (needed.has("etudes_achieved")) {
    jobs.push(prisma.userPracticeAchievement.count({
      where: { userId, practiceItem: { category: "etude" } },
    }).then((n) => { m.etudes_achieved = n }))
  }
  if (needed.has("achieved_songs") || needed.has("mastered_songs")) {
    jobs.push(prisma.userScoreAchievement.findMany({
      where: { userId }, select: { masteredAt: true },
    }).then((rows) => {
      m.achieved_songs = rows.length
      m.mastered_songs = rows.filter((r) => r.masteredAt != null).length
    }))
  }
  if (needed.has("score_total") || needed.has("score_pitch") || needed.has("score_timing") || needed.has("best_updates")) {
    jobs.push(prisma.performance.findMany({
      where: { userId, rangeFromNote: null, pitchAccuracy: { not: null }, timingAccuracy: { not: null } },
      orderBy: { uploadedAt: "asc" },
      select: { scoreId: true, pitchAccuracy: true, timingAccuracy: true },
    }).then((rows) => {
      let maxTotal = 0, maxPitch = 0, maxTiming = 0, bestUpdates = 0
      const bestBySong = new Map<string, number>()
      for (const r of rows) {
        const total = ((r.pitchAccuracy ?? 0) + (r.timingAccuracy ?? 0)) / 2
        maxTotal = Math.max(maxTotal, total)
        maxPitch = Math.max(maxPitch, r.pitchAccuracy ?? 0)
        maxTiming = Math.max(maxTiming, r.timingAccuracy ?? 0)
        if (r.scoreId) {
          const prev = bestBySong.get(r.scoreId)
          if (prev != null && total > prev) bestUpdates++
          if (prev == null || total > prev) bestBySong.set(r.scoreId, total)
        }
      }
      m.score_total = maxTotal
      m.score_pitch = maxPitch
      m.score_timing = maxTiming
      m.best_updates = bestUpdates
    }))
  }
  if (needed.has("distinct_songs")) {
    jobs.push(prisma.performance.findMany({
      where: { userId },
      distinct: ["scoreId"], select: { scoreId: true },
    }).then((rows) => { m.distinct_songs = rows.length }))
  }
  const songFlagWhere = (extra: object) => ({
    where: { userId, score: { deletedAt: null, ...extra } }, select: { id: true }, take: 1,
  })
  if (needed.has("song_minor")) {
    jobs.push(prisma.performance.findFirst(songFlagWhere({ keyMode: "minor" })).then((r) => { m.song_minor = r ? 1 : 0 }))
  }
  if (needed.has("song_fast")) {
    jobs.push(prisma.performance.findFirst(songFlagWhere({ defaultTempo: { gte: 120 } })).then((r) => { m.song_fast = r ? 1 : 0 }))
  }
  if (needed.has("song_doublestop")) {
    jobs.push(prisma.performance.findFirst(songFlagWhere({
      featureTags: { some: { featureTag: { category: "double_stop" } } },
    })).then((r) => { m.song_doublestop = r ? 1 : 0 }))
  }
  if (needed.has("song_position")) {
    jobs.push(prisma.performance.findFirst(songFlagWhere({ positions: { hasSome: [2, 3, 4, 5, 6, 7, 8, 9, 10] } })).then((r) => { m.song_position = r ? 1 : 0 }))
  }
  if (needed.has("song_star2")) {
    jobs.push(prisma.performance.findFirst(songFlagWhere({ star: 2 })).then((r) => { m.song_star2 = r ? 1 : 0 }))
  }
  if (needed.has("annotations")) {
    jobs.push(prisma.scoreAnnotation.count({ where: { userId } }).then((n) => { m.annotations = n }))
  }
  if (["streak", "week5", "week5_streak", "month20", "total_days"].some((k) => needed.has(k as CounterMetric))) {
    // 練習日の集合 (曲+基礎練の全期間。日付のみなので軽量・#1 streak90日窓問題の恒久対応)
    jobs.push(Promise.all([
      prisma.performance.findMany({ where: { userId }, select: { uploadedAt: true } }),
      prisma.practicePerformance.findMany({ where: { userId }, select: { uploadedAt: true } }),
    ]).then(([a, b]) => {
      const dates = new Set([...a, ...b].map((r) => jstDate(r.uploadedAt)))
      const d = dayMetrics(dates)
      m.streak = d.streak
      m.week5 = d.week5
      m.week5_streak = d.week5Streak
      m.month20 = d.month20
      m.total_days = d.totalDays
    }))
  }
  if (neededActions.size > 0) {
    jobs.push(prisma.userActionCount.findMany({
      where: { userId, action: { in: [...neededActions] } },
    }).then((rows) => { for (const r of rows) m.actions.set(r.action, r.count) }))
  }
  await Promise.all(jobs)
  return m
}

function metricValue(m: Metrics, q: QuestDef): number {
  const c = q.counter
  if (!c) return 0
  if (c.metric === "action") return m.actions.get(c.action ?? "") ?? 0
  return (m[c.metric] as number | undefined) ?? 0
}

function thresholdOf(q: QuestDef): number {
  if (q.counter?.metric === "lessons_all") return LESSONS.length
  return q.counter?.threshold ?? Infinity
}

/**
 * ホーム読込時の評価器。カウンター判定 → メダル → マスター/称号の遅延発行。
 * 初回 (treasureEvaluatedAt null) は遡及: すべて演出なしで棚へ。
 * Returns: 今回棚に静かに入った数 (遡及お知らせの判断材料)。
 */
export async function evaluateTreasures(userId: string): Promise<{ silentGranted: number; firstRun: boolean }> {
  if (!rewardSystemLit()) return { silentGranted: 0, firstRun: false }

  const [guideState, cleared] = await Promise.all([
    prisma.userGuideState.findUnique({ where: { userId }, select: { treasureEvaluatedAt: true } }),
    prisma.userQuestClear.findMany({ where: { userId }, select: { questId: true } }),
  ])
  const firstRun = guideState?.treasureEvaluatedAt == null
  const clearedSet = new Set(cleared.map((c) => c.questId))
  const targets = COUNTER_QUESTS.filter((q) => !clearedSet.has(q.questId))

  let silentGranted = 0
  if (targets.length > 0) {
    const needed = new Set<CounterMetric>(targets.map((q) => q.counter?.metric as CounterMetric))
    const neededActions = new Set(targets.filter((q) => q.counter?.metric === "action").map((q) => q.counter?.action as string))
    const metrics = await collectMetrics(userId, needed, neededActions)
    for (const q of targets) {
      if (metricValue(metrics, q) >= thresholdOf(q)) {
        const ok = await grantQuest(userId, q.questId, { silent: firstRun })
        if (ok && firstRun) silentGranted++
      }
    }
  }

  // メダル (カード枚数の節目)。カード=quest由来のcard宝物の枚数
  const cardCount = await prisma.userTreasure.count({ where: { userId, kind: "card" } })
  const medalTargets = MEDAL_MILESTONES.filter((n) => cardCount >= n)
  if (medalTargets.length > 0) {
    await prisma.userTreasure.createMany({
      data: medalTargets.map((n) => ({
        userId, kind: "medal", sourceType: "card_milestone", sourceId: String(n),
        awardedAt: firstRun ? new Date() : null,
      })),
      skipDuplicates: true,
    })
  }

  // マスターの遅延発行: 証明書+記念カード。backfill済み (masterCelebratedAt非null) は棚直行
  const masters = await prisma.userScoreAchievement.findMany({
    where: { userId, masteredAt: { not: null } },
    select: { scoreId: true, masteredAt: true, masterCelebratedAt: true },
  })
  if (masters.length > 0) {
    const now = new Date()
    await prisma.userTreasure.createMany({
      data: masters.flatMap((a) => {
        const silent = firstRun || a.masterCelebratedAt != null
        return [
          { userId, kind: "cert", sourceType: "master", sourceId: a.scoreId, earnedAt: a.masteredAt ?? now, awardedAt: silent ? now : null },
          { userId, kind: "master_card", sourceType: "master", sourceId: `card:${a.scoreId}`, earnedAt: a.masteredAt ?? now, awardedAt: silent ? now : null },
        ]
      }),
      skipDuplicates: true,
    })
  }

  await prisma.userGuideState.upsert({
    where: { userId },
    create: { userId, treasureEvaluatedAt: new Date() },
    update: firstRun ? { treasureEvaluatedAt: new Date() } : {},
  })
  return { silentGranted, firstRun }
}

/** ★昇格時の称号カード発行 (achievement.py 側にも同処理・ユニーク制約で冪等) */
export async function grantRankUpTitle(userId: string, newStar: number): Promise<void> {
  if (!rewardSystemLit()) return
  try {
    await prisma.userTreasure.createMany({
      data: [{ userId, kind: "title", sourceType: "rank_up", sourceId: String(newStar), awardedAt: null }],
      skipDuplicates: true,
    })
  } catch (e) {
    console.error("[treasure] grantRankUpTitle failed:", e instanceof Error ? e.message : e)
  }
}

/** 帰着キュー (授与待ちの宝物・格順: カード→称号→メダル→記念→証明書) */
const KIND_ORDER = ["card", "title", "medal", "master_card", "cert"] as const
export async function getTreasureQueue(userId: string) {
  if (!rewardSystemLit()) return []
  const rows = await prisma.userTreasure.findMany({
    where: { userId, awardedAt: null },
    orderBy: { earnedAt: "asc" },
    select: { id: true, kind: true, sourceType: true, sourceId: true, catalogNo: true },
  })
  return rows.sort((a, b) => KIND_ORDER.indexOf(a.kind as never) - KIND_ORDER.indexOf(b.kind as never))
}

/** 授与消化 (演出開始時点で全消化・コイン規則)。マスター進化の消化も同時に刻む */
export async function markTreasuresAwarded(userId: string): Promise<void> {
  const now = new Date()
  try {
    await prisma.$transaction([
      prisma.userTreasure.updateMany({ where: { userId, awardedAt: null }, data: { awardedAt: now } }),
      prisma.userScoreAchievement.updateMany({
        where: { userId, masteredAt: { not: null }, masterCelebratedAt: null },
        data: { masterCelebratedAt: now },
      }),
    ])
  } catch (e) {
    console.error("[treasure] markTreasuresAwarded failed:", e instanceof Error ? e.message : e)
  }
}
