import { prisma } from "@/app/_libs/prisma"
import ScoresClient from "./ScoresClient"

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
  const rawScores = await prisma.score.findMany({
    where: {
      OR: [
        { createdById: user.id },
        { isShared: true },
      ],
    },
    orderBy: { createdAt: "desc" }
  })
  console.log(`[PERF] scores/list step2_scores: ${(performance.now() - perfStep2).toFixed(0)}ms  TOTAL: ${(performance.now() - perfStart).toFixed(0)}ms`)


  const scores = rawScores.map(score => ({
    ...score,
    createdAt: score.createdAt.toISOString()
  }))
  return <ScoresClient scores={scores} userId={userId} />
}