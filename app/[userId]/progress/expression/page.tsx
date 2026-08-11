// app/[userId]/progress/expression/page.tsx
//
// 「表現の習得状況」詳細ページ (2026-08-11)。わざの習得状況(skills)と同型:
// カルテトップ (progress/page.tsx) の ExprChapter は概要=系統バー+このページへのリンクに縮退し、
// 全15表現の認定カード (★N / 認定曲 / 挑戦する曲) を系統タブ+横スクロールでここに集約。
// 認可・データ取得は skills/page.tsx に倣う (supabaseUserId → dbUser → buildKarteData("30d") → exprMap)。
import { prisma } from "@/app/_libs/prisma"
import { buildKarteData, type KartePeriod } from "@/app/_libs/growthKarte"
import ExpressionLevelClient from "./ExpressionLevelClient"

export const metadata = { title: "表現の習得状況" }

type PageProps = {
  params: Promise<{ userId: string }>
}

export default async function ExpressionLevelServerPage({ params }: PageProps) {
  const { userId } = await params
  const period: KartePeriod = "30d"

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: userId },
    select: { id: true },
  })
  if (!dbUser) return <div>User not found</div>

  const data = await buildKarteData(dbUser.id, userId, period)

  return (
    <ExpressionLevelClient
      userId={userId}
      exprMap={data.v2.exprMap}
      unlocked={!!data.v2.expression}
    />
  )
}
