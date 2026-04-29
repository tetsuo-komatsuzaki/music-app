"use server"

import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { prisma } from "@/app/_libs/prisma"

export async function updateAiTrainingOptIn(
  { enabled }: { enabled: boolean }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "認証エラー" }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id },
    select: { id: true },
  })
  if (!dbUser) return { success: false, error: "ユーザーが見つかりません" }

  await prisma.user.update({
    where: { id: dbUser.id },
    data: {
      aiTrainingOptIn: enabled,
      aiTrainingOptInChangedAt: new Date(),
    },
  })

  // GDPR Art. 7 同意ログ要件のため必須
  console.log(JSON.stringify({
    event: "ai_training_opt_in_changed",
    userId: dbUser.id,
    newValue: enabled,
    timestamp: new Date().toISOString(),
  }))

  return { success: true }
}
