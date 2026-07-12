"use server"

// 学びレッスンの演奏報告 (確定#3/#4 2026-07-14)
//
// クライアントの窓あき発音チェック(音符の期待タイミングに発音があるか)に合格した
// 録音1回ごとに呼ばれる。録音音声はアップロードされない(端末内で破棄)。
// 3回目で:
//   ① UserLessonClear (正式クリア記録・冪等) を教材のタグ分書き込み
//   ② 同タグの自己申告 UserTagAcquisition が PROVISIONAL なら CONFIRMED へ昇格 (確定#4)
// 品質(音程/リズム)は判定しない=点数不問 (achievement.py のレッスンクリア思想と同一)。

import { prisma } from "../_libs/prisma"
import { createServerSupabaseClient } from "../_libs/supabaseServer"
import { positionTagKey, type LessonTagRef } from "../_libs/lessonStatus"

const LESSON_RUNS_REQUIRED = 3 // achievement.py LESSON_RUNS_REQUIRED と同値

export type RecordLessonPlayResult =
  | {
      ok: true
      playCount: number
      cleared: boolean
      /** 今回のクリアで新規に書かれたタグ */
      newlyCleared: string[]
      /** PROVISIONAL→CONFIRMED に昇格した自己申告タグ数 */
      confirmed: number
    }
  | { ok: false; error: string }

export async function recordLessonPlay(
  practiceItemId: string,
): Promise<RecordLessonPlayResult> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "ログインが必要です" }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id },
    select: { id: true },
  })
  if (!dbUser) return { ok: false, error: "ユーザーが見つかりません" }

  const item = await prisma.practiceItem.findUnique({
    where: { id: practiceItemId },
    select: {
      id: true,
      category: true,
      isPublished: true,
      positions: true,
      techniques: { select: { techniqueTag: { select: { name: true } } } },
      featureTags: {
        select: {
          featureTag: { select: { category: true, name: true, isAcquisition: true } },
        },
      },
    },
  })
  if (!item || item.category !== "lesson" || !item.isPublished) {
    return { ok: false, error: "レッスン教材が見つかりません" }
  }

  // 教えるタグ = 教材自身のタグ (achievement.py process_practice_achievement と同一導出)
  const tags: LessonTagRef[] = []
  for (const t of item.techniques) tags.push({ tagType: "technique", tagKey: t.techniqueTag.name })
  for (const f of item.featureTags) {
    if (f.featureTag.category === "double_stop" && f.featureTag.isAcquisition)
      tags.push({ tagType: "double_stop", tagKey: f.featureTag.name })
  }
  const posKeys = new Set<string>()
  for (const p of item.positions) {
    const key = positionTagKey(p)
    if (key) posKeys.add(key)
  }
  for (const key of posKeys) tags.push({ tagType: "position", tagKey: key })

  const result = await prisma.$transaction(async (tx) => {
    const play = await tx.userLessonPlay.upsert({
      where: {
        userId_practiceItemId: { userId: dbUser.id, practiceItemId: item.id },
      },
      create: { userId: dbUser.id, practiceItemId: item.id, playCount: 1 },
      update: { playCount: { increment: 1 } },
      select: { playCount: true },
    })

    if (play.playCount < LESSON_RUNS_REQUIRED || tags.length === 0) {
      return { playCount: play.playCount, cleared: play.playCount >= LESSON_RUNS_REQUIRED, newlyCleared: [] as string[], confirmed: 0 }
    }

    // ① 正式クリア記録 (冪等: unique userId+tagType+tagKey)
    const existing = await tx.userLessonClear.findMany({
      where: {
        userId: dbUser.id,
        OR: tags.map((t) => ({ tagType: t.tagType, tagKey: t.tagKey })),
      },
      select: { tagType: true, tagKey: true },
    })
    const existingSet = new Set(existing.map((e) => `${e.tagType}:${e.tagKey}`))
    const fresh = tags.filter((t) => !existingSet.has(`${t.tagType}:${t.tagKey}`))
    if (fresh.length > 0) {
      await tx.userLessonClear.createMany({
        data: fresh.map((t) => ({
          userId: dbUser.id,
          tagType: t.tagType,
          tagKey: t.tagKey,
          lessonItemId: item.id,
        })),
        skipDuplicates: true,
      })
    }

    // ② 自己申告の昇格 (確定#4: レッスンクリア = 触れた確認済み)
    let confirmed = 0
    for (const t of tags) {
      const res = await tx.userTagAcquisition.updateMany({
        where: {
          userId: dbUser.id,
          tagType: t.tagType,
          tagKey: t.tagKey,
          state: "PROVISIONAL",
        },
        data: { state: "CONFIRMED", confirmedAt: new Date() },
      })
      confirmed += res.count
    }

    return {
      playCount: play.playCount,
      cleared: true,
      newlyCleared: fresh.map((t) => `${t.tagType}:${t.tagKey}`),
      confirmed,
    }
  })

  return { ok: true, ...result }
}
