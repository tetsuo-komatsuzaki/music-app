import { prisma } from "@/app/_libs/prisma"
import { generateArcoMessage } from "@/app/_libs/arcoChan"
import { getAchievementFlags } from "@/app/_libs/achievementFlags"
import { SKILL_SUB_DEFS } from "@/app/_libs/growthKarte"
import { buildSubMap } from "@/app/_libs/growthLine"
import {
  badgeKind,
  gradeFromStar,
  STAR_UP_ACHIEVEMENTS,
} from "@/app/_libs/starProgress"
import HomeClient from "./home"

// C-6b (2026-07-11): 旧レコメンド(UserSkillTaskCard/UserGrade.progressData)経路は撤去。
// ★/グレード/バッジは新判定体系 (UserStarProgress/UserScoreAchievement) から。

export const metadata = { title: "ホーム" }

type PageProps = {
  params: Promise<{ userId: string }>
}

// JST での "YYYY-MM-DD" 文字列を返す
function toJSTDateStr(date: Date): string {
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  return jst.toISOString().split("T")[0]
}

// 連続練習日数（JST）を計算する
function calculateStreak(dates: Date[]): number {
  const uniqueDays = [...new Set(dates.map(toJSTDateStr))].sort().reverse()
  if (uniqueDays.length === 0) return 0

  const todayStr = toJSTDateStr(new Date())
  const yesterdayStr = toJSTDateStr(new Date(Date.now() - 86400000))

  let start: string
  if (uniqueDays[0] === todayStr) {
    start = todayStr
  } else if (uniqueDays[0] === yesterdayStr) {
    start = yesterdayStr
  } else {
    return 0
  }

  let streak = 0
  for (let i = 0; i < uniqueDays.length; i++) {
    const expected = toJSTDateStr(
      new Date(new Date(start + "T00:00:00+09:00").getTime() - i * 86400000)
    )
    if (uniqueDays[i] === expected) {
      streak++
    } else {
      break
    }
  }
  return streak
}

