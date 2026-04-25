"use server"

import { prisma } from "@/app/_libs/prisma"
import { requireAuthAction } from "@/app/_libs/requireAuth"
import { isValidCuid } from "@/app/_libs/validators"
import { revalidatePath } from "next/cache"

/**
 * スコアを論理削除する (deletedAt にタイムスタンプ設定)。
 * - 認証必須
 * - cuid 形式検証
 * - 所有者検証 (Score.createdById === dbUser.id)
 * - 既に削除済み (deletedAt !== null) は冪等的に { ok: true } を返す
 * - 物理削除は行わない (Performance との外部キー整合性維持 + 復旧可能性)
 */
export async function deleteScore(
  scoreId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  const dbUserId = auth.user.dbUser.id
  const supabaseUserId = auth.user.supabaseUser.id

  if (!isValidCuid(scoreId)) {
    return { ok: false, error: "scoreId が不正です" }
  }

  const score = await prisma.score.findUnique({
    where: { id: scoreId },
    select: { id: true, createdById: true, deletedAt: true },
  })
  if (!score || score.createdById !== dbUserId) {
    return { ok: false, error: "Score が見つかりません" }
  }

  if (score.deletedAt !== null) {
    revalidatePath(`/${supabaseUserId}/scores`)
    revalidatePath(`/${supabaseUserId}`)
    return { ok: true }
  }

  try {
    await prisma.score.update({
      where: { id: scoreId },
      data: { deletedAt: new Date() },
    })
  } catch (e) {
    console.error("[deleteScore] DB update failed:", e)
    return {
      ok: false,
      error: e instanceof Error ? e.message : "削除に失敗しました",
    }
  }

  revalidatePath(`/${supabaseUserId}/scores`)
  revalidatePath(`/${supabaseUserId}`)
  return { ok: true }
}
