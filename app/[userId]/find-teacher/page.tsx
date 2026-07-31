// 先生を探す (2026-08-01 Phase2)。先生を登録していない生徒向け。公開プロフィールを掲載し、
// AI相性(直近演奏で音程/リズムどちらが伸びしろか)で並べ替え。招待コード登録も併設。
import { redirect } from "next/navigation"
import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import FindTeacherClient from "./FindTeacherClient"

export const metadata = { title: "先生を探す" }

export default async function FindTeacherPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) redirect(`/${userId}`)

  const me = await prisma.user.findUnique({ where: { supabaseUserId: userId }, select: { id: true } })
  if (!me) redirect(`/${userId}`)

  // 既に先生がいれば「やりとり」へ
  const existing = await prisma.teacherStudent.findFirst({ where: { studentId: me.id }, select: { id: true } })
  if (existing) redirect(`/${userId}/my-teacher`)

  // 伸びしろ軸 (直近の評価済み演奏で音程 vs リズム)
  const perfs = await prisma.performance.findMany({
    where: { userId: me.id, rangeFromNote: null, pitchAccuracy: { not: null }, timingAccuracy: { not: null } },
    orderBy: { uploadedAt: "desc" }, take: 10, select: { pitchAccuracy: true, timingAccuracy: true },
  })
  let weakAxis: "音程" | "リズム" | null = null
  if (perfs.length >= 2) {
    const ap = perfs.reduce((a, p) => a + (p.pitchAccuracy ?? 0), 0) / perfs.length
    const at = perfs.reduce((a, p) => a + (p.timingAccuracy ?? 0), 0) / perfs.length
    weakAxis = ap < at - 2 ? "音程" : at < ap - 2 ? "リズム" : null
  }

  const profiles = await prisma.teacherProfile.findMany({
    where: { published: true },
    select: {
      teacherId: true, headline: true, bio: true, specialties: true, levels: true,
      forKids: true, online: true, priceNote: true, trial: true, sampleUrl: true,
      teacher: { select: { name: true } },
    },
  })

  const scored = profiles.map((p) => {
    let score = 70
    const matchWeak = weakAxis != null && p.specialties.some((s) => s.includes(weakAxis as string))
    if (matchWeak) score += 18
    if (p.trial) score += 4
    if (p.online) score += 4
    score = Math.min(98, score)
    return {
      teacherId: p.teacherId,
      name: p.teacher.name,
      headline: p.headline,
      bio: p.bio,
      specialties: p.specialties,
      levels: p.levels,
      forKids: p.forKids,
      online: p.online,
      priceNote: p.priceNote,
      trial: p.trial,
      sampleUrl: p.sampleUrl,
      match: score,
      matchWeak,
    }
  }).sort((a, b) => b.match - a.match)

  return <FindTeacherClient userId={userId} weakAxis={weakAxis} teachers={scored} />
}
