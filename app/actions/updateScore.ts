"use server"

import { prisma } from "@/app/_libs/prisma"
import { requireAuthAction } from "@/app/_libs/requireAuth"
import { isValidCuid } from "@/app/_libs/validators"
import { revalidatePath } from "next/cache"

const MAX_TITLE_LEN = 100

/**
 * スコアの楽曲名 (title) を更新する。
 * - 認証必須
 * - cuid 形式検証
 * - 所有者検証 (Score.createdById === dbUser.id)
 * - 論理削除済み (deletedAt !== null) のスコアは更新不可
 * - composer / arranger / deletedAt 等への書き込みは行わない
 */
export async function updateScoreTitle(
  scoreId: string,
  newTitle: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuthAction()
  if (!auth.ok) return { ok: false, error: auth.error }
  const dbUserId = auth.user.dbUser.id
  const supabaseUserId = auth.user.supabaseUser.id

  if (!isValidCuid(scoreId)) {
    return { ok: false, error: "scoreId が不正です" }
  }

  const trimmedTitle = newTitle.trim()
  if (trimmedTitle.length === 0) {
    return { ok: false, error: "曲名を入力してください" }
  }
  if (trimmedTitle.length > MAX_TITLE_LEN) {
    return { ok: false, error: `曲名は${MAX_TITLE_LEN}文字以内で入力してください` }
  }

  // 所有者検証 + 論理削除済みチェック
  const score = await prisma.score.findUnique({
    where: { id: scoreId },
    select: { id: true, createdById: true, deletedAt: true },
  })
  if (!score || score.createdById !== dbUserId) {
    // 存在しない / 他者所有 / 共有スコア(admin作) を全て同じエラー文言で返す
    // (エンティティ列挙防止 + 共有スコアは編集対象外)
    return { ok: false, error: "Score が見つかりません" }
  }
  if (score.deletedAt !== null) {
    return { ok: false, error: "削除されたスコアは編集できません" }
  }

  try {
    await prisma.score.update({
      where: { id: scoreId },
      data: { title: trimmedTitle },
    })
  } catch (e) {
    console.error("[updateScoreTitle] DB update failed:", e)
    return {
      ok: false,
      error: e instanceof Error ? e.message : "更新に失敗しました",
    }
  }

  revalidatePath(`/${supabaseUserId}/scores`)
  return { ok: true }
}
