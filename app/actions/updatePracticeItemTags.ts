"use server"

// 既存の PracticeItem の loop engine 必須項目 (star / skillSubTaskTags) を
// admin が編集するためのサーバアクション。
//
// アップロード時には uploadPracticeItem.ts、既存 item の編集は本 action を使う。
// v1.3 B-3: DB カラム & payload key 双方 star に統一。

import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { revalidatePath } from "next/cache"
import { Prisma, type PracticeCategory } from "@/app/generated/prisma"
import { SUB_TASK_IDS } from "@/app/_libs/skillMaster"
import { isPracticeCategory } from "@/app/_libs/practiceConstants"

export type UpdatePracticeItemTagsResult =
  | { success: true; itemId: string }
  | { error: string }

const VALID_SUB_TASK_IDS = new Set<string>(SUB_TASK_IDS as readonly string[])
const VALID_KEY_MODES = new Set(["major", "minor"])
const MAX_TITLE_LEN = 100

export type UpdatePracticeItemPayload = {
  star: number | null
  skillSubTaskTags: string[]
  // v: admin 一覧のインライン編集で追加 (タイトル/カテゴリ/調/テンポ)
  title?: string
  category?: string
  keyTonic?: string
  keyMode?: string
  tempoMin?: number | null
  tempoMax?: number | null
}

export async function updatePracticeItemTags(
  itemId: string,
  payload: UpdatePracticeItemPayload,
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
  if (payload.star != null) {
    if (!Number.isFinite(payload.star)) {
      return { error: "難易度の値が不正です" }
    }
    if (payload.star < 1 || payload.star > 10) {
      return { error: "難易度は 1 〜 10 で指定してください" }
    }
  }

  // skillSubTaskTags は SUB_TASK_IDS の集合に含まれる文字列のみを許可
  const cleanedTags = Array.from(
    new Set(payload.skillSubTaskTags.filter(t => VALID_SUB_TASK_IDS.has(t))),
  )

  // 追加フィールド (任意) の組み立て & バリデーション
  const data: Prisma.PracticeItemUpdateInput = {
    star: payload.star,
    skillSubTaskTags: cleanedTags as Prisma.InputJsonValue,
  }

  if (payload.title !== undefined) {
    const t = payload.title.trim()
    if (t.length === 0) return { error: "タイトルを入力してください" }
    if (t.length > MAX_TITLE_LEN) return { error: `タイトルは${MAX_TITLE_LEN}文字以内で入力してください` }
    data.title = t
  }
  if (payload.category !== undefined) {
    // 基礎練6 + エチュードのみ許可 (score は別テーブルのため不可)
    if (!isPracticeCategory(payload.category)) {
      return { error: `不正なカテゴリです: ${payload.category}` }
    }
    data.category = payload.category as PracticeCategory
  }
  if (payload.keyTonic !== undefined) {
    const k = payload.keyTonic.trim()
    if (k.length === 0) return { error: "調(主音)を指定してください" }
    data.keyTonic = k
  }
  if (payload.keyMode !== undefined) {
    if (!VALID_KEY_MODES.has(payload.keyMode)) return { error: "調(長短)が不正です" }
    data.keyMode = payload.keyMode
  }
  for (const [key, val] of [["tempoMin", payload.tempoMin], ["tempoMax", payload.tempoMax]] as const) {
    if (val !== undefined) {
      if (val !== null && (!Number.isFinite(val) || val < 1 || val > 400)) {
        return { error: "テンポは 1〜400 で指定してください" }
      }
      data[key] = val
    }
  }
  if (
    payload.tempoMin != null && payload.tempoMax != null &&
    payload.tempoMin > payload.tempoMax
  ) {
    return { error: "テンポの最小値は最大値以下にしてください" }
  }

  // 存在チェック
  const existing = await prisma.practiceItem.findUnique({
    where: { id: itemId },
    select: { id: true },
  })
  if (!existing) return { error: "教材が見つかりません" }

  await prisma.practiceItem.update({
    where: { id: itemId },
    data,
  })

  revalidatePath("/admin/practice")
  return { success: true, itemId }
}
