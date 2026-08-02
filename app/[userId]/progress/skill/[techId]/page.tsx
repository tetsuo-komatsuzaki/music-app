// 技術の詳細分析ページ (2026-08-02・先生あり特典)。
// カルテの技術マップから遷移。指導注釈つき推移 / 先生の指導履歴 / 聴き比べ / 処方箋。
// spec: project_skill_map_spec / モック743beec0承認済。
import { redirect } from "next/navigation"
import { prisma } from "@/app/_libs/prisma"
import { buildSkillDetail } from "@/app/_libs/growthKarte"
import SkillDetailClient from "./SkillDetailClient"

export const metadata = { title: "技術の分析" }

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

  return <SkillDetailClient userId={userId} data={data} />
}
