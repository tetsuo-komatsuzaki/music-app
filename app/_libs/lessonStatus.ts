// 学びレッスンの状態解決 (確定#3/#5 2026-07-14)
//
// - レッスン⇔教材の対応: コンテンツ定義(content.ts)のタグと、公開中の
//   PracticeItem(category=lesson)に張られたタグの一致で実行時に解決する(正本はタグ)。
// - クリア判定の表示: 正式クリア=UserLessonClear。申告済み=UserTagAcquisition(≠REVOKED)
//   のみ(淡い✓バッジ)。曲側ゲート・誘導はユニオン(achievement.py要件①と同一式)。

import { prisma } from "@/app/_libs/prisma"

export type LessonTagRef = { tagType: string; tagKey: string }

export const tagId = (t: LessonTagRef) => `${t.tagType}:${t.tagKey}`

/** "1st"/"3rd" 形式 → tagKey。6以上は "6" に正規化 (確定#8・achievement.py と同一) */
export function positionTagKey(raw: string): string | null {
  const m = /^(\d+)/.exec(String(raw))
  if (!m) return null
  const n = parseInt(m[1], 10)
  if (n < 2) return null
  return n >= 6 ? "6" : String(n)
}

export type LessonItemInfo = {
  practiceItemId: string
  tempoMin: number | null
  generatedXmlPath: string | null
  buildStatus: string
  /** この教材が教えるタグ全部 (通常は1つ) */
  tags: LessonTagRef[]
}

/**
 * 公開中レッスン教材の在庫を「タグ→教材」で返す (achievement.py _lesson_stock のTS版)。
 * 同一タグに複数教材がある場合は sortOrder/createdAt 順の先頭を採用。
 */
export async function getLessonInventory(): Promise<Map<string, LessonItemInfo>> {
  const items = await prisma.practiceItem.findMany({
    where: { category: "lesson", isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      tempoMin: true,
      generatedXmlPath: true,
      buildStatus: true,
      positions: true,
      techniques: { select: { techniqueTag: { select: { name: true } } } },
      featureTags: {
        select: {
          featureTag: { select: { category: true, name: true, isAcquisition: true } },
        },
      },
    },
  })
  const map = new Map<string, LessonItemInfo>()
  for (const it of items) {
    const tags: LessonTagRef[] = []
    for (const t of it.techniques) tags.push({ tagType: "technique", tagKey: t.techniqueTag.name })
    for (const f of it.featureTags) {
      if (f.featureTag.category === "double_stop" && f.featureTag.isAcquisition)
        tags.push({ tagType: "double_stop", tagKey: f.featureTag.name })
    }
    const posKeys = new Set<string>()
    for (const p of it.positions) {
      const key = positionTagKey(p)
      if (key) posKeys.add(key)
    }
    for (const key of posKeys) tags.push({ tagType: "position", tagKey: key })

    const info: LessonItemInfo = {
      practiceItemId: it.id,
      tempoMin: it.tempoMin,
      generatedXmlPath: it.generatedXmlPath,
      buildStatus: it.buildStatus,
      tags,
    }
    for (const t of tags) {
      if (!map.has(tagId(t))) map.set(tagId(t), info)
    }
  }
  return map
}

export type UserLessonState = {
  /** 正式クリア済みタグ (UserLessonClear) */
  cleared: Set<string>
  /** 自己申告のみ (UserTagAcquisition ≠REVOKED で未クリア) → 淡い✓バッジ */
  selfReported: Set<string>
  /** ユニオン (曲ゲート・誘導の判定に使う) */
  union: Set<string>
  /** レッスンごとの演奏回数 (practiceItemId → playCount) */
  plays: Map<string, number>
}

export async function getUserLessonState(userId: string): Promise<UserLessonState> {
  const [clears, acquisitions, plays] = await Promise.all([
    prisma.userLessonClear.findMany({
      where: { userId },
      select: { tagType: true, tagKey: true },
    }),
    prisma.userTagAcquisition.findMany({
      where: { userId, state: { not: "REVOKED" } },
      select: { tagType: true, tagKey: true },
    }),
    prisma.userLessonPlay.findMany({
      where: { userId },
      select: { practiceItemId: true, playCount: true },
    }),
  ])
  const cleared = new Set(clears.map(tagId))
  const union = new Set(cleared)
  const selfReported = new Set<string>()
  for (const a of acquisitions) {
    const id = tagId(a)
    union.add(id)
    if (!cleared.has(id)) selfReported.add(id)
  }
  return {
    cleared,
    selfReported,
    union,
    plays: new Map(plays.map((p) => [p.practiceItemId, p.playCount])),
  }
}
