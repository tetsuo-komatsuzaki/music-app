"use server"

// レッスン予約 (2026-08-01 Phase3)。先生が空き枠を作り、生徒が予約する。
import { prisma } from "@/app/_libs/prisma"
import { requireAuthAction } from "@/app/_libs/requireAuth"

/** 先生: 空き枠を作る。 */
export async function createLessonSlot(input: {
  startAtIso: string; durationMin: number; online: boolean; locationNote: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  if (auth.user.dbUser.role !== "teacher") return { ok: false, error: "先生アカウントが必要です" }
  const startAt = new Date(input.startAtIso)
  if (Number.isNaN(startAt.getTime())) return { ok: false, error: "日時が不正です" }
  if (startAt.getTime() < Date.now()) return { ok: false, error: "過去の日時は指定できません" }
  const dur = Math.min(180, Math.max(10, Math.round(input.durationMin || 30)))
  try {
    await prisma.lesson.create({
      data: {
        teacherId: auth.user.dbUser.id, startAt, durationMin: dur,
        online: !!input.online, locationNote: (input.locationNote || "").trim().slice(0, 200) || null,
        status: "open",
      },
    })
    return { ok: true }
  } catch {
    return { ok: false, error: "作成に失敗しました" }
  }
}

/** 先生: 枠/予約を取り消す。 */
export async function cancelLesson(lessonId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  try {
    const l = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { teacherId: true } })
    if (!l || l.teacherId !== auth.user.dbUser.id) return { ok: false, error: "対象がありません" }
    await prisma.lesson.update({ where: { id: lessonId }, data: { status: "cancelled" } })
    return { ok: true }
  } catch {
    return { ok: false, error: "取り消しに失敗しました" }
  }
}

/** 生徒: 空き枠を予約する。 */
export async function bookLesson(lessonId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  try {
    const l = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { teacherId: true, status: true, startAt: true } })
    if (!l || l.status !== "open") return { ok: false, error: "この枠は予約できません" }
    if (l.startAt.getTime() < Date.now()) return { ok: false, error: "過去の枠です" }
    // 自分の先生の枠であることを確認
    const link = await prisma.teacherStudent.findUnique({
      where: { teacherId_studentId: { teacherId: l.teacherId, studentId: auth.user.dbUser.id } },
      select: { id: true },
    })
    if (!link) return { ok: false, error: "担当の先生の枠ではありません" }
    // 二重予約防止: status=open のときだけ確定
    const res = await prisma.lesson.updateMany({
      where: { id: lessonId, status: "open" },
      data: { studentId: auth.user.dbUser.id, status: "booked" },
    })
    if (res.count === 0) return { ok: false, error: "先に予約が入りました" }
    return { ok: true }
  } catch {
    return { ok: false, error: "予約に失敗しました" }
  }
}

/** 生徒: 自分の予約を取り消す(枠は空きに戻す)。 */
export async function cancelMyBooking(lessonId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  try {
    const l = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { studentId: true } })
    if (!l || l.studentId !== auth.user.dbUser.id) return { ok: false, error: "対象がありません" }
    await prisma.lesson.update({ where: { id: lessonId }, data: { studentId: null, status: "open" } })
    return { ok: true }
  } catch {
    return { ok: false, error: "取り消しに失敗しました" }
  }
}
