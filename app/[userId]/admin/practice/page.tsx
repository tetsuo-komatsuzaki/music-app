import { after } from "next/server"
import { prisma } from "@/app/_libs/prisma"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { redirect } from "next/navigation"
import { sweepPracticePartVariants } from "@/app/_libs/partMaterialize"
import AdminPractice from "../adminPractice"
import { uploadPracticeItem } from "@/app/actions/uploadPracticeItem"
import { uploadScore } from "@/app/actions/uploadScore"

export const metadata = { title: "教材管理" }

export default async function AdminPracticePage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  void params // userId は admin 権限チェック後に supabase user 経由で利用
  // 管理者チェック
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id },
  })
  if (!dbUser || dbUser.role !== "admin")  {
    return <div style={{ padding: 40, textAlign: "center" }}>管理者権限が必要です</div>
  }

  // パート自動実体化スイープ (2026-08-31 Tetsuo確定 A案): 奏法変種など
  // 解析が済んだ通しにパート実体が欠けていれば、管理画面を開いたついでに補充する。
  // 冪等 (作成済みの組はスキップ) なので毎回呼んで良い
  after(async () => {
    try {
      const r = await sweepPracticePartVariants()
      if (r.created > 0) console.log(`[partSweep] パート実体化 ${r.created}件 (skip ${r.skipped})`)
    } catch (e) {
      console.error("[partSweep] 失敗:", e instanceof Error ? e.message : e)
    }
  })

  // 登録済み教材 (PracticeItem + Score) を並列で取得
  const [items, scores, techniqueTags] = await Promise.all([
    prisma.practiceItem.findMany({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { title: "asc" }],
      include: {
        techniques: {
          include: { techniqueTag: { select: { id: true, name: true } } },
        },
        group: { select: { id: true, title: true } },
      },
    }),
    // 削除済み (deletedAt != null) は除外
    prisma.score.findMany({
      where: { deletedAt: null },
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        composer: true,
        keyTonic: true,
        keyMode: true,
        defaultTempo: true,
        isShared: true,
        analysisStatus: true,
        buildStatus: true,
        star: true,
        skillSubTaskTags: true,
        moodTags: true,
        // 変種の判別用 (2026-09-01)
        groupId: true,
        partId: true,
        rhythmRecipe: true,
        difficulty: true,
        // v1.6 Phase 4-3 (Q4=B): ScoreTechniqueTag を一緒に取得し、
        //   admin UI の編集モーダル初期値に使う。
        scoreTechniqueTags: {
          include: { techniqueTag: { select: { id: true, name: true } } },
        },
      },
    }),
    // TechniqueTag 一覧（フォームの選択肢用）
    prisma.techniqueTag.findMany({
      where: { implementStatus: "実装" },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      select: { id: true, category: true, name: true, nameEn: true },
    }),
  ])

  // 教材グループ一覧 (Phase B: 「既存グループに変種を追加」の選択肢用)
  const groupsRaw = await prisma.materialGroup.findMany({
    orderBy: [{ category: "asc" }, { title: "asc" }],
    select: {
      id: true, category: true, title: true, composer: true, axes: true,
    },
  })

  // 一覧に出す「代表」を決める (2026-09-01 Tetsuo確定):
  // 奏法別・リズム別・パート別は教材管理に並べない。量が多すぎて見えなくなるため。
  // 同じ族・同じ調・同じ難易度の中で、いちばん素のものを1件だけ代表として出す。
  // 調や難易度が違うもの (音階の12調、曲の難易度別) は別物なので残る。
  type VariantKeys = {
    id: string
    groupId: string | null
    keyTonic: string | null
    keyMode: string | null
    difficulty: string | null
    positions?: string[]
    modeVariant?: string | null
    chordType?: string | null
    partId?: string | null
    articulation?: string | null
    hasRhythm: boolean
    hasArtRecipe: boolean
    title: string
  }
  const bucketOf = (v: VariantKeys) => [
    v.groupId ?? `solo:${v.id}`, v.keyTonic ?? "", v.keyMode ?? "", v.difficulty ?? "",
    v.modeVariant ?? "", v.chordType ?? "", (v.positions ?? []).join(","),
  ].join("|")
  // 素なものほど小さい = 代表になる
  const plainness = (v: VariantKeys) =>
    (v.partId ? 8 : 0) + (v.hasRhythm ? 4 : 0) + (v.hasArtRecipe ? 2 : 0) + (v.articulation ? 1 : 0)
  const pickRepresentatives = (list: VariantKeys[]) => {
    const best = new Map<string, VariantKeys>()
    for (const v of list) {
      const k = bucketOf(v)
      const cur = best.get(k)
      if (!cur || plainness(v) < plainness(cur)
        || (plainness(v) === plainness(cur) && v.title.localeCompare(cur.title, "ja") < 0)) best.set(k, v)
    }
    return new Set([...best.values()].map((v) => v.id))
  }

  // カテゴリでグルーピング
  const tagsByCategory: Record<string, typeof techniqueTags> = {}
  for (const tag of techniqueTags) {
    if (!tagsByCategory[tag.category]) tagsByCategory[tag.category] = []
    tagsByCategory[tag.category].push(tag)
  }

  const itemReps = pickRepresentatives(items.map((item) => {
    const md = (item.metadata && typeof item.metadata === "object" && !Array.isArray(item.metadata)
      ? item.metadata : {}) as Record<string, unknown>
    return {
      id: item.id, groupId: item.groupId, keyTonic: item.keyTonic, keyMode: item.keyMode,
      difficulty: item.difficulty, positions: item.positions,
      modeVariant: typeof md.modeVariant === "string" ? md.modeVariant : null,
      chordType: typeof md.chordType === "string" ? md.chordType : null,
      partId: item.partId, articulation: item.articulation,
      hasRhythm: item.rhythmRecipe != null, hasArtRecipe: item.articulationRecipe != null,
      title: item.title,
    }
  }))
  const itemDtos = items.map((item) => {
    const tags = Array.isArray(item.skillSubTaskTags)
      ? (item.skillSubTaskTags as unknown[]).filter((v): v is string => typeof v === "string")
      : []
    return {
      type: "practice" as const,
      id: item.id,
      category: item.category as string,
      title: item.title,
      // 族でまとめて表示するため (2026-08-25 Tetsuo「数が多くて見にくい」)
      groupId: item.groupId ?? null,
      groupTitle: item.group?.title ?? null,
      // 2026-09-01: 奏法別・リズム別・パート別は既定で一覧に出さない
      isVariant: !itemReps.has(item.id),
      composer: item.composer,
      keyTonic: item.keyTonic,
      keyMode: item.keyMode,
      tempoMin: item.tempoMin,
      tempoMax: item.tempoMax,
      positions: item.positions,
      isPublished: item.isPublished,
      analysisStatus: item.analysisStatus,
      buildStatus: item.buildStatus,
      star: item.star,
      autoStar: item.autoStar ?? null,
      skillSubTaskTags: tags,
      techniques: item.techniques.map((t) => ({
        id: t.techniqueTag.id,
        name: t.techniqueTag.name,
        isPrimary: t.isPrimary,
      })),
    }
  })

  // Score も同形に整形 (PracticeItem に存在しないフィールドは空 / null)
  const scoreReps = pickRepresentatives(scores.map((s) => ({
    id: s.id, groupId: s.groupId, keyTonic: s.keyTonic, keyMode: s.keyMode,
    difficulty: s.difficulty, partId: s.partId, articulation: null,
    hasRhythm: s.rhythmRecipe != null, hasArtRecipe: false, title: s.title,
  })))
  const scoreDtos = scores.map((s) => {
    const tags = Array.isArray(s.skillSubTaskTags)
      ? (s.skillSubTaskTags as unknown[]).filter((v): v is string => typeof v === "string")
      : []
    return {
      type: "score" as const,
      id: s.id,
      category: "score" as const,
      title: s.title,
      groupId: s.groupId ?? null,
      isVariant: !scoreReps.has(s.id),
      composer: s.composer,
      keyTonic: s.keyTonic ?? "",
      keyMode: s.keyMode ?? "",
      tempoMin: s.defaultTempo,
      tempoMax: null,
      positions: [] as string[],
      isPublished: s.isShared, // Score の "公開" 相当は isShared
      analysisStatus: s.analysisStatus,
      buildStatus: s.buildStatus,
      star: s.star,
      skillSubTaskTags: tags,
      moodTags: s.moodTags ?? [],
      techniques: s.scoreTechniqueTags.map((t) => ({
        id: t.techniqueTag.id,
        name: t.techniqueTag.name,
        isPrimary: t.isPrimary,
      })),
    }
  })

  // 統合一覧 (PracticeItem 先 + Score 後)
  const allItems = [...itemDtos, ...scoreDtos]

  // 族の変種数は「一覧に出る代表」で数える (2026-09-01 Tetsuo確定)。
  // リズム別・奏法別・パート別まで数えると、教材1つが数十件に見えてしまう。
  const repCountByGroup = new Map<string, number>()
  for (const it of allItems) {
    if (it.isVariant || !it.groupId) continue
    repCountByGroup.set(it.groupId, (repCountByGroup.get(it.groupId) ?? 0) + 1)
  }
  const groups = groupsRaw.map((g) => ({
    id: g.id,
    category: g.category,
    title: g.title,
    // 族の軸 (2026-08-25)。既存グループに追加するとき、軸の値を選ばせる
    axes: (g.axes as { key: string; label: string; kind: string; values: string[] }[] | null) ?? null,
    composer: g.composer,
    variantCount: repCountByGroup.get(g.id) ?? 0,
  }))

  return (
    <AdminPractice
      items={allItems}
      tagsByCategory={tagsByCategory}
      groups={groups}
      uploadAction={uploadPracticeItem}
      uploadScoreAction={uploadScore}
    />
  )
}
