// わざマスターの課題曲設定 (admin専用・2026-09-01 Tetsuo確定)。
// わざ×★のマトリクスに課題曲を割り当てる。候補曲は「その★の曲」に絞り、
// technique系のわざは技術タグが一致する曲を候補の先頭グループに出す。
import { redirect } from "next/navigation"
import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { SKILL_MASTERY_TARGETS } from "@/app/_libs/growthKarte"
import SkillSongsClient from "./SkillSongsClient"

export const metadata = { title: "課題曲設定" }

export default async function SkillSongsPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const dbUser = await prisma.user.findUnique({ where: { supabaseUserId: user.id } })
  if (!dbUser || dbUser.role !== "admin") {
    return <div style={{ padding: 40, textAlign: "center" }}>管理者権限が必要です</div>
  }

  const [scores, mappings] = await Promise.all([
    prisma.score.findMany({
      where: { deletedAt: null, partId: null, star: { not: null } },
      orderBy: [{ star: "asc" }, { title: "asc" }],
      select: {
        id: true, title: true, star: true,
        scoreTechniqueTags: { select: { techniqueTag: { select: { name: true } } } },
      },
    }),
    prisma.skillMasterySong.findMany({ select: { skillId: true, star: true, scoreId: true } }),
  ])

  return (
    <SkillSongsClient
      userId={userId}
      skills={SKILL_MASTERY_TARGETS}
      scores={scores.map((s) => ({
        id: s.id, title: s.title, star: s.star as number,
        tags: s.scoreTechniqueTags.map((t) => t.techniqueTag.name),
      }))}
      mappings={mappings}
    />
  )
}
