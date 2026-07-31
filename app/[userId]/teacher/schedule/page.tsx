// 先生: レッスン枠の管理 (2026-08-01 Phase3)。空き枠を作り、予約状況を見る。別シェル /teacher。
import { redirect } from "next/navigation"
import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import ScheduleClient from "./ScheduleClient"

export const metadata = { title: "レッスン枠" }

export default async function TeacherSchedulePage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) redirect(`/${userId}`)

  const me = await prisma.user.findUnique({ where: { supabaseUserId: userId }, select: { id: true, role: true } })
  if (!me || me.role !== "teacher") redirect(`/${userId}`)

  const lessons = await prisma.lesson.findMany({
    where: { teacherId: me.id, status: { in: ["open", "booked"] }, startAt: { gte: new Date(Date.now() - 3600_000) } },
    orderBy: { startAt: "asc" },
    take: 100,
    select: {
      id: true, startAt: true, durationMin: true, online: true, locationNote: true, status: true,
      student: { select: { name: true } },
    },
  })

  const fmt = (d: Date) => d.toLocaleString("ja-JP", { month: "numeric", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" })

  return (
    <ScheduleClient
      userId={userId}
      lessons={lessons.map((l) => ({
        id: l.id,
        when: fmt(l.startAt),
        durationMin: l.durationMin,
        online: l.online,
        locationNote: l.locationNote,
        status: l.status as "open" | "booked",
        studentName: l.student?.name ?? null,
      }))}
    />
  )
}
