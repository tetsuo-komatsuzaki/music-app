"use server"

import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"

export async function updateUserEmail(
  { newEmail }: { newEmail: string }
): Promise<{ success: boolean; error?: string }> {
  const trimmed = newEmail.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { success: false, error: "メールアドレスの形式が不正です" }
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "認証エラー" }
  if (user.email === trimmed) return { success: false, error: "現在のメールアドレスと同じです" }

  const { error } = await supabase.auth.updateUser({ email: trimmed })
  if (error) return { success: false, error: `変更に失敗しました: ${error.message}` }

  return { success: true }
}
