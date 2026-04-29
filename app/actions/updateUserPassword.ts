"use server"

import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"
import { createClient } from "@supabase/supabase-js"

export async function updateUserPassword({
  currentPassword,
  newPassword,
}: {
  currentPassword: string
  newPassword: string
}): Promise<{ success: boolean; error?: string }> {
  if (newPassword.length < 8) {
    return { success: false, error: "新しいパスワードは8文字以上で入力してください" }
  }
  if (newPassword === currentPassword) {
    return { success: false, error: "現在のパスワードと同じです" }
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { success: false, error: "認証エラー" }

  // 旧パスワード再認証 (per-request 一時クライアントでセッション汚染回避)
  // 注: signInWithPassword は本来サインイン用 API。再認証用途として流用しており
  // レート制限は Supabase 組み込みのサインイン用に依存。
  // reauthenticate API への移行は Out-of-scope。
  const tempClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )
  const { error: signInError } = await tempClient.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (signInError) {
    return { success: false, error: "現在のパスワードが正しくありません" }
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { success: false, error: `変更に失敗しました: ${error.message}` }

  return { success: true }
}
