"use server"

// 既存 Score の loop engine 必須項目 (star / skillSubTaskTags) を
// admin が編集するためのサーバアクション。
//
// uploadScore.ts のアップロード時には拡張済み。本 action は既存 Score の編集用。
// updatePracticeItemTags.ts と対をなす。
// v1.3 B-3: DB カラム & payload key 双方 star に統一。

import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { revalidatePath } from "next/cache"
import { Prisma } from "@/app/generated/prisma"
import { SUB_TASK_IDS } from "@/app/_libs/skillMaster"

export type UpdateScoreTagsResult =
  | { success: true; scoreId: string }
  | { error: string }

const VALID_SUB_TASK_IDS = new Set<string>(SUB_TASK_IDS as readonly string[])
const VALID_KEY_MODES = new Set(["major", "minor"])
const MAX_TITLE_LEN = 100

export type UpdateScorePayload = {
  star: number | null
  skillSubTaskTags: string[]
  // v: admin 一覧のインライン編集で追加 (タイトル/調/テンポ)。
  //    カテゴリは Score=「練習曲」固定のため対象外。
  title?: string
  keyTonic?: string | null
  keyMode?: string | null
  defaultTempo?: number | null
}

export async function updateScoreTags(
  scoreId: string,
  payload: UpdateScorePayload,
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
  if (payload.star != null) {
    if (!Number.isFinite(payload.star)) {
      return { error: "難易度の値が不正です" }
    }
    if (payload.star < 1 || payload.star > 10) {
      return { error: "難易度は 1 〜 10 で指定してください" }
    }
  }

  const cleanedTags = Array.from(
    new Set(payload.skillSubTaskTags.filter(t => VALID_SUB_TASK_IDS.has(t))),
  )

  // 追加フィールド (任意) の組み立て & バリデーション
  const data: Prisma.ScoreUpdateInput = {
    star: payload.star,
    skillSubTaskTags: cleanedTags as Prisma.InputJsonValue,
  }

  if (payload.title !== undefined) {
    const t = payload.title.trim()
    if (t.length === 0) return { error: "タイトルを入力してください" }
    if (t.length > MAX_TITLE_LEN) return { error: `タイトルは${MAX_TITLE_LEN}文字以内で入力してください` }
    data.title = t
  }
  if (payload.keyTonic !== undefined) {
    const k = payload.keyTonic?.trim() ?? ""
    data.keyTonic = k.length > 0 ? k : null
  }
  if (payload.keyMode !== undefined) {
    if (payload.keyMode != null && !VALID_KEY_MODES.has(payload.keyMode)) {
      return { error: "調(長短)が不正です" }
    }
    data.keyMode = payload.keyMode ?? null
  }
  if (payload.defaultTempo !== undefined) {
    if (payload.defaultTempo !== null && (!Number.isFinite(payload.defaultTempo) || payload.defaultTempo < 1 || payload.defaultTempo > 400)) {
      return { error: "テンポは 1〜400 で指定してください" }
    }
    data.defaultTempo = payload.defaultTempo
  }

  // 存在チェック (deletedAt=null のみ対象)
  const existing = await prisma.score.findFirst({
    where: { id: scoreId, deletedAt: null },
    select: { id: true },
  })
  if (!existing) return { error: "曲が見つかりません" }

  await prisma.score.update({
    where: { id: scoreId },
    data,
  })

  revalidatePath("/admin/practice")
  return { success: true, scoreId }
}
