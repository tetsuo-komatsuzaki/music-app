// 先生: 生徒の成長カルテ詳細 (わざ/表現/記録の分析) を閲覧する (2026-08-11)。
// 生徒本人ルートは middleware でセッション一致必須のため、先生用に同じビューをこのルートで提供。
// view = skills | expression | numbers
import { redirect } from "next/navigation"
import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { buildKarteData, buildNumbersRoom, type KartePeriod } from "@/app/_libs/growthKarte"
import { buildUserHeatmap } from "@/app/_libs/fingerboard/aggregate"
import type { HeatmapData } from "@/app/_libs/fingerboard/heatmapTypes"
import SkillsLevelClient from "@/app/[userId]/progress/skills/SkillsLevelClient"
import ExpressionLevelClient from "@/app/[userId]/progress/expression/ExpressionLevelClient"
import NumbersRoomView from "@/app/components/NumbersRoomView"
import { buildPowersComparison, parseScale, scaleWindows, SCALE_LABEL, pastRange, buildPastFastSwitch } from "@/app/_libs/fivePowers"

export const metadata = { title: "生徒の成長カルテ" }

export default async function TeacherGrowthDetailPage({
  params, searchParams,
}: {
  params: Promise<{ userId: string; studentId: string; view: string }>
  searchParams: Promise<{ period?: string; scale?: string }>
}) {
  const { userId, studentId, view } = await params
  const sp = await searchParams

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) redirect(`/${userId}`)
  const me = await prisma.user.findUnique({ where: { supabaseUserId: userId }, select: { id: true, role: true } })
  if (!me || me.role !== "teacher") redirect(`/${userId}`)
  const link = await prisma.teacherStudent.findUnique({
    where: { teacherId_studentId: { teacherId: me.id, studentId } }, select: { id: true },
  })
  if (!link) redirect(`/${userId}/teacher`)

  const student = await prisma.user.findUnique({ where: { id: studentId }, select: { name: true, supabaseUserId: true } })
  if (!student?.supabaseUserId) redirect(`/${userId}/teacher/students/${studentId}`)

  const backHref = `/${userId}/teacher/students/${studentId}`
  const backLabel = `${student.name}のカルテにもどる`

  if (view === "numbers") {
    const scale = parseScale(sp.scale)
    const period: KartePeriod = SCALE_LABEL[scale].period
    const win = scaleWindows(scale)
    const [d, powers, past] = await Promise.all([
      buildNumbersRoom(studentId, period, win.now),
      buildPowersComparison(studentId, scale).catch(() => null),
      pastRange(studentId, scale).catch(() => null),
    ])
    const [dPast, fastSwitchPast] = past
      ? await Promise.all([buildNumbersRoom(studentId, period, past).catch(() => null), buildPastFastSwitch(studentId, scale).catch(() => null)])
      : [null, null]
    const days = period === "7d" ? 7 : 30
    let heatmap: HeatmapData = { cells: {}, details: {}, perfCount: 0 }
    try { heatmap = await buildUserHeatmap(studentId, days) } catch { /* storage不通でも画面は出す */ }
    let fbMarks: { cellId: string; note: string }[] = []
    try {
      fbMarks = (await prisma.teacherMarkedCell.findMany({
        where: { teacherId: me.id, studentId },
        select: { cellId: true, note: true },
      })).map((m) => ({ cellId: m.cellId, note: m.note }))
    } catch { fbMarks = [] }
    return (
      <NumbersRoomView
        d={d}
        period={period}
        baseHref={`/${userId}/teacher/students/${studentId}/growth/numbers`}
        backHref={backHref}
        backLabel={backLabel}
        heatmap={heatmap}
        fbMarks={fbMarks}
        scale={scale}
        powers={powers}
        dPast={dPast}
        fastSwitchPast={fastSwitchPast}
      />
    )
  }

  const data = await buildKarteData(studentId, student.supabaseUserId, "30d")

  if (view === "expression") {
    return (
      <ExpressionLevelClient
        userId={student.supabaseUserId}
        exprMap={data.v2.exprMap}
        unlocked={!!data.v2.expression}
        backHref={backHref}
        backLabel={backLabel}
        hideSongLinks
      />
    )
  }

  // 既定 = skills
  return (
    <SkillsLevelClient
      userId={student.supabaseUserId}
      skillMap={data.skillMap}
      backHref={backHref}
      backLabel={backLabel}
      hideDetailLinks
    />
  )
}
