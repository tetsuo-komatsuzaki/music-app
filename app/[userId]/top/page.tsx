import { prisma } from "@/app/_libs/prisma"
import TopClient from "./TopClient"

type PageProps = {
  params: Promise<{ userId: string }>
}

export default async function Page({ params }: PageProps) {

  const { userId } = await params


  // まずSupabaseIDでPrismaユーザー取得
  const user = await prisma.user.findUnique({
    where: { supabaseUserId: userId }
  })

  if (!user) {
    return <div>User not found</div>
  }

  const rawScores = await prisma.score.findMany({
    where: {
      OR: [
        { createdById: user.id },
        { isShared: true },
      ],
    },
    orderBy: { createdAt: "desc" }
  })


  const scores = rawScores.map(score => ({
    ...score,
    createdAt: score.createdAt.toISOString()
  }))
  return <TopClient scores={scores} userId={userId} />
}