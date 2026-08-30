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
import { recordAchievementIfComplete } from "../_libs/scoreAchievement"
import { questEventHook } from "../_libs/treasureEngine"
import { createServerSupabaseClient } from "../_libs/supabaseServer"
import { positionTagKey, tagId, type LessonTagRef } from "../_libs/lessonStatus"
import { LESSON_BY_ID } from "@/app/[userId]/lessons/_lib/content"

const LESSON_RUNS_REQUIRED = 3 // achievement.py LESSON_RUNS_REQUIRED と同値

export type RecordLessonPlayResult =
  | {
      ok: true
      playCount: number
      cleared: boolean
    }
  | { ok: false; error: string }

export async function recordLessonPlay(
  practiceItemId: string,
  lessonId: string,
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

  // 教えるタグ = そのレッスンが定義するタグ1つだけ (content.ts が正本)。
  // 教材には自動抽出で複数タグが付き得る(例: リコシェ教材にスタッカートも検出される)が、
  // レッスンクリアで巻き添えクリアさせないため、教材の全タグではなくレッスン定義タグのみ書く。
  // 整合性チェックとして、教材に実際にそのタグが張られていることを要求する。
  const lesson = LESSON_BY_ID.get(lessonId)
  if (!lesson) return { ok: false, error: "レッスン定義が見つかりません" }

  const itemTags: LessonTagRef[] = []
  for (const t of item.techniques) itemTags.push({ tagType: "technique", tagKey: t.techniqueTag.name })
  for (const f of item.featureTags) {
    if (f.featureTag.category === "double_stop" && f.featureTag.isAcquisition)
      itemTags.push({ tagType: "double_stop", tagKey: f.featureTag.name })
  }
  const posKeys = new Set<string>()
  for (const p of item.positions) {
    const key = positionTagKey(p)
    if (key) posKeys.add(key)
  }
  for (const key of posKeys) itemTags.push({ tagType: "position", tagKey: key })

  if (!itemTags.some((t) => tagId(t) === tagId(lesson.tag))) {
    return { ok: false, error: "教材とレッスンのタグが一致しません" }
  }
  const tags: LessonTagRef[] = [lesson.tag]

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
      return { playCount: play.playCount, cleared: play.playCount >= LESSON_RUNS_REQUIRED }
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
    for (const t of tags) {
      await tx.userTagAcquisition.updateMany({
        where: {
          userId: dbUser.id,
          tagType: t.tagType,
          tagKey: t.tagKey,
          state: "PROVISIONAL",
        },
        data: { state: "CONFIRMED", confirmedAt: new Date() },
      })
    }

    return {
      playCount: play.playCount,
      cleared: true,
      freshCleared: fresh.length,
    }
  })

  // 達成 = ゴールカードに表示されている行がすべて✓ (2026-08-30 Tetsuo確定)。
  // このレッスンクリアが「最後の✓」だった曲は、次の曲演奏の解析を待たず
  // その場で達成に昇格させる (コインも次のホーム表示で出る)。失敗してもレッスン結果は返す
  if ("freshCleared" in result && (result.freshCleared ?? 0) > 0) {
    // 報酬体系 (骨組み): レッスン初回クリアのクエスト発火
    await questEventHook(dbUser.id, "lesson_first")
    try {
      const [played, achieved] = await Promise.all([
        prisma.performance.findMany({
          where: { userId: dbUser.id, rangeFromNote: null, score: { deletedAt: null, star: { not: null } } },
          select: { scoreId: true },
          distinct: ["scoreId"],
        }),
        prisma.userScoreAchievement.findMany({
          where: { userId: dbUser.id },
          select: { scoreId: true },
        }),
      ])
      const done = new Set(achieved.map((a) => a.scoreId))
      for (const p of played) {
        if (!done.has(p.scoreId)) await recordAchievementIfComplete(dbUser.id, p.scoreId)
      }
    } catch (e) {
      console.error("[recordLessonPlay] achievement cascade failed:", e instanceof Error ? e.message : e)
    }
  }

  return { ok: true, ...result }
}
