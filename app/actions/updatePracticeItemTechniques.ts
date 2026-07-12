"use server"

// PracticeItemTechnique (教材 ⇔ TechniqueTag M2M) 専用更新 (2026-07-14)。
// updateScoreTechniqueTags の教材版。学びレッスン教材の技法タグ後付け
// (ビブラート/ピチカート等、自動抽出されない技法) を admin 技法モーダルから行う。
// 戻り値・バリデーションは updateScoreTechniqueTags と揃える。

import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { revalidatePath } from "next/cache"
import type { ScoreTechniqueSelection } from "./updateScoreTechniqueTags"

export type UpdatePracticeItemTechniquesResult =
  | { success: true; itemId: string }
  | { error: string }

export async function updatePracticeItemTechniques(
  itemId: string,
  techniques: ScoreTechniqueSelection[],
): Promise<UpdatePracticeItemTechniquesResult> {
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

  const existing = await prisma.practiceItem.findUnique({
    where: { id: itemId },
    select: { id: true },
  })
  if (!existing) return { error: "教材が見つかりません" }

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

  await prisma.$transaction([
    prisma.practiceItemTechnique.deleteMany({ where: { practiceItemId: itemId } }),
    ...(requestedIds.length > 0
      ? [
          prisma.practiceItemTechnique.createMany({
            data: requestedIds.map((id) => ({
              practiceItemId: itemId,
              techniqueTagId: id,
              isPrimary: uniqueByTagId.get(id) ?? false,
            })),
          }),
        ]
      : []),
  ])

  revalidatePath("/admin/practice")
  return { success: true, itemId }
}
