// 技術の詳細分析ページ (2026-08-02・先生あり特典)。
// カルテの技術マップから遷移。指導注釈つき推移 / 先生の指導履歴 / 聴き比べ / 処方箋。
// spec: project_skill_map_spec / モック743beec0承認済。
import { redirect } from "next/navigation"
import { prisma } from "@/app/_libs/prisma"
import { buildSkillDetail } from "@/app/_libs/growthKarte"
import SkillDetailClient from "./SkillDetailClient"

export const metadata = { title: "技術マップ" }

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ userId: string; techId: string }>
}) {
  const { userId, techId } = await params

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: userId },
    select: { id: true },
  })
  if (!dbUser) redirect("/login")

  const data = await buildSkillDetail(dbUser.id, userId, techId)
  // 不明ID or 先生なし(特典対象外) はカルテへ戻す
  if (!data) redirect(`/${userId}/progress`)

  // わざマスター (2026-09-01 案4検定の記録表): ★ごとの課題曲の進み
  const { getSkillMastery } = await import("@/app/_libs/skillMastery")
  const mastery = (await getSkillMastery(dbUser.id)).get(techId) ?? null

  return <SkillDetailClient userId={userId} data={data} mastery={mastery} />
}
