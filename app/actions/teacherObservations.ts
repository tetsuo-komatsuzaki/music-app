"use server"

// 先生の所見 (2026-08-02)。癖タグ(選択式)+程度+任意コメントで記録する。
// タグの正本は app/_libs/observationCatalog.ts。生徒にも表示される。
import { prisma } from "@/app/_libs/prisma"
import { requireAuthAction } from "@/app/_libs/requireAuth"
import { notifyStudent } from "@/app/_libs/teacherEmailNotify"
import { OBSERVATION_TAG_BY_ID } from "@/app/_libs/observationCatalog"

export async function createObservation(input: {
  studentId: string
  tagIds: string[]
  severity?: "mild" | "focus" | null
  comment?: string | null
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  if (auth.user.dbUser.role !== "teacher") return { ok: false, error: "先生アカウントが必要です" }
  const teacherId = auth.user.dbUser.id

  // カタログに存在するタグだけ受け付ける
  const tagIds = [...new Set((input.tagIds ?? []).filter((t) => OBSERVATION_TAG_BY_ID[t]))].slice(0, 12)
  const comment = (input.comment ?? "").trim().slice(0, 500) || null
  if (tagIds.length === 0 && !comment) return { ok: false, error: "タグを選ぶかコメントを書いてください" }
  const severity = input.severity === "mild" || input.severity === "focus" ? input.severity : null

  try {
    const link = await prisma.teacherStudent.findUnique({
      where: { teacherId_studentId: { teacherId, studentId: input.studentId } },
      select: { id: true },
    })
    if (!link) return { ok: false, error: "担当していない生徒です" }

    await prisma.teacherObservation.create({
      data: { teacherId, studentId: input.studentId, tagIds, severity, comment },
    })

    const preview = tagIds.map((t) => OBSERVATION_TAG_BY_ID[t].label).join("・") || comment || ""
    await notifyStudent(input.studentId, teacherId, "observation", preview)
    return { ok: true }
  } catch {
    return { ok: false, error: "保存に失敗しました" }
  }
}
