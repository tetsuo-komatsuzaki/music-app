import { prisma } from "@/app/_libs/prisma"
import { redirect } from "next/navigation"
import { GUEST_ID } from "@/app/_libs/viewer"
import { badgeKind } from "@/app/_libs/starProgress"
import ScoresClient from "./ScoresClient"

export const metadata = { title: "マイライブラリー" }

type PageProps = {
  params: Promise<{ userId: string }>
}

export default async function Page({ params }: PageProps) {
  const { userId } = await params
  // ゲスト閲覧 (2026-09-06 Tetsuo確定): 自分の曲一覧はゲスト用に作らない → ゲストホームに戻してシート
  if (userId === GUEST_ID) redirect("/guest?gate=1")


  const perfStart = performance.now()

  // まずSupabaseIDでPrismaユーザー取得
  const user = await prisma.user.findUnique({
    where: { supabaseUserId: userId }
  })

  if (!user) {
    return <div>User not found</div>
  }
  console.log(`[PERF] scores/list step1_user: ${(performance.now() - perfStart).toFixed(0)}ms`)

  const perfStep2 = performance.now()
  // v1.6 Phase 4-2 Q2=a: スコアカードに完全習得バッジを掲載するため、
  //   ユーザーの SongMastery (isFullyMastered=true) も並列取得して scoreId set を作る
  const [rawScores, masterySongs] = await Promise.all([
    prisma.score.findMany({
      where: {
        // 2026-05-31 練習メニュー再編: マイライブラリー = 自分のアップロードのみ。
        // 公開教材(isShared) は練習メニューの「練習曲」セクションへ移設。
        createdById: user.id,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" }
    }),
    // C-6b (2026-07-11): バッジは新達成記録 (UserScoreAchievement) から。マスター≻達成。
    prisma.userScoreAchievement.findMany({
      where: { userId: user.id },
      select: { scoreId: true, achievedAt: true, masteredAt: true },
    }),
  ])
  console.log(`[PERF] scores/list step2_scores: ${(performance.now() - perfStep2).toFixed(0)}ms  TOTAL: ${(performance.now() - perfStart).toFixed(0)}ms`)

  const achievementByScore = new Map(masterySongs.map(a => [a.scoreId, a]))

  const scores = rawScores.map(score => ({
    ...score,
    createdAt: score.createdAt.toISOString(),
    isOwn: score.createdById === user.id,
    badge: badgeKind(achievementByScore.get(score.id)),
  }))
  return <ScoresClient scores={scores} userId={userId} />
}