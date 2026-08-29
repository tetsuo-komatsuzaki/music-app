"use server"

// 「アルコと最初の1周」ガイドとクエストの進行保存 (2026-08-29)
//
// 出す条件 (Tetsuo確定): 未完了かつ未スキップの全ユーザー (既存ユーザーにも出す)。
// 先生ロールには出さない (判定は page.tsx 側)。進行・完了はDB保存のみで、
// localStorage は使わない (端末跨ぎで再表示される WelcomeSlides の欠陥を繰り返さない)。
// 途中離脱は firstLoopStep から続きを再開。完了時はクエスト「はじめての1周」も達成。

import { prisma } from "../_libs/prisma"
import type { Prisma } from "@/app/generated/prisma/client"
import { createServerSupabaseClient } from "../_libs/supabaseServer"

async function currentUserId(): Promise<string | null> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id },
    select: { id: true },
  })
  return dbUser?.id ?? null
}

/** 途中経過の保存 (ステップが進むたびに呼ぶ。巻き戻しはしない) */
export async function saveGuideStep(step: number): Promise<void> {
  const userId = await currentUserId()
  if (userId == null || !Number.isFinite(step)) return
  const s = Math.max(0, Math.min(64, Math.floor(step)))
  try {
    const cur = await prisma.userGuideState.findUnique({ where: { userId }, select: { firstLoopStep: true } })
    await prisma.userGuideState.upsert({
      where: { userId },
      create: { userId, firstLoopStep: s },
      update: { firstLoopStep: Math.max(s, cur?.firstLoopStep ?? 0) },
    })
  } catch { /* 進行保存の失敗でガイドを止めない */ }
}

/** 完了。二度と表示しない+クエスト「はじめての1周」達成 */
export async function completeGuide(): Promise<void> {
  const userId = await currentUserId()
  if (userId == null) return
  const now = new Date()
  try {
    const cur = await prisma.userGuideState.findUnique({ where: { userId }, select: { quests: true } })
    const quests = { ...(cur?.quests as Record<string, unknown> ?? {}), first_loop: { doneAt: now.toISOString() } } as Prisma.InputJsonValue
    await prisma.userGuideState.upsert({
      where: { userId },
      create: { userId, completedAt: now, quests },
      update: { completedAt: now, quests },
    })
  } catch { /* noop */ }
}

/** スキップ。二度と表示しない (カード付与はしない) */
export async function skipGuide(): Promise<void> {
  const userId = await currentUserId()
  if (userId == null) return
  try {
    await prisma.userGuideState.upsert({
      where: { userId },
      create: { userId, skippedAt: new Date() },
      update: { skippedAt: new Date() },
    })
  } catch { /* noop */ }
}

/** ヘルプ「最初の1周をもう一度見る」用: 完了/スキップを外して最初から再生する */
export async function resetGuideForReplay(): Promise<void> {
  const userId = await currentUserId()
  if (userId == null) return
  try {
    await prisma.userGuideState.upsert({
      where: { userId },
      create: { userId },
      update: { firstLoopStep: 0, completedAt: null, skippedAt: null },
    })
  } catch { /* noop */ }
}

/** クエスト達成の記録 (冪等)。各機能の実装点から呼ぶ */
export async function markQuestDone(questId: string): Promise<void> {
  const userId = await currentUserId()
  if (userId == null || !/^[a-z0-9_]{1,40}$/.test(questId)) return
  try {
    const cur = await prisma.userGuideState.findUnique({ where: { userId }, select: { quests: true } })
    const quests = (cur?.quests as Record<string, unknown> | null) ?? {}
    if (quests[questId]) return
    const next = { ...quests, [questId]: { doneAt: new Date().toISOString() } } as Prisma.InputJsonValue
    await prisma.userGuideState.upsert({
      where: { userId },
      create: { userId, quests: next },
      update: { quests: next },
    })
  } catch { /* noop */ }
}
