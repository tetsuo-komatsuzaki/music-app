"use server"

import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { prisma } from "@/app/_libs/prisma"
import { revalidatePath } from "next/cache"

export async function updateUserName(
  { name }: { name: string }
): Promise<{ success: boolean; error?: string }> {
  const trimmed = name.trim()
  if (trimmed.length === 0) return { success: false, error: "表示名は必須です" }
  if (trimmed.length > 30) return { success: false, error: "表示名は30文字以内で入力してください" }

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
    data: { name: trimmed },
  })

  revalidatePath(`/${dbUser.id}/settings`)
  return { success: true }
}
