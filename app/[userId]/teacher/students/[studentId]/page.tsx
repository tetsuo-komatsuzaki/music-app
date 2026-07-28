// 生徒カルテ (2026-07-28)。概要(レッスン前ブリーフィング) + 宿題タブ。
// 担当していない生徒なら /teacher へ戻す。将来: 診断/添削タブをここに足す。
import { redirect } from "next/navigation"
import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import StudentKarte from "./StudentKarte"

export const metadata = { title: "生徒カルテ" }

export default async function StudentKartePage({
  params,
}: {
  params: Promise<{ userId: string; studentId: string }>
}) {
  const { userId, studentId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) redirect(`/${userId}`)

  const me = await prisma.user.findUnique({
    where: { supabaseUserId: userId },
    select: { id: true, role: true },
  })
  if (!me || me.role !== "teacher") redirect(`/${userId}`)

  // 担当生徒であることを確認
  const link = await prisma.teacherStudent.findUnique({
    where: { teacherId_studentId: { teacherId: me.id, studentId } },
    select: { id: true },
  })
  if (!link) redirect(`/${userId}/teacher`)

  const student = await prisma.user.findUnique({ where: { id: studentId }, select: { name: true } })
  if (!student) redirect(`/${userId}/teacher`)

  const since = new Date(Date.now() - 7 * 86400000)
  const [
    perfCount7d, pracCount7d, recentPerfs, recentAchievements,
    studentScoresRaw, studentItemsRaw, assignments,
  ] = await Promise.all([
    prisma.performance.count({ where: { userId: studentId, uploadedAt: { gte: since } } }),
    prisma.practicePerformance.count({ where: { userId: studentId, uploadedAt: { gte: since } } }),
    prisma.performance.findMany({
      where: { userId: studentId, pitchAccuracy: { not: null }, timingAccuracy: { not: null } },
      orderBy: { uploadedAt: "desc" }, take: 5,
      select: { pitchAccuracy: true, timingAccuracy: true, uploadedAt: true, score: { select: { title: true } } },
    }),
    prisma.userScoreAchievement.findMany({
      where: { userId: studentId }, orderBy: { achievedAt: "desc" }, take: 3,
      select: { masteredAt: true, score: { select: { title: true } } },
    }),
    prisma.performance.findMany({
      where: { userId: studentId }, distinct: ["scoreId"], orderBy: { uploadedAt: "desc" }, take: 30,
      select: { scoreId: true, score: { select: { title: true } } },
    }),
    prisma.practicePerformance.findMany({
      where: { userId: studentId }, distinct: ["practiceItemId"], orderBy: { uploadedAt: "desc" }, take: 30,
      select: { practiceItemId: true, practiceItem: { select: { title: true } } },
    }),
    prisma.assignment.findMany({
      where: { teacherId: me.id, studentId }, orderBy: { createdAt: "desc" }, take: 30,
      select: {
        id: true, targetMeasures: true, reps: true, targetTempo: true, comment: true,
        doneAt: true, createdAt: true,
        score: { select: { title: true } }, practiceItem: { select: { title: true } },
      },
    }),
  ])

  // メッセージ (生徒→先生の未読を既読化して取得)
  await prisma.message.updateMany({
    where: { teacherId: me.id, studentId, fromTeacher: false, readAt: null },
    data: { readAt: new Date() },
  })
  const messages = await prisma.message.findMany({
    where: { teacherId: me.id, studentId },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: { id: true, fromTeacher: true, body: true, createdAt: true },
  })

  const recent5 = recentPerfs.map((p) => ({
    title: p.score?.title ?? "曲",
    avg: Math.round(((p.pitchAccuracy ?? 0) + (p.timingAccuracy ?? 0)) / 2),
    date: p.uploadedAt.toLocaleDateString("ja-JP"),
  }))
  const scoreTargets = studentScoresRaw
    .filter((s) => s.scoreId)
    .map((s) => ({ id: s.scoreId as string, title: s.score?.title ?? "曲" }))
  const itemTargets = studentItemsRaw
    .filter((s) => s.practiceItemId)
    .map((s) => ({ id: s.practiceItemId as string, title: s.practiceItem?.title ?? "教材" }))

  return (
    <StudentKarte
      userId={userId}
      studentId={studentId}
      studentName={student.name}
      messages={messages.map((m) => ({
        id: m.id, fromTeacher: m.fromTeacher, body: m.body,
        time: m.createdAt.toLocaleDateString("ja-JP"),
      }))}
      briefing={{
        practiceCount7d: perfCount7d + pracCount7d,
        recent5,
        achievements: recentAchievements.map((a) => ({
          title: a.score?.title ?? "曲",
          mastered: a.masteredAt != null,
        })),
      }}
      scoreTargets={scoreTargets}
      itemTargets={itemTargets}
      assignments={assignments.map((a) => ({
        id: a.id,
        targetTitle: a.score?.title ?? a.practiceItem?.title ?? "課題",
        targetMeasures: a.targetMeasures,
        reps: a.reps,
        targetTempo: a.targetTempo,
        comment: a.comment,
        done: a.doneAt != null,
        createdAt: a.createdAt.toLocaleDateString("ja-JP"),
      }))}
    />
  )
}
