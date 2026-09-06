import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/app/_libs/supabaseServer"

export default async function RootPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect(`/${user.id}`)
  }
  // ゲスト閲覧 (2026-09-06): 未ログインはログイン画面ではなくゲストホームへ。/login 自体は残す
  redirect("/guest")
}
