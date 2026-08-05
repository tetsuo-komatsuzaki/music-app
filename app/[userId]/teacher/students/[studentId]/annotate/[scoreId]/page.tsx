// 先生: 生徒の曲に添削(譜面注釈)を書き込む (2026-07-29 Phase1.5-c)。別シェル /teacher 内。
import { redirect } from "next/navigation"
import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { storageAdmin } from "@/app/_libs/storageAdmin"
import { encodeSignedUrl } from "@/app/_libs/encodeSignedUrl"
import AnnotateClient from "./AnnotateClient"

export const metadata = { title: "採点カルテ" }

export default async function AnnotatePage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string; studentId: string; scoreId: string }>
  searchParams: Promise<{ mood?: string }>
}) {
  const { userId, studentId, scoreId } = await params
  const { mood } = await searchParams
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) redirect(`/${userId}`)

  const me = await prisma.user.findUnique({ where: { supabaseUserId: userId }, select: { id: true, role: true } })
  if (!me || me.role !== "teacher") redirect(`/${userId}`)

  const link = await prisma.teacherStudent.findUnique({
    where: { teacherId_studentId: { teacherId: me.id, studentId } },
    select: { id: true },
  })
  if (!link) redirect(`/${userId}/teacher`)

  const student = await prisma.user.findUnique({ where: { id: studentId }, select: { name: true } })
  const score = await prisma.score.findUnique({
    where: { id: scoreId },
    select: { title: true, generatedXmlPath: true, buildStatus: true },
  })
  if (!student || !score) redirect(`/${userId}/teacher/students/${studentId}`)

  const buildUrl = (score.buildStatus === "done" && score.generatedXmlPath)
    ? await storageAdmin.storage.from("musicxml").createSignedUrl(score.generatedXmlPath, 300)
        .then((r) => encodeSignedUrl(r.data?.signedUrl))
    : null

  return (
    <AnnotateClient
      initialMood={mood ?? null}
      userId={userId}
      studentId={studentId}
      studentName={student.name}
      scoreId={scoreId}
      scoreTitle={score.title}
      buildUrl={buildUrl}
    />
  )
}
