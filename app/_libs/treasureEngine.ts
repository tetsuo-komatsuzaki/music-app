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
  COUNTER_QUESTS, MEDAL_MILESTONES, QUESTS, QUEST_BY_ID,
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
  if (["score_total", "score_pitch", "score_timing", "best_updates", "songs_90", "songs_95", "first_take_90"]
    .some((k) => needed.has(k as CounterMetric))) {
    jobs.push(prisma.performance.findMany({
      where: { userId, rangeFromNote: null, pitchAccuracy: { not: null }, timingAccuracy: { not: null } },
      orderBy: { uploadedAt: "asc" },
      select: { scoreId: true, pitchAccuracy: true, timingAccuracy: true },
    }).then((rows) => {
      let maxTotal = 0, maxPitch = 0, maxTiming = 0, bestUpdates = 0
      let firstTake90 = 0
      const bestBySong = new Map<string, number>()
      for (const r of rows) {
        const total = ((r.pitchAccuracy ?? 0) + (r.timingAccuracy ?? 0)) / 2
        maxTotal = Math.max(maxTotal, total)
        maxPitch = Math.max(maxPitch, r.pitchAccuracy ?? 0)
        maxTiming = Math.max(maxTiming, r.timingAccuracy ?? 0)
        if (r.scoreId) {
          const prev = bestBySong.get(r.scoreId)
          if (prev == null && total >= 90) firstTake90 = 1
          if (prev != null && total > prev) bestUpdates++
          if (prev == null || total > prev) bestBySong.set(r.scoreId, total)
        }
      }
      m.score_total = maxTotal
      m.score_pitch = maxPitch
      m.score_timing = maxTiming
      m.best_updates = bestUpdates
      m.songs_90 = [...bestBySong.values()].filter((v) => v >= 90).length
      m.songs_95 = [...bestBySong.values()].filter((v) => v >= 95).length
      m.first_take_90 = firstTake90
    }))
  }
  if (needed.has("song_rec_max")) {
    jobs.push(prisma.performance.groupBy({
      by: ["scoreId"], where: { userId }, _count: true,
    }).then((rows) => {
      m.song_rec_max = rows.reduce((mx, r) => Math.max(mx, r._count), 0)
    }))
  }
  if (["cards_count", "medals_count", "treasures_count", "titles_count", "nintei_count", "cards_all"]
    .some((k) => needed.has(k as CounterMetric))) {
    jobs.push(prisma.userTreasure.groupBy({
      by: ["kind", "sourceType"], where: { userId }, _count: true,
    }).then((rows) => {
      const sum = (pred: (r: { kind: string; sourceType: string }) => boolean) =>
        rows.filter(pred).reduce((n, r) => n + r._count, 0)
      m.cards_count = sum((r) => r.kind === "card")
      m.medals_count = sum((r) => r.kind === "medal")
      m.titles_count = sum((r) => r.kind === "title")
      // 認定証 = クエスト由来のcert (マスター証明書は sourceType "master")
      m.nintei_count = sum((r) => r.kind === "cert" && r.sourceType === "quest")
      m.treasures_count = sum(() => true)
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
  if (["streak", "week5", "week5_streak", "month20", "total_days",
    "day_rec5", "day_both", "weekend_both", "morning_rec", "comeback", "anniversary_1y",
    "week7", "practice_streak", "day_songs_max"]
    .some((k) => needed.has(k as CounterMetric))) {
    // 練習日の集合 (曲+基礎練の全期間。日付+曲IDのみなので軽量・#1 streak90日窓問題の恒久対応)
    jobs.push(Promise.all([
      prisma.performance.findMany({ where: { userId }, select: { uploadedAt: true, scoreId: true } }),
      prisma.practicePerformance.findMany({ where: { userId }, select: { uploadedAt: true } }),
    ]).then(([a, b]) => {
      const dates = new Set([...a, ...b].map((r) => jstDate(r.uploadedAt)))
      const d = dayMetrics(dates)
      m.streak = d.streak
      m.week5 = d.week5
      m.week5_streak = d.week5Streak
      m.month20 = d.month20
      m.total_days = d.totalDays

      // ── 2026-08-31 追加分: 同じ2クエリから派生する日付系メトリクス ──
      // 1日で5回以上の録音 (曲+基礎練の合算)
      const perDay = new Map<string, number>()
      for (const r of [...a, ...b]) {
        const k = jstDate(r.uploadedAt)
        perDay.set(k, (perDay.get(k) ?? 0) + 1)
      }
      m.day_rec5 = [...perDay.values()].some((n) => n >= 5) ? 1 : 0
      // 同じ日に曲と基礎練の両方
      const songDays = new Set(a.map((r) => jstDate(r.uploadedAt)))
      m.day_both = b.some((r) => songDays.has(jstDate(r.uploadedAt))) ? 1 : 0
      // 土曜と翌日曜の両方に練習した週がある
      m.weekend_both = [...dates].some((day) => {
        const dt = new Date(day + "T00:00:00Z")
        if (dt.getUTCDay() !== 6) return false
        const sunday = new Date(dt.getTime() + dayMs).toISOString().slice(0, 10)
        return dates.has(sunday)
      }) ? 1 : 0
      // 朝5-9時 (JST) に録音した日数 (118=1日 / 130=5日)
      const morningDays = new Set<string>()
      for (const r of [...a, ...b]) {
        const h = new Date(r.uploadedAt.getTime() + 9 * 3600_000).getUTCHours()
        if (h >= 5 && h < 9) morningDays.add(jstDate(r.uploadedAt))
      }
      m.morning_rec = morningDays.size
      // 7日以上あけてからの再開 (連続する練習日の間に8日以上の間隔)
      const sorted = [...dates].sort()
      m.comeback = sorted.some((day, i) => {
        if (i === 0) return false
        const gap = (new Date(day + "T00:00:00Z").getTime() - new Date(sorted[i - 1] + "T00:00:00Z").getTime()) / dayMs
        return gap >= 8
      }) ? 1 : 0
      // はじめての録音から365日
      m.anniversary_1y = sorted.length > 0 &&
        (Date.now() + 9 * 3600_000 - new Date(sorted[0] + "T00:00:00Z").getTime()) / dayMs >= 365 ? 1 : 0
      // 週7日練習した週がある (月曜起点)
      const weekDays = new Map<string, number>()
      for (const day of dates) {
        const dt = new Date(day + "T00:00:00Z")
        const dow = (dt.getUTCDay() + 6) % 7
        const monday = new Date(dt.getTime() - dow * dayMs).toISOString().slice(0, 10)
        weekDays.set(monday, (weekDays.get(monday) ?? 0) + 1)
      }
      m.week7 = [...weekDays.values()].some((n) => n >= 7) ? 1 : 0
      // 基礎練だけの連続日数
      m.practice_streak = dayMetrics(new Set(b.map((r) => jstDate(r.uploadedAt)))).streak
      // 1日で弾いた曲数の最大 (distinct scoreId)
      const daySongs = new Map<string, Set<string>>()
      for (const r of a) {
        if (!r.scoreId) continue
        const k = jstDate(r.uploadedAt)
        if (!daySongs.has(k)) daySongs.set(k, new Set())
        daySongs.get(k)!.add(r.scoreId)
      }
      m.day_songs_max = [...daySongs.values()].reduce((mx, s2) => Math.max(mx, s2.size), 0)
    }))
  }
  if (needed.has("etude_runs")) {
    jobs.push(prisma.practicePerformance.count({
      where: { userId, practiceItem: { category: "etude" } },
    }).then((n) => { m.etude_runs = n }))
  }
  if (needed.has("scale_runs")) {
    jobs.push(prisma.practicePerformance.count({
      where: { userId, practiceItem: { category: "scale" } },
    }).then((n) => { m.scale_runs = n }))
  }
  if (needed.has("arpeggio_runs")) {
    jobs.push(prisma.practicePerformance.count({
      where: { userId, practiceItem: { category: "arpeggio" } },
    }).then((n) => { m.arpeggio_runs = n }))
  }
  if (["practice_keys", "practice_articulations", "practice_categories", "etude_distinct"]
    .some((k) => needed.has(k as CounterMetric))) {
    // 弾いたことのある基礎練教材の種類 (distinct practiceItem) から調・奏法・カテゴリの種類数を数える。
    // 奏法未指定 (null) は基本の1種と数える → 閾値2=基本以外を1つ試した時点で成立
    jobs.push(prisma.practicePerformance.findMany({
      where: { userId },
      distinct: ["practiceItemId"],
      select: { practiceItemId: true, practiceItem: { select: { keyTonic: true, keyMode: true, articulation: true, category: true } } },
    }).then((rows) => {
      m.practice_keys = new Set(rows.map((r) => `${r.practiceItem.keyTonic}:${r.practiceItem.keyMode}`)).size
      m.practice_articulations = new Set(rows.map((r) => r.practiceItem.articulation ?? "basic")).size
      m.practice_categories = new Set(rows.map((r) => r.practiceItem.category)).size
      m.etude_distinct = new Set(rows.filter((r) => r.practiceItem.category === "etude").map((r) => r.practiceItemId)).size
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
  // cards_all の実体はカード枚数 (閾値側が動的)
  if (q.counter?.metric === "cards_all") return m.cards_count ?? 0
  const c = q.counter
  if (!c) return 0
  if (c.metric === "action") return m.actions.get(c.action ?? "") ?? 0
  return (m[c.metric] as number | undefined) ?? 0
}

function thresholdOf(q: QuestDef): number {
  if (q.counter?.metric === "lessons_all") return LESSONS.length
  // カード全制覇: カード格 (認定証以外) のクエスト数 - 1 (自分のカードは達成後に出るため除く)
  if (q.counter?.metric === "cards_all") {
    return QUESTS.filter((x) => x.grade !== "cert").length - 1
  }
  return q.counter?.threshold ?? Infinity
}

/**
 * ホーム読込時の評価器。カウンター判定 → メダル → マスター/称号の遅延発行。
 * 初回 (treasureEvaluatedAt null) は遡及: すべて演出なしで棚へ。
 * Returns: 今回棚に静かに入った数 (遡及お知らせの判断材料)。
 */
export async function evaluateTreasures(userId: string): Promise<{ silentGranted: number; firstRun: boolean }> {
  if (!rewardSystemLit()) return { silentGranted: 0, firstRun: false }

  const guideState = await prisma.userGuideState.findUnique({
    where: { userId }, select: { treasureEvaluatedAt: true },
  })
  const firstRun = guideState?.treasureEvaluatedAt == null

  // ── 性能対策 (2026-08-31): 前回評価から練習・宝物・操作累計に変化がなく、
  // 24時間以内 (日付またぎ系クエストは日次で拾い直す) なら重い集計を丸ごと省く。
  // 帰着キューは呼び手が getTreasureQueue で別途読むので授与は欠けない
  const lastEval = guideState?.treasureEvaluatedAt
  if (!firstRun && lastEval && Date.now() - lastEval.getTime() < 24 * 3600_000) {
    const [p1, p2, t1, a1] = await Promise.all([
      prisma.performance.findFirst({ where: { userId, uploadedAt: { gt: lastEval } }, select: { id: true } }),
      prisma.practicePerformance.findFirst({ where: { userId, uploadedAt: { gt: lastEval } }, select: { id: true } }),
      prisma.userTreasure.findFirst({ where: { userId, earnedAt: { gt: lastEval } }, select: { id: true } }),
      prisma.userActionCount.findFirst({ where: { userId, updatedAt: { gt: lastEval } }, select: { action: true } }),
    ])
    if (!p1 && !p2 && !t1 && !a1) return { silentGranted: 0, firstRun: false }
  }

  // この後の発行 (earnedAt) より前の時刻を刻むことで、発行があった場合は次回も
  // 変化ありと判定→もう1周だけ走ってメタ系 (カード枚数等) を拾い、以後スキップに収束する
  const evalStartedAt = new Date()
  const cleared = await prisma.userQuestClear.findMany({ where: { userId }, select: { questId: true } })
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

  // 評価済み時刻を毎回刻む (性能対策のスキップ判定が参照する・評価開始時刻)
  await prisma.userGuideState.upsert({
    where: { userId },
    create: { userId, treasureEvaluatedAt: evalStartedAt },
    update: { treasureEvaluatedAt: evalStartedAt },
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
export type TreasureQueueRow = {
  id: string
  kind: string
  sourceType: string
  sourceId: string
  catalogNo: number | null
  earnedAt: Date
  /** マスター証明書の券面: 曲名 */
  label?: string
  /** マスター証明書の券面: 達成時の★ */
  stars?: number
  /** マスター証明書の券面: CERT No (獲得順の通し番号) */
  certNo?: number
}
export async function getTreasureQueue(userId: string): Promise<TreasureQueueRow[]> {
  if (!rewardSystemLit()) return []
  const rows: TreasureQueueRow[] = await prisma.userTreasure.findMany({
    where: { userId, awardedAt: null },
    orderBy: { earnedAt: "asc" },
    select: { id: true, kind: true, sourceType: true, sourceId: true, catalogNo: true, earnedAt: true },
  })

  // マスター証明書の券面情報 (曲名・★・通し番号) を解決する。
  // 通し番号は本人の全マスター証明書を earnedAt 順に並べた獲得順 (授与済み含む・欠番なし)
  const pending = rows.filter((r) => r.kind === "cert" && r.sourceType === "master")
  if (pending.length > 0) {
    try {
      const [allCerts, scores, achievements] = await Promise.all([
        prisma.userTreasure.findMany({
          where: { userId, kind: "cert", sourceType: "master" },
          orderBy: { earnedAt: "asc" },
          select: { id: true },
        }),
        prisma.score.findMany({
          where: { id: { in: pending.map((r) => r.sourceId) } },
          select: { id: true, title: true },
        }),
        prisma.userScoreAchievement.findMany({
          where: { userId, scoreId: { in: pending.map((r) => r.sourceId) } },
          select: { scoreId: true, starAtAchievement: true },
        }),
      ])
      const certNoById = new Map(allCerts.map((c, i) => [c.id, i + 1]))
      const titleByScore = new Map(scores.map((s) => [s.id, s.title]))
      const starByScore = new Map(achievements.map((a) => [a.scoreId, a.starAtAchievement]))
      for (const r of pending) {
        r.label = titleByScore.get(r.sourceId)
        r.stars = starByScore.get(r.sourceId)
        r.certNo = certNoById.get(r.id)
      }
    } catch (e) {
      // 券面情報が引けなくても授与自体は止めない (フォールバック文言で再生)
      console.error("[treasure] cert face enrich failed:", e instanceof Error ? e.message : e)
    }
  }

  return rows.sort((a, b) => KIND_ORDER.indexOf(a.kind as never) - KIND_ORDER.indexOf(b.kind as never))
}

/** ギャラリー3棚の表示データ (2026-08-31 本結線)。lit時のみホームで呼ぶ */
export type GalleryData = {
  coins: { scoreId: string; title: string; star: number; mastered: boolean }[]
  treasures: { kind: string; sourceId: string; catalogNo: number | null; earnedAt: string; label?: string }[]
}
export async function getGalleryData(userId: string): Promise<GalleryData> {
  const [achievements, treasures] = await Promise.all([
    prisma.userScoreAchievement.findMany({
      where: { userId },
      orderBy: { achievedAt: "asc" },
      select: { scoreId: true, starAtAchievement: true, masteredAt: true, score: { select: { title: true } } },
    }),
    prisma.userTreasure.findMany({
      where: { userId },
      orderBy: { earnedAt: "asc" },
      select: { kind: true, sourceType: true, sourceId: true, catalogNo: true, earnedAt: true },
    }),
  ])

  // マスター証明書 (sourceId=scoreId) と記念カード (sourceId=card:scoreId) の券面に曲名を引く
  const titleByScore = new Map(achievements.map((a) => [a.scoreId, a.score.title]))
  return {
    coins: achievements.map((a) => ({
      scoreId: a.scoreId,
      title: a.score.title,
      star: a.starAtAchievement,
      mastered: a.masteredAt != null,
    })),
    treasures: treasures.map((t) => {
      let label: string | undefined
      if (t.kind === "cert" && t.sourceType === "master") label = titleByScore.get(t.sourceId)
      if (t.kind === "master_card") label = titleByScore.get(t.sourceId.replace(/^card:/, ""))
      return { kind: t.kind, sourceId: t.sourceId, catalogNo: t.catalogNo, earnedAt: t.earnedAt.toISOString(), label }
    }),
  }
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
