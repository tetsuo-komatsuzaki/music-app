// app/[userId]/profile/page.tsx
//
// マイページ (Server Component)。グレード詳細セクション + プロフィール / 設定リンク。
// C-6b掃除 (2026-07-11): データ源を新判定体系 (UserStarProgress + UserScoreAchievement)
// に切替 (旧 UserGradeProgress / UserGrade は退役)。

import { prisma } from "@/app/_libs/prisma"
import { gradeFromStar, STAR_UP_ACHIEVEMENTS } from "@/app/_libs/starProgress"
import MyPage from "./myPage"

export const metadata = { title: "マイページ" }

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

  const [starProgress, achievements] = await Promise.all([
    prisma.userStarProgress.findUnique({
      where: { userId: internalUserId },
      select: { currentStar: true, updatedAt: true },
    }),
    prisma.userScoreAchievement.findMany({
      where: { userId: internalUserId },
      select: { starAtAchievement: true },
    }),
  ])

  const currentStar = starProgress?.currentStar ?? 1
  const gradeData = {
    currentStar,
    currentGrade: gradeFromStar(currentStar),
    masteredSongCountAtCurrentStar: achievements.filter(
      (a) => a.starAtAchievement === currentStar,
    ).length,
    gradeUpRequired: STAR_UP_ACHIEVEMENTS,
    masterReachedAt: null,
    achievedAt: starProgress?.updatedAt?.toISOString() ?? null,
  }

  return (
    <MyPage
      userId={userId}
      userName={dbUser.name ?? ""}
      gradeData={gradeData}
    />
  )
}
