"use server"

import { prisma } from "../_libs/prisma"
import { createClient } from "@supabase/supabase-js"

const MAX_EMAIL_LEN = 254
const MAX_PASSWORD_LEN = 128
const MAX_NAME_LEN = 100

const ALLOWED_PLANS = ["free", "standard", "premium"] as const

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function signUpAction(formData: FormData) {
  const email = (formData.get("email") as string | null)?.trim() ?? ""
  const password = (formData.get("password") as string | null) ?? ""
  const name = (formData.get("name") as string | null)?.trim() ?? ""
  const plan = (formData.get("plan") as string | null)?.trim() ?? ""
  // role はフォームから受け取らない（権限昇格防止・新規登録は常に student 固定）

  if (!email || !password || !name || !plan) {
    return { error: "入力不備があります" }
  }
  if (email.length > MAX_EMAIL_LEN || !isValidEmail(email)) {
    return { error: "メールアドレスの形式が正しくありません" }
  }
  if (password.length < 10 || password.length > MAX_PASSWORD_LEN) {
    return { error: "パスワードは10文字以上128文字以下で入力してください" }
  }
  if (name.length > MAX_NAME_LEN) {
    return { error: "名前が長すぎます" }
  }
  if (!ALLOWED_PLANS.includes(plan as (typeof ALLOWED_PLANS)[number])) {
    return { error: "プラン指定が不正です" }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
  })

  if (error || !data.user) {
    return { error: "Supabase登録失敗" }
  }

  try {
    await prisma.user.create({
      data: {
        supabaseUserId: data.user.id,
        name,
        role: "student",
        plan,
      },
    })
  } catch (err) {
    try {
      await supabase.auth.admin.deleteUser(data.user.id)
    } catch (cleanupError) {
      console.error("Supabase削除失敗", cleanupError)
    }
    return { error: "データベース登録失敗" }
  }

  return { success: true }
}
