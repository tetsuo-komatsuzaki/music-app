// 曲の達成条件の共通評価 (2026-08-30 Tetsuo確定: 達成 = ゴールカードに表示されている
// 行がすべて✓)。行の内訳は曲ごとに変わる (レッスン=在庫のあるタグのみ / エチュード=
// 候補なしは免除 / 通し3回=常時)。
//
// 判定の正本は music-analyzer/lib/achievement.py。本ファイルは同じ式のTS実装で、
//   1. GET achievement-status (表示) と
//   2. recordAchievementIfComplete (レッスンクリアが最後の✓だった時の即時昇格)
// の両方から使う。エチュード解決・レッスン要件・通し判定を変更する時は
// achievement.py と必ず両方同期すること。

import { prisma } from "./prisma"

export const CLEAN_RUNS_REQUIRED = 3
export const STAR_UP_ACHIEVEMENTS = 10

function parsePositions(raw: string[]): number[] {
  return raw
    .map((p) => {
      const m = /^(\d+)/.exec(p)
      return m ? parseInt(m[1], 10) : null
    })
    .filter((n): n is number => n !== null)
}

export type ScoreForAchievement = {
  id: string
  star: number | null
  keyTonic: string | null
  keyMode: string | null
  defaultTempo: number | null
  positions: number[]
  primaryBowing: string | null
  primaryPosition: number | null
  scoreTechniqueTags: { techniqueTag: { name: string } }[]
  featureTags: { featureTag: { category: string; name: string; isAcquisition: boolean } }[]
}

export type ScoreAchievementState = {
  score: ScoreForAchievement
  lessons: { tagType: string; tagKey: string; cleared: boolean }[]
  etude: { required: boolean; id?: string; title?: string; achieved?: boolean }
  cleanRuns: number
  /** 表示中の全行が✓か (通し3回 + レッスン全クリア + エチュード達成or免除)。star未設定はfalse */
  allMet: boolean
}

/** ゴールカードの行 (達成条件) とその充足を計算する。scoreが無ければnull */
export async function computeScoreAchievementState(
  userId: string,
  scoreId: string,
): Promise<ScoreAchievementState | null> {
  const score = await prisma.score.findUnique({
    where: { id: scoreId },
    select: {
      id: true,
      star: true,
      keyTonic: true,
      keyMode: true,
      defaultTempo: true,
      positions: true,
      primaryBowing: true,
      primaryPosition: true,
      scoreTechniqueTags: { select: { techniqueTag: { select: { name: true } } } },
      featureTags: {
        select: { featureTag: { select: { category: true, name: true, isAcquisition: true } } },
      },
    },
  })
  if (!score) return null

  // ── レッスン在庫（公開中 category=lesson 教材のタグ集合。論点1フォールバック） ──
  const lessonItems = await prisma.practiceItem.findMany({
    where: { category: "lesson", isPublished: true },
    select: {
      positions: true,
      techniques: { select: { techniqueTag: { select: { name: true } } } },
      featureTags: {
        select: { featureTag: { select: { category: true, name: true, isAcquisition: true } } },
      },
    },
  })
  const stock = {
    technique: new Set<string>(),
    double_stop: new Set<string>(),
    position: new Set<string>(),
  }
  for (const li of lessonItems) {
    for (const t of li.techniques) stock.technique.add(t.techniqueTag.name)
    for (const f of li.featureTags) {
      if (f.featureTag.category === "double_stop" && f.featureTag.isAcquisition) {
        stock.double_stop.add(f.featureTag.name)
      }
    }
    for (const n of parsePositions(li.positions)) {
      // 6以上は "6"(=6thポジション以上) に正規化 (学びレッスン確定#8・achievement.pyと同一)
      if (n >= 2) stock.position.add(n >= 6 ? "6" : String(n))
    }
  }

  // ── 要件①: 曲のタグのうち lesson 在庫のあるものだけが要件（論点1） ──
  const required: Array<{ tagType: string; tagKey: string }> = []
  for (const t of score.scoreTechniqueTags) {
    if (stock.technique.has(t.techniqueTag.name)) {
      required.push({ tagType: "technique", tagKey: t.techniqueTag.name })
    }
  }
  for (const f of score.featureTags) {
    if (
      f.featureTag.category === "double_stop" &&
      f.featureTag.isAcquisition &&
      stock.double_stop.has(f.featureTag.name)
    ) {
      required.push({ tagType: "double_stop", tagKey: f.featureTag.name })
    }
  }
  const scorePosKeys = new Set<string>()
  for (const n of score.positions) {
    if (n >= 2) scorePosKeys.add(n >= 6 ? "6" : String(n))
  }
  for (const key of [...scorePosKeys].sort()) {
    if (stock.position.has(key)) {
      required.push({ tagType: "position", tagKey: key })
    }
  }
  // クリア判定 = UserLessonClear ∪ UserTagAcquisition(≠REVOKED) のユニオン
  // (学びレッスン確定#5・achievement.py 要件①と同一式)
  const [clears, acquisitions] = await Promise.all([
    prisma.userLessonClear.findMany({
      where: { userId },
      select: { tagType: true, tagKey: true },
    }),
    prisma.userTagAcquisition.findMany({
      where: { userId, state: { not: "REVOKED" } },
      select: { tagType: true, tagKey: true },
    }),
  ])
  const clearedSet = new Set([
    ...clears.map((c) => `${c.tagType}:${c.tagKey}`),
    ...acquisitions.map((a) => `${a.tagType}:${a.tagKey}`),
  ])
  const lessons = required.map((r) => ({
    ...r,
    cleared: clearedSet.has(`${r.tagType}:${r.tagKey}`),
  }))

  // ── 要件②: エチュード（achievement.py resolve_required_etude と同一ロジック） ──
  let etude: { required: boolean; id?: string; title?: string; achieved?: boolean } = {
    required: false,
  }
  const techNames = score.scoreTechniqueTags.map((t) => t.techniqueTag.name)
  if (score.star !== null && techNames.length > 0) {
    const candidates = await prisma.practiceItem.findMany({
      where: {
        category: "etude",
        isPublished: true,
        star: score.star,
        techniques: { some: { techniqueTag: { name: { in: techNames } } } },
      },
      select: {
        id: true,
        title: true,
        keyTonic: true,
        keyMode: true,
        tempoMin: true,
        tempoMax: true,
        techniques: { select: { techniqueTag: { select: { name: true } } } },
      },
    })
    if (candidates.length > 0) {
      const techSet = new Set(techNames)
      const ranked = candidates
        .map((c) => {
          const overlap = c.techniques.filter((t) => techSet.has(t.techniqueTag.name)).length
          const keyMatch =
            c.keyTonic === score.keyTonic && c.keyMode === score.keyMode ? 0 : 1
          let tempoDist = 999
          if (score.defaultTempo !== null && (c.tempoMin !== null || c.tempoMax !== null)) {
            const lo = c.tempoMin ?? c.tempoMax ?? score.defaultTempo
            const hi = c.tempoMax ?? c.tempoMin ?? score.defaultTempo
            tempoDist =
              score.defaultTempo >= lo && score.defaultTempo <= hi
                ? 0
                : Math.min(Math.abs(score.defaultTempo - lo), Math.abs(score.defaultTempo - hi))
          }
          return { c, overlap, keyMatch, tempoDist }
        })
        .sort(
          (a, b) =>
            b.overlap - a.overlap ||
            a.keyMatch - b.keyMatch ||
            a.tempoDist - b.tempoDist ||
            a.c.id.localeCompare(b.c.id),
        )
      const best = ranked[0].c
      const achieved = await prisma.userPracticeAchievement.findUnique({
        where: { userId_practiceItemId: { userId, practiceItemId: best.id } },
      })
      etude = { required: true, id: best.id, title: best.title, achieved: achieved !== null }
    }
  }

  // ── 要件③: 崩壊ゼロの通し演奏 累計3回（区間録音は非算入） ──
  const cleanRuns = await prisma.performance.count({
    where: {
      userId,
      scoreId,
      rangeFromNote: null,
      analysisSummary: { path: ["diagnosis", "collapse", "is_clean"], equals: true },
    },
  })

  const allMet =
    score.star !== null &&
    cleanRuns >= CLEAN_RUNS_REQUIRED &&
    lessons.every((l) => l.cleared) &&
    (!etude.required || etude.achieved === true)

  return { score, lessons, etude, cleanRuns, allMet }
}

