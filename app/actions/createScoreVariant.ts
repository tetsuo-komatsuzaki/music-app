"use server"
// 曲の難易度・パート変種の自動生成 (2026-08-24 要件確定 ・ admin専用)。
//
// 仕組み: 変種の Score 行を作り、originalXmlPath は元スコアのファイルを共有する。
// 解析ジョブ (score_full) が Score.variantRecipe を読み、parse 直後に機械変換
// (小節範囲限定 → 同音2分割 → 音価2倍) を適用して、変種自身のIDの下に
// analysis / build_score を生成する (lib/difficulty_variant.py)。
//
// 確定仕様:
// - 自動変換は下方向 (例: 中級→初級) のみ。上級は常に手動アップロード
// - 移調・オクターブ下げはルールに存在しない
// - テンポ表記は変えない
// - パート変種 = measure_range ルール+partId の組み合わせ
import { revalidatePath } from "next/cache"
import { Prisma } from "@/app/generated/prisma"
import { prisma } from "@/app/_libs/prisma"
import { requireAdminAction } from "@/app/_libs/requireAuth"
import { invokeAnalysis } from "@/app/_libs/pythonRunner"
import { parseParts } from "@/app/_libs/materialParts"

const DIFFICULTIES = new Set(["BEGINNER", "INTERMEDIATE", "ADVANCED"])
const RULE_TYPES = new Set(["measure_range", "split_repeat", "double_duration"])

// 難易度と★束ねの整合 (2026-08-24 確定: 初級=1-3 / 中級=4-6 / 上級=7-10)
const STAR_RANGE: Record<string, [number, number]> = {
  BEGINNER: [1, 3],
  INTERMEDIATE: [4, 6],
  ADVANCED: [7, 10],
}

export type VariantRule =
  | { type: "measure_range"; from: number; to: number }
  | { type: "split_repeat" }
  | { type: "double_duration" }

export async function createScoreVariant(input: {
  sourceScoreId: string
  difficulty: string          // 変種の難易度 (BEGINNER 等)
  star: number                // 束ねの中の★
  rules: VariantRule[]        // 適用する変換ルール (1つ以上)
  partId?: string | null      // グループの parts 内のパートid (パート変種のとき)
}): Promise<{ ok: true; scoreId: string } | { ok: false; error: string }> {
  const gate = await requireAdminAction()
  if (!gate.ok) return { ok: false, error: gate.error }
  const dbUserId = gate.user.dbUser.id
  const authUserId = gate.user.supabaseUser.id

  const { sourceScoreId, difficulty, star, partId } = input
  if (!DIFFICULTIES.has(difficulty)) return { ok: false, error: "難易度が不正です" }
  const range = STAR_RANGE[difficulty]
  if (!Number.isInteger(star) || star < range[0] || star > range[1]) {
    return { ok: false, error: `★は${range[0]}〜${range[1]}で指定してください` }
  }
  const rules = (input.rules ?? []).filter((r) => r && RULE_TYPES.has(r.type))
  if (rules.length === 0) return { ok: false, error: "変換ルールを1つ以上選んでください" }
  for (const r of rules) {
    if (r.type === "measure_range") {
      if (!Number.isInteger(r.from) || !Number.isInteger(r.to) || r.from < 1 || r.to < r.from) {
        return { ok: false, error: "小節範囲の指定が不正です" }
      }
    }
  }

  const source = await prisma.score.findUnique({
    where: { id: sourceScoreId },
    select: {
      id: true, title: true, composer: true, genre: true, groupId: true,
      isShared: true, ownerScope: true, originalXmlPath: true, createdById: true,
      skillSubTaskTags: true, deletedAt: true, buildStatus: true,
    },
  })
  if (!source || source.deletedAt) return { ok: false, error: "元のスコアが見つかりません" }
  if (!source.originalXmlPath) return { ok: false, error: "元のスコアにファイルがありません" }
  if (source.buildStatus !== "done") return { ok: false, error: "元のスコアの解析完了後に作成できます" }

  // パート指定の妥当性 (グループの parts に存在するか)
  let partName: string | null = null
  if (partId) {
    if (!source.groupId) return { ok: false, error: "パート指定にはグループが必要です" }
    const g = await prisma.materialGroup.findUnique({
      where: { id: source.groupId }, select: { parts: true },
    })
    const parts = parseParts(g?.parts ?? [])
    const part = parts.find((p) => p.id === partId)
    if (!part) return { ok: false, error: "指定のパートがグループにありません" }
    partName = part.name
  }

  // 同一グループ内の重複ガード (同じ難易度×パートの変種は1つまで)
  if (source.groupId) {
    const dup = await prisma.score.findFirst({
      where: {
        groupId: source.groupId, deletedAt: null,
        difficulty: difficulty as never, partId: partId ?? null,
        NOT: { id: sourceScoreId },
      },
      select: { id: true },
    })
    if (dup) return { ok: false, error: "同じ難易度・パートの変種が既にあります" }
  }

  const recipe = { rules, sourceScoreId } as unknown as Prisma.InputJsonValue

  const variant = await prisma.score.create({
    data: {
      createdById: dbUserId, // 実行したadmin (解析ジョブの createdById 照合と一致させる)
      title: partName ? `${source.title}（${partName}）` : source.title,
      composer: source.composer ?? "",
      genre: source.genre,
      groupId: source.groupId,
      isShared: source.isShared,
      ownerScope: source.ownerScope,
      difficulty: difficulty as never,
      partId: partId ?? null,
      variantRecipe: recipe,
      star,
      skillSubTaskTags: (source.skillSubTaskTags ?? []) as Prisma.InputJsonValue,
      originalXmlPath: source.originalXmlPath, // 元ファイル共有 (解析時にレシピ適用)
      analysisStatus: "queued",
      buildStatus: "queued",
    },
  })

  try {
    await invokeAnalysis({
      mode: "score_full",
      idempotencyKey: `score_full:${variant.id}`,
      userId: dbUserId,
      storageUserId: authUserId,
      scoreId: variant.id,
    })
  } catch (e) {
    await prisma.score.update({
      where: { id: variant.id },
      data: {
        analysisStatus: "error", buildStatus: "error",
        errorMessage: e instanceof Error ? e.message.slice(0, 300) : String(e).slice(0, 300),
      },
    })
    return { ok: false, error: "解析ジョブの起動に失敗しました (変種はエラー状態で作成済み)" }
  }

  revalidatePath(`/${authUserId}/admin/practice`)
  return { ok: true, scoreId: variant.id }
}
