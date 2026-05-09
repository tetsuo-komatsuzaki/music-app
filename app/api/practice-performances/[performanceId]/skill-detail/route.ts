// GET /api/practice-performances/[performanceId]/skill-detail
//
// v3.2.2 §10 / §16-7 — 演奏完了画面の表示に必要な全データを返す。

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { requireAuthApi } from "@/app/_libs/requireAuth"
import {
  GRADE_LEVELS,
  SKILL_SUB_TASKS,
  SUB_TASK_IDS,
  SUB_TASK_NAMES,
  TASK_NAMES,
  type GradeLevel,
  type SubTaskId,
} from "@/app/_libs/skillMaster"

type SubScoreData = {
  score: number
  matched: boolean
  sample_size: number
  target_count: number
  bad_count: number
  details: string | null
  details_with_count: string | null
}

const isGradeLevel = (v: unknown): v is GradeLevel =>
  typeof v === "string" && (GRADE_LEVELS as readonly string[]).includes(v)

function buildSkillSubScores(raw: unknown): Record<SubTaskId, SubScoreData> | null {
  if (!raw || typeof raw !== "object") return null
  const src = raw as Record<string, Partial<SubScoreData>>
  const out = {} as Record<SubTaskId, SubScoreData>
  for (const id of SUB_TASK_IDS) {
    const s = src[id] ?? {}
    out[id] = {
      score: typeof s.score === "number" ? s.score : 0,
      matched: Boolean(s.matched),
      sample_size: typeof s.sample_size === "number" ? s.sample_size : 0,
      target_count: typeof s.target_count === "number" ? s.target_count : 0,
      bad_count: typeof s.bad_count === "number" ? s.bad_count : 0,
      details: typeof s.details === "string" ? s.details : null,
      details_with_count:
        typeof s.details_with_count === "string" ? s.details_with_count : null,
    }
  }
  return out
}

function buildImprovementGuides(
  subScores: Record<SubTaskId, SubScoreData> | null,
) {
  if (!subScores) return []
  // matched=true の sub_task のみを抽出（spec §10）
  return SUB_TASK_IDS.filter(id => subScores[id]?.matched).map(id => {
    const def = SKILL_SUB_TASKS[id]
    return {
      subTaskId: id,
      subTaskName: SUB_TASK_NAMES[id],
      parentTaskId: def.parentTaskId,
      parentTaskName: TASK_NAMES[def.parentTaskId],
      guide: def.improvementGuide,
    }
  })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ performanceId: string }> },
) {
  const { performanceId } = await params

  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  const dbUserId = auth.user.dbUser.id

  const perf = await prisma.practicePerformance.findUnique({
    where: { id: performanceId },
    select: {
      id: true,
      userId: true,
      practiceItemId: true,
      audioPath: true,
      uploadedAt: true,
      analysisStatus: true,
      pitchAccuracy: true,
      timingAccuracy: true,
      overallScore: true,
      pitchSkillScore: true,
      rhythmSkillScore: true,
      bowingSkillScore: true,
      skillSubScores: true,
      problematicPositions: true,
      practiceItem: {
        select: { title: true, originalXmlPath: true },
      },
    },
  })

  // 存在しない or 他者所有 → 404 (エンティティ列挙防止)
  if (!perf || perf.userId !== dbUserId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const skillSubScores = buildSkillSubScores(perf.skillSubScores)
  const improvementGuides = buildImprovementGuides(skillSubScores)

  // gradeUpdate: 「この演奏 upload から ACHIEVED_WINDOW_MS 以内に昇格」を
  // 「この演奏が引き起こした昇格」とみなす。古い演奏を後で開いた際の
  // 誤検出を防ぐ。厳密判定 (lastUpgradeTriggerPerformanceId) は β以降。
  const ACHIEVED_WINDOW_MS = 60 * 60 * 1000 // 1 時間
  const userGrade = await prisma.userGrade.findUnique({
    where: { userId: dbUserId },
    select: { currentGrade: true, achievedAt: true },
  })
  const recentlyChanged = !!(
    userGrade?.achievedAt &&
    userGrade.achievedAt > perf.uploadedAt &&
    userGrade.achievedAt.getTime() - perf.uploadedAt.getTime() < ACHIEVED_WINDOW_MS
  )
  const gradeUpdate = userGrade
    ? {
        recentlyChanged,
        ...(isGradeLevel(userGrade.currentGrade)
          ? { newGrade: userGrade.currentGrade }
          : {}),
      }
    : null

  // problematicPositions は score_full が JSON 配列で書き込み済み (発見 A 解消)
  const problematicPositions =
    Array.isArray(perf.problematicPositions) ? perf.problematicPositions : null

  return NextResponse.json({
    performanceId: perf.id,
    practiceItemId: perf.practiceItemId,
    practiceItemTitle: perf.practiceItem.title,

    // 既存スコア
    overallScore: perf.overallScore,
    pitchAccuracy: perf.pitchAccuracy,
    timingAccuracy: perf.timingAccuracy,

    // v3.2.2 新規
    pitchSkillScore: perf.pitchSkillScore,
    rhythmSkillScore: perf.rhythmSkillScore,
    bowingSkillScore: perf.bowingSkillScore,
    skillSubScores,
    problematicPositions,

    analysisStatus: perf.analysisStatus,
    improvementGuides,
    gradeUpdate,

    musicxmlPath: perf.practiceItem.originalXmlPath,
    audioPath: perf.audioPath,
    recordingBpm: null, // 未保存、β で対応
    createdAt: perf.uploadedAt.toISOString(),
  })
}
