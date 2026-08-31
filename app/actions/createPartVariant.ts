"use server"
// パートを独立した教材として作る (2026-08-25 Tetsuo確定「案B」 ・ admin専用)。
//
// 「1〜8小節だけ」の実体を生成し、譜面・解析・採点・カルテのすべてがその範囲だけになる。
// 表示だけ絞る案Aではなく、実体を作る案Bを採用 (中身と見た目が食い違わないため)。
// 変換は解析時に Python (lib/rhythm_recipe / difficulty_variant の measure_range) が行い、
// 生成物は通常アップロードと同じ形式 (MusicXML + analysis + build_score) になる。
import { revalidatePath } from "next/cache"
import { Prisma, type PracticeCategory } from "@/app/generated/prisma"
import { prisma } from "@/app/_libs/prisma"
import { requireAdminAction } from "@/app/_libs/requireAuth"
import { invokeAnalysis } from "@/app/_libs/pythonRunner"
import { parseParts } from "@/app/_libs/materialParts"
import { materializePracticeParts } from "@/app/_libs/partMaterialize"

/** グループに定義済みのパートから、まだ実体化していないものを教材として作る */
export async function createPartVariants(input: {
  sourceItemId: string
  kind: "practice" | "score"
  /** 作るパートのid。未指定ならグループの全パート */
  partIds?: string[]
}): Promise<{ ok: true; created: number; skipped: number } | { ok: false; error: string }> {
  const gate = await requireAdminAction()
  if (!gate.ok) return { ok: false, error: gate.error }
  const dbUserId = gate.user.dbUser.id
  const authUserId = gate.user.supabaseUser.id

  if (input.kind === "score") {
    return createScorePartVariants(input.sourceItemId, input.partIds, dbUserId, authUserId)
  }

  // 教材側の実体化ロジックは partMaterialize.ts に共通化 (2026-08-31 A案:
  // adminスイープ/遡及スクリプトと共用。奏法変種にもパートが揃うように)
  const r = await materializePracticeParts(input.sourceItemId, { partIds: input.partIds })
  if (r.ok) revalidatePath(`/${authUserId}/admin/practice`)
  return r
}

async function createScorePartVariants(
  scoreId: string, partIds: string[] | undefined, dbUserId: string, authUserId: string,
): Promise<{ ok: true; created: number; skipped: number } | { ok: false; error: string }> {
  const source = await prisma.score.findUnique({
    where: { id: scoreId },
    select: {
      id: true, title: true, composer: true, genre: true, groupId: true, isShared: true,
      ownerScope: true, originalXmlPath: true, star: true, difficulty: true,
      skillSubTaskTags: true, buildStatus: true, deletedAt: true, partId: true,
    },
  })
  if (!source || source.deletedAt) return { ok: false, error: "元のスコアが見つかりません" }
  if (source.partId) return { ok: false, error: "パート教材からは作れません" }
  if (!source.groupId) return { ok: false, error: "教材グループが無いためパートを作れません" }
  if (source.buildStatus !== "done") return { ok: false, error: "解析完了後に作成できます" }

  const g = await prisma.materialGroup.findUnique({ where: { id: source.groupId }, select: { parts: true } })
  const parts = parseParts(g?.parts ?? []).filter((p) => !partIds || partIds.includes(p.id))
  if (parts.length === 0) return { ok: false, error: "パートが定義されていません" }

  // 重複判定は教材側と同じく「同じパート × 同じ元スコア」(2026-08-25 Tetsuo確定)。
  // 難易度で判定すると、同じ難易度の別変種から作ったPart1が作れなくなる。
  const existing = await prisma.score.findMany({
    where: { groupId: source.groupId, partId: { not: null }, deletedAt: null },
    select: { partId: true, variantRecipe: true },
  })
  const done = new Set(existing.map((e) => {
    const rec = e.variantRecipe as { sourceScoreId?: string } | null
    return `${e.partId}:${rec?.sourceScoreId ?? ""}`
  }))

  let created = 0, skipped = 0
  for (const part of parts) {
    if (done.has(`${part.id}:${source.id}`)) { skipped += 1; continue }
    const child = await prisma.score.create({
      data: {
        createdById: dbUserId,
        title: `${source.title}・${part.name}`,
        composer: source.composer ?? "",
        genre: source.genre,
        groupId: source.groupId,
        isShared: source.isShared,
        ownerScope: source.ownerScope,
        difficulty: source.difficulty,
        partId: part.id,
        star: source.star,
        // 2026-08-28 Tetsuo確定: 課題タグは写さない。変種ごとに解析が中身から判定する。
        // 通しから写すと空でなくなり、解析側の「空のときだけ入れる」に阻まれて
        // その抜粋/変種に実際は出てこない課題が残り続けていた。
        originalXmlPath: source.originalXmlPath,
        analysisStatus: "queued",
        buildStatus: "queued",
        variantRecipe: {
          rules: [{ type: "measure_range", from: part.startMeasure, to: part.endMeasure }],
          sourcePartId: part.id,
          sourceScoreId: source.id,
        } as unknown as Prisma.InputJsonValue,
      },
    })
    try {
      await invokeAnalysis({
        mode: "score_full", idempotencyKey: `score_full:${child.id}`,
        userId: dbUserId, storageUserId: authUserId, scoreId: child.id,
      })
      created += 1
    } catch (e) {
      await prisma.score.update({
        where: { id: child.id },
        data: {
          analysisStatus: "error", buildStatus: "error",
          errorMessage: e instanceof Error ? e.message.slice(0, 300) : String(e).slice(0, 300),
        },
      })
    }
  }
  revalidatePath(`/${authUserId}/admin/practice`)
  return { ok: true, created, skipped }
}
