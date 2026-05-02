"use server"

import { prisma } from "@/app/_libs/prisma"
import { requireAuthAction } from "@/app/_libs/requireAuth"
import { isValidCuid } from "@/app/_libs/validators"

const MAX_NAME_LENGTH = 10

export type RenamePerformanceParams = {
  performanceId: string
  kind: "score" | "practice"
  name: string
}

export type RenamePerformanceResult =
  | { ok: true; name: string }
  | { ok: false; error: string }

export async function renamePerformance(
  params: RenamePerformanceParams
): Promise<RenamePerformanceResult> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  const dbUserId = auth.user.dbUser.id

  if (!isValidCuid(params.performanceId)) {
    return { ok: false, error: "performanceId が不正です" }
  }

  const trimmed = params.name.trim()
  if (trimmed.length === 0) {
    return { ok: false, error: "名前を入力してください" }
  }
  if (trimmed.length > MAX_NAME_LENGTH) {
    return { ok: false, error: `${MAX_NAME_LENGTH}文字以内で入力してください` }
  }

  if (params.kind === "score") {
    const owned = await prisma.performance.findFirst({
      where: { id: params.performanceId, userId: dbUserId },
      select: { id: true },
    })
    if (!owned) return { ok: false, error: "Performance が見つかりません" }
    await prisma.performance.update({
      where: { id: params.performanceId },
      data: { name: trimmed },
    })
  } else {
    const owned = await prisma.practicePerformance.findFirst({
      where: { id: params.performanceId, userId: dbUserId },
      select: { id: true },
    })
    if (!owned) return { ok: false, error: "PracticePerformance が見つかりません" }
    await prisma.practicePerformance.update({
      where: { id: params.performanceId },
      data: { name: trimmed },
    })
  }

  return { ok: true, name: trimmed }
}
