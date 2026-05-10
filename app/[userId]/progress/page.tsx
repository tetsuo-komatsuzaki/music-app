import { prisma } from "@/app/_libs/prisma"
import {
  GRADE_DIFFICULTY_RANGE,
  SKILL_TASKS,
  SUB_TASK_IDS,
  SUB_TASK_NAMES,
  TASK_NAMES,
  type GradeLevel,
  type SubTaskId,
  type TaskId,
} from "@/app/_libs/skillMaster"
import type { SkillTaskCardData } from "@/app/components/SkillTaskCardItem"
import ProgressPage from "./progressPage"

// 達成基準 (Q3:D)
const ACHIEVEMENT_SCALE_PRACTICE_THRESHOLD = 10
const ACHIEVEMENT_ARPEGGIO_PRACTICE_THRESHOLD = 10
const ACHIEVEMENT_ETUDE_RECENT_AVG_THRESHOLD = 85
const ACHIEVEMENT_ETUDE_RECENT_WINDOW = 5

export const metadata = { title: "成長記録" }

type PageProps = {
  params:       Promise<{ userId: string }>
  searchParams: Promise<{ tab?: string }>
}

const VALID_TABS = ["calendar", "tasks"] as const

function toJSTDateStr(date: Date): string {
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  return jst.toISOString().split("T")[0]
}

function calculateStreak(dates: Date[]): number {
  const uniqueDays = [...new Set(dates.map(toJSTDateStr))].sort().reverse()
  if (uniqueDays.length === 0) return 0

  const todayStr     = toJSTDateStr(new Date())
  const yesterdayStr = toJSTDateStr(new Date(Date.now() - 86400000))

  let start: string
  if      (uniqueDays[0] === todayStr)     start = todayStr
  else if (uniqueDays[0] === yesterdayStr) start = yesterdayStr
  else                                      return 0

  let streak = 0
  for (let i = 0; i < uniqueDays.length; i++) {
    const expected = toJSTDateStr(
      new Date(new Date(start + "T00:00:00+09:00").getTime() - i * 86400000)
    )
    if (uniqueDays[i] === expected) streak++
    else break
  }
  return streak
}

function getDisplayNames(
  cardType: "task" | "sub_task",
  skillTaskId: string | null,
  skillSubTaskId: string | null,
): { displayName: string; parentTaskName: string } {
  if (cardType === "sub_task" && skillSubTaskId) {
    const subId = skillSubTaskId as SubTaskId
    const displayName = SUB_TASK_NAMES[subId] ?? skillSubTaskId
    let parentTaskName = ""
    for (const taskId of Object.keys(SKILL_TASKS) as TaskId[]) {
      if (SKILL_TASKS[taskId].subTaskIds.includes(subId)) {
        parentTaskName = TASK_NAMES[taskId]
        break
      }
    }
    return { displayName, parentTaskName }
  }
  if (cardType === "task" && skillTaskId) {
    const taskId = skillTaskId as TaskId
    const name = TASK_NAMES[taskId] ?? skillTaskId
    return { displayName: name, parentTaskName: name }
  }
  return { displayName: "", parentTaskName: "" }
}

