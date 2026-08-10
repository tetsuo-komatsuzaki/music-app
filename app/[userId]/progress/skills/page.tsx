// app/[userId]/progress/skills/page.tsx
//
// 「わざのレベル」詳細ページ (2026-08-11 案7=カード+推移)。
// カルテトップ (progress/page.tsx) のSkillsChapterは概要+ミニマップ+このページへのリンクに縮退し、
// 全15わざの案7カード (大きな安定度% / スパークライン / 音程・リズム2本バー / くわしく・練習リンク) はここに集約。
// 認可・データ取得は progress/page.tsx に倣う (supabaseUserId → dbUser → buildKarteData("30d") → skillMap)。
import { prisma } from "@/app/_libs/prisma"
import { buildKarteData, type KartePeriod } from "@/app/_libs/growthKarte"
import SkillsLevelClient from "./SkillsLevelClient"

export const metadata = { title: "わざの習得状況" }

type PageProps = {
  params: Promise<{ userId: string }>
}

export default async function SkillsLevelServerPage({ params }: PageProps) {
  const { userId } = await params
  const period: KartePeriod = "30d"

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: userId },
    select: { id: true },
  })
  if (!dbUser) return <div>User not found</div>

  const data = await buildKarteData(dbUser.id, userId, period)

  return <SkillsLevelClient userId={userId} skillMap={data.skillMap} />
}
