"use server"

// 表現の評価 (2026-08-03 カルテv2 Phase0-3)。
// 先生が生徒の表現技法を 💪とくい/🔥挑戦中/🌿良くなってきた として記録する。
// 保存は TeacherObservation を共用 (tagId=expr_*・severity=状態)。癖と同じく
// 「タグの現在状態 = そのタグを含む最新行」。挑戦中→🌿→💪の昇格が時系列で残る。
import { prisma } from "@/app/_libs/prisma"
import { requireAuthAction } from "@/app/_libs/requireAuth"
import { notifyStudent } from "@/app/_libs/teacherEmailNotify"
import {
  EXPRESSION_TAG_BY_ID, EXPR_FREE_PREFIX, isExpressionTagId, expressionLabel,
  type ExpressionStatus,
} from "@/app/_libs/expressionCatalog"

export async function recordExpressionReview(input: {
  studentId: string
  /** カタログID (expr_*) または 自由入力ラベル (freeLabel と排他) */
  tagId?: string | null
  freeLabel?: string | null
  status: ExpressionStatus
  comment?: string | null
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  if (auth.user.dbUser.role !== "teacher") return { ok: false, error: "先生アカウントが必要です" }
  const teacherId = auth.user.dbUser.id

  if (!["strength", "improving", "challenge"].includes(input.status)) {
    return { ok: false, error: "不明な状態です" }
  }
  // タグ確定: カタログ or 自由入力
  let tagId: string
  if (input.tagId && EXPRESSION_TAG_BY_ID[input.tagId]) {
    tagId = input.tagId
  } else {
    const free = (input.freeLabel ?? "").trim().slice(0, 30)
    if (!free) return { ok: false, error: "表現を選ぶか入力してください" }
    tagId = `${EXPR_FREE_PREFIX}${free}`
  }
  if (!isExpressionTagId(tagId)) return { ok: false, error: "不正なタグです" }
  const comment = (input.comment ?? "").trim().slice(0, 500) || null

  try {
    const link = await prisma.teacherStudent.findUnique({
      where: { teacherId_studentId: { teacherId, studentId: input.studentId } },
      select: { id: true },
    })
    if (!link) return { ok: false, error: "担当していない生徒です" }

    await prisma.teacherObservation.create({
      data: { teacherId, studentId: input.studentId, tagIds: [tagId], severity: input.status, comment },
    })

    const label = expressionLabel(tagId)
    const preview =
      input.status === "strength" ? `💪「${label}」はきみの強み！と先生が評価しました`
      : input.status === "improving" ? `🌿「${label}」が良くなってきた、と先生が評価しました`
      : `🔥「${label}」に挑戦しよう、と先生が評価しました`
    await notifyStudent(input.studentId, teacherId, "expression", preview)
    return { ok: true }
  } catch {
    return { ok: false, error: "保存に失敗しました" }
  }
}
