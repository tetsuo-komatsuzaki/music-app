"use server"
import { prisma } from "@/app/_libs/prisma"
import { createClient } from "@supabase/supabase-js"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { revalidatePath } from "next/cache"
import { after } from "next/server"
import { invokeAnalysis } from "@/app/_libs/pythonRunner"
import { generatePracticeItemCover } from "@/app/_libs/coverImage/generateAndStore"
import { ensurePracticeItemGroup, MATERIAL_KIND_BY_CATEGORY } from "@/app/_libs/materialGroup"
import { allKeyTargets, KEY_EXPAND_CATEGORIES } from "@/app/_libs/scaleKeyExpansion"
import { STANDARD_ARTICULATIONS, ARTICULATION_CATEGORIES, ARTICULATION_SUBTASK } from "@/app/_libs/articulationPatterns"
import { isDifficulty, isArticulation } from "@/app/_libs/materialVariant"
import { Prisma, type PracticeCategory, type MaterialKind } from "@/app/generated/prisma"
import { SUB_TASK_IDS } from "@/app/_libs/skillMaster"
import { isPracticeCategory } from "@/app/_libs/practiceConstants"

const VALID_SUB_TASK_IDS = new Set<string>(SUB_TASK_IDS as readonly string[])

type VariantSpec = {
  titleSuffix: string
  keyTonic: string
  keyMode: string
  articulation: string | null
  metadata: Prisma.InputJsonValue
  /** 奏法別の課題タグ(弓サブタスク)。未指定なら opts の admin 値を継承 */
  skillSubTaskTags?: Prisma.InputJsonValue
}

/** 共有MaterialGroup配下に複数変種を作成し、同一ソースXMLを各件へアップ、カバー1枚共有、各件を並列解析。 */
async function generateVariantGroup(opts: {
  kind: MaterialKind
  category: string
  title: string
  composer: string | null
  description: string | null
  descriptionShort: string | null
  tempoMin: number | null
  tempoMax: number | null
  positions: string[]
  star: number | null
  skillSubTaskTags: Prisma.InputJsonValue
  techniques: { id: string; isPrimary: boolean }[]
  buffer: Buffer
  variants: VariantSpec[]
}): Promise<{ groupId: string; count: number }> {
  const storage = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const group = await prisma.materialGroup.create({
    data: { kind: opts.kind, category: opts.category, title: opts.title, composer: opts.composer },
  })
  const createdIds: string[] = []
  for (const v of opts.variants) {
    const child = await prisma.practiceItem.create({
      data: {
        category: opts.category as PracticeCategory,
        title: `${opts.title}・${v.titleSuffix}`,
        composer: opts.composer,
        description: opts.description,
        descriptionShort: opts.descriptionShort,
        keyTonic: v.keyTonic,
        keyMode: v.keyMode,
        tempoMin: opts.tempoMin,
        tempoMax: opts.tempoMax,
        positions: opts.positions,
        instrument: "violin",
        originalXmlPath: "",
        source: "admin",
        isPublished: true,
        analysisStatus: "queued",
        buildStatus: "queued",
        star: opts.star,
        skillSubTaskTags: v.skillSubTaskTags ?? opts.skillSubTaskTags,
        articulation: v.articulation,
        groupId: group.id,
        metadata: v.metadata,
      },
    })
    const path = `practice/${child.id}/original.musicxml`
    const { error: upErr } = await storage.storage
      .from("musicxml")
      .upload(path, opts.buffer, { contentType: "application/xml", upsert: true })
    if (upErr) {
      await prisma.practiceItem.delete({ where: { id: child.id } })
      continue
    }
    await prisma.practiceItem.update({ where: { id: child.id }, data: { originalXmlPath: path } })
    for (const tech of opts.techniques) {
      await prisma.practiceItemTechnique.create({
        data: { practiceItemId: child.id, techniqueTagId: tech.id, isPrimary: tech.isPrimary },
      })
    }
    createdIds.push(child.id)
  }
  after(async () => {
    try {
      if (createdIds[0]) await generatePracticeItemCover(createdIds[0])
    } catch (e) {
      console.error(`[cover] group ${group.id} カバー生成失敗:`, e instanceof Error ? e.message : e)
    }
    // Cloud Run のジョブ実行/分クォータ(429)対策: 一定間隔で順次投入 (~50/分)。
    // 大量(例144)の一斉投入で 429 Quota exceeded が出るため。
    for (const id of createdIds) {
      try {
        await invokeAnalysis({ mode: "score_full", idempotencyKey: `score_full:${id}`, practiceItemId: id })
      } catch {
        /* 個別失敗は relay/status に反映。ここでは握りつぶして次へ */
      }
      await new Promise((r) => setTimeout(r, 1200))
    }
  })
  return { groupId: group.id, count: createdIds.length }
}

