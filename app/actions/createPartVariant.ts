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

  const source = await prisma.practiceItem.findUnique({
    where: { id: input.sourceItemId },
    select: {
      id: true, groupId: true, category: true, title: true, composer: true,
      description: true, descriptionShort: true, keyTonic: true, keyMode: true,
      tempoMin: true, tempoMax: true, positions: true, star: true,
      skillSubTaskTags: true, metadata: true, originalXmlPath: true, buildStatus: true,
      partId: true, articulation: true,
    },
  })
  if (!source) return { ok: false, error: "元の教材が見つかりません" }
  if (source.partId) return { ok: false, error: "パート教材からは作れません (通しの教材を選んでください)" }
  if (!source.groupId) return { ok: false, error: "教材グループが無いためパートを作れません" }
  if (source.buildStatus !== "done") return { ok: false, error: "解析完了後に作成できます" }

  const g = await prisma.materialGroup.findUnique({ where: { id: source.groupId }, select: { parts: true } })
  const parts = parseParts(g?.parts ?? []).filter((p) => !input.partIds || input.partIds.includes(p.id))
  if (parts.length === 0) return { ok: false, error: "パートが定義されていません" }

  // すでに実体化済みのパートは飛ばす。
  // 重複判定は「同じパート × 同じ元教材」(2026-08-25 Tetsuo確定):
  // スタッカート変種のPart1と、通しのPart1は別の教材として共存できる。
  const existing = await prisma.practiceItem.findMany({
    where: { groupId: source.groupId, partId: { not: null } },
    select: { partId: true, variantRecipe: true },
  })
  const done = new Set(existing.map((e) => {
    const rec = e.variantRecipe as { sourceItemId?: string } | null
    return `${e.partId}:${rec?.sourceItemId ?? ""}`
  }))

  let created = 0, skipped = 0
  for (const part of parts) {
    if (done.has(`${part.id}:${source.id}`)) { skipped += 1; continue }
    const md = (source.metadata && typeof source.metadata === "object" ? source.metadata : {}) as Record<string, unknown>
    const metadata: Record<string, unknown> = {}
    if (md.transposeSource) metadata.transposeSource = md.transposeSource
    // 奏法変種を元にした場合はそのパターンを引き継ぐ (2026-08-25 Tetsuo:
    // 「スタッカート奏法を適用した教材のパート分割」→ 奏法つきのまま該当小節だけを切り出す)
    if (md.articulationPattern) metadata.articulationPattern = md.articulationPattern

    const child = await prisma.practiceItem.create({
      data: {
        category: source.category as PracticeCategory,
        title: `${source.title}・${part.name}`,
        composer: source.composer,
        description: source.description,
        descriptionShort: source.descriptionShort,
        keyTonic: source.keyTonic,
        keyMode: source.keyMode,
        tempoMin: source.tempoMin,
        tempoMax: source.tempoMax,
        positions: source.positions,
        instrument: "violin",
        originalXmlPath: source.originalXmlPath,  // 元ファイル共有 (解析時に範囲を切り出す)
        source: "admin",
        isPublished: true,
        analysisStatus: "queued",
        buildStatus: "queued",
        star: source.star,
        skillSubTaskTags: (source.skillSubTaskTags ?? []) as Prisma.InputJsonValue,
        groupId: source.groupId,
        partId: part.id,
        // 2026-08-28: 奏法は通しから継ぐ。
        // 写していなかったため空で作られ、解析の自動判定 (analyze_musicxml.py の
        // 「スラーのみなら articulation='slur'」) が各パートの中身を見て別々に
        // 付けていた。同じ曲を切っただけなのに Part1 だけ slur、Part2 は空、
        // という食い違いが起き、奏法を選んでもパートが揃わなくなっていた。
        // 奏法は「人が選ぶ軸」であって「その抜粋に何が出てくるか」ではない。
        articulation: source.articulation,
        metadata: metadata as Prisma.InputJsonValue,
        // 小節範囲だけを残す変換 (難易度変換と同じルールを流用)
        variantRecipe: {
          rules: [{ type: "measure_range", from: part.startMeasure, to: part.endMeasure }],
          sourcePartId: part.id,
          sourceItemId: source.id,
        } as unknown as Prisma.InputJsonValue,
      },
    })
    try {
      await invokeAnalysis({ mode: "score_full", idempotencyKey: `score_full:${child.id}`, practiceItemId: child.id })
      created += 1
    } catch (e) {
      await prisma.practiceItem.update({
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
        skillSubTaskTags: (source.skillSubTaskTags ?? []) as Prisma.InputJsonValue,
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
