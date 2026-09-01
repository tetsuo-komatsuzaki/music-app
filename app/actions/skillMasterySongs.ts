"use server"
// わざマスターの課題曲設定 (admin専用・2026-09-01 Tetsuo確定)。
// わざ×★→曲 の対応を SkillMasterySong に upsert / 削除する。
// 選定方法の記録は memory/project_skill_mastery_criteria.md。
import { revalidatePath } from "next/cache"
import { prisma } from "@/app/_libs/prisma"
import { requireAdminAction } from "@/app/_libs/requireAuth"
import { SKILL_MASTERY_TARGETS } from "@/app/_libs/growthKarte"
import { isValidCuid } from "@/app/_libs/validators"

export async function setSkillMasterySong(input: {
  skillId: string
  star: number
  /** 空文字/null = 指定解除 */
  scoreId: string | null
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await requireAdminAction()
  if (!gate.ok) return { ok: false, error: gate.error }

  if (!SKILL_MASTERY_TARGETS.some((t) => t.id === input.skillId)) return { ok: false, error: "わざが不正です" }
  const star = Math.round(input.star)
  if (!(star >= 1 && star <= 10)) return { ok: false, error: "ランク★が不正です" }

  try {
    if (!input.scoreId) {
      await prisma.skillMasterySong.deleteMany({ where: { skillId: input.skillId, star } })
    } else {
      if (!isValidCuid(input.scoreId)) return { ok: false, error: "曲が不正です" }
      const score = await prisma.score.findUnique({ where: { id: input.scoreId }, select: { id: true, deletedAt: true } })
      if (!score || score.deletedAt) return { ok: false, error: "曲が見つかりません" }
      await prisma.skillMasterySong.upsert({
        where: { skillId_star: { skillId: input.skillId, star } },
        create: { skillId: input.skillId, star, scoreId: input.scoreId },
        update: { scoreId: input.scoreId },
      })
    }
    revalidatePath(`/${gate.user.supabaseUser.id}/admin/skill-songs`)
    return { ok: true }
  } catch (e) {
    console.error("[skillMasterySongs] 保存失敗:", e)
    return { ok: false, error: "保存に失敗しました" }
  }
}
