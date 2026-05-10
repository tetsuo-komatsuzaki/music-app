"use server"

// 既存の PracticeItem の loop engine 必須項目 (star / skillSubTaskTags) を
// admin が編集するためのサーバアクション。
//
// アップロード時には uploadPracticeItem.ts、既存 item の編集は本 action を使う。
// v1.3: DB カラム difficulty → star にリネーム済み。payload キー名 "difficulty" は UI 互換のため維持。

import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { revalidatePath } from "next/cache"
import { Prisma } from "@/app/generated/prisma"
import { SUB_TASK_IDS } from "@/app/_libs/skillMaster"

export type UpdatePracticeItemTagsResult =
  | { success: true; itemId: string }
  | { error: string }

const VALID_SUB_TASK_IDS = new Set<string>(SUB_TASK_IDS as readonly string[])

export async function updatePracticeItemTags(
  itemId: string,
  payload: { difficulty: number | null; skillSubTaskTags: string[] },
): Promise<UpdatePracticeItemTagsResult> {
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

  // skillSubTaskTags は SUB_TASK_IDS の集合に含まれる文字列のみを許可
  const cleanedTags = Array.from(
    new Set(payload.skillSubTaskTags.filter(t => VALID_SUB_TASK_IDS.has(t))),
  )

  // 存在チェック
  const existing = await prisma.practiceItem.findUnique({
    where: { id: itemId },
    select: { id: true },
  })
  if (!existing) return { error: "教材が見つかりません" }

  await prisma.practiceItem.update({
    where: { id: itemId },
    data: {
      star: payload.difficulty, // payload は UI 由来 (difficulty キー)、DB は star
      skillSubTaskTags: cleanedTags as Prisma.InputJsonValue,
    },
  })

  revalidatePath("/admin/practice")
  return { success: true, itemId }
}
