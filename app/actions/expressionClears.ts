"use server"

// 表現クリア認定 (2026-08-06 Tetsuo確定・案C)。
// 先生が「この曲(★N)でこの表現ができていた」と認定 → UserExpressionClear に記録。
// 表現力レベル = そのタグでクリアした曲の最高★ (下がらない)。
// 入口は2つ: ①宿題の提出確認 ②生徒カルテ (どちらも本アクションを呼ぶ)。
import { prisma } from "@/app/_libs/prisma"
import { requireAuthAction } from "@/app/_libs/requireAuth"
import { isValidCuid } from "@/app/_libs/validators"
import { isMoodTagId } from "@/app/_libs/moodTags"
import { notifyStudent } from "@/app/_libs/teacherEmailNotify"

export async function recordExpressionClear(input: {
  studentId: string
  moodTagId: string
  scoreId: string
  /** 一緒に送られた練習後カルテ (案A・2026-08-11) */
  karteId?: string | null
}): Promise<{ ok: true; star: number } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  const teacher = auth.user.dbUser
  if (teacher.role !== "teacher") return { ok: false, error: "先生アカウントが必要です" }
  if (!isMoodTagId(input.moodTagId)) return { ok: false, error: "表現タグが不正です" }
  if (!isValidCuid(input.studentId) || !isValidCuid(input.scoreId)) return { ok: false, error: "対象が不正です" }

  const link = await prisma.teacherStudent.findUnique({
    where: { teacherId_studentId: { teacherId: teacher.id, studentId: input.studentId } },
    select: { id: true },
  })
  if (!link) return { ok: false, error: "担当していない生徒です" }

  const score = await prisma.score.findFirst({
    where: { id: input.scoreId, deletedAt: null },
    select: { star: true, title: true },
  })
  if (!score) return { ok: false, error: "曲が見つかりません" }
  const star = score.star ?? 1

  try {
    // 同じ曲×タグは1回 (再認定は上書きでなく既存維持 — ★は曲に固有なので変わらない)
    await prisma.userExpressionClear.upsert({
      where: {
        userId_moodTagId_scoreId: {
          userId: input.studentId, moodTagId: input.moodTagId, scoreId: input.scoreId,
        },
      },
      create: {
        userId: input.studentId, teacherId: teacher.id,
        moodTagId: input.moodTagId, scoreId: input.scoreId, starAtClear: star,
        karteId: input.karteId ?? null,
      },
      update: input.karteId ? { karteId: input.karteId } : {},
    })
    await notifyStudent(input.studentId, teacher.id, "expression", `${score.title}での表現を認定`)
    return { ok: true, star }
  } catch (e) {
    console.error("[expressionClears] record failed:", e)
    return { ok: false, error: "記録に失敗しました" }
  }
}
