"use server"

// 報酬体系: クライアント内操作のクエスト発火・行動カウント (骨組み・2026-08-30)。
// 白リスト (treasureCatalog) にあるIDのみ受理。低リスク操作 (画面を見た等) 専用で、
// 点数・課金・達成判定には一切影響しない。キルスイッチ (REWARD_SYSTEM_LIT) 配下。

import { prisma } from "../_libs/prisma"
import { createServerSupabaseClient } from "../_libs/supabaseServer"
import { ACTION_COUNT_KEYS, CLIENT_EVENT_QUEST_IDS } from "../_libs/treasureCatalog"
import { grantQuest, rewardSystemLit } from "../_libs/treasureEngine"

async function currentUserId(): Promise<string | null> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id },
    select: { id: true, role: true, deletedAt: true },
  })
  if (!dbUser || dbUser.role === "teacher" || dbUser.deletedAt != null) return null
  return dbUser.id
}

/** 操作イベント: event型クエストの発火 (例 "fingerboard_zoom") */
export async function recordQuestEvent(questId: string): Promise<void> {
  if (!rewardSystemLit()) return
  if (!CLIENT_EVENT_QUEST_IDS.has(questId)) return
  const userId = await currentUserId()
  if (!userId) return
  await grantQuest(userId, questId)
}

/** 行動カウント: action型カウンター (例 "playback") を+1 */
export async function recordActionCount(action: string): Promise<void> {
  if (!rewardSystemLit()) return
  if (!ACTION_COUNT_KEYS.has(action)) return
  const userId = await currentUserId()
  if (!userId) return
  try {
    await prisma.userActionCount.upsert({
      where: { userId_action: { userId, action } },
      create: { userId, action, count: 1 },
      update: { count: { increment: 1 } },
    })
  } catch (e) {
    console.error("[questEvents] count failed:", action, e instanceof Error ? e.message : e)
  }
}