/** 表示中の全行が✓なら達成レコードを作る (レッスンクリア等、曲演奏の解析を経ない
 *  「最後の✓」の直後に呼ぶ)。★昇格も achievement.py _check_star_up と同一式で行う。
 *  Returns 新規作成したか。既達成/未充足/star未設定は false */
export async function recordAchievementIfComplete(
  userId: string,
  scoreId: string,
): Promise<boolean> {
  const existing = await prisma.userScoreAchievement.findUnique({
    where: { userId_scoreId: { userId, scoreId } },
    select: { id: true },
  })
  if (existing) return false
  const state = await computeScoreAchievementState(userId, scoreId)
  if (!state || !state.allMet || state.score.star === null) return false

  // 達成成立 (曲演奏起点ではないので achievedPerformanceId は null =
  // コイン演出のトリガー推定が「レッスン/エチュードが最後」と判定する根拠)
  try {
    await prisma.userScoreAchievement.create({
      data: {
        userId,
        scoreId,
        starAtAchievement: state.score.star,
        achievedPerformanceId: null,
      },
    })
  } catch {
    // 同時実行でユニーク違反 → 既に作られている
    return false
  }

  // ★昇格 (同★の達成曲数≥10・上限★10)
  try {
    const progress = await prisma.userStarProgress.upsert({
      where: { userId },
      create: { userId, currentStar: 1 },
      update: {},
      select: { currentStar: true },
    })
    const count = await prisma.userScoreAchievement.count({
      where: { userId, starAtAchievement: progress.currentStar },
    })
    if (count >= STAR_UP_ACHIEVEMENTS && progress.currentStar < 10) {
      await prisma.userStarProgress.update({
        where: { userId },
        data: { currentStar: progress.currentStar + 1 },
      })
      // 報酬体系 (骨組み): 称号カードの実体刻印 (achievement.py 側と二重書込・ユニーク制約で冪等)
      const { grantRankUpTitle } = await import("./treasureEngine")
      await grantRankUpTitle(userId, progress.currentStar + 1)
    }
  } catch (e) {
    console.error("[scoreAchievement] star-up failed:", e instanceof Error ? e.message : e)
  }
  return true
}
