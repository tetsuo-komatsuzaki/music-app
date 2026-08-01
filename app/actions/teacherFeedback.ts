"use server"

// 添削 (2026-07-29 Phase1.5-c)。先生が特定の生徒の曲/教材に譜面注釈を書き込む。
// data は ScoreAnnotation と同形式(highlight/warnings/notation)。描画は AnnotationLayer を流用。
import { prisma } from "@/app/_libs/prisma"
import { requireAuthAction } from "@/app/_libs/requireAuth"
import { isValidCuid } from "@/app/_libs/validators"
import { notifyStudent } from "@/app/_libs/teacherEmailNotify"
import type { AnnotationData } from "@/app/actions/scoreAnnotations"

type Target = { scoreId?: string; practiceItemId?: string }

function validTarget(t: Target): boolean {
  if (t.practiceItemId) return isValidCuid(t.practiceItemId)
  if (t.scoreId) return isValidCuid(t.scoreId)
  return false
}

/** 先生: 担当生徒の曲/教材への添削(注釈)を取得。編集用。 */
export async function getFeedbackAsTeacher(
  studentId: string, target: Target,
): Promise<{ ok: true; data: AnnotationData } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  if (auth.user.dbUser.role !== "teacher") return { ok: false, error: "先生アカウントが必要です" }
  if (!validTarget(target)) return { ok: false, error: "対象が不正です" }
  try {
    const link = await prisma.teacherStudent.findUnique({
      where: { teacherId_studentId: { teacherId: auth.user.dbUser.id, studentId } },
      select: { id: true },
    })
    if (!link) return { ok: false, error: "担当していない生徒です" }
    const rec = await prisma.teacherFeedback.findFirst({
      where: target.practiceItemId
        ? { teacherId: auth.user.dbUser.id, studentId, practiceItemId: target.practiceItemId }
        : { teacherId: auth.user.dbUser.id, studentId, scoreId: target.scoreId },
      select: { data: true },
    })
    return { ok: true, data: (rec?.data as AnnotationData | null) ?? {} }
  } catch {
    return { ok: false, error: "取得に失敗しました" }
  }
}

/** 先生: 添削を保存(upsert)。 */
export async function saveFeedback(
  studentId: string, target: Target, data: AnnotationData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  if (auth.user.dbUser.role !== "teacher") return { ok: false, error: "先生アカウントが必要です" }
  if (!validTarget(target)) return { ok: false, error: "対象が不正です" }
  const teacherId = auth.user.dbUser.id
  try {
    const link = await prisma.teacherStudent.findUnique({
      where: { teacherId_studentId: { teacherId, studentId } },
      select: { id: true },
    })
    if (!link) return { ok: false, error: "担当していない生徒です" }
    const d = data ?? {}
    if (target.practiceItemId) {
      await prisma.teacherFeedback.upsert({
        where: { teacherId_studentId_practiceItemId: { teacherId, studentId, practiceItemId: target.practiceItemId } },
        create: { teacherId, studentId, practiceItemId: target.practiceItemId, data: d },
        update: { data: d },
      })
    } else if (target.scoreId) {
      await prisma.teacherFeedback.upsert({
        where: { teacherId_studentId_scoreId: { teacherId, studentId, scoreId: target.scoreId } },
        create: { teacherId, studentId, scoreId: target.scoreId, data: d },
        update: { data: d },
      })
    }
    await notifyStudent(studentId, teacherId, "feedback")
    return { ok: true }
  } catch {
    return { ok: false, error: "保存に失敗しました" }
  }
}

/** 生徒: 自分の先生からの添削を取得。読み取り専用表示に使う。 */
export async function getFeedbackAsStudent(
  target: Target,
): Promise<{ ok: true; data: AnnotationData; teacherName: string | null } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  if (!validTarget(target)) return { ok: false, error: "対象が不正です" }
  try {
    const link = await prisma.teacherStudent.findFirst({
      where: { studentId: auth.user.dbUser.id },
      orderBy: { createdAt: "asc" },
      select: { teacherId: true, teacher: { select: { name: true } } },
    })
    if (!link) return { ok: true, data: {}, teacherName: null }
    const rec = await prisma.teacherFeedback.findFirst({
      where: target.practiceItemId
        ? { teacherId: link.teacherId, studentId: auth.user.dbUser.id, practiceItemId: target.practiceItemId }
        : { teacherId: link.teacherId, studentId: auth.user.dbUser.id, scoreId: target.scoreId },
      select: { data: true },
    })
    return { ok: true, data: (rec?.data as AnnotationData | null) ?? {}, teacherName: link.teacher.name }
  } catch {
    return { ok: false, error: "取得に失敗しました" }
  }
}
