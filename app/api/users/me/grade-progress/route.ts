// GET /api/users/me/grade-progress
//
// v1.3 Phase 4-1 (2026-05-16) — UserGradeProgress (v1.3 新設計) を返す。
// 既存 /api/users/[userId]/grade (旧 UserGrade.progressData) とは別経路で併存。
// Phase 4-2 でホーム☆ UI 書き換え時に切替予定。

import { NextResponse } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { requireAuthApi } from "@/app/_libs/requireAuth"

const GRADE_UP_SONG_COUNT = 10 // §2-7 ☆昇格条件

export async function GET() {
  const auth = await requireAuthApi()
  if (!auth.ok) return auth.response
  const dbUserId = auth.user.dbUser.id

  const progress = await prisma.userGradeProgress.findUnique({
    where: { userId: dbUserId },
    select: {
      currentStar: true,
      currentGrade: true,
      masteredSongCountAtCurrentStar: true,
      masterReachedAt: true,
      updatedAt: true,
    },
  })

  if (!progress) {
    // レコード未生成 = まだ完全習得 1 曲もなし。初期値で返す (フロント側分岐削減)。
    return NextResponse.json({
      currentStar: 1,
      currentGrade: "BEGINNER" as const,
      masteredSongCountAtCurrentStar: 0,
      gradeUpRequired: GRADE_UP_SONG_COUNT,
      gradeUpRemaining: GRADE_UP_SONG_COUNT,
      masterReachedAt: null,
      updatedAt: null,
    })
  }

  const remaining = Math.max(
    0,
    GRADE_UP_SONG_COUNT - progress.masteredSongCountAtCurrentStar,
  )

  return NextResponse.json({
    currentStar: progress.currentStar,
    currentGrade: progress.currentGrade,
    masteredSongCountAtCurrentStar: progress.masteredSongCountAtCurrentStar,
    gradeUpRequired: GRADE_UP_SONG_COUNT,
    gradeUpRemaining: remaining,
    masterReachedAt: progress.masterReachedAt?.toISOString() ?? null,
    updatedAt: progress.updatedAt.toISOString(),
  })
}
