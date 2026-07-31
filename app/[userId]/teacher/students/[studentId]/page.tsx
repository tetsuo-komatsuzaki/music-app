// 生徒カルテ (2026-07-28)。概要(レッスン前ブリーフィング) + 宿題タブ。
// 担当していない生徒なら /teacher へ戻す。将来: 診断/添削タブをここに足す。
import { redirect } from "next/navigation"
import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { storageAdmin } from "@/app/_libs/storageAdmin"
import { encodeSignedUrl } from "@/app/_libs/encodeSignedUrl"
import { categoryLabel } from "@/app/_libs/practiceConstants"
import { SUBTASK_BY_ID } from "@/app/_libs/subtaskCatalog.generated"
import StudentKarte from "./StudentKarte"

// 演奏の analysisSummary.diagnosis から上位の弱点パターンを抽出 (§5-1: ミス集中箇所・原因候補)
type WeakSlot = { name: string; tree: "音程" | "リズム"; miss: number; target: number }
function topWeak(analysisSummary: unknown): WeakSlot[] {
  const dj = (analysisSummary as { diagnosis?: {
    map_available?: boolean
    per_subtask?: Record<string, { miss: number; target: number }>
    diagnosis?: { pitch?: string[]; rhythm?: string[] }
  } })?.diagnosis
  if (!dj || !dj.map_available) return []
  const out: WeakSlot[] = []
  for (const tree of ["pitch", "rhythm"] as const) {
    for (const sid of dj.diagnosis?.[tree] ?? []) {
      const def = SUBTASK_BY_ID[sid]
      if (!def || !def.diagnosable) continue
      const c = dj.per_subtask?.[sid] ?? { miss: 0, target: 0 }
      out.push({ name: def.name, tree: tree === "pitch" ? "音程" : "リズム", miss: c.miss, target: c.target })
    }
  }
  return out.slice(0, 3)
}

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
        doneAt: true, submittedAt: true, submittedScore: true, createdAt: true,
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

  // ── 練習タブ (§5-1 拡充): 取り組んでいる曲/教材 + 直近の録音(分析結果 + 音声) ──
  const [scorePerfs, pracPerfs] = await Promise.all([
    prisma.performance.findMany({
      where: { userId: studentId, pitchAccuracy: { not: null }, timingAccuracy: { not: null } },
      orderBy: { uploadedAt: "desc" }, take: 12,
      select: { id: true, uploadedAt: true, pitchAccuracy: true, timingAccuracy: true, audioPath: true, rangeFromNote: true, analysisSummary: true, score: { select: { title: true } } },
    }),
    prisma.practicePerformance.findMany({
      where: { userId: studentId, pitchAccuracy: { not: null }, timingAccuracy: { not: null } },
      orderBy: { uploadedAt: "desc" }, take: 12,
      select: { id: true, uploadedAt: true, pitchAccuracy: true, timingAccuracy: true, audioPath: true, analysisSummary: true, practiceItem: { select: { title: true, category: true } } },
    }),
  ])
  const avg2 = (p: number | null, t: number | null) => Math.round(((p ?? 0) + (t ?? 0)) / 2)
  type RecRaw = { id: string; at: number; title: string; cat: string; pitch: number; timing: number; avg: number; audioPath: string; weak: WeakSlot[] }
  const recRaw: RecRaw[] = [
    ...scorePerfs.map((p) => ({
      id: p.id, at: p.uploadedAt.getTime(), title: p.score?.title ?? "曲",
      cat: p.rangeFromNote != null ? "曲（区間）" : "曲",
      pitch: Math.round(p.pitchAccuracy ?? 0), timing: Math.round(p.timingAccuracy ?? 0), avg: avg2(p.pitchAccuracy, p.timingAccuracy),
      audioPath: p.audioPath, weak: topWeak(p.analysisSummary),
    })),
    ...pracPerfs.map((p) => ({
      id: p.id, at: p.uploadedAt.getTime(), title: p.practiceItem?.title ?? "教材",
      cat: p.practiceItem?.category ? categoryLabel(p.practiceItem.category) : "基礎練",
      pitch: Math.round(p.pitchAccuracy ?? 0), timing: Math.round(p.timingAccuracy ?? 0), avg: avg2(p.pitchAccuracy, p.timingAccuracy),
      audioPath: p.audioPath, weak: topWeak(p.analysisSummary),
    })),
  ].sort((a, b) => b.at - a.at).slice(0, 12)

  // 音声の署名URL (先生が聴ける)
  const recordings = await Promise.all(recRaw.map(async (r) => ({
    id: r.id, title: r.title, cat: r.cat, pitch: r.pitch, timing: r.timing, avg: r.avg, weak: r.weak,
    date: new Date(r.at).toLocaleDateString("ja-JP"),
    audioUrl: r.audioPath
      ? await storageAdmin.storage.from("performances").createSignedUrl(r.audioPath, 600).then((x) => encodeSignedUrl(x.data?.signedUrl)).catch(() => null)
      : null,
  })))

  // 取り組んでいる曲・教材 (直近の録音から重複除去・最新スコア)
  const seenWork = new Set<string>()
  const working = recRaw.filter((r) => { const k = `${r.cat}:${r.title}`; if (seenWork.has(k)) return false; seenWork.add(k); return true })
    .slice(0, 10).map((r) => ({ title: r.title, cat: r.cat, avg: r.avg }))

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
      working={working}
      recordings={recordings}
      assignments={assignments.map((a) => ({
        id: a.id,
        targetTitle: a.score?.title ?? a.practiceItem?.title ?? "課題",
        targetMeasures: a.targetMeasures,
        reps: a.reps,
        targetTempo: a.targetTempo,
        comment: a.comment,
        done: a.doneAt != null,
        submitted: a.submittedAt != null,
        submittedScore: a.submittedScore,
        createdAt: a.createdAt.toLocaleDateString("ja-JP"),
      }))}
    />
  )
}
