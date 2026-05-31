"use server"

// admin が教材管理画面から「公式教材」を削除するためのサーバアクション。
//
// - PracticeItem: 物理削除 (deletedAt カラムを持たないため)。
//     PracticeItemTechnique のみ FK が onDelete:Cascade ではないので手動削除し、
//     その後 PracticeItem を削除 (PracticePerformance / SubTaskAssignment /
//     UserPracticeMastery / PracticeItemSubTaskTag は Cascade で自動削除)。
//     公式教材 (ownerUserId = null) のみ対象 (ユーザー所有データの保護)。
// - Score: 論理削除 (deletedAt 設定)。deleteScore.ts と同じく Performance との
//     FK 整合・復旧可能性のため物理削除はしない。

import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { isValidCuid } from "@/app/_libs/validators"
import { revalidatePath } from "next/cache"

export type DeleteAdminMaterialResult =
  | { success: true; id: string }
  | { error: string }

export async function deleteAdminMaterial(
  type: "practice" | "score",
  id: string,
): Promise<DeleteAdminMaterialResult> {
  // admin チェック
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "ログインが必要です" }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id },
  })
  if (!dbUser || dbUser.role !== "admin") {
    return { error: "管理者権限が必要です" }
  }

  if (!isValidCuid(id)) return { error: "ID が不正です" }

  if (type === "practice") {
    const item = await prisma.practiceItem.findUnique({
      where: { id },
      select: { id: true, ownerUserId: true },
    })
    if (!item) return { error: "教材が見つかりません" }
    // 公式教材 (運営サンプル) のみ削除可。ユーザー所有教材は保護。
    if (item.ownerUserId !== null) {
      return { error: "ユーザー所有の教材は削除できません" }
    }
    try {
      await prisma.$transaction([
        // FK が Cascade でない PracticeItemTechnique を先に削除
        prisma.practiceItemTechnique.deleteMany({ where: { practiceItemId: id } }),
        // 本体削除 (残りの関連は onDelete:Cascade で自動削除)
        prisma.practiceItem.delete({ where: { id } }),
      ])
    } catch (e) {
      console.error("[deleteAdminMaterial] practiceItem delete failed:", e)
      return { error: e instanceof Error ? e.message : "削除に失敗しました" }
    }
  } else {
    const score = await prisma.score.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    })
    if (!score) return { error: "曲が見つかりません" }
    try {
      await prisma.score.update({
        where: { id },
        data: { deletedAt: new Date() },
      })
    } catch (e) {
      console.error("[deleteAdminMaterial] score soft-delete failed:", e)
      return { error: e instanceof Error ? e.message : "削除に失敗しました" }
    }
  }

  revalidatePath("/admin/practice")
  return { success: true, id }
}
