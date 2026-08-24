"use server"
// 変種作成ダイアログ用の文脈取得 (2026-08-24 ・ admin専用)。
// 元スコアのグループ ・ パート一覧 ・ 既存変種 (難易度×パート) を返す。
import { prisma } from "@/app/_libs/prisma"
import { requireAdminAction } from "@/app/_libs/requireAuth"
import { parseParts, type Part } from "@/app/_libs/materialParts"

export type ScoreVariantContext = {
  ok: true
  source: { id: string; title: string; star: number | null; difficulty: string | null }
  parts: Part[]
  variants: { id: string; difficulty: string | null; partId: string | null; star: number | null; buildStatus: string }[]
} | { ok: false; error: string }

export async function getScoreVariantContext(scoreId: string): Promise<ScoreVariantContext> {
  const gate = await requireAdminAction()
  if (!gate.ok) return { ok: false, error: gate.error }

  const score = await prisma.score.findUnique({
    where: { id: scoreId },
    select: { id: true, title: true, star: true, difficulty: true, groupId: true, deletedAt: true },
  })
  if (!score || score.deletedAt) return { ok: false, error: "スコアが見つかりません" }

  let parts: Part[] = []
  let variantRows: { id: string; difficulty: string | null; partId: string | null; star: number | null; buildStatus: string }[] = []
  if (score.groupId) {
    const g = await prisma.materialGroup.findUnique({
      where: { id: score.groupId },
      select: { parts: true },
    })
    parts = parseParts(g?.parts ?? [])
    const rows = await prisma.score.findMany({
      where: { groupId: score.groupId, deletedAt: null, NOT: { id: scoreId } },
      select: { id: true, difficulty: true, partId: true, star: true, buildStatus: true },
      orderBy: { createdAt: "asc" },
    })
    variantRows = rows.map((r) => ({
      id: r.id, difficulty: r.difficulty, partId: r.partId, star: r.star, buildStatus: r.buildStatus,
    }))
  }
  return {
    ok: true,
    source: { id: score.id, title: score.title, star: score.star, difficulty: score.difficulty },
    parts,
    variants: variantRows,
  }
}
