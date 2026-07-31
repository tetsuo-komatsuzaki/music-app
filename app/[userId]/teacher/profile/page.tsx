// 先生: 自分のプロフィール編集 (2026-08-01 Phase2)。別シェル /teacher 内。
import { redirect } from "next/navigation"
import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import ProfileEditor from "./ProfileEditor"

export const metadata = { title: "プロフィール" }

export default async function TeacherProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) redirect(`/${userId}`)

  const me = await prisma.user.findUnique({
    where: { supabaseUserId: userId },
    select: { id: true, role: true, name: true },
  })
  if (!me || me.role !== "teacher") redirect(`/${userId}`)

  return <ProfileEditor userId={userId} teacherName={me.name} />
}