export default async function HomePage({ params }: PageProps) {
  const { userId } = await params

  const perfStart = performance.now()

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: userId },
    select: { id: true, name: true },
  })
  if (!dbUser) return <div>きみの情報が見つからなかったよ</div>
  console.log(`[PERF] home step1_dbUser: ${(performance.now() - perfStart).toFixed(0)}ms`)

  const internalUserId = dbUser.id
  // オンボーディング未完了ガードは [userId]/layout.tsx (全入口共通) に移設 (C6)

  // 今週の月曜日
  const now = new Date()
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay()
  const weekStart = new Date(now.getTime() - (dayOfWeek - 1) * 86400000)
  weekStart.setHours(0, 0, 0, 0)

  // ストリーク用（直近90日のみ取得）
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400_000)

  const perfStep2 = performance.now()
  // ── 全データを並列一括取得 ──
  const [
    practiceUploads,
    scoreUploads,
    latestPracticePerf,
    latestScorePerf,
    latestTwoScores,        // アルコちゃん改善検出用 (直近2件の overallScore)
    userStarProgress,       // C-6b: ★の現在地 (新判定体系・工程D)
    scoreAchievements,      // C-6b: 曲の達成/マスター記録 (バッジ + ★進捗 + 次曲除外)
  ] = await Promise.all([
    // ストリーク用（90日以内のみ）
    prisma.practicePerformance.findMany({
      where: { userId: internalUserId, uploadedAt: { gte: ninetyDaysAgo } },
      select: { uploadedAt: true },
      orderBy: { uploadedAt: "desc" },
    }),
    prisma.performance.findMany({
      where: { userId: internalUserId, uploadedAt: { gte: ninetyDaysAgo } },
      select: { uploadedAt: true },
      orderBy: { uploadedAt: "desc" },
    }),
    // Continue バー用 (最新練習記録)
    prisma.practicePerformance.findFirst({
      where: { userId: internalUserId },
      orderBy: { uploadedAt: "desc" },
      select: {
        uploadedAt: true,
        practiceItemId: true,
        practiceItem: { select: { id: true, title: true, category: true } },
      },
    }),
    prisma.performance.findFirst({
      where: { userId: internalUserId, score: { deletedAt: null } },
      orderBy: { uploadedAt: "desc" },
      select: {
        uploadedAt: true,
        scoreId: true,
        score: { select: { id: true, title: true, keyTonic: true, keyMode: true } },
      },
    }),
    // アルコちゃんの改善検出用 (直近 2 件、score 演奏のみ)。
    // overallScore 廃止に伴い演奏スコア(音程+リズム平均)で改善判定する。
    prisma.performance.findMany({
      where: {
        userId: internalUserId,
        pitchAccuracy: { not: null },
        timingAccuracy: { not: null },
      },
      orderBy: { uploadedAt: "desc" },
      take: 2,
      select: { pitchAccuracy: true, timingAccuracy: true },
    }),
    // C-6b (2026-07-11): ★とバッジは新判定体系 (UserStarProgress/UserScoreAchievement) から。
    // 旧 UserGrade / UserGradeProgress / UserSkillTaskCard / SongMastery は退役。
    prisma.userStarProgress.findUnique({
      where: { userId: internalUserId },
      select: { currentStar: true },
    }),
    prisma.userScoreAchievement.findMany({
      where: { userId: internalUserId },
      select: { scoreId: true, starAtAchievement: true, achievedAt: true, masteredAt: true },
    }),
  ])
  console.log(`[PERF] home step2_parallel: ${(performance.now() - perfStep2).toFixed(0)}ms`)

  // --- ストリーク ---
  const allUploadDates = [
    ...practiceUploads.map(p => p.uploadedAt),
    ...scoreUploads.map(p => p.uploadedAt),
  ].filter(Boolean) as Date[]

  const streak = calculateStreak(allUploadDates)

  // --- 今週の練習日数 ---
  const weeklyDays = new Set([
    ...practiceUploads
      .filter(p => p.uploadedAt >= weekStart)
      .map(p => toJSTDateStr(p.uploadedAt)),
    ...scoreUploads
      .filter(p => p.uploadedAt >= weekStart)
      .map(p => toJSTDateStr(p.uploadedAt)),
  ]).size

  // --- 最終練習日 (アルコちゃん挨拶生成用) ---
  const lastPracticeDate: Date | null = (() => {
    const candidates: Date[] = []
    if (latestPracticePerf?.uploadedAt) candidates.push(latestPracticePerf.uploadedAt)
    if (latestScorePerf?.uploadedAt) candidates.push(latestScorePerf.uploadedAt)
    if (candidates.length === 0) return null
    return new Date(Math.max(...candidates.map(d => d.getTime())))
  })()

  // --- アルコちゃん挨拶生成 ---
  const arcoMessage = generateArcoMessage({
    userName: dbUser.name ?? "",
    streak,
    weeklyDays,
    lastPracticeDate,
    lastOverallScore:
      latestTwoScores[0]?.pitchAccuracy != null && latestTwoScores[0]?.timingAccuracy != null
        ? Math.round((latestTwoScores[0].pitchAccuracy + latestTwoScores[0].timingAccuracy) / 2)
        : null,
    previousOverallScore:
      latestTwoScores[1]?.pitchAccuracy != null && latestTwoScores[1]?.timingAccuracy != null
        ? Math.round((latestTwoScores[1].pitchAccuracy + latestTwoScores[1].timingAccuracy) / 2)
        : null,
  })

  // --- C-6b (2026-07-11): グレード/★表示 = 新判定体系ベース ---
  // ★ = UserStarProgress、進捗 = 同★の達成曲数（10曲で次の★へ = spec§1-6）。
  // グレードは★から導出 (starProgress.ts)。
  const currentStar = userStarProgress?.currentStar ?? 1
  const achievedCountAtCurrentStar = scoreAchievements.filter(
    (a) => a.starAtAchievement === currentStar,
  ).length
  const currentGradeFromStar = gradeFromStar(currentStar)
  const gradeData = {
    currentStar,
    currentGrade: currentGradeFromStar,
    masteredSongCountAtCurrentStar: achievedCountAtCurrentStar, // 新体系では「達成」数
    gradeUpRequired: STAR_UP_ACHIEVEMENTS,
    gradeUpRemaining: Math.max(0, STAR_UP_ACHIEVEMENTS - achievedCountAtCurrentStar),
    isMaster: currentGradeFromStar === "MASTER",
    masterReachedAt: null,
  }
  console.log(`[PERF] home step3: TOTAL ${(performance.now() - perfStart).toFixed(0)}ms`)

  // --- マイランクカード: 現在★の達成曲をスタンプ化 (曲名 + ベスト演奏スコア + 達成日) ---
  const currentStarAchievements = scoreAchievements
    .filter((a) => a.starAtAchievement === currentStar)
    .sort((a, b) => (a.achievedAt?.getTime() ?? 0) - (b.achievedAt?.getTime() ?? 0))
  const rankStampIds = currentStarAchievements.map((a) => a.scoreId)
  let rankStamps: {
    scoreId: string; title: string; best: number | null; achievedAt: string | null; href: string
  }[] = []
  if (rankStampIds.length > 0) {
    const rows = await prisma.performance.findMany({
      where: {
        userId: internalUserId,
        scoreId: { in: rankStampIds },
        rangeFromNote: null,
        pitchAccuracy: { not: null },
        timingAccuracy: { not: null },
      },
      select: { scoreId: true, pitchAccuracy: true, timingAccuracy: true, score: { select: { title: true } } },
    })
    const bestByScore = new Map<string, { title: string; best: number }>()
    for (const r of rows) {
      if (r.pitchAccuracy == null || r.timingAccuracy == null || !r.score) continue
      const s = Math.round((r.pitchAccuracy + r.timingAccuracy) / 2)
      const cur = bestByScore.get(r.scoreId)
      if (!cur || s > cur.best) bestByScore.set(r.scoreId, { title: r.score.title, best: s })
    }
    rankStamps = currentStarAchievements.map((a) => {
      const b = bestByScore.get(a.scoreId)
      return {
        scoreId: a.scoreId,
        title: b?.title ?? "この曲",
        best: b?.best ?? null,
        achievedAt: a.achievedAt ? a.achievedAt.toISOString() : null,
        href: `/${userId}/scores/${a.scoreId}`,
      }
    })
  }
  const rankCard = {
    currentStar,
    required: STAR_UP_ACHIEVEMENTS,
    achievedCount: achievedCountAtCurrentStar,
    stamps: rankStamps,
  }

  // --- 基礎練習の練習状況: 直近に練習した、かつまだクリア(マスター)していない
  //     基礎練 (PracticeItem) を横並びで提示。各カードに直近の練習日時 + 直近スコア。 ---
  const [practicePerfsForBasics, clearedMasteryRows] = await Promise.all([
    prisma.practicePerformance.findMany({
      where: { userId: internalUserId },
      orderBy: { uploadedAt: "desc" },
      take: 50,
      select: {
        practiceItemId: true,
        uploadedAt: true,
        pitchAccuracy: true,
        timingAccuracy: true,
        practiceItem: { select: { id: true, title: true, category: true } },
      },
    }),
    // C-6b: クリア判定は新体系の教材達成 (3回×崩壊ゼロ) に置換
    prisma.userPracticeAchievement.findMany({
      where: { userId: internalUserId },
      select: { practiceItemId: true },
    }),
  ])
  const clearedItemSet = new Set(clearedMasteryRows.map((m) => m.practiceItemId))
  const seenItemIds = new Set<string>()
  // 毎日の基礎練「○回/3回」用: 本日(JST)の教材別 演奏回数
  const homeTodayStr = toJSTDateStr(new Date())
  const todayCountByItem = new Map<string, number>()
  for (const p of practicePerfsForBasics) {
    if (!p.practiceItemId) continue
    if (toJSTDateStr(p.uploadedAt) === homeTodayStr) {
      todayCountByItem.set(p.practiceItemId, (todayCountByItem.get(p.practiceItemId) ?? 0) + 1)
    }
  }
  type BasicPracticeCard = {
    id: string
    title: string
    category: string
    href: string
    lastPracticedAt: string
    recentScore: number | null
    todayCount: number
  }
  const basicPracticeCards: BasicPracticeCard[] = []
  for (const p of practicePerfsForBasics) {
    if (!p.practiceItemId || !p.practiceItem) continue
    if (clearedItemSet.has(p.practiceItemId) || seenItemIds.has(p.practiceItemId)) continue
    seenItemIds.add(p.practiceItemId)
    const recentScore =
      p.pitchAccuracy != null && p.timingAccuracy != null
        ? Math.round((p.pitchAccuracy + p.timingAccuracy) / 2)
        : null
    basicPracticeCards.push({
      id: p.practiceItem.id,
      title: p.practiceItem.title,
      category: p.practiceItem.category,
      href: `/${userId}/practice/${p.practiceItem.category}/${p.practiceItem.id}`,
      lastPracticedAt: p.uploadedAt.toISOString(),
      recentScore,
      todayCount: todayCountByItem.get(p.practiceItem.id) ?? 0,
    })
    if (basicPracticeCards.length >= 24) break
  }

  // --- 直近の練習曲 (Score) + 曲別 直近平均スコア (pitch+timing の 2 軸平均) ---
  // overallScore は skill 依存で欠損しやすいため、確実に入る pitch/timing で算出。
  const recentPiecePerfs = await prisma.performance.findMany({
    where: {
      userId: internalUserId,
      score: { deletedAt: null },
      pitchAccuracy: { not: null },
      timingAccuracy: { not: null },
    },
    orderBy: { uploadedAt: "desc" },
    take: 50,
    select: {
      scoreId: true,
      pitchAccuracy: true,
      timingAccuracy: true,
      score: { select: { id: true, title: true, star: true, coverImagePath: true } },
    },
  })
  const pieceOrder: string[] = []
  const pieceData = new Map<string, { id: string; title: string; star: number | null; cover: string | null; latest: number; vals: number[] }>()
  for (const p of recentPiecePerfs) {
    if (!p.scoreId || !p.score || p.pitchAccuracy == null || p.timingAccuracy == null) continue
    const avg2 = (p.pitchAccuracy + p.timingAccuracy) / 2
    if (!pieceData.has(p.scoreId)) {
      // 最初の1件 = 最新(desc順) → 直近点
      pieceData.set(p.scoreId, { id: p.score.id, title: p.score.title, star: p.score.star, cover: p.score.coverImagePath, latest: Math.round(avg2), vals: [] })
      pieceOrder.push(p.scoreId)
    }
    const d = pieceData.get(p.scoreId)!
    if (d.vals.length < 5) d.vals.push(avg2)
  }
  // C-6b: バッジは新達成記録から (マスター ≻ 達成 ≻ なし・上位1つ = Tetsuo確定)
  const achievementByScore = new Map(scoreAchievements.map((a) => [a.scoreId, a]))
  const recentPieces = pieceOrder.slice(0, 5).map((sid) => {
    const d = pieceData.get(sid)!
    const recentAvg = d.vals.length
      ? Math.round(d.vals.reduce((s, v) => s + v, 0) / d.vals.length)
      : null
    return {
      id: d.id,
      title: d.title,
      star: d.star,
      cover: d.cover,
      latest: d.latest,
      recentAvg,
      badge: badgeKind(achievementByScore.get(d.id)),
      href: `/${userId}/scores/${d.id}`,
    }
  })

  // --- 「次の曲にチャレンジ」: ユーザーと同じ★で、まだ達成していない共有曲 (Score)。
  //     現在練習中の曲・達成済みの曲は除外。 ---
  const excludePieceIds = [
    ...new Set([
      ...recentPieces.map((p) => p.id),
      ...scoreAchievements.map((a) => a.scoreId),
    ]),
  ]
  const nextPieceScoresRaw = await prisma.score.findMany({
    where: {
      star: currentStar,
      ownerScope: "admin",
      isShared: true,
      deletedAt: null,
      ...(excludePieceIds.length ? { id: { notIn: excludePieceIds } } : {}),
    },
    orderBy: [{ createdAt: "asc" }],
    take: 16, // 重複排除前提で多めに取る
    select: { id: true, title: true, composer: true, star: true, coverImagePath: true, groupId: true },
  })
  // 同一グループ(曲)の難易度違いは1つに集約 (2026-07-26 パート/変種整合)。groupId=null は id で一意扱い。
  const seenNextGroups = new Set<string>()
  const nextPieceScores: typeof nextPieceScoresRaw = []
  for (const s of nextPieceScoresRaw) {
    const key = s.groupId ?? s.id
    if (seenNextGroups.has(key)) continue
    seenNextGroups.add(key)
    nextPieceScores.push(s)
    if (nextPieceScores.length >= 4) break
  }
  const nextPieceRecommendations = nextPieceScores.map((s) => ({
    practiceItem: {
      id: s.id,
      title: s.title,
      category: "score",
      star: s.star ?? null,
      composer: s.composer ?? null,
      cover: s.coverImagePath ?? null,
    },
    reason: `きみの★${currentStar}にちょうどいい曲だよ`,
    href: `/${userId}/scores/${s.id}`,
  }))

  // 編み込み案1 (2026-08-03): 選曲理由を成長ベースに ([[project_growth_woven_experience]])。
  // 曲のわざタグ × ユーザーの30日安定度/習得状況 →
  //   「◯◯が安定してきたから、次はこの曲」(安定度70%以上) >「新しいわざ「◯◯」に挑戦できる曲」(未習得)。
  // データが無ければ既定文言 (レベル文) のまま — でっち上げない。
  try {
    const recIds = nextPieceRecommendations.map((r) => r.practiceItem.id)
    if (recIds.length > 0) {
      const since30 = new Date(Date.now() - 30 * 864e5)
      const [tagRows, clears, acqs, perf30, prac30] = await Promise.all([
        prisma.scoreTechniqueTag.findMany({
          where: { scoreId: { in: recIds } },
          orderBy: { isPrimary: "desc" },
          select: { scoreId: true, techniqueTag: { select: { name: true } } },
        }),
        prisma.userLessonClear.findMany({
          where: { userId: internalUserId, tagType: "technique" }, select: { tagKey: true },
        }),
        prisma.userTagAcquisition.findMany({
          where: { userId: internalUserId, tagType: "technique", state: { not: "REVOKED" } }, select: { tagKey: true },
        }),
        prisma.performance.findMany({
          where: { userId: internalUserId, uploadedAt: { gte: since30 } }, select: { analysisSummary: true },
        }),
        prisma.practicePerformance.findMany({
          where: { userId: internalUserId, uploadedAt: { gte: since30 } }, select: { analysisSummary: true },
        }),
      ])
      const acquired = new Set([...clears, ...acqs].map((r) => r.tagKey))
      const sub30 = buildSubMap([...perf30, ...prac30].map((r) => r.analysisSummary))
      const pctOfTag = (name: string): number | null => {
        const def = SKILL_SUB_DEFS.find((d) => d.label === name || d.tagKeys.includes(name))
        if (!def) return null
        let miss = 0
        let target = 0
        for (const sid of def.subIds) {
          const e = sub30.get(sid)
          if (e) { miss += e.miss; target += e.target }
        }
        if (target < 8) return null // 少数サンプルで「安定」と言わない
        return (1 - miss / target) * 100
      }
      const tagsByScore = new Map<string, string[]>()
      for (const t of tagRows) {
        const arr = tagsByScore.get(t.scoreId) ?? []
        arr.push(t.techniqueTag.name)
        tagsByScore.set(t.scoreId, arr)
      }
      for (const rec of nextPieceRecommendations) {
        const names = tagsByScore.get(rec.practiceItem.id) ?? []
        let stable: { name: string; pct: number } | null = null
        let fresh: string | null = null
        for (const n of names) {
          const pct = pctOfTag(n)
          if (pct != null && pct >= 70 && (!stable || pct > stable.pct)) stable = { name: n, pct }
          if (!fresh && !acquired.has(n)) fresh = n
        }
        if (stable) rec.reason = `${stable.name}が安定してきたから、次はこの曲`
        else if (fresh) rec.reason = `新しいわざ「${fresh}」に挑戦できる曲`
      }
    }
  } catch { /* 理由の高度化に失敗しても既定文言で表示は継続 */ }

  // 旅の地図は 2026-08-02 廃案 (「まずはこれから」に転換)。計算ブロックは 2026-08-06 掃除で削除。
  // 目標曲データ (onboardingProfile.answers) はDBに保持 — 将来カルテ「あゆみ」の終点として活かす構想は残る

  // --- お気に入り (曲 Score / 教材 PracticeItem) ---
  // Favorite テーブル未マイグレーション環境でもホームが落ちないよう防御的に取得
  let favorites: { id: string; title: string; category: string; cover: string | null; href: string }[] = []
  try {
    const favoriteRows = await prisma.favorite.findMany({
      where: { userId: internalUserId },
      orderBy: { createdAt: "desc" },
      select: {
        score: { select: { id: true, title: true, coverImagePath: true, groupId: true } },
        practiceItem: { select: { id: true, title: true, category: true, coverImagePath: true, groupId: true } },
      },
    })
    // 同一グループ(曲/教材)の変種は1つに集約して表示 (2026-07-26 パート/変種整合)。groupId=null は id で一意扱い。
    const seenFavGroups = new Set<string>()
    favorites = favoriteRows.flatMap((f) => {
      if (f.score) {
        const key = `s:${f.score.groupId ?? f.score.id}`
        if (seenFavGroups.has(key)) return []
        seenFavGroups.add(key)
        return [{ id: f.score.id, title: f.score.title, category: "score", cover: f.score.coverImagePath, href: `/${userId}/scores/${f.score.id}` }]
      }
      if (f.practiceItem) {
        const key = `p:${f.practiceItem.groupId ?? f.practiceItem.id}`
        if (seenFavGroups.has(key)) return []
        seenFavGroups.add(key)
        return [{ id: f.practiceItem.id, title: f.practiceItem.title, category: f.practiceItem.category, cover: f.practiceItem.coverImagePath, href: `/${userId}/practice/${f.practiceItem.category}/${f.practiceItem.id}` }]
      }
      return []
    })
  } catch {
    favorites = []
  }

  // 先生からの宿題(未完了) + 新着サマリ — ホーム上部「先生から」用 (2026-07-28 / E追加 2026-08-01)
  let teacherAssignments: {
    id: string; kind: "score" | "practice"; teacherName: string; title: string; reps: number | null; targetTempo: number | null; comment: string | null; href: string
    dueDate: string | null; goalType: string | null; targetScore: number | null; achieved: boolean; mastered: boolean
  }[] = []
  let teacherSummary: { teacherName: string | null; unreadMessages: number; unreadKarte: number; unreadPassed: number; feedbackCount: number; unreadCelebration: boolean; recentObservations: number } | undefined
  try {
    // 先生を登録している生徒のみ「先生から」を出す (解約したら消える)
    const link = await prisma.teacherStudent.findFirst({
      where: { studentId: internalUserId },
      orderBy: { createdAt: "asc" },
      select: { teacherId: true, teacher: { select: { name: true } } },
    })
    if (link) {
      const [rows, unreadMessages, unreadKarte, unreadPassed, feedbackCount, unreadCelebrationCount, recentObservations] = await Promise.all([
        prisma.assignment.findMany({
          where: { studentId: internalUserId, doneAt: null },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true, targetMeasures: true, reps: true, targetTempo: true, comment: true,
            dueDate: true, goalType: true, targetScore: true, moodTagId: true, submittedAt: true,
            teacher: { select: { name: true } },
            score: { select: { id: true, title: true } },
            practiceItem: { select: { id: true, title: true, category: true } },
          },
        }),
        prisma.message.count({ where: { studentId: internalUserId, teacherId: link.teacherId, fromTeacher: true, readAt: null } }),
        // 練習後カルテの新着 (2026-08-11): 演奏に紐づく未読コメント
        prisma.message.count({ where: { studentId: internalUserId, teacherId: link.teacherId, fromTeacher: true, readAt: null, performanceId: { not: null } } }),
        // 宿題合格の新着 (2026-08-11)
        prisma.message.count({ where: { studentId: internalUserId, teacherId: link.teacherId, fromTeacher: true, readAt: null, kind: "hw_passed" } }),
        prisma.teacherFeedback.count({ where: { teacherId: link.teacherId, studentId: internalUserId } }),
        prisma.message.count({ where: { studentId: internalUserId, teacherId: link.teacherId, fromTeacher: true, readAt: null, kind: "celebration" } }),
        // 所見(癖)の新着: 既読概念が無いため直近7日を新着扱い (週1レッスンの起点を塞ぐ・2026-08-02)
        prisma.teacherObservation.count({
          where: { studentId: internalUserId, teacherId: link.teacherId, createdAt: { gte: new Date(Date.now() - 7 * 864e5) } },
        }),
      ])
      const homeAchFlags = await getAchievementFlags(internalUserId, rows.map((a) => a.score?.id))
      teacherAssignments = rows.map((a) => ({
        id: a.id,
        kind: (a.score ? "score" : "practice") as "score" | "practice",
        teacherName: a.teacher.name,
        title: a.score?.title ?? a.practiceItem?.title ?? "課題",
        reps: a.reps,
        targetTempo: a.targetTempo,
        comment: a.comment,
        dueDate: a.dueDate ? a.dueDate.toISOString() : null,
        goalType: a.goalType,
        targetScore: a.targetScore,
        moodTagId: a.moodTagId,
        submitted: a.submittedAt != null,
        achieved: a.score?.id ? (homeAchFlags.get(a.score.id)?.achieved ?? false) : false,
        mastered: a.score?.id ? (homeAchFlags.get(a.score.id)?.mastered ?? false) : false,
        href: a.score
          ? `/${userId}/scores/${a.score.id}`
          : a.practiceItem
            ? `/${userId}/practice/${a.practiceItem.category}/${a.practiceItem.id}`
            : `/${userId}`,
      }))
      teacherSummary = { teacherName: link.teacher.name, unreadMessages, unreadKarte, unreadPassed, feedbackCount, unreadCelebration: unreadCelebrationCount > 0, recentObservations }
    }
  } catch {
    teacherAssignments = []
    teacherSummary = undefined
  }

  // 🌟 まずはこれから (2026-08-02・旅の地図の後継): 録音0ユーザーに最初の1曲を一等地で推す。
  // 選曲=「次の曲にチャレンジ」1位の昇格 (新しい推薦ロジックは持たない)。
  let starterPick: { title: string; star: number | null; reason: string; href: string; cover: string | null } | null = null
  if (recentPieces.length === 0 && nextPieceRecommendations.length > 0) {
    const top = nextPieceRecommendations[0]
    let reason = `きみの★${currentStar}にぴったりの曲だよ`
    try {
      const tags = await prisma.scoreTechniqueTag.findMany({
        where: { scoreId: top.practiceItem.id },
        orderBy: { isPrimary: "desc" },
        take: 1,
        select: { techniqueTag: { select: { name: true } } },
      })
      if (tags[0]) reason = `${tags[0].techniqueTag.name}の練習になるよ`
    } catch { /* タグ無しでも既定文言で出す */ }
    starterPick = { title: top.practiceItem.title, star: top.practiceItem.star ?? null, reason, href: top.href, cover: top.practiceItem.cover ?? null }
  }

  // ホーム上部の解析通知 (2026-08-02): 直近24hの録音の採点状況 (採点中チップ+完了バナー)
  let analysisNotices: { id: string; status: string; scoreId: string; title: string; score: number | null }[] = []
  try {
    const rows = await prisma.performance.findMany({
      where: {
        userId: dbUser.id,
        performanceType: "user",
        createdAt: { gte: new Date(Date.now() - 24 * 3600_000) },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, analysisStatus: true, scoreId: true, pitchAccuracy: true, timingAccuracy: true, score: { select: { title: true } } },
    })
    analysisNotices = rows.map((r) => ({
      id: r.id,
      status: r.analysisStatus,
      scoreId: r.scoreId,
      title: r.score.title,
      score: r.pitchAccuracy != null && r.timingAccuracy != null ? (r.pitchAccuracy + r.timingAccuracy) / 2 : null,
    }))
  } catch {
    analysisNotices = []
  }

  // 表現の棚 (2026-08-06 案2): きみの表現(最高★の強み)が活きる曲。
  // 源泉 = UserExpressionClear(先生認定) × Score.moodTags(手動タグ)。タグ付き曲が無い間は棚ごと非表示
  let exprShelf: { tagLabel: string; star: number; items: { id: string; title: string; star: number | null; cover: string | null }[] } | null = null
  try {
    const clears = await prisma.userExpressionClear.findMany({
      where: { userId: internalUserId },
      select: { moodTagId: true, starAtClear: true },
    })
    if (clears.length > 0) {
      const best = new Map<string, number>()
      for (const c of clears) best.set(c.moodTagId, Math.max(best.get(c.moodTagId) ?? 0, c.starAtClear))
      // いちばん育っている表現を看板に
      const [topTag, topStar] = [...best.entries()].sort((a, b) => b[1] - a[1])[0]
      const songs = await prisma.score.findMany({
        where: {
          ownerScope: "admin", isShared: true, deletedAt: null,
          moodTags: { has: topTag },
          star: { gte: topStar, lte: topStar + 1 },
          ...(excludePieceIds.length ? { id: { notIn: excludePieceIds } } : {}),
        },
        orderBy: [{ star: "desc" }, { createdAt: "asc" }],
        take: 4,
        select: { id: true, title: true, star: true, coverImagePath: true },
      })
      if (songs.length > 0) {
        const { moodTagLabel } = await import("@/app/_libs/moodTags")
        exprShelf = {
          tagLabel: moodTagLabel(topTag), star: topStar,
          items: songs.map((sc) => ({ id: sc.id, title: sc.title, star: sc.star ?? null, cover: sc.coverImagePath ?? null })),
        }
      }
    }
  } catch { exprShelf = null }

  // 編み込み案4 (2026-08-03): わざ点灯の祝い (直近7日のレッスンクリア=正式習得のみ)
  let skillLits: { key: string; label: string }[] = []
  try {
    const rows = await prisma.userLessonClear.findMany({
      where: { userId: internalUserId, clearedAt: { gte: new Date(Date.now() - 7 * 864e5) } },
      orderBy: { clearedAt: "desc" },
      take: 3,
      select: { tagType: true, tagKey: true },
    })
    skillLits = rows.map((r) => ({ key: `${r.tagType}:${r.tagKey}`, label: r.tagKey }))
  } catch { skillLits = [] }

  return (
    <HomeClient
      teacherAssignments={teacherAssignments}
      teacherSummary={teacherSummary}
      analysisNotices={analysisNotices}
      skillLits={skillLits}
      exprShelf={exprShelf}
      starterPick={starterPick}
      userName={dbUser.name ?? ""}
      streak={streak}
      weeklyDays={weeklyDays}
      arcoMessage={arcoMessage}
      gradeData={gradeData}
      basicPracticeCards={basicPracticeCards}
      recentPieces={recentPieces}
      nextPieceRecommendations={nextPieceRecommendations}
      rankCard={rankCard}
      favorites={favorites}
    />
  )
}
