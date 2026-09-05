"use server"

// 工程G (2026-07-11): スタッカート系曖昧記号の確定アクション。
// 管理者が /admin/confirmations で選んだ奏法へ、曲/教材単位で一括確定する。
//   - 対象の全パターン行を confirmed + resolvedTag に更新
//   - タグ付け替え: 前回確定タグ(初回は仮付与の「スタッカート」)を外し、選択タグを付与
//     (選び直しにも対応。管理者の明示操作なので手動タグ保護の原則と矛盾しない)

import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { revalidatePath } from "next/cache"

const ALLOWED_TAGS = [
  "スタッカート",
  "スピッカート",
  "連続スピッカート", // 2026-07-14 用語改定: 旧称ボウ・スタッカート
  "ポルタート",
] as const

export async function resolveTechniqueConfirmation(input: {
  targetType: "score" | "practice"
  targetId: string
  resolvedTag: string
}): Promise<{ ok: boolean; error?: string }> {
  const { targetType, targetId, resolvedTag } = input
  if (!(ALLOWED_TAGS as readonly string[]).includes(resolvedTag)) {
    return { ok: false, error: "不正な奏法タグです" }
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "未ログイン" }
  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id },
    select: { role: true },
  })
  if (dbUser?.role !== "admin") return { ok: false, error: "管理者権限が必要です" }

  const rows = await prisma.techniqueConfirmation.findMany({
    where: { targetType, targetId },
    select: { id: true, resolvedTag: true },
  })
  if (rows.length === 0) return { ok: false, error: "確認対象がありません" }

  // 付け替え元 = 前回確定タグ (初回は仮付与の「スタッカート」)
  const prevTag = rows.find((r) => r.resolvedTag)?.resolvedTag ?? "スタッカート"

  const [prevTagRow, newTagRow] = await Promise.all([
    prisma.techniqueTag.findFirst({ where: { name: prevTag }, select: { id: true } }),
    prisma.techniqueTag.findFirst({ where: { name: resolvedTag }, select: { id: true } }),
  ])
  if (!newTagRow) return { ok: false, error: `タグ「${resolvedTag}」が見つかりません` }

  await prisma.$transaction(async (tx) => {
    if (prevTag !== resolvedTag && prevTagRow) {
      if (targetType === "score") {
        await tx.scoreTechniqueTag.deleteMany({
          where: { scoreId: targetId, techniqueTagId: prevTagRow.id },
        })
      } else {
        await tx.practiceItemTechnique.deleteMany({
          where: { practiceItemId: targetId, techniqueTagId: prevTagRow.id },
        })
      }
    }
    if (targetType === "score") {
      await tx.scoreTechniqueTag.createMany({
        data: [{ scoreId: targetId, techniqueTagId: newTagRow.id, isPrimary: false }],
        skipDuplicates: true,
      })
    } else {
      await tx.practiceItemTechnique.createMany({
        data: [
          { practiceItemId: targetId, techniqueTagId: newTagRow.id, isPrimary: false },
        ],
        skipDuplicates: true,
      })
    }
    await tx.techniqueConfirmation.updateMany({
      where: { targetType, targetId },
      data: { status: "confirmed", resolvedTag, confirmedAt: new Date() },
    })
  })

  revalidatePath("/[userId]/admin/confirmations", "page")
  return { ok: true }
}
