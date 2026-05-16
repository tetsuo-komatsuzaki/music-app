// GET /api/performances/[id]/skill-detail
//
// v1.6 Phase 4-4 (2026-05-16) — Score 演奏 (Performance) 用 skill-detail。
// practice 版 /api/practice-performances/[performanceId]/skill-detail と
// レスポンス形状を揃え、PerformanceSkillDetail コンポーネントを Score 詳細でも
// 再利用できるようにする (Q1=a / Q2=A 確定: 練習教材からは除去、Score 詳細で表示)。
//
// 命名注記: この endpoint は Score Performance 専用。
//   練習教材は /api/practice-performances/[performanceId]/skill-detail を使う。
//
// 役割分担 (Q4 確定):
//   - PerformanceSkillDetail (本 API)  = 個別演奏の詳細フィードバック
//     (3軸スコア + 気になる箇所 + 改善ガイド)
//   - ScoreLoopDetal (Phase 4-1, loop-detail API) = 課題カード一覧 (SkillTaskCard/教材リンク)
//   → improvementGuides[].cardId は常に null。教材リンクは「上達ループ」タブが担う。
//
// gradeUpdate は null 固定。Score のグレード進捗は UserGradeProgress (ホーム/Progress) で
// 表示するため、本コンポーネントの GradeUpModal は使わない。
//
// 認可 (Q6 と同方針): Performance.userId === dbUser.id の演奏のみ閲覧可、他者は 404。

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { requireAuthApi } from "@/app/_libs/requireAuth"
import {
  SKILL_SUB_TASKS,
  SUB_TASK_IDS,
  SUB_TASK_NAMES,
  TASK_NAMES,
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
  // matched=true の sub_task のみ抽出 (spec §10)
  return SUB_TASK_IDS.filter(id => subScores[id]?.matched).map(id => {
    const def = SKILL_SUB_TASKS[id]
    return {
      subTaskId: id,
      subTaskName: SUB_TASK_NAMES[id],
      parentTaskId: def.parentTaskId,
      parentTaskName: TASK_NAMES[def.parentTaskId],
      // Q4 役割分担: Score の教材リンクは「上達ループ」タブ (ScoreLoopDetail) が担うため
      //   ここでは常に null (改善ガイドの「練習する」ボタンは準備中表示)。
      cardId: null,
      guide: def.improvementGuide,
    }
  })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: performanceId } = await params

  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  const dbUserId = auth.user.dbUser.id

  const perf = await prisma.performance.findUnique({
    where: { id: performanceId },
    select: {
      id: true,
      userId: true,
      scoreId: true,
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
      score: {
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

  const problematicPositions =
    Array.isArray(perf.problematicPositions) ? perf.problematicPositions : null

  return NextResponse.json({
    performanceId: perf.id,
    // practice 版の practiceItemId/practiceItemTitle と形状を揃える
    practiceItemId: perf.scoreId,
    practiceItemTitle: perf.score.title,

    // 既存スコア
    overallScore: perf.overallScore,
    pitchAccuracy: perf.pitchAccuracy,
    timingAccuracy: perf.timingAccuracy, // legacy mirror (P-ア)

    // v1.5/3.2.2
    pitchSkillScore: perf.pitchSkillScore,
    rhythmSkillScore: perf.rhythmSkillScore,
    bowingSkillScore: perf.bowingSkillScore,
    skillSubScores,
    problematicPositions,

    analysisStatus: perf.analysisStatus,
    improvementGuides,
    gradeUpdate: null, // Score は UserGradeProgress 経路 (本 UI では grade-up modal 非使用)

    musicxmlPath: perf.score.originalXmlPath,
    audioPath: perf.audioPath,
    recordingBpm: null,
    createdAt: perf.uploadedAt.toISOString(),
  })
}
