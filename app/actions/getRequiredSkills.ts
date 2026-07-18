"use server"

// 練習前シート用: そのスコア/教材を弾くのに必要な技術タグ(習得系含む)と、
// ユーザーの習得状態(未習得か)を返す (2026-07-18)。scoreDetail の学びレッスンゲート
// (gateTags + lessonState.union) と同一ロジックを流用。
import { prisma } from "../_libs/prisma"
import {
  getLessonInventory, getUserLessonState, tagId, positionTagKey,
} from "../_libs/lessonStatus"
import { LESSON_BY_TAG } from "../[userId]/lessons/_lib/content"

export type SkillChip = {
  /** 表示名 (レッスン名 or タグ名) */
  label: string
  tagType: string
  /** true=習得済 or 非学習対象、false=未習得(学べるが未取得) */
  acquired: boolean
  /** 未習得で学べるレッスンがある場合の lessonId */
  lessonId: string | null
}

type Gate = { tagType: string; tagKey: string; label: string }

export async function getRequiredSkills(
  kind: "score" | "practice",
  id: string,
  authUserId: string,
): Promise<SkillChip[]> {
  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: authUserId },
    select: { id: true },
  })

  const gates: Gate[] = []
  const addTech = (name: string) => gates.push({ tagType: "technique", tagKey: name, label: name })
  const addDs = (name: string) => gates.push({ tagType: "double_stop", tagKey: name, label: `重音 ${name}` })
  const addPos = (key: string) => gates.push({ tagType: "position", tagKey: key, label: `${key}ポジション` })

  if (kind === "score") {
    const s = await prisma.score.findUnique({
      where: { id },
      select: {
        scoreTechniqueTags: { select: { techniqueTag: { select: { name: true } } } },
        featureTags: { select: { featureTag: { select: { category: true, name: true, isAcquisition: true } } } },
        positions: true,
      },
    })
    if (!s) return []
    for (const t of s.scoreTechniqueTags) addTech(t.techniqueTag.name)
    for (const f of s.featureTags) if (f.featureTag.category === "double_stop" && f.featureTag.isAcquisition) addDs(f.featureTag.name)
    const pk = new Set<string>()
    for (const n of s.positions) { const k = positionTagKey(String(n)); if (k) pk.add(k) }
    for (const k of pk) addPos(k)
  } else {
    const it = await prisma.practiceItem.findUnique({
      where: { id },
      select: {
        techniques: { select: { techniqueTag: { select: { name: true } } } },
        featureTags: { select: { featureTag: { select: { category: true, name: true, isAcquisition: true } } } },
        positions: true,
      },
    })
    if (!it) return []
    for (const t of it.techniques) addTech(t.techniqueTag.name)
    for (const f of it.featureTags) if (f.featureTag.category === "double_stop" && f.featureTag.isAcquisition) addDs(f.featureTag.name)
    const pk = new Set<string>()
    for (const p of it.positions) { const k = positionTagKey(p); if (k) pk.add(k) }
    for (const k of pk) addPos(k)
  }

  if (gates.length === 0) return []

  const [inventory, state] = await Promise.all([
    getLessonInventory(),
    dbUser ? getUserLessonState(dbUser.id) : Promise.resolve({ union: new Set<string>() }),
  ])

  const seen = new Set<string>()
  const out: SkillChip[] = []
  for (const g of gates) {
    const tid = tagId(g)
    if (seen.has(tid)) continue
    seen.add(tid)
    const inv = inventory.get(tid)
    const learnable = !!inv && inv.buildStatus === "done" && !!inv.generatedXmlPath
    const acquired = state.union.has(tid)
    const lesson = LESSON_BY_TAG.get(tid)
    out.push({
      label: lesson?.name ?? g.label,
      tagType: g.tagType,
      acquired: learnable ? acquired : true,
      lessonId: learnable && !acquired ? (lesson?.id ?? null) : null,
    })
  }
  // 未習得を先頭へ
  out.sort((a, b) => Number(a.acquired) - Number(b.acquired))
  return out
}
