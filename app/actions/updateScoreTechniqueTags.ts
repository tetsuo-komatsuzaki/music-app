"use server"

// v1.6 Phase 4-3 (2026-05-16) — ScoreTechniqueTag (Score ⇔ TechniqueTag M2M) 専用更新。
//
// Q4=(b) 分離確定: updateScoreTags (star + skillSubTaskTags) とは独立した Action。
//   理由: 更新粒度のミスマッチ (star は頻繁、TechniqueTag は登録時+稀な後付け)。
//   仕様書 v1.6 §0-1 引用: 「既存 admin Score への技法タグ後付け作業: Phase 4 完了後、
//   Tetsuoから手動で 50 曲程度に技法タグを設定」→ 後付けメンテ専用にも使う。
//
// 戻り値は updateScoreTags と揃える ({ success: true, scoreId } | { error }).

import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { revalidatePath } from "next/cache"

export type ScoreTechniqueSelection = {
  id: string
  isPrimary: boolean
}

export type UpdateScoreTechniqueTagsResult =
  | { success: true; scoreId: string }
  | { error: string }

export async function updateScoreTechniqueTags(
  scoreId: string,
  techniques: ScoreTechniqueSelection[],
): Promise<UpdateScoreTechniqueTagsResult> {
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

  // 存在チェック (deletedAt=null のみ対象)
  const existing = await prisma.score.findFirst({
    where: { id: scoreId, deletedAt: null },
    select: { id: true },
  })
  if (!existing) return { error: "曲が見つかりません" }

  // 入力バリデーション: 技法 ID の存在 + 重複除去
  if (!Array.isArray(techniques)) {
    return { error: "技法リストの形式が不正です" }
  }
  const uniqueByTagId = new Map<string, boolean>()
  for (const t of techniques) {
    if (!t || typeof t.id !== "string" || typeof t.isPrimary !== "boolean") {
      return { error: "技法エントリの形式が不正です" }
    }
    uniqueByTagId.set(t.id, t.isPrimary)
  }
  const requestedIds = Array.from(uniqueByTagId.keys())

  if (requestedIds.length > 0) {
    const found = await prisma.techniqueTag.findMany({
      where: { id: { in: requestedIds } },
      select: { id: true },
    })
    if (found.length !== requestedIds.length) {
      return { error: "存在しない技法が含まれています" }
    }
  }

  // 既存 ScoreTechniqueTag を全削除 → 新規挿入 (差分計算より単純で十分高速、最大 ~10 件想定)
  // 同 transaction で atomic に
  await prisma.$transaction([
    prisma.scoreTechniqueTag.deleteMany({ where: { scoreId } }),
    ...(requestedIds.length > 0
      ? [
          prisma.scoreTechniqueTag.createMany({
            data: requestedIds.map((id) => ({
              scoreId,
              techniqueTagId: id,
              isPrimary: uniqueByTagId.get(id) ?? false,
            })),
          }),
        ]
      : []),
  ])

  revalidatePath("/admin/practice")
  return { success: true, scoreId }
}
