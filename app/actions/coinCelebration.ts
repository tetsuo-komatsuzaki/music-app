"use server"

// 達成コインの獲得モーション消化 (2026-08-30 Tetsuo確定仕様)。
// UserScoreAchievement.coinCelebratedAt が null の行 = ホーム未演出のコイン。
// 演出開始時点で全行を消化する (Q17: 途中離脱しても繰り返さない /
// Q3: 3枚目以降は演出なしでゲージ反映のみ = 同時にまとめて消化)。
// 過去の達成分はマイグレーションで backfill 済み (Q1: 遡及演出はしない)。

import { prisma } from "../_libs/prisma"
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

/** ホームのコイン演出開始で呼ぶ。未演出コインを全て消化する (自分の行のみ) */
export async function markCoinsCelebrated(): Promise<void> {
  const userId = await currentUserId()
  if (userId == null) return
  try {
    await prisma.userScoreAchievement.updateMany({
      where: { userId, coinCelebratedAt: null },
      data: { coinCelebratedAt: new Date() },
    })
  } catch { /* 消化の失敗で演出やホームを止めない (次回もう一度流れるだけ) */ }
}
