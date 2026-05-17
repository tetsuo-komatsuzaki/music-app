"use server"

// v1.6 Phase 6 (2026-05-18) — MissingPracticeItemFlag を「解決済み」にする admin Action。
//
// 解決粒度 = (keyTonic, keyMode, star, missingCategory) グループ単位の一括解決
// (確定: 教材を 1 件作成 = 該当グループ解決、という運用に合致)。
// resolvedAt IS NULL の該当フラグ全件に resolvedAt=NOW() を設定する (冪等)。
//
// 認可: admin のみ (updateScoreTechniqueTags と同パターン)。

import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { revalidatePath } from "next/cache"

export type ResolveMissingFlagResult =
  | { success: true; resolvedCount: number }
  | { error: string }

export async function resolveMissingPracticeItemFlag(input: {
  keyTonic: string
  keyMode: string
  star: number
  missingCategory: string
}): Promise<ResolveMissingFlagResult> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "ログインが必要です" }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id },
  })
  if (!dbUser || dbUser.role !== "admin") {
    return { error: "管理者権限が必要です" }
  }

  const { keyTonic, keyMode, star, missingCategory } = input
  if (
    typeof keyTonic !== "string" ||
    typeof keyMode !== "string" ||
    typeof star !== "number" ||
    !Number.isInteger(star) ||
    typeof missingCategory !== "string"
  ) {
    return { error: "入力が不正です" }
  }
  if (!["scale", "arpeggio", "etude"].includes(missingCategory)) {
    return { error: "missingCategory が不正です" }
  }

  const res = await prisma.missingPracticeItemFlag.updateMany({
    where: {
      keyTonic,
      keyMode,
      star,
      missingCategory,
      resolvedAt: null,
    },
    data: { resolvedAt: new Date() },
  })

  revalidatePath("/admin/missing-items")
  return { success: true, resolvedCount: res.count }
}
