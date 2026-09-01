// パート実体化の共通ロジック (2026-08-31 Tetsuo確定 A案)。
//
// 背景: パート教材は「元教材 (通し変種) 単位」で実体化する設計のため、奏法変種を
// あとから作ってもそのパートは自動では生まれず、練習前シートで奏法×パートの
// 組が旧経路 (通し+区間) に落ちて全小節表示になっていた。
// ここに実体化の核を置き、(1) admin操作 (createPartVariant action)、
// (2) admin教材一覧を開いたときの自己修復スイープ、(3) 遡及スクリプト から共用する。
// 解析は非同期 (Cloud Run) なので「変種の解析が終わったあと最初のスイープ」で揃う。
import { Prisma, type PracticeCategory } from "@/app/generated/prisma"
import { prisma } from "@/app/_libs/prisma"
import { invokeAnalysis } from "@/app/_libs/pythonRunner"
import { parseParts } from "@/app/_libs/materialParts"

/** 1つの通し教材から、未実体化のパートを教材として作る (認可は呼び手が行う) */
export async function materializePracticeParts(sourceItemId: string, opts?: { partIds?: string[] }): Promise<
  { ok: true; created: number; skipped: number } | { ok: false; error: string }
> {
  const source = await prisma.practiceItem.findUnique({
    where: { id: sourceItemId },
    select: {
      id: true, groupId: true, category: true, title: true, composer: true,
      description: true, descriptionShort: true, keyTonic: true, keyMode: true,
      tempoMin: true, tempoMax: true, positions: true, star: true,
      skillSubTaskTags: true, metadata: true, originalXmlPath: true, buildStatus: true,
      partId: true, articulation: true, rhythmRecipe: true,
    },
  })
  if (!source) return { ok: false, error: "元の教材が見つかりません" }
  if (source.partId) return { ok: false, error: "パート教材からは作れません (通しの教材を選んでください)" }
  if (!source.groupId) return { ok: false, error: "教材グループが無いためパートを作れません" }
  if (source.buildStatus !== "done") return { ok: false, error: "解析完了後に作成できます" }

  const g = await prisma.materialGroup.findUnique({ where: { id: source.groupId }, select: { parts: true } })
  const parts = parseParts(g?.parts ?? []).filter((p) => !opts?.partIds || opts.partIds.includes(p.id))
  if (parts.length === 0) return { ok: false, error: "パートが定義されていません" }

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

  let created = 0
  let skipped = 0
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
        // 2026-08-28 Tetsuo確定: 課題タグは写さない。変種ごとに解析が中身から判定する。
        groupId: source.groupId,
        partId: part.id,
        // 2026-08-28: 奏法は通しから継ぐ (人が選ぶ軸。パートごとの自動判定に任せない)
        articulation: source.articulation,
        // 2026-09-01: リズム変種も同じ理由で継ぐ。写していなかったため、リズム登録した
        // 教材のパートが「リズムなしの素の抜粋」になり、そもそも作られていなかった。
        // 解析側は 範囲切り出し→移調→奏法→リズム の順で両方適用できる (analyze_musicxml.py)
        rhythmRecipe: (source.rhythmRecipe ?? Prisma.DbNull) as Prisma.InputJsonValue,
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
    // Cloud Run のジョブ実行/分クォータ(429)対策
    await new Promise((r) => setTimeout(r, 1200))
  }
  return { ok: true, created, skipped }
}

/** 全グループのスイープ: パート定義があるグループの、解析済み通し変種ぜんぶを実体化。
    冪等 (作成済みの組はスキップ)。admin教材一覧の表示時と遡及スクリプトから呼ぶ */
export async function sweepPracticePartVariants(): Promise<{ groups: number; created: number; skipped: number }> {
  const groups = (await prisma.materialGroup.findMany({
    where: { kind: { not: "SONG" }, parts: { not: Prisma.DbNull } },
    select: { id: true, parts: true },
  })).filter((g) => parseParts(g.parts ?? []).length > 0)
  let created = 0
  let skipped = 0
  for (const g of groups) {
    const sources = await prisma.practiceItem.findMany({
      where: { groupId: g.id, partId: null, buildStatus: "done" },
      select: { id: true },
    })
    for (const s of sources) {
      const r = await materializePracticeParts(s.id)
      if (r.ok) { created += r.created; skipped += r.skipped }
    }
  }
  return { groups: groups.length, created, skipped }
}
