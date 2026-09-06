// 先生とのやりとり (生徒側・2026-07-28)。先生を登録している生徒だけがアクセスできる。
// 通常の生徒シェル内で表示。タブ: すべて(これまでのやりとり) / 宿題 / 添削 / メッセージ。
// Phase 1: すべて・宿題は既存の宿題データから。添削・メッセージは Phase 1.5。
import { redirect } from "next/navigation"
import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { getAchievementFlags } from "@/app/_libs/achievementFlags"
import { categoryLabel } from "@/app/_libs/practiceConstants"
import { resolveObsTag } from "@/app/_libs/observationCatalog"
import MyTeacherClient from "./MyTeacherClient"
import GuestGate from "@/app/components/guest/GuestGate"
import { GATE_TEXT } from "@/app/components/guest/gateText"
import { GUEST_ID } from "@/app/_libs/viewer"

export const metadata = { title: "先生とのやりとり" }

export default async function MyTeacherPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  // ゲスト閲覧 (2026-09-06): 見本データで本物の画面を描き、上にゲートを重ねる (先生とつながると何が届くかを見せる)
  if (userId === GUEST_ID) {
    const g = GATE_TEXT.teacher
    return (
      <GuestGate title={g.title} items={[...g.items]}>
        <MyTeacherClient
          userId={userId}
          teacherName="山田"
          since="2026/7/28"
          timeline={[
            { when: "2026/9/4", kind: "comment", text: "先生：ラの音が高め。3の指を少し手前に。・メヌエット の演奏へ" },
            { when: "2026/9/2", kind: "hw", text: "宿題「メヌエット」第1〜8小節 ×3" },
          ]}
          homework={[
            { id: "sample-hw-1", title: "メヌエット", detail: "×3 ・ ♩=80", comment: "ゆっくり正確に", dueDate: null, goalType: "score", targetScore: 80, achieved: false, mastered: false, done: false, submitted: false, submittedScore: null, date: "2026/9/2", href: `/${userId}/library` },
            { id: "sample-hw-2", title: "ト長調の音階", detail: "×5", comment: null, dueDate: null, goalType: null, targetScore: null, achieved: false, mastered: false, done: false, submitted: false, submittedScore: null, date: "2026/8/30", href: `/${userId}/library?tab=basics` },
          ]}
          karteItems={[{ when: "2026-09-04T00:00:00.000Z", title: "メヌエット", href: `/${userId}/library`, body: "ラの音が高め。3の指を少し手前に。" }]}
          passedItems={[]}
          feedbacks={[]}
          lessons={{ open: [], booked: [] }}
          nextLessonLabel="木曜 17:00"
        />
      </GuestGate>
    )
  }
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

  // 先生からの未読メッセージ・練習後カルテを既読化 (開いた時点)
  await prisma.message.updateMany({
    where: { studentId: me.id, teacherId: link.teacher.id, fromTeacher: true, readAt: null },
    data: { readAt: new Date() },
  })
  try {
    await prisma.practiceKarte.updateMany({
      where: { studentId: me.id, teacherId: link.teacher.id, readAt: null },
      data: { readAt: new Date() },
    })
  } catch { /* migration未適用でも画面は出す */ }
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

  // 練習後カルテタブ (2026-08-11 Tetsuo確定): カルテ=曲/教材にぶら下がる独立エンティティ (PracticeKarte)。
  // 曲はスコア画面の練習後カルテタブへ、教材は教材ページへリンク。
  let karteItems: { when: string; title: string; href: string; body: string }[] = []
  try {
    const karteRows = await prisma.practiceKarte.findMany({
      where: { studentId: me.id, teacherId: link.teacher.id },
      orderBy: { createdAt: "desc" }, take: 100,
      select: {
        id: true, body: true, createdAt: true,
        score: { select: { id: true, title: true } },
        practiceItem: { select: { id: true, title: true, category: true } },
      },
    })
    karteItems = karteRows
      .filter((k) => k.score || k.practiceItem)
      .map((k) => ({
        when: k.createdAt.toISOString(),
        title: k.score?.title ?? k.practiceItem!.title,
        href: k.score
          ? `/${userId}/scores/${k.score.id}?tab=karte`
          : `/${userId}/practice/${k.practiceItem!.category}/${k.practiceItem!.id}`,
        body: k.body,
      }))
  } catch { karteItems = [] }

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
      doneAt: true, passedAt: true, submittedAt: true, submittedScore: true, createdAt: true,
      score: { select: { id: true, title: true, star: true } },
      practiceItem: { select: { id: true, title: true, category: true, star: true } },
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
    passed: a.passedAt != null,
    submitted: a.submittedAt != null,
    submittedScore: a.submittedScore,
    date: a.createdAt.toLocaleDateString("ja-JP"),
    href: a.score
      ? `/${userId}/scores/${a.score.id}`
      : a.practiceItem
        ? `/${userId}/practice/${a.practiceItem.category}/${a.practiceItem.id}`
        : `/${userId}`,
  }))

  // 合格の履歴 (2026-08-11): カテゴリ→★でまとめる共有ビュー用
  const md = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`
  const passedItems = assignments
    .filter((a) => a.passedAt != null)
    .map((a) => ({
      title: a.score?.title ?? a.practiceItem?.title ?? "課題",
      cat: a.score ? "曲" : a.practiceItem ? categoryLabel(a.practiceItem.category) : "その他",
      star: a.score?.star ?? a.practiceItem?.star ?? null,
      when: md(a.passedAt as Date),
      score: a.submittedScore,
    }))

  // 「すべて＝これまでのやりとり」: いまは宿題とそのコメントをイベント化して時系列に
  type Ev = { at: number; when: string; kind: "hw" | "comment"; text: string; href?: string; icon?: string }
  const events: Ev[] = []
  for (const a of assignments) {
    events.push({
      at: a.createdAt.getTime(),
      when: a.createdAt.toLocaleDateString("ja-JP"),
      kind: "hw",
      icon: "pin",
      text: `宿題「${a.score?.title ?? a.practiceItem?.title ?? "課題"}」${[a.targetMeasures && `第${a.targetMeasures}小節`, a.reps && `×${a.reps}`].filter(Boolean).join(" ")}`,
      href: hw.find((h) => h.id === a.id)?.href,
    })
    if (a.comment) {
      events.push({
        at: a.createdAt.getTime() + 1,
        when: a.createdAt.toLocaleDateString("ja-JP"),
        kind: "comment",
        icon: "message",
        text: `${a.comment}`,
      })
    }
    if (a.submittedAt) {
      events.push({
        at: a.submittedAt.getTime(),
        when: a.submittedAt.toLocaleDateString("ja-JP"),
        kind: "hw",
        icon: "upload",
        text: `「${a.score?.title ?? a.practiceItem?.title ?? "課題"}」を提出${a.submittedScore != null ? `・${a.submittedScore}点` : ""}`,
      })
    }
  }
  // 先生コメント (演奏紐づき) / お祝い は「すべて」タイムラインに集約して見せる
  // (自由チャットの「メッセージ」タブは廃止・2026-08-09。コメントは成果物に紐づく形へ一本化)
  for (const m of messages) {
    const perf = m.performanceId ? perfMap.get(m.performanceId) : null
    events.push({
      at: m.createdAt.getTime(),
      when: m.createdAt.toLocaleDateString("ja-JP"),
      kind: "comment",
      icon: m.kind === "celebration" ? "party" : m.fromTeacher ? "message" : "you",
      text: m.kind === "celebration"
        ? `先生からのお祝い：${m.body}`
        : `${m.fromTeacher ? "先生" : "あなた"}：${m.body}${perf ? `・${perf.title} の演奏へ` : ""}`,
      href: perf?.href,
    })
  }

  // 先生の所見 (癖タグ・2026-08-02): 生徒にも表示する
  try {
    const obsRows = await prisma.teacherObservation.findMany({
      where: { studentId: me.id, teacherId: link.teacher.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { tagIds: true, severity: true, comment: true, createdAt: true },
    })
    for (const o of obsRows) {
      const tags = o.tagIds.map((t) => resolveObsTag(t)?.label).filter(Boolean).join("・")
      const sev = o.severity === "focus" ? "【要重点】" : ""
      const body = [tags, o.comment].filter(Boolean).join(" — ")
      events.push({
        at: o.createdAt.getTime(),
        when: o.createdAt.toLocaleDateString("ja-JP"),
        kind: "comment",
        icon: "clipboard",
        text: `先生の所見${sev}：${body}`,
      })
    }
  } catch { /* テーブル未整備時は無視 */ }

  events.sort((x, y) => y.at - x.at)

  return (
    <MyTeacherClient
      userId={userId}
      teacherName={link.teacher.name}
      since={link.createdAt.toLocaleDateString("ja-JP")}
      timeline={events.map(({ when, kind, text, href }) => ({ when, kind, text, href }))}
      homework={hw}
      karteItems={karteItems}
      passedItems={passedItems}
      feedbacks={feedbacks}
      lessons={lessons}
      nextLessonLabel={nextLessonLabel}
    />
  )
}
