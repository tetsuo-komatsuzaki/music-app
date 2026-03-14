"use server"

import { prisma } from "../_libs/prisma"
import { createClient } from "@supabase/supabase-js"


export async function signUpAction(formData: FormData) {

  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const name = formData.get("name") as string
  const plan = formData.get("plan") as string
  const role = formData.get("role") as string

    if (!email || !password || !name || !plan) {
    return { error: "入力不備があります" }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // ① Supabase作成
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })

  if (error || !data.user) {
    return { error: "Supabase登録失敗" }
  }

  try {

    // ② Prisma作成
    await prisma.user.create({
      data: {
        supabaseUserId: data.user.id,
        name,
        role,
        plan
      }
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