export default async function ProgressServerPage({ params, searchParams }: PageProps) {
  const { userId } = await params
  const { tab: rawTab = "calendar" } = await searchParams
  const tab = (VALID_TABS as readonly string[]).includes(rawTab) ? rawTab : "calendar"

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: userId },
    select: { id: true },
  })
  if (!dbUser) return <div>User not found</div>

  const internalUserId = dbUser.id

  // ── 全データを並列取得 ──
  // calendar タブ: practiceAll / scoreAll
  // tasks タブ: cards / subScores / skillScores / 演奏明細 (達成基準計算用) / userGrade
  const [
    practiceAll,
    scoreAll,
    rawCards,
    subScores,
    skillScores,
    practiceDetails,
    userGrade,
  ] = await Promise.all([
    prisma.practicePerformance.findMany({
      where: { userId: internalUserId },
      select: { uploadedAt: true, performanceDuration: true, comparisonResultPath: true },
      orderBy: { uploadedAt: "desc" },
    }),
    prisma.performance.findMany({
      where: { userId: internalUserId },
      select: { uploadedAt: true, performanceDuration: true, comparisonResultPath: true },
      orderBy: { uploadedAt: "desc" },
    }),
    prisma.userSkillTaskCard.findMany({
      where: { userId: internalUserId },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 100,
      select: {
        id: true,
        cardType: true,
        skillTaskId: true,
        skillSubTaskId: true,
        status: true,
        createdAt: true,
        improvedAt: true,
        clearedAt: true,
        lastMatchedAt: true,
      },
    }),
    prisma.userSkillSubScore.findMany({
      where: { userId: internalUserId },
      select: { skillSubTaskId: true, averageScore: true },
    }),
    prisma.userSkillScore.findMany({
      where: { userId: internalUserId },
      select: { skillTaskId: true, currentScore: true },
    }),
    // 達成基準 + 難易度推定 用に skillSubScores と practiceItem.difficulty を持つ演奏履歴
    prisma.practicePerformance.findMany({
      where: { userId: internalUserId, analysisStatus: "done" },
      orderBy: { uploadedAt: "desc" },
      select: {
        practiceItemId: true,
        uploadedAt: true,
        skillSubScores: true,
        practiceItem: {
          select: { id: true, category: true, difficulty: true },
        },
      },
    }),
    prisma.userGrade.findUnique({
      where: { userId: internalUserId },
      select: { currentGrade: true },
    }),
  ])

  // ── ストリーク計算 ──
  const allDates = [
    ...practiceAll.map(p => p.uploadedAt),
    ...scoreAll.map(p => p.uploadedAt),
  ].filter(Boolean) as Date[]

  const streak = calculateStreak(allDates)

  // ── 全期間の日別達成カウント (0..3) ──
  type PerfEntry = { performanceDuration: number | null; comparisonResultPath: string | null }
  const dayMap = new Map<string, PerfEntry[]>()
  for (const p of [...practiceAll, ...scoreAll]) {
    const dStr = toJSTDateStr(p.uploadedAt)
    if (!dayMap.has(dStr)) dayMap.set(dStr, [])
    dayMap.get(dStr)!.push(p)
  }

  const dayAchievements: Record<string, number> = {}
  for (const [dStr, entries] of dayMap.entries()) {
    const totalSec = entries.reduce((a, x) => a + (x.performanceDuration ?? 0), 0)
    const recordCount = entries.length
    const reviewCount = entries.filter(x => x.comparisonResultPath).length

    let n = 0
    if (totalSec >= 15 * 60) n++
    if (recordCount >= 1) n++
    if (reviewCount >= 2) n++

    if (n > 0) dayAchievements[dStr] = n
  }

  // ── スコアマップ (sub_task / task カード共通参照用) ──
  const subScoresMap: Record<string, number | null> = {}
  for (const s of subScores) {
    if (s.skillSubTaskId) subScoresMap[s.skillSubTaskId] = s.averageScore
  }
  const skillScoresMap: Record<string, number | null> = {}
  for (const s of skillScores) {
    if (s.skillTaskId) skillScoresMap[s.skillTaskId] = s.currentScore
  }

  // ─────────────────────────────────────────────────────────
  // カード拡張データ計算: 中項目→難易度グルーピング + 達成基準 (Q3:D)
  //   - cardDifficulty: 「最後にこの sub_task が target>0 だった演奏」の practiceItem.difficulty
  //   - 推薦 scale/arpeggio/etude (top1, 同 difficulty + sub_task tag)
  //   - 練習回数 + etude 直近 5 回サブタスクスコア平均
  //   - 達成基準: 音階 ≥10回 AND アルペジオ ≥10回 AND エチュード直近5平均 ≥85
  // ─────────────────────────────────────────────────────────
  type SubScoreEntry = { score?: number; matched?: boolean; target_count?: number }
  const grade: GradeLevel = (userGrade?.currentGrade as GradeLevel | undefined) ?? "BEGINNER"
  const [gradeMinDiff] = GRADE_DIFFICULTY_RANGE[grade]

  // (1) sub_task ごとに「最近この sub_task に target を持った演奏」のうち最新の難易度
  const subTaskDifficulty: Partial<Record<SubTaskId, number>> = {}
  for (const p of practiceDetails) {
    const diff = p.practiceItem?.difficulty
    if (diff == null) continue
    const subScores = (p.skillSubScores ?? {}) as Record<string, SubScoreEntry>
    for (const subId of SUB_TASK_IDS) {
      if (subTaskDifficulty[subId] != null) continue
      const sub = subScores[subId]
      if (sub?.target_count && sub.target_count > 0) {
        subTaskDifficulty[subId] = diff
      }
    }
  }

  // (2) sub_task カードに対する augmentation を並列計算
  type CardAugmentation = {
    cardDifficulty: number
    recommendedScale: { id: string; title: string } | null
    recommendedArpeggio: { id: string; title: string } | null
    recommendedEtude: { id: string; title: string } | null
    scalePracticeCount: number
    arpeggioPracticeCount: number
    etudePracticeCount: number
    etudeRecentAvgScore: number | null
    achievementMet: boolean
  }
  const augmentTargets = rawCards.filter(
    c => c.cardType === "sub_task" && c.skillSubTaskId && c.status !== "cleared",
  )
  const cardAugmentations: Record<string, CardAugmentation> = {}
  await Promise.all(
    augmentTargets.map(async card => {
      const subId = card.skillSubTaskId as SubTaskId
      const cardDifficulty = subTaskDifficulty[subId] ?? gradeMinDiff
      const tagFilter = { skillSubTaskTags: { array_contains: subId } }

      const [scale, arpeggio, etude] = await Promise.all([
        prisma.practiceItem.findFirst({
          where: {
            category: "scale",
            isPublished: true,
            difficulty: cardDifficulty,
            ...tagFilter,
          },
          orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
          select: { id: true, title: true },
        }),
        prisma.practiceItem.findFirst({
          where: {
            category: "arpeggio",
            isPublished: true,
            difficulty: cardDifficulty,
            ...tagFilter,
          },
          orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
          select: { id: true, title: true },
        }),
        prisma.practiceItem.findFirst({
          where: {
            category: "etude",
            isPublished: true,
            difficulty: cardDifficulty,
            ...tagFilter,
          },
          orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
          select: { id: true, title: true },
        }),
      ])

      const [scaleCount, arpeggioCount, etudeCount, etudeRecent] = await Promise.all([
        scale
          ? prisma.practicePerformance.count({
              where: { userId: internalUserId, practiceItemId: scale.id },
            })
          : Promise.resolve(0),
        arpeggio
          ? prisma.practicePerformance.count({
              where: { userId: internalUserId, practiceItemId: arpeggio.id },
            })
          : Promise.resolve(0),
        etude
          ? prisma.practicePerformance.count({
              where: { userId: internalUserId, practiceItemId: etude.id },
            })
          : Promise.resolve(0),
        etude
          ? prisma.practicePerformance.findMany({
              where: {
                userId: internalUserId,
                practiceItemId: etude.id,
                analysisStatus: "done",
              },
              orderBy: { uploadedAt: "desc" },
              take: ACHIEVEMENT_ETUDE_RECENT_WINDOW,
              select: { skillSubScores: true },
            })
          : Promise.resolve([] as { skillSubScores: unknown }[]),
      ])

      let etudeRecentAvgScore: number | null = null
      if (etudeRecent.length > 0) {
        const scores = etudeRecent
          .map(p => {
            const subs = (p.skillSubScores ?? {}) as Record<string, SubScoreEntry>
            return subs[subId]?.score
          })
          .filter((s): s is number => typeof s === "number")
        if (scores.length > 0) {
          etudeRecentAvgScore =
            Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        }
      }

      const achievementMet =
        scaleCount >= ACHIEVEMENT_SCALE_PRACTICE_THRESHOLD &&
        arpeggioCount >= ACHIEVEMENT_ARPEGGIO_PRACTICE_THRESHOLD &&
        etudeRecentAvgScore != null &&
        etudeRecentAvgScore >= ACHIEVEMENT_ETUDE_RECENT_AVG_THRESHOLD

      cardAugmentations[card.id] = {
        cardDifficulty,
        recommendedScale: scale,
        recommendedArpeggio: arpeggio,
        recommendedEtude: etude,
        scalePracticeCount: scaleCount,
        arpeggioPracticeCount: arpeggioCount,
        etudePracticeCount: etudeCount,
        etudeRecentAvgScore,
        achievementMet,
      }
    }),
  )

  // ── カードデータをクライアント用に整形 ──
  const cards: SkillTaskCardData[] = rawCards.map(c => {
    const cardType = c.cardType as "task" | "sub_task"
    const { displayName, parentTaskName } = getDisplayNames(
      cardType,
      c.skillTaskId,
      c.skillSubTaskId,
    )
    const aug = cardAugmentations[c.id] ?? null
    return {
      id: c.id,
      cardType,
      skillTaskId: c.skillTaskId,
      skillSubTaskId: c.skillSubTaskId,
      status: c.status as "active" | "improving" | "cleared",
      createdAt: c.createdAt.toISOString(),
      improvedAt: c.improvedAt?.toISOString() ?? null,
      clearedAt: c.clearedAt?.toISOString() ?? null,
      lastMatchedAt: c.lastMatchedAt?.toISOString() ?? null,
      displayName,
      parentTaskName,
      // 中項目→難易度グルーピング + 達成基準 (Q3:D) 用の augmentation
      cardDifficulty: aug?.cardDifficulty ?? null,
      recommendedScale: aug?.recommendedScale ?? null,
      recommendedArpeggio: aug?.recommendedArpeggio ?? null,
      recommendedEtude: aug?.recommendedEtude ?? null,
      scalePracticeCount: aug?.scalePracticeCount ?? 0,
      arpeggioPracticeCount: aug?.arpeggioPracticeCount ?? 0,
      etudePracticeCount: aug?.etudePracticeCount ?? 0,
      etudeRecentAvgScore: aug?.etudeRecentAvgScore ?? null,
      achievementMet: aug?.achievementMet ?? false,
    }
  })

  return (
    <ProgressPage
      tab={tab}
      userId={userId}
      streak={streak}
      dayAchievements={dayAchievements}
      cards={cards}
      subScoresMap={subScoresMap}
      skillScoresMap={skillScoresMap}
    />
  )
}
