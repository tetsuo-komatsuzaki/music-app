// app/[userId]/profile/page.tsx
//
// v1.6 Phase 4-2 (2026-05-16) — マイページ (Server Component)。
// グレード詳細セクション (UserGradeProgress 準拠) + プロフィール / 設定リンク。
//
// 旧「あなたの課題」カードは 成長記録「あなたの課題」タブに移設。

import { prisma } from "@/app/_libs/prisma"
import {
  GRADE_LEVELS,
  type GradeLevel,
} from "@/app/_libs/skillMaster"
import MyPage from "./myPage"

export const metadata = { title: "マイページ" }

const isGradeLevel = (v: unknown): v is GradeLevel =>
  typeof v === "string" && (GRADE_LEVELS as readonly string[]).includes(v)

const GRADE_UP_SONG_COUNT = 10 // v1.6 §2-7

type PageProps = {
  params: Promise<{ userId: string }>
}

export default async function ProfilePage({ params }: PageProps) {
  const { userId } = await params

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: userId },
    select: { id: true, name: true },
  })
  if (!dbUser) return <div>User not found</div>

  const internalUserId = dbUser.id

  // v1.6 Phase 4-2: UserGradeProgress (新設計) + UserGrade.achievedAt (legacy 履歴用)
  const [userGradeProgress, legacyUserGrade] = await Promise.all([
    prisma.userGradeProgress.findUnique({
      where: { userId: internalUserId },
      select: {
        currentStar: true,
        currentGrade: true,
        masteredSongCountAtCurrentStar: true,
        masterReachedAt: true,
      },
    }),
    prisma.userGrade.findUnique({
      where: { userId: internalUserId },
      select: { achievedAt: true },
    }),
  ])

  const currentGrade: GradeLevel = isGradeLevel(userGradeProgress?.currentGrade)
    ? userGradeProgress.currentGrade
    : "BEGINNER"

  const gradeData = {
    currentStar: userGradeProgress?.currentStar ?? 1,
    currentGrade,
    masteredSongCountAtCurrentStar:
      userGradeProgress?.masteredSongCountAtCurrentStar ?? 0,
    gradeUpRequired: GRADE_UP_SONG_COUNT,
    masterReachedAt:
      userGradeProgress?.masterReachedAt?.toISOString() ?? null,
    achievedAt: legacyUserGrade?.achievedAt?.toISOString() ?? null,
  }

  return (
    <MyPage
      userId={userId}
      userName={dbUser.name ?? ""}
      gradeData={gradeData}
    />
  )
}
