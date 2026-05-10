"use server"

// 既存 Score の loop engine 必須項目 (difficulty / skillSubTaskTags) を
// admin が編集するためのサーバアクション。
//
// uploadScore.ts のアップロード時には拡張済み。本 action は既存 Score の編集用。
// updatePracticeItemTags.ts と対をなす。

import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { revalidatePath } from "next/cache"
import { Prisma } from "@/app/generated/prisma"
import { SUB_TASK_IDS } from "@/app/_libs/skillMaster"

export type UpdateScoreTagsResult =
  | { success: true; scoreId: string }
  | { error: string }

const VALID_SUB_TASK_IDS = new Set<string>(SUB_TASK_IDS as readonly string[])

export async function updateScoreTags(
  scoreId: string,
  payload: { difficulty: number | null; skillSubTaskTags: string[] },
): Promise<UpdateScoreTagsResult> {
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

  // バリデーション
  if (payload.difficulty != null) {
    if (!Number.isFinite(payload.difficulty)) {
      return { error: "難易度の値が不正です" }
    }
    if (payload.difficulty < 1 || payload.difficulty > 10) {
      return { error: "難易度は 1 〜 10 で指定してください" }
    }
  }

  const cleanedTags = Array.from(
    new Set(payload.skillSubTaskTags.filter(t => VALID_SUB_TASK_IDS.has(t))),
  )

  // 存在チェック (deletedAt=null のみ対象)
  const existing = await prisma.score.findFirst({
    where: { id: scoreId, deletedAt: null },
    select: { id: true },
  })
  if (!existing) return { error: "曲が見つかりません" }

  await prisma.score.update({
    where: { id: scoreId },
    data: {
      star: payload.difficulty, // payload は UI 由来 (difficulty キー)、DB は star
      skillSubTaskTags: cleanedTags as Prisma.InputJsonValue,
    },
  })

  revalidatePath("/admin/practice")
  return { success: true, scoreId }
}
