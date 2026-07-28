// 生徒: 先生の添削を譜面上で見る (読み取り専用・2026-07-29 Phase1.5-c)。通常の生徒シェル内。
import { redirect } from "next/navigation"
import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { storageAdmin } from "@/app/_libs/storageAdmin"
import { encodeSignedUrl } from "@/app/_libs/encodeSignedUrl"
import ReviewClient from "./ReviewClient"

export const metadata = { title: "先生の添削" }

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ userId: string; scoreId: string }>
}) {
  const { userId, scoreId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) redirect(`/${userId}`)

  const me = await prisma.user.findUnique({ where: { supabaseUserId: userId }, select: { id: true } })
  if (!me) redirect(`/${userId}`)

  const link = await prisma.teacherStudent.findFirst({ where: { studentId: me.id }, select: { id: true } })
  if (!link) redirect(`/${userId}`)

  const score = await prisma.score.findUnique({
    where: { id: scoreId },
    select: { title: true, generatedXmlPath: true, buildStatus: true },
  })
  if (!score) redirect(`/${userId}/my-teacher`)

  const buildUrl = (score.buildStatus === "done" && score.generatedXmlPath)
    ? await storageAdmin.storage.from("musicxml").createSignedUrl(score.generatedXmlPath, 300)
        .then((r) => encodeSignedUrl(r.data?.signedUrl))
    : null

  return (
    <ReviewClient userId={userId} scoreId={scoreId} scoreTitle={score.title} buildUrl={buildUrl} />
  )
}
