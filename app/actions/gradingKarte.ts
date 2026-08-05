"use server"

// 採点カルテ (2026-08-06 Tetsuo確定・モック103dcadf): 「生徒の演奏を先生が聴いて返す」の統一。
// 入口 (👂依頼 / 宿題提出 / 先生の自発) が何であれ、返すのはこの1枚:
//   譜面添削 (TeacherFeedback.data・既存の自動保存) + 💬コメント + 🎨表現クリア認定。
// 「カルテを返す」で該当曲の👂依頼は自動解決し、生徒に通知が届く。
import { prisma } from "@/app/_libs/prisma"
import { requireAuthAction } from "@/app/_libs/requireAuth"
import { isValidCuid } from "@/app/_libs/validators"
import { isMoodTagId } from "@/app/_libs/moodTags"
import { notifyStudent } from "@/app/_libs/teacherEmailNotify"

export async function returnGradingKarte(input: {
  studentId: string
  scoreId: string
  comment?: string | null
  moodTagId?: string | null
}): Promise<{ ok: true; clearedStar: number | null } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  const teacher = auth.user.dbUser
  if (teacher.role !== "teacher") return { ok: false, error: "先生アカウントが必要です" }
  if (!isValidCuid(input.studentId) || !isValidCuid(input.scoreId)) return { ok: false, error: "対象が不正です" }

  const link = await prisma.teacherStudent.findUnique({
    where: { teacherId_studentId: { teacherId: teacher.id, studentId: input.studentId } },
    select: { id: true },
  })
  if (!link) return { ok: false, error: "担当していない生徒です" }

  const comment = (input.comment ?? "").trim().slice(0, 500) || null
  try {
    // 💬 コメントを添削データ(JSON)に同居させる (migration不要・添削の自動保存と衝突しないようマージ)
    const existing = await prisma.teacherFeedback.findFirst({
      where: { teacherId: teacher.id, studentId: input.studentId, scoreId: input.scoreId },
      select: { id: true, data: true },
    })
    const merged = {
      ...((existing?.data as Record<string, unknown> | null) ?? {}),
      comment,
      returnedAt: new Date().toISOString(),
    }
    if (existing) {
      await prisma.teacherFeedback.update({ where: { id: existing.id }, data: { data: merged } })
    } else {
      await prisma.teacherFeedback.create({
        data: { teacherId: teacher.id, studentId: input.studentId, scoreId: input.scoreId, data: merged },
      })
    }

    // 🎨 表現クリア認定 (任意): 曲の★がそのまま表現力レベルに
    let clearedStar: number | null = null
    if (input.moodTagId && isMoodTagId(input.moodTagId)) {
      const score = await prisma.score.findFirst({
        where: { id: input.scoreId, deletedAt: null }, select: { star: true },
      })
      if (score) {
        clearedStar = score.star ?? 1
        await prisma.userExpressionClear.upsert({
          where: {
            userId_moodTagId_scoreId: {
              userId: input.studentId, moodTagId: input.moodTagId, scoreId: input.scoreId,
            },
          },
          create: {
            userId: input.studentId, teacherId: teacher.id,
            moodTagId: input.moodTagId, scoreId: input.scoreId, starAtClear: clearedStar,
          },
          update: {},
        })
      }
    }

    // 👂 この曲の未対応リクエストを自動解決 (旧「対応済みにする」の代替)
    await prisma.listenRequest.updateMany({
      where: { teacherId: teacher.id, studentId: input.studentId, scoreId: input.scoreId, status: "pending" },
      data: { status: "done", resolvedAt: new Date() },
    })

    await notifyStudent(input.studentId, teacher.id, "feedback", comment)
    return { ok: true, clearedStar }
  } catch (e) {
    console.error("[gradingKarte] return failed:", e)
    return { ok: false, error: "返却に失敗しました" }
  }
}
