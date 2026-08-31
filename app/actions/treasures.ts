"use server"

// 報酬体系: 授与消化 (骨組み・2026-08-30)。演出開始時点で全消化 (コイン規則)。

import { prisma } from "../_libs/prisma"
import { createServerSupabaseClient } from "../_libs/supabaseServer"
import { markTreasuresAwarded, rewardSystemLit } from "../_libs/treasureEngine"

export async function consumeTreasures(): Promise<void> {
  if (!rewardSystemLit()) return
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id },
    select: { id: true },
  })
  if (!dbUser) return
  await markTreasuresAwarded(dbUser.id)
}
