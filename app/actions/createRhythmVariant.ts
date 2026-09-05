"use server"
// リズムパターン変種の作成 (2026-08-24 要件確定 ・ admin専用)。
//
// くり返し単位のリズムを組み替え、同じ形の単位すべてに適用した変種を作る。
// 変換は解析時に Python (lib/rhythm_recipe.py) が行い、生成物は通常アップロードと
// 同じ形式 (MusicXML + analysis + build_score) になる。
import { revalidatePath } from "next/cache"
import { firstPassNotes } from "@/app/_libs/analysisNotes"
import { Prisma, type PracticeCategory } from "@/app/generated/prisma"
import { prisma } from "@/app/_libs/prisma"
import { requireAdminAction } from "@/app/_libs/requireAuth"
import { invokeAnalysis } from "@/app/_libs/pythonRunner"
import { noteQl, notePitchNos, RHYTHM_ARTICULATIONS, type RhythmNote } from "@/app/_libs/rhythmRecipe"
import { normalizeNoteName } from "@/app/_libs/noteName"
import { ARTICULATIONS as AXIS_ARTICULATIONS } from "@/app/_libs/materialVariant"

const ARTS = new Set<string>(RHYTHM_ARTICULATIONS as readonly string[])

/** 解析データから、小節ごとの音符数・拍数と「同じリズムの小節」をまとめて返す */
export async function getRhythmContext(itemId: string, kind: "practice" | "score" = "practice"): Promise<
  | {
      ok: true; title: string; beatsPerMeasure: number; measureCount: number
      notesPerMeasure: number[]; unitCandidates: number[]
      /** 単位ごとの「同じリズムの単位数」(unit → 件数) */
      sameCountByUnit: Record<number, number>
      srcNames: string[]   // 先頭単位の音名 (高さ番号の表示用)
      /** 通しの奏法 (2026-08-28 A案)。ダイアログの「奏法をえらぶ」の初期選択に使う */
      sourceArticulation: string | null
    }
  | { ok: false; error: string }
> {
  const gate = await requireAdminAction()
  if (!gate.ok) return { ok: false, error: gate.error }

  const item = kind === "practice"
    ? await prisma.practiceItem.findUnique({ where: { id: itemId }, select: { id: true, title: true, articulation: true } })
    : await prisma.score.findUnique({ where: { id: itemId }, select: { id: true, title: true } })
  if (!item) return { ok: false, error: "見つかりません" }

  try {
    const { createClient } = await import("@supabase/supabase-js")
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const path = kind === "practice" ? `practice/${itemId}/analysis.json` : null
    if (!path) return { ok: false, error: "曲のリズム変種は未対応です" }
    const { data, error } = await sb.storage.from("musicxml").download(path)
    if (error || !data) return { ok: false, error: "解析データがまだありません" }
    const j = JSON.parse(Buffer.from(await data.arrayBuffer()).toString("utf8"))
    const notes = (j.notes ?? j.note_results ?? []) as { type?: string; measure_number?: number; note_name?: string; start_time_sec?: number; end_time_sec?: number }[]

    const byMeasure = new Map<number, { count: number; names: string[]; durs: number[] }>()
    // 繰り返し展開後の解析データを記譜の1回目だけに絞る (2026-09-05 No.16 が1小節24音になっていた)
    for (const n of firstPassNotes(notes)) {
      if (n.type !== "note" || typeof n.measure_number !== "number") continue
      const m = byMeasure.get(n.measure_number) ?? { count: 0, names: [], durs: [] }
      m.count += 1
      if (n.note_name) m.names.push(normalizeNoteName(n.note_name)) // music21 の "B-3" (シ♭) を "Bb3" に (2026-09-05 Tetsuo指摘)
      if (typeof n.start_time_sec === "number" && typeof n.end_time_sec === "number") {
        m.durs.push(Math.round((n.end_time_sec - n.start_time_sec) * 1000) / 1000)
      }
      byMeasure.set(n.measure_number, m)
    }
    const measureCount = Math.max(0, ...byMeasure.keys())
    const notesPerMeasure = Array.from({ length: measureCount }, (_, i) => byMeasure.get(i + 1)?.count ?? 0)

    // 単位候補ごとに「先頭単位と同じリズム (音価の並び) の単位数」を数える
    const sig = (from: number, unit: number) =>
      Array.from({ length: unit }, (_, k) => (byMeasure.get(from + k)?.durs ?? []).join(",")).join("|")
    const sameCountByUnit: Record<number, number> = {}
    const unitCandidates = [1, 2, 3, 4, 8].filter((u) => u <= Math.max(1, measureCount))
    for (const u of unitCandidates) {
      const head = sig(1, u)
      let same = 0
      for (let start = 1; start + u - 1 <= measureCount; start += u) {
        if (sig(start, u) === head) same += 1
      }
      sameCountByUnit[u] = same
    }

    // 拍子は解析データから (PracticeItem に拍子列は無い)。quarterLength 換算の拍数。
    const ts = (j.time_signature ?? {}) as { numerator?: number; denominator?: number }
    const beatsPerMeasure = (ts.numerator ?? 4) * (4 / (ts.denominator ?? 4))
    const srcNames = (byMeasure.get(1)?.names ?? []).slice(0, 64)
    return {
      ok: true, title: item.title, beatsPerMeasure, measureCount, notesPerMeasure, unitCandidates, sameCountByUnit, srcNames,
      sourceArticulation: kind === "practice" ? ((item as { articulation?: string | null }).articulation ?? null) : null,
    }
  } catch {
    return { ok: false, error: "解析データの読み込みに失敗しました" }
  }
}