export async function uploadPracticeItem(formData: FormData) {
  console.log("▶ uploadPracticeItem START")

  // 管理者チェック（Role enum で "student"|"teacher"|"admin" に限定済）
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "ログインが必要です" }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id },
  })
  if (!dbUser || dbUser.role !== "admin") return { error: "管理者権限が必要です" }

  // フォームデータ取得
  // 入力値は trim する（前後空白が create 時のバリデーションや path 組み立てで
  // 予期しない挙動を招くのを防ぐ）
  const file = formData.get("file") as File | null
  const title = (formData.get("title") as string | null)?.trim() ?? ""
  const composer = (formData.get("composer") as string | null)?.trim() || null
  const category = (formData.get("category") as string | null)?.trim() ?? ""
  const keyTonic = (formData.get("keyTonic") as string | null)?.trim() ?? ""
  const keyMode = (formData.get("keyMode") as string | null)?.trim() ?? ""
  const tempoMin = parseInt(formData.get("tempoMin") as string) || null
  const tempoMax = parseInt(formData.get("tempoMax") as string) || null
  const positions = JSON.parse(formData.get("positions") as string || "[]")
  const techniques = JSON.parse(formData.get("techniques") as string || "[]")
  const description = (formData.get("description") as string | null)?.trim() || null
  const descriptionShort = (formData.get("descriptionShort") as string | null)?.trim() || null

  // 教材グループ・変種 (Phase B): 既存グループに追加=groupId、エチュード難易度=difficulty、基礎練奏法=articulation
  const joinGroupId = (formData.get("groupId") as string | null)?.trim() || ""
  const difficultyRaw = (formData.get("difficulty") as string | null)?.trim() || ""
  const difficulty = isDifficulty(difficultyRaw) ? difficultyRaw : null
  const articulationRaw = (formData.get("articulation") as string | null)?.trim() || ""
  const articulation = isArticulation(articulationRaw) ? articulationRaw : null

  // ループエンジン用フィールド (Phase 1c で追加 / v1.3 B-3: DB カラム & formData key 双方 star に統一)
  const starRaw = (formData.get("star") as string | null)?.trim() ?? ""
  let star: number | null = null
  if (starRaw !== "") {
    const n = Number.parseInt(starRaw, 10)
    if (!Number.isFinite(n) || n < 1 || n > 10) {
      return { error: "難易度は 1 〜 10 で指定してください" }
    }
    star = n
  }
  const skillSubTaskTagsRaw = JSON.parse(
    (formData.get("skillSubTaskTags") as string | null) || "[]",
  )
  const skillSubTaskTags = Array.isArray(skillSubTaskTagsRaw)
    ? Array.from(
        new Set(
          (skillSubTaskTagsRaw as unknown[]).filter(
            (v): v is string => typeof v === "string" && VALID_SUB_TASK_IDS.has(v),
          ),
        ),
      )
    : []

  if (!file || !title || !category || !keyTonic || !keyMode) {
    return { error: "必須項目が不足しています" }
  }

  // category ランタイム検証 (2026-05-31: 基礎練6 + エチュード / 2026-07-14: 学びレッスン追加)。
  // 「練習曲」(score) は Score 側 (uploadScore) で扱うため PracticeItem には来ない。
  // lesson は練習メニュー非表示の管理専用カテゴリ (PRACTICE_CATEGORIES に混ぜない)。
  if (!isPracticeCategory(category) && category !== "lesson") {
    return { error: `不正なカテゴリです: ${category}` }
  }

  // ── 変種の一括生成: 全調(expandAllKeys) × 通常技法(standardArticulations) ──
  //   音階/アルペジオ/フィンガリング は全調可 (両方選べばクロス積 = 24調 × 6奏法 = 144件)。
  //   ボーイング/ポジション移動 は奏法のみ (調は不要 = 全調チェックは非表示)。
  const wantExpand = (formData.get("expandAllKeys") as string) === "true"
  const wantStdArt = (formData.get("standardArticulations") as string) === "true"
  if (wantExpand || wantStdArt) {
    const kind = MATERIAL_KIND_BY_CATEGORY[category]
    if (!kind) return { error: `変種生成に未対応のカテゴリ: ${category}` }
    if (wantExpand && !(KEY_EXPAND_CATEGORIES.includes(category) && keyMode === "major")) {
      return { error: "全調生成は 音階/アルペジオ/フィンガリング かつ 長調ソース のみ対応です" }
    }
    if (wantStdArt && !ARTICULATION_CATEGORIES.includes(category)) {
      return { error: "通常技法パターンは 音階/アルペジオ/ボーイング/フィンガリング/ポジション移動 のみ対応です" }
    }

    // 調ターゲット × 奏法ターゲット のクロス積で変種を作る (片方だけなら単軸)
    const keys: { keyTonic: string; keyMode: string; label: string | null }[] =
      wantExpand ? allKeyTargets() : [{ keyTonic, keyMode, label: null }]
    const arts: ({ id: string; label: string } | null)[] =
      wantStdArt ? STANDARD_ARTICULATIONS : [null]

    const variants: VariantSpec[] = []
    for (const k of keys) {
      for (const a of arts) {
        const suffix = [k.label, a?.label].filter(Boolean).join("・")
        const metadata: Record<string, unknown> = {}
        if (wantExpand) metadata.transposeSource = { keyTonic, keyMode: "major" }
        if (a) metadata.articulationPattern = { type: "uniform", articulation: a.id }
        // 奏法別の課題タグ(弓サブタスク)。対応があれば付与、無ければ admin値を継承。
        const artSub = a ? ARTICULATION_SUBTASK[a.id as keyof typeof ARTICULATION_SUBTASK] : undefined
        variants.push({
          titleSuffix: suffix,
          keyTonic: k.keyTonic,
          keyMode: k.keyMode,
          articulation: a ? a.id : articulation,
          metadata: metadata as Prisma.InputJsonValue,
          skillSubTaskTags: artSub ? ([artSub] as unknown as Prisma.InputJsonValue) : undefined,
        })
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const r = await generateVariantGroup({
      kind, category, title, composer, description, descriptionShort,
      tempoMin, tempoMax, positions, star,
      skillSubTaskTags: skillSubTaskTags as Prisma.InputJsonValue,
      techniques: techniques as { id: string; isPrimary: boolean }[],
      buffer, variants,
    })
    revalidatePath("/admin/practice")
    return { success: true, ...r }
  }

  const item = await prisma.practiceItem.create({
    data: {
      category: category as PracticeCategory,
      title,
      composer,
      description,
      descriptionShort,
      keyTonic,
      keyMode,
      tempoMin,
      tempoMax,
      positions,
      instrument: "violin",
      originalXmlPath: "",
      source: "admin",
      isPublished: true,
      analysisStatus: "queued",
      buildStatus: "queued",
      star,
      skillSubTaskTags: skillSubTaskTags as Prisma.InputJsonValue,
      difficulty,
      articulation,
    },
  })

  // Storage にアップロード
  // item.id は Prisma 生成の cuid なので path に使って安全
  const storagePath = `practice/${item.id}/original.musicxml`
  const buffer = Buffer.from(await file.arrayBuffer())

  const storage = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { error: uploadError } = await storage.storage
    .from("musicxml")
    .upload(storagePath, buffer, { contentType: "application/xml", upsert: true })

  if (uploadError) {
    await prisma.practiceItem.delete({ where: { id: item.id } })
    return { error: `アップロード失敗: ${uploadError.message}` }
  }

  await prisma.practiceItem.update({
    where: { id: item.id },
    data: { originalXmlPath: storagePath },
  })

  // 教材グループ紐付け (Phase B): 既存グループ指定があれば変種として追加、無ければ新規1:1作成。
  let joinedExistingGroup = false
  try {
    if (joinGroupId) {
      const g = await prisma.materialGroup.findUnique({
        where: { id: joinGroupId },
        select: { id: true, category: true },
      })
      // 同カテゴリのグループのみ受け入れる
      if (g && g.category === category) {
        await prisma.practiceItem.update({ where: { id: item.id }, data: { groupId: g.id } })
        joinedExistingGroup = true
      }
    }
    if (!joinedExistingGroup) await ensurePracticeItemGroup(item.id)
  } catch (e) {
    console.error(`[group] practiceItem ${item.id} グループ紐付け失敗:`, e instanceof Error ? e.message : e)
  }

  // AIカバーを応答後に非同期生成。既存グループへの変種追加時は継承するため生成しない。
  if (!joinedExistingGroup) {
    after(async () => {
      try {
        await generatePracticeItemCover(item.id)
      } catch (e) {
        console.error(`[cover] practiceItem ${item.id} 生成失敗:`, e instanceof Error ? e.message : e)
      }
    })
  }

  // 技法タグを紐づけ
  for (const tech of techniques as { id: string; isPrimary: boolean }[]) {
    await prisma.practiceItemTechnique.create({
      data: {
        practiceItemId: item.id,
        techniqueTagId: tech.id,
        isPrimary: tech.isPrimary,
      },
    })
  }

  // 解析ジョブ起動 (Cloud Run Jobs 経由・非同期)
  // analysis/build のパス更新・status=done 遷移は Python 側 (analyze_musicxml.py /
  // build_score.py) が DB UPDATE する。ここでは起動だけ。
  try {
    const r = await invokeAnalysis({
      mode: "score_full",
      idempotencyKey: `score_full:${item.id}`,
      practiceItemId: item.id,
    })
    if (r.status === "skipped") {
      console.warn(
        `[uploadPracticeItem] Analysis skipped, item ${item.id} remains in "queued" state`
      )
      revalidatePath("/admin/practice")
      return { success: true, itemId: item.id }
    }
  } catch (e) {
    console.error("[uploadPracticeItem] invokeAnalysis failed:", e)
    // 失敗してもアイテム自体は残す（手動で再実行可能）
  }

  revalidatePath("/admin/practice")
  return { success: true, itemId: item.id }
}
