import { prisma } from "@/app/_libs/prisma"
import ScoresClient from "./ScoresClient"

export const metadata = { title: "マイライブラリー" }

type PageProps = {
  params: Promise<{ userId: string }>
}

export default async function Page({ params }: PageProps) {
  const { userId } = await params


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
    prisma.songMastery.findMany({
      where: { userId: user.id, isFullyMastered: true },
      select: { scoreId: true },
    }),
  ])
  console.log(`[PERF] scores/list step2_scores: ${(performance.now() - perfStep2).toFixed(0)}ms  TOTAL: ${(performance.now() - perfStart).toFixed(0)}ms`)

  const fullyMasteredScoreIds = new Set(masterySongs.map(m => m.scoreId))

  const scores = rawScores.map(score => ({
    ...score,
    createdAt: score.createdAt.toISOString(),
    isOwn: score.createdById === user.id,
    isFullyMastered: fullyMasteredScoreIds.has(score.id),
  }))
  return <ScoresClient scores={scores} userId={userId} />
}