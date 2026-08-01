// 先生とのやりとり (生徒側・2026-07-28)。先生を登録している生徒だけがアクセスできる。
// 通常の生徒シェル内で表示。タブ: すべて(これまでのやりとり) / 宿題 / 添削 / メッセージ。
// Phase 1: すべて・宿題は既存の宿題データから。添削・メッセージは Phase 1.5。
import { redirect } from "next/navigation"
import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { getAchievementFlags } from "@/app/_libs/achievementFlags"
import MyTeacherClient from "./MyTeacherClient"

export const metadata = { title: "先生とのやりとり" }

export default async function MyTeacherPage({
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
    select: { id: true },
  })
  if (!me) redirect(`/${userId}`)

  // 先生リンク (最初の1人)。無ければ普通のホームへ (この画面は先生ありのみ)
  const link = await prisma.teacherStudent.findFirst({
    where: { studentId: me.id },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true, teacher: { select: { id: true, name: true } } },
  })
  if (!link) redirect(`/${userId}`)

  // 先生からの未読メッセージを既読化 (開いた時点)
  await prisma.message.updateMany({
    where: { studentId: me.id, teacherId: link.teacher.id, fromTeacher: true, readAt: null },
    data: { readAt: new Date() },
  })
  const messages = await prisma.message.findMany({
    where: { studentId: me.id, teacherId: link.teacher.id },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: { id: true, fromTeacher: true, body: true, createdAt: true, performanceId: true, performanceKind: true, kind: true },
  })

  // メッセージに紐づく演奏を解決 (タイトル + 対象へのリンク)
  const perfMap = new Map<string, { title: string; href: string }>()
  const scorePerfIds = messages.filter((m) => m.performanceKind === "score" && m.performanceId).map((m) => m.performanceId as string)
  const pracPerfIds = messages.filter((m) => m.performanceKind === "practice" && m.performanceId).map((m) => m.performanceId as string)
  const [scorePerfRows, pracPerfRows] = await Promise.all([
    scorePerfIds.length
      ? prisma.performance.findMany({ where: { id: { in: scorePerfIds }, userId: me.id }, select: { id: true, score: { select: { id: true, title: true } } } })
      : Promise.resolve([]),
    pracPerfIds.length
      ? prisma.practicePerformance.findMany({ where: { id: { in: pracPerfIds }, userId: me.id }, select: { id: true, practiceItem: { select: { id: true, title: true, category: true } } } })
      : Promise.resolve([]),
  ])
  for (const p of scorePerfRows) {
    if (p.score) perfMap.set(p.id, { title: p.score.title, href: `/${userId}/scores/${p.score.id}` })
  }
  for (const p of pracPerfRows) {
    if (p.practiceItem) perfMap.set(p.id, { title: p.practiceItem.title, href: `/${userId}/practice/${p.practiceItem.category}/${p.practiceItem.id}` })
  }

  // 添削 (先生が譜面に書き込んだもの)。曲単位。TeacherFeedback は score リレーションを持たないので別引き。
  const feedbackRows = await prisma.teacherFeedback.findMany({
    where: { studentId: me.id, teacherId: link.teacher.id, scoreId: { not: null } },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: { scoreId: true, updatedAt: true },
  })
  const fbScoreTitles = new Map<string, string>()
  if (feedbackRows.length) {
    const scores = await prisma.score.findMany({
      where: { id: { in: feedbackRows.map((f) => f.scoreId as string) } },
      select: { id: true, title: true },
    })
    for (const s of scores) fbScoreTitles.set(s.id, s.title)
  }
  const feedbacks = feedbackRows
    .filter((f) => f.scoreId)
    .map((f) => ({ scoreId: f.scoreId as string, title: fbScoreTitles.get(f.scoreId as string) ?? "曲", date: f.updatedAt.toLocaleDateString("ja-JP") }))

  // レッスン (予約) — 予約できる空き枠 + 自分の予約済み
  const nowD = new Date()
  const fmtLesson = (d: Date) => d.toLocaleString("ja-JP", { month: "numeric", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" })
  const [openSlotRows, myLessonRows] = await Promise.all([
    prisma.lesson.findMany({
      where: { teacherId: link.teacher.id, status: "open", startAt: { gte: nowD } },
      orderBy: { startAt: "asc" }, take: 30,
      select: { id: true, startAt: true, durationMin: true, online: true, locationNote: true },
    }),
    prisma.lesson.findMany({
      where: { studentId: me.id, status: "booked", startAt: { gte: new Date(Date.now() - 3600_000) } },
      orderBy: { startAt: "asc" }, take: 30,
      select: { id: true, startAt: true, durationMin: true, online: true, locationNote: true },
    }),
  ])
  const toLessonDTO = (l: { id: string; startAt: Date; durationMin: number; online: boolean; locationNote: string | null }) =>
    ({ id: l.id, when: fmtLesson(l.startAt), durationMin: l.durationMin, online: l.online, locationNote: l.locationNote })
  const lessons = { open: openSlotRows.map(toLessonDTO), booked: myLessonRows.map(toLessonDTO) }
  const nextLessonLabel = myLessonRows[0] ? fmtLesson(myLessonRows[0].startAt) : null

  const assignments = await prisma.assignment.findMany({
    where: { studentId: me.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true, targetMeasures: true, reps: true, targetTempo: true, comment: true,
      dueDate: true, goalType: true, targetScore: true,
      doneAt: true, submittedAt: true, submittedScore: true, createdAt: true,
      score: { select: { id: true, title: true } },
      practiceItem: { select: { id: true, title: true, category: true } },
    },
  })

  const hwAchFlags = await getAchievementFlags(me.id, assignments.map((a) => a.score?.id))
  const hw = assignments.map((a) => ({
    id: a.id,
    title: a.score?.title ?? a.practiceItem?.title ?? "課題",
    detail: [
      a.reps && `×${a.reps}`,
      a.targetTempo && `♩=${a.targetTempo}`,
    ].filter(Boolean).join(" ・ "),
    comment: a.comment,
    dueDate: a.dueDate ? a.dueDate.toISOString() : null,
    goalType: a.goalType,
    targetScore: a.targetScore,
    achieved: a.score?.id ? (hwAchFlags.get(a.score.id)?.achieved ?? false) : false,
    mastered: a.score?.id ? (hwAchFlags.get(a.score.id)?.mastered ?? false) : false,
    done: a.doneAt != null,
    submitted: a.submittedAt != null,
    submittedScore: a.submittedScore,
    date: a.createdAt.toLocaleDateString("ja-JP"),
    href: a.score
      ? `/${userId}/scores/${a.score.id}`
      : a.practiceItem
        ? `/${userId}/practice/${a.practiceItem.category}/${a.practiceItem.id}`
        : `/${userId}`,
  }))

  // 「すべて＝これまでのやりとり」: いまは宿題とそのコメントをイベント化して時系列に
  type Ev = { at: number; when: string; kind: "hw" | "comment"; text: string; href?: string }
  const events: Ev[] = []
  for (const a of assignments) {
    events.push({
      at: a.createdAt.getTime(),
      when: a.createdAt.toLocaleDateString("ja-JP"),
      kind: "hw",
      text: `📌 宿題「${a.score?.title ?? a.practiceItem?.title ?? "課題"}」${[a.targetMeasures && `第${a.targetMeasures}小節`, a.reps && `×${a.reps}`].filter(Boolean).join(" ")}`,
      href: hw.find((h) => h.id === a.id)?.href,
    })
    if (a.comment) {
      events.push({
        at: a.createdAt.getTime() + 1,
        when: a.createdAt.toLocaleDateString("ja-JP"),
        kind: "comment",
        text: `💬 ${a.comment}`,
      })
    }
    if (a.submittedAt) {
      events.push({
        at: a.submittedAt.getTime(),
        when: a.submittedAt.toLocaleDateString("ja-JP"),
        kind: "hw",
        text: `📤 「${a.score?.title ?? a.practiceItem?.title ?? "課題"}」を提出${a.submittedScore != null ? `（${a.submittedScore}点）` : ""}`,
      })
    }
  }
  for (const m of messages) {
    events.push({
      at: m.createdAt.getTime(),
      when: m.createdAt.toLocaleDateString("ja-JP"),
      kind: "comment",
      text: `${m.fromTeacher ? "💬 先生" : "🙋 あなた"}：${m.body}`,
    })
  }
  events.sort((x, y) => y.at - x.at)

  return (
    <MyTeacherClient
      userId={userId}
      teacherName={link.teacher.name}
      since={link.createdAt.toLocaleDateString("ja-JP")}
      timeline={events.map(({ when, kind, text, href }) => ({ when, kind, text, href }))}
      homework={hw}
      messages={messages.map((m) => ({
        id: m.id,
        fromTeacher: m.fromTeacher,
        body: m.body,
        time: m.createdAt.toLocaleDateString("ja-JP"),
        perf: m.performanceId ? (perfMap.get(m.performanceId) ?? null) : null,
        kind: m.kind,
      }))}
      feedbacks={feedbacks}
      lessons={lessons}
      nextLessonLabel={nextLessonLabel}
    />
  )
}
