"use server"
// 教材 (音階/アルペジオ等) の奏法バリエーション作成 (2026-08-24 要件確定 ・ admin専用)。
//
// 音符ごとの奏法割り当てレシピ (per_note) から変種 PracticeItem を生成する。
// - 繰り返し単位 (unitMeasures小節) の中の音符並び (0始まり・休符除く) に奏法を割り当て、
//   規則を譜面全体へ繰り返し適用 (Python: apply_articulation_variant type=per_note)
// - 何個でも追加できる (要件: 複数個の作成)
// - 適用先: このグループの「いまの調だけ」or「全部の調」
// - 奏法8種: legato/staccato/spiccato/martele/portato/tenuto/tremolo/accent
import { revalidatePath } from "next/cache"
import { Prisma, type PracticeCategory } from "@/app/generated/prisma"
import { prisma } from "@/app/_libs/prisma"
import { requireAdminAction } from "@/app/_libs/requireAuth"
import { invokeAnalysis } from "@/app/_libs/pythonRunner"

const ARTICULATIONS = new Set([
  "legato", "staccato", "spiccato", "martele", "portato", "tenuto", "tremolo", "accent",
])

export type PerNoteAssignment = { noteIndex: number; articulation: string }

export async function createArticulationVariant(input: {
  sourceItemId: string
  name: string                     // バリエーション名 (例: 前半スラー・後半スタッカート)
  unitMeasures: number             // 繰り返し単位 (小節数)。0=譜面全体で1回 → 大きい値で近似
  assignments: PerNoteAssignment[] // 単位内の音符への割り当て
  applyAllKeys: boolean            // true=グループの全調に適用 / false=元の調のみ
}): Promise<{ ok: true; created: number } | { ok: false; error: string }> {
  const gate = await requireAdminAction()
  if (!gate.ok) return { ok: false, error: gate.error }

  const name = input.name.trim().slice(0, 40)
  if (!name) return { ok: false, error: "バリエーション名を入れてください" }
  const unitMeasures = Number.isInteger(input.unitMeasures) && input.unitMeasures >= 1
    ? input.unitMeasures : 9999 // 9999 = 実質「譜面全体で1回」
  const assignments = (input.assignments ?? [])
    .filter((a) => Number.isInteger(a.noteIndex) && a.noteIndex >= 0 && ARTICULATIONS.has(a.articulation))
    .slice(0, 400)
  if (assignments.length === 0) return { ok: false, error: "奏法の割り当てが空です" }

  const source = await prisma.practiceItem.findUnique({
    where: { id: input.sourceItemId },
    select: {
      id: true, groupId: true, category: true, title: true, composer: true,
      description: true, descriptionShort: true, tempoMin: true, tempoMax: true,
      positions: true, star: true, skillSubTaskTags: true, keyTonic: true, keyMode: true,
      metadata: true, originalXmlPath: true, buildStatus: true,
    },
  })
  if (!source) return { ok: false, error: "元の教材が見つかりません" }
  if (!source.originalXmlPath) return { ok: false, error: "元の教材にファイルがありません" }

  // 適用先の代表教材を集める: 全調なら調ごとに1つ (レガート系を優先)、単独なら元教材のみ
  type Rep = {
    id: string; keyTonic: string; keyMode: string; metadata: Prisma.JsonValue
    originalXmlPath: string; star: number | null; skillSubTaskTags: Prisma.JsonValue
  }
  let reps: Rep[] = []
  if (input.applyAllKeys && source.groupId) {
    const all = await prisma.practiceItem.findMany({
      where: { groupId: source.groupId, originalXmlPath: { not: "" } },
      select: {
        id: true, keyTonic: true, keyMode: true, metadata: true, articulation: true,
        originalXmlPath: true, star: true, skillSubTaskTags: true,
      },
      orderBy: { createdAt: "asc" },
    })
    const byKey = new Map<string, typeof all[number]>()
    for (const it of all) {
      const k = `${it.keyTonic}/${it.keyMode}`
      const cur = byKey.get(k)
      // レガート(または奏法なし)を代表に。無ければ最初のもの
      if (!cur || ((it.articulation === "legato" || it.articulation == null) && cur.articulation !== "legato" && cur.articulation != null)) {
        byKey.set(k, it)
      }
    }
    reps = [...byKey.values()]
  } else {
    reps = [source as unknown as Rep]
  }
  if (reps.length === 0) return { ok: false, error: "適用先の教材が見つかりません" }

  const groupTitle = source.groupId
    ? (await prisma.materialGroup.findUnique({ where: { id: source.groupId }, select: { title: true } }))?.title ?? source.title
    : source.title

  const KEY_LABEL: Record<string, string> = {
    C: "ハ", "C#": "嬰ハ", Db: "変ニ", D: "ニ", Eb: "変ホ", E: "ホ", F: "ヘ",
    "F#": "嬰ヘ", Gb: "変ト", G: "ト", Ab: "変イ", A: "イ", Bb: "変ロ", B: "ロ",
  }
  const keyLabel = (t: string, m: string) => `${KEY_LABEL[t] ?? t}${m === "minor" ? "短調" : "長調"}`

  const recipe = {
    name, unitMeasures, assignments,
    appliedKeys: input.applyAllKeys ? "all" : `${source.keyTonic}/${source.keyMode}`,
    sourceItemId: source.id,
  }

  let created = 0
  for (const rep of reps) {
    // 代表の metadata から transposeSource を引き継ぎ、articulationPattern を per_note に差し替え
    const repMd = (rep.metadata && typeof rep.metadata === "object" ? rep.metadata : {}) as Record<string, unknown>
    const metadata: Record<string, unknown> = {}
    if (repMd.transposeSource) metadata.transposeSource = repMd.transposeSource
    metadata.articulationPattern = { type: "per_note", unitMeasures, assignments }

    const child = await prisma.practiceItem.create({
      data: {
        category: source.category as PracticeCategory,
        title: input.applyAllKeys
          ? `${groupTitle}・${keyLabel(rep.keyTonic, rep.keyMode)}・${name}`
          : `${groupTitle}・${name}`,
        composer: source.composer,
        description: source.description,
        descriptionShort: source.descriptionShort,
        keyTonic: rep.keyTonic,
        keyMode: rep.keyMode,
        tempoMin: source.tempoMin,
        tempoMax: source.tempoMax,
        positions: source.positions,
        instrument: "violin",
        originalXmlPath: rep.originalXmlPath, // 元ファイル共有 (解析時にレシピ適用)
        source: "admin",
        isPublished: true,
        analysisStatus: "queued",
        buildStatus: "queued",
        star: rep.star ?? source.star,
        skillSubTaskTags: (rep.skillSubTaskTags ?? source.skillSubTaskTags ?? []) as Prisma.InputJsonValue,
        groupId: source.groupId,
        metadata: metadata as Prisma.InputJsonValue,
        articulationRecipe: recipe as unknown as Prisma.InputJsonValue,
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

  revalidatePath(`/${gate.user.supabaseUser.id}/admin/practice`)
  return { ok: true, created }
}

// ダイアログ用: 元教材の小節数・単位内の音符数を返す (解析済みの note_karte から)
export async function getArticulationContext(itemId: string): Promise<
  | { ok: true; title: string; category: string; measureCount: number; notesPerMeasure: number[]; existing: { name: string; keys: string }[] }
  | { ok: false; error: string }
> {
  const gate = await requireAdminAction()
  if (!gate.ok) return { ok: false, error: gate.error }
  const item = await prisma.practiceItem.findUnique({
    where: { id: itemId },
    select: { id: true, title: true, category: true, groupId: true, analysisPath: true },
  })
  if (!item) return { ok: false, error: "教材が見つかりません" }

  // 小節ごとの音符数: analysis.json の measure_number を数える
  let notesPerMeasure: number[] = []
  try {
    const { createClient } = await import("@supabase/supabase-js")
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const path = `practice/${item.id}/analysis.json`
    const { data, error } = await sb.storage.from("musicxml").download(path)
    if (error || !data) return { ok: false, error: "解析データがまだありません (解析完了後にお試しください)" }
    const j = JSON.parse(Buffer.from(await data.arrayBuffer()).toString("utf8"))
    const notes = (j.notes ?? j.note_results ?? []) as { type?: string; measure_number?: number }[]
    const byMeasure = new Map<number, number>()
    for (const n of notes) {
      if (n.type !== "note" || typeof n.measure_number !== "number") continue
      byMeasure.set(n.measure_number, (byMeasure.get(n.measure_number) ?? 0) + 1)
    }
    const maxM = Math.max(0, ...byMeasure.keys())
    notesPerMeasure = Array.from({ length: maxM }, (_, i) => byMeasure.get(i + 1) ?? 0)
  } catch {
    return { ok: false, error: "解析データの読み込みに失敗しました" }
  }

  // 既存のバリエーション一覧 (グループ内の articulationRecipe 持ち)
  let existing: { name: string; keys: string }[] = []
  if (item.groupId) {
    const rows = await prisma.practiceItem.findMany({
      where: { groupId: item.groupId, NOT: { articulationRecipe: { equals: Prisma.DbNull } } },
      select: { articulationRecipe: true },
    })
    const seen = new Map<string, string>()
    for (const r of rows) {
      const rec = r.articulationRecipe as { name?: string; appliedKeys?: string } | null
      if (rec?.name && !seen.has(rec.name)) seen.set(rec.name, rec.appliedKeys === "all" ? "全調" : "1調")
    }
    existing = [...seen.entries()].map(([name, keys]) => ({ name, keys }))
  }

  return {
    ok: true, title: item.title, category: item.category,
    measureCount: notesPerMeasure.length, notesPerMeasure, existing,
  }
}
