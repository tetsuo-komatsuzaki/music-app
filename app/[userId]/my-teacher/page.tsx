// 先生とのやりとり (生徒側・2026-07-28)。先生を登録している生徒だけがアクセスできる。
// 通常の生徒シェル内で表示。タブ: すべて(これまでのやりとり) / 宿題 / 添削 / メッセージ。
// Phase 1: すべて・宿題は既存の宿題データから。添削・メッセージは Phase 1.5。
import { redirect } from "next/navigation"
import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
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
    select: { id: true, fromTeacher: true, body: true, createdAt: true },
  })

  const assignments = await prisma.assignment.findMany({
    where: { studentId: me.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true, targetMeasures: true, reps: true, targetTempo: true, comment: true,
      doneAt: true, createdAt: true,
      score: { select: { id: true, title: true } },
      practiceItem: { select: { id: true, title: true, category: true } },
    },
  })

  const hw = assignments.map((a) => ({
    id: a.id,
    title: a.score?.title ?? a.practiceItem?.title ?? "課題",
    detail: [
      a.targetMeasures && `第${a.targetMeasures}小節`,
      a.reps && `×${a.reps}`,
      a.targetTempo && `♩=${a.targetTempo}`,
    ].filter(Boolean).join(" ・ "),
    comment: a.comment,
    done: a.doneAt != null,
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
      }))}
    />
  )
}