const AXIS_ARTS = new Set<string>(AXIS_ARTICULATIONS.map((a) => a.id))

export async function createRhythmVariant(input: {
  sourceItemId: string
  name: string
  unitMeasures: number
  notes: RhythmNote[]
  /** 対象外の小節 (2026-08-24): 先頭から / 終わりから / ピンポイント (1始まり) */
  skipHead?: number
  skipTail?: number
  skipMeasures?: number[]
  /** 2026-08-28 A案 (Tetsuo確定): このパターンをどの奏法の軸に置くか。人が選ぶ。
      undefined = 指定なし (通しから継ぐ) / null = 「なし」を明示 / 文字列 = その奏法 */
  articulation?: string | null
}): Promise<{ ok: true; itemId: string } | { ok: false; error: string }> {
  const gate = await requireAdminAction()
  if (!gate.ok) return { ok: false, error: gate.error }

  const name = input.name.trim().slice(0, 40)
  if (!name) return { ok: false, error: "名前を入れてください" }
  // 奏法は選択用の正リスト (materialVariant.ARTICULATIONS) にある id だけ受ける
  if (typeof input.articulation === "string" && !AXIS_ARTS.has(input.articulation)) {
    return { ok: false, error: "奏法の指定が不正です" }
  }
  const unitMeasures = Number.isInteger(input.unitMeasures) && input.unitMeasures >= 1 ? input.unitMeasures : 1
  // 重音 (2026-09-05): pitchNos は 2〜4 個に整え、先頭を pitchNo に揃える。1個以下なら単音
  const notes: RhythmNote[] = (input.notes ?? [])
    .filter((n) => noteQl(n) != null && Number.isInteger(n.pitchNo) && n.pitchNo >= 1 && ARTS.has(n.articulation ?? ""))
    .map((n) => {
      const nos = notePitchNos(n)
      return nos.length >= 2 ? { ...n, pitchNo: nos[0], pitchNos: nos } : { ...n, pitchNo: n.pitchNo, pitchNos: undefined }
    })
  if (notes.length === 0) return { ok: false, error: "音符がありません" }

  const source = await prisma.practiceItem.findUnique({
    where: { id: input.sourceItemId },
    select: {
      id: true, groupId: true, category: true, title: true, composer: true,
      description: true, descriptionShort: true, keyTonic: true, keyMode: true,
      tempoMin: true, tempoMax: true, positions: true, star: true,
      skillSubTaskTags: true, metadata: true, originalXmlPath: true, buildStatus: true,
      articulation: true,
    },
  })
  if (!source) return { ok: false, error: "元の教材が見つかりません" }
  if (!source.originalXmlPath) return { ok: false, error: "元の教材にファイルがありません" }
  if (source.buildStatus !== "done") return { ok: false, error: "解析完了後に作成できます" }

  // 拍の帳尻をサーバ側でも検証 (UIのメーターと二重で担保)。拍子は解析データが正。
  let beatsPerMeasure = 4
  try {
    const { createClient } = await import("@supabase/supabase-js")
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data } = await sb.storage.from("musicxml").download(`practice/${source.id}/analysis.json`)
    if (data) {
      const j = JSON.parse(Buffer.from(await data.arrayBuffer()).toString("utf8"))
      const ts = (j.time_signature ?? {}) as { numerator?: number; denominator?: number }
      beatsPerMeasure = (ts.numerator ?? 4) * (4 / (ts.denominator ?? 4))
    }
  } catch { /* 既定の4拍で続行 */ }
  const need = beatsPerMeasure * unitMeasures
  const total = notes.reduce((a, n) => a + (noteQl(n) ?? 0), 0)
  if (Math.abs(total - need) > 1e-6) {
    return { ok: false, error: `拍が合いません (必要 ${need}拍 / いま ${Math.round(total * 1000) / 1000}拍)` }
  }

  const skipHead = Math.max(0, Math.trunc(input.skipHead ?? 0))
  const skipTail = Math.max(0, Math.trunc(input.skipTail ?? 0))
  const skipMeasures = [...new Set((input.skipMeasures ?? []).map((n) => Math.trunc(n)).filter((n) => n >= 1))].sort((a, b) => a - b)
  const recipe = { name, unitMeasures, notes, skipHead, skipTail, skipMeasures, sourceItemId: source.id }
  const md = (source.metadata && typeof source.metadata === "object" ? source.metadata : {}) as Record<string, unknown>
  const metadata: Record<string, unknown> = {}
  if (md.transposeSource) metadata.transposeSource = md.transposeSource
  if (md.articulationPattern) metadata.articulationPattern = md.articulationPattern

  const child = await prisma.practiceItem.create({
    data: {
      category: source.category as PracticeCategory,
      title: `${source.title}・${name}`,
      composer: source.composer,
      description: source.description,
      descriptionShort: source.descriptionShort,
      keyTonic: source.keyTonic,
      keyMode: source.keyMode,
      tempoMin: source.tempoMin,
      tempoMax: source.tempoMax,
      positions: source.positions,
      instrument: "violin",
      originalXmlPath: source.originalXmlPath,  // 元ファイル共有 (解析時にレシピ適用)
      source: "admin",
      isPublished: true,
      analysisStatus: "queued",
      buildStatus: "queued",
      star: source.star,
      // 2026-08-28 Tetsuo確定: 課題タグは写さない。変種ごとに解析が中身から判定する。
      // 通しから写すと空でなくなり、解析側の「空のときだけ入れる」に阻まれて
      // その抜粋/変種に実際は出てこない課題が残り続けていた。
      // 奏法 = 人が選ぶ軸 (2026-08-28 A案)。ダイアログの選択を最優先し、
      // 未指定なら通しから継ぐ。混在パターンでも人が「どの軸に置くか」を決める。
      articulation: input.articulation !== undefined ? input.articulation : source.articulation,
      groupId: source.groupId,
      metadata: metadata as Prisma.InputJsonValue,
      rhythmRecipe: recipe as unknown as Prisma.InputJsonValue,
    },
  })

  try {
    await invokeAnalysis({ mode: "score_full", idempotencyKey: `score_full:${child.id}`, practiceItemId: child.id })
  } catch (e) {
    await prisma.practiceItem.update({
      where: { id: child.id },
      data: {
        analysisStatus: "error", buildStatus: "error",
        errorMessage: e instanceof Error ? e.message.slice(0, 300) : String(e).slice(0, 300),
      },
    })
    return { ok: false, error: "解析ジョブの起動に失敗しました" }
  }
  revalidatePath(`/${gate.user.supabaseUser.id}/admin/practice`)
  return { ok: true, itemId: child.id }
}
