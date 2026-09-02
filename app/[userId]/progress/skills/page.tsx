// app/[userId]/progress/skills/page.tsx
//
// 「わざのレベル」詳細ページ (2026-08-11 案7=カード+推移)。
// カルテトップ (progress/page.tsx) のSkillsChapterは概要+ミニマップ+このページへのリンクに縮退し、
// 全15わざの案7カード (大きな精度% / スパークライン / 音程・リズム2本バー / くわしく・練習リンク) はここに集約。
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

  // 報酬体系: 技術マップ閲覧クエスト (No.017・失敗しても表示は止めない)
  try {
    const { questEventHook } = await import("@/app/_libs/treasureEngine")
    await questEventHook(dbUser.id, "skill_map")
  } catch { /* noop */ }

  const data = await buildKarteData(dbUser.id, userId, period)

  // わざマスター (2026-09-01 案4): ★ごとの課題曲の進み。read防御はlib側
  const { getSkillMastery } = await import("@/app/_libs/skillMastery")
  const mastery = await getSkillMastery(dbUser.id)

  return <SkillsLevelClient userId={userId} skillMap={data.skillMap} mastery={Object.fromEntries(mastery)} />
}
