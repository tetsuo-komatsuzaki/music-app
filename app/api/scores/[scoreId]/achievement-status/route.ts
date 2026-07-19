// GET /api/scores/[scoreId]/achievement-status
//
// 工程D (2026-07-11) — 曲の達成/マスター進捗（新判定体系 spec§1）。
// 曲詳細「🏆 曲マスターまで」トラッカーの表示用。判定の正本は loop_engine
// (music-analyzer/lib/achievement.py) で、本APIは同じ条件を「表示用に」計算する。
// エチュード解決の決定関数は achievement.py と同一ロジック。変更時は両方同期すること。

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { requireAuthApi } from "@/app/_libs/requireAuth"

const CLEAN_RUNS_REQUIRED = 3
const MASTER_RECENT_COUNT = 5
const MASTER_AVG = 90

function parsePositions(raw: string[]): number[] {
  return raw
    .map((p) => {
      const m = /^(\d+)/.exec(p)
      return m ? parseInt(m[1], 10) : null
    })
    .filter((n): n is number => n !== null)
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ scoreId: string }> },
) {
  const { scoreId } = await params

  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  const dbUserId = auth.user.dbUser.id

  const score = await prisma.score.findUnique({
    where: { id: scoreId },
    select: {
      id: true,
      star: true,
      keyTonic: true,
      keyMode: true,
      defaultTempo: true,
      positions: true,
      scoreTechniqueTags: { select: { techniqueTag: { select: { name: true } } } },
      featureTags: {
        select: { featureTag: { select: { category: true, name: true, isAcquisition: true } } },
      },
    },
  })
  if (!score) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

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
  // (学びレッスン確定#5・achievement.py 要件①と同一式。自己申告済みユーザーに
  //  不要なレッスンを「未クリア」と出さない)
  const [clears, acquisitions] = await Promise.all([
    prisma.userLessonClear.findMany({
      where: { userId: dbUserId },
      select: { tagType: true, tagKey: true },
    }),
    prisma.userTagAcquisition.findMany({
      where: { userId: dbUserId, state: { not: "REVOKED" } },
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
        where: { userId_practiceItemId: { userId: dbUserId, practiceItemId: best.id } },
      })
      etude = { required: true, id: best.id, title: best.title, achieved: achieved !== null }
    }
  }

  // ── 要件③: 崩壊ゼロの通し演奏 累計3回（v65以降の演奏のみ diagnosis を持つ） ──
  // 区間録音(部分練習)は非算入 (rangeFromNote != null を除外)。
  const cleanRuns = await prisma.performance.count({
    where: {
      userId: dbUserId,
      scoreId,
      rangeFromNote: null,
      analysisSummary: { path: ["diagnosis", "collapse", "is_clean"], equals: true },
    },
  })

  // ── 達成/マスターの記録と直近5回平均 ──
  const achievement = await prisma.userScoreAchievement.findUnique({
    where: { userId_scoreId: { userId: dbUserId, scoreId } },
    select: { achievedAt: true, masteredAt: true },
  })
  const [recent, latestPerf, totalPerformances] = await Promise.all([
    // overallScore は bowing 依存で欠損しやすいため廃止 → 音程+リズム平均で算出 (アプリ全体と統一)。
    // Python の achievement.py マスター判定も同式に揃えてある。区間録音は非算入。
    prisma.performance.findMany({
      where: {
        userId: dbUserId, scoreId, rangeFromNote: null,
        pitchAccuracy: { not: null }, timingAccuracy: { not: null },
      },
      orderBy: { uploadedAt: "desc" },
      take: MASTER_RECENT_COUNT,
      select: { pitchAccuracy: true, timingAccuracy: true },
    }),
    // C-6b: 上達ループタブの弱点表示用 (旧loop-detail API の後継)。区間録音は非算入。
    prisma.performance.findFirst({
      where: { userId: dbUserId, scoreId, rangeFromNote: null },
      orderBy: { uploadedAt: "desc" },
      select: { id: true },
    }),
    prisma.performance.count({ where: { userId: dbUserId, scoreId, rangeFromNote: null } }),
  ])
  const recentAvg =
    recent.length > 0
      ? recent.reduce((s, p) => s + ((p.pitchAccuracy ?? 0) + (p.timingAccuracy ?? 0)) / 2, 0) / recent.length
      : null

  return NextResponse.json({
    lessons: { total: lessons.length, cleared: lessons.filter((l) => l.cleared).length, items: lessons },
    etude,
    cleanRuns: { count: Math.min(cleanRuns, CLEAN_RUNS_REQUIRED), required: CLEAN_RUNS_REQUIRED },
    achieved: achievement !== null,
    achievedAt: achievement?.achievedAt ?? null,
    mastered: achievement?.masteredAt !== null && achievement?.masteredAt !== undefined,
    masteredAt: achievement?.masteredAt ?? null,
    master: {
      recentAvg: recentAvg !== null ? Math.round(recentAvg * 10) / 10 : null,
      scoredCount: recent.length,
      requiredCount: MASTER_RECENT_COUNT,
      threshold: MASTER_AVG,
    },
    latestPerformanceId: latestPerf?.id ?? null,
    totalPerformanceCount: totalPerformances,
  })
}